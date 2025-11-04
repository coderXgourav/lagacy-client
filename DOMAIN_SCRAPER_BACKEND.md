# Domain Scraper Backend Implementation

## Overview

Autonomous AI agent that scrapes newly registered domains from WhoisXML API, streams CSV data, parses records in real-time, and stores in MongoDB without manual downloads.

**Goal**: Navigate to https://newly-registered-domains.whoisxmlapi.com/, find all CSV download links, stream data, parse domains, insert into MongoDB with deduplication.

---

## Architecture

### Components:
1. **Scraper Agent** - Puppeteer/Playwright to navigate and find CSV links
2. **CSV Stream Parser** - Parse CSV data in real-time without downloading
3. **MongoDB Storage** - Store unique domain records
4. **API Endpoints** - Trigger scraping, get stats, download data

---

## Step 1: MongoDB Models

### ScrapedDomain Model

**File**: `models/ScrapedDomain.js`

```javascript
const mongoose = require('mongoose');

const scrapedDomainSchema = new mongoose.Schema({
  domainName: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  tld: String,
  registrationDate: Date,
  registrant: {
    name: String,
    email: String,
    phone: String,
    organization: String,
    country: String,
    address: String
  },
  nameservers: [String],
  status: String,
  sourceUrl: String,
  scrapedAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Prevent duplicate domains
scrapedDomainSchema.index({ domainName: 1 }, { unique: true });

module.exports = mongoose.model('ScrapedDomain', scrapedDomainSchema);
```

### Settings Model (Update)

**File**: `models/Settings.js`

Add these fields to your existing Settings model:

```javascript
const settingsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // ... existing fields ...
  whoisFreaksApiKey: String,  // ✅ ADD THIS
  whoisXmlApiKey: String,     // ✅ ADD THIS
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Settings', settingsSchema);
```

---

## Step 2: Domain Enrichment Service

**File**: `services/domainEnrichmentService.js`

```javascript
const axios = require('axios');
const Settings = require('../models/Settings');

class DomainEnrichmentService {
  // Try RDAP first (free)
  async enrichWithRDAP(domainName) {
    try {
      const response = await axios.get(`https://rdap.org/domain/${domainName}`, {
        timeout: 5000
      });

      const data = response.data;
      return {
        registrant: {
          name: data.entities?.[0]?.vcardArray?.[1]?.find(v => v[0] === 'fn')?.[3],
          email: data.entities?.[0]?.vcardArray?.[1]?.find(v => v[0] === 'email')?.[3],
          organization: data.entities?.[0]?.vcardArray?.[1]?.find(v => v[0] === 'org')?.[3],
        },
        nameservers: data.nameservers?.map(ns => ns.ldhName),
        status: data.status?.[0],
        source: 'RDAP'
      };
    } catch (error) {
      console.log(`RDAP failed for ${domainName}:`, error.message);
      return null;
    }
  }

  // Fallback to WhoisFreaks
  async enrichWithWhoisFreaks(domainName, apiKey) {
    if (!apiKey) return null;

    try {
      const response = await axios.get(`https://api.whoisfreaks.com/v1.0/whois`, {
        params: { whois: 'live', domainName },
        headers: { 'Authorization': `Bearer ${apiKey}` },
        timeout: 10000
      });

      const data = response.data;
      return {
        registrant: {
          name: data.registrant_contact?.name,
          email: data.registrant_contact?.email,
          phone: data.registrant_contact?.phone,
          organization: data.registrant_contact?.company,
          country: data.registrant_contact?.country,
        },
        nameservers: data.name_servers,
        status: data.domain_status,
        source: 'WhoisFreaks'
      };
    } catch (error) {
      console.log(`WhoisFreaks failed for ${domainName}:`, error.message);
      return null;
    }
  }

  // Final fallback to WhoisXML
  async enrichWithWhoisXML(domainName, apiKey) {
    if (!apiKey) return null;

    try {
      const response = await axios.get(`https://www.whoisxmlapi.com/whoisserver/WhoisService`, {
        params: {
          apiKey,
          domainName,
          outputFormat: 'JSON'
        },
        timeout: 10000
      });

      const data = response.data.WhoisRecord;
      return {
        registrant: {
          name: data.registrant?.name,
          email: data.registrant?.email,
          phone: data.registrant?.telephone,
          organization: data.registrant?.organization,
          country: data.registrant?.country,
        },
        nameservers: data.nameServers?.hostNames,
        status: data.status,
        source: 'WhoisXML'
      };
    } catch (error) {
      console.log(`WhoisXML failed for ${domainName}:`, error.message);
      return null;
    }
  }

  // Main enrichment function with fallback chain
  async enrichDomain(domainName) {
    console.log(`🔍 Enriching domain: ${domainName}`);

    // Try RDAP first (free)
    let enrichedData = await this.enrichWithRDAP(domainName);
    if (enrichedData) {
      console.log(`✅ Enriched ${domainName} via RDAP`);
      return enrichedData;
    }

    // Get API keys from settings
    const settings = await Settings.findOne();

    // Try WhoisFreaks
    enrichedData = await this.enrichWithWhoisFreaks(domainName, settings?.whoisFreaksApiKey);
    if (enrichedData) {
      console.log(`✅ Enriched ${domainName} via WhoisFreaks`);
      return enrichedData;
    }

    // Try WhoisXML as last resort
    enrichedData = await this.enrichWithWhoisXML(domainName, settings?.whoisXmlApiKey);
    if (enrichedData) {
      console.log(`✅ Enriched ${domainName} via WhoisXML`);
      return enrichedData;
    }

    console.log(`❌ All enrichment methods failed for ${domainName}`);
    return null;
  }
}

module.exports = new DomainEnrichmentService();
```

---

## Step 3: Scraper Service

**File**: `services/domainScraperService.js`

```javascript
const puppeteer = require('puppeteer');
const axios = require('axios');
const csv = require('csv-parser');
const { Readable } = require('stream');
const ScrapedDomain = require('../models/ScrapedDomain');
const domainEnrichmentService = require('./domainEnrichmentService');

class DomainScraperService {
  constructor() {
    this.targetUrl = 'https://newly-registered-domains.whoisxmlapi.com/';
    this.isRunning = false;
  }

  // Main scraping function
  async scrapeNewDomains() {
    if (this.isRunning) {
      throw new Error('Scraping already in progress');
    }

    this.isRunning = true;
    const results = {
      totalProcessed: 0,
      newDomains: 0,
      duplicates: 0,
      errors: 0,
      csvLinks: []
    };

    try {
      console.log('🚀 Starting domain scraper...');

      // Step 1: Find all CSV download links
      const csvLinks = await this.findCsvLinks();
      results.csvLinks = csvLinks;
      console.log(`📋 Found ${csvLinks.length} CSV links`);

      // Step 2: Process each CSV link
      for (const link of csvLinks) {
        try {
          await this.processCsvLink(link, results);
        } catch (error) {
          console.error(`❌ Error processing ${link}:`, error.message);
          results.errors++;
        }
      }

      console.log('✅ Scraping completed:', results);
      return results;

    } catch (error) {
      console.error('❌ Scraping failed:', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  // Find CSV download links using Puppeteer
  async findCsvLinks() {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      await page.goto(this.targetUrl, { waitUntil: 'networkidle2' });

      // Find all CSV download links
      const csvLinks = await page.evaluate(() => {
        const links = [];
        const anchors = document.querySelectorAll('a[href*=".csv"]');
        
        anchors.forEach(anchor => {
          const href = anchor.href;
          if (href && href.includes('.csv')) {
            links.push(href);
          }
        });

        return links;
      });

      return csvLinks;

    } finally {
      await browser.close();
    }
  }

  // Stream and parse CSV data
  async processCsvLink(csvUrl, results) {
    console.log(`📥 Processing: ${csvUrl}`);

    // Stream CSV data
    const response = await axios({
      method: 'GET',
      url: csvUrl,
      responseType: 'stream'
    });

    return new Promise((resolve, reject) => {
      const stream = Readable.from(response.data);
      
      stream
        .pipe(csv())
        .on('data', async (row) => {
          try {
            await this.processDomainRow(row, csvUrl, results);
          } catch (error) {
            console.error('Error processing row:', error.message);
            results.errors++;
          }
        })
        .on('end', () => {
          console.log(`✅ Finished processing: ${csvUrl}`);
          resolve();
        })
        .on('error', (error) => {
          console.error(`❌ Stream error: ${error.message}`);
          reject(error);
        });
    });
  }

  // Process individual domain row
  async processDomainRow(row, sourceUrl, results) {
    results.totalProcessed++;

    const domainName = row.domainName || row.domain || row.Domain;
    
    // Skip if no domain name
    if (!domainName) {
      return;
    }

    try {
      // Check if domain already exists
      const existingDomain = await ScrapedDomain.findOne({ domainName });
      if (existingDomain) {
        results.duplicates++;
        return;
      }

      // Enrich domain with RDAP -> WhoisFreaks -> WhoisXML
      const enrichedData = await domainEnrichmentService.enrichDomain(domainName);

      // Map CSV columns to domain object
      const domainData = {
        domainName,
        tld: this.extractTld(domainName),
        registrationDate: this.parseDate(row.create_date || row.createdDate || row.registrationDate),
        registrant: enrichedData?.registrant || {
          name: row.registrant_name || row.registrantName,
          email: row.registrant_email || row.registrantEmail,
          phone: row.registrant_phone || row.registrantPhone,
          organization: row.registrant_organization || row.registrantOrg,
          country: row.registrant_country || row.registrantCountry,
          address: row.registrant_address || row.registrantAddress
        },
        nameservers: enrichedData?.nameservers || this.parseNameservers(row.nameservers || row.nameServers),
        status: enrichedData?.status || row.status || row.domainStatus,
        sourceUrl,
        enrichmentSource: enrichedData?.source || 'CSV'
      };

      // Insert domain
      await ScrapedDomain.create(domainData);
      results.newDomains++;

      if (results.totalProcessed % 100 === 0) {
        console.log(`📊 Progress: ${results.totalProcessed} processed, ${results.newDomains} new`);
      }

    } catch (error) {
      if (error.code === 11000) {
        results.duplicates++;
      } else {
        console.error(`Error processing ${domainName}:`, error.message);
        results.errors++;
      }
    }
  }

  // Helper: Extract TLD from domain
  extractTld(domain) {
    if (!domain) return null;
    const parts = domain.split('.');
    return parts.length > 1 ? `.${parts[parts.length - 1]}` : null;
  }

  // Helper: Parse date
  parseDate(dateStr) {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  }

  // Helper: Parse nameservers
  parseNameservers(nsStr) {
    if (!nsStr) return [];
    if (Array.isArray(nsStr)) return nsStr;
    return nsStr.split(',').map(ns => ns.trim()).filter(Boolean);
  }

  // Get scraping status
  getStatus() {
    return {
      isRunning: this.isRunning
    };
  }
}

module.exports = new DomainScraperService();
```

---

## Step 3: Controller

**File**: `controllers/domainScraperController.js`

```javascript
const domainScraperService = require('../services/domainScraperService');
const ScrapedDomain = require('../models/ScrapedDomain');

// Get dashboard stats
exports.getDashboardStats = async (req, res) => {
  try {
    const totalDomains = await ScrapedDomain.countDocuments();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayDomains = await ScrapedDomain.countDocuments({
      scrapedAt: { $gte: today }
    });

    const lastScraped = await ScrapedDomain.findOne()
      .sort({ scrapedAt: -1 })
      .select('scrapedAt');

    const recentDomains = await ScrapedDomain.find()
      .sort({ scrapedAt: -1 })
      .limit(10);

    res.json({
      success: true,
      totalDomains,
      todayDomains,
      lastScrapedAt: lastScraped?.scrapedAt || null,
      recentDomains
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Trigger scraping
exports.triggerScrape = async (req, res) => {
  try {
    const status = domainScraperService.getStatus();
    
    if (status.isRunning) {
      return res.status(400).json({
        success: false,
        message: 'Scraping already in progress'
      });
    }

    // Start scraping in background
    domainScraperService.scrapeNewDomains()
      .then(results => {
        console.log('✅ Scraping completed:', results);
      })
      .catch(error => {
        console.error('❌ Scraping failed:', error);
      });

    res.json({
      success: true,
      message: 'Scraping started in background'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get all domains (for download)
exports.getAllDomains = async (req, res) => {
  try {
    const domains = await ScrapedDomain.find()
      .sort({ scrapedAt: -1 })
      .limit(10000); // Limit to prevent memory issues

    res.json({
      success: true,
      domains
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get scraping status
exports.getStatus = async (req, res) => {
  try {
    const status = domainScraperService.getStatus();
    res.json({
      success: true,
      ...status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
```

---

## Step 4: Routes

**File**: `routes/domainScraperRoutes.js`

```javascript
const express = require('express');
const router = express.Router();
const domainScraperController = require('../controllers/domainScraperController');
const auth = require('../middleware/auth');

// Get dashboard stats
router.get('/stats', auth, domainScraperController.getDashboardStats);

// Trigger scraping
router.post('/scrape', auth, domainScraperController.triggerScrape);

// Get all domains
router.get('/domains', auth, domainScraperController.getAllDomains);

// Get scraping status
router.get('/status', auth, domainScraperController.getStatus);

module.exports = router;
```

---

## Step 5: Register Routes

**File**: `server.js` or `app.js`

```javascript
const domainScraperRoutes = require('./routes/domainScraperRoutes');

// Register routes
app.use('/api/domain-scraper', domainScraperRoutes);
```

---

## Step 6: Install Dependencies

```bash
npm install puppeteer axios csv-parser
```

---

## API Endpoints

### 1. Get Dashboard Stats
```
GET /api/domain-scraper/stats
Authorization: Bearer <token>

Response:
{
  "success": true,
  "totalDomains": 15000,
  "todayDomains": 500,
  "lastScrapedAt": "2024-01-15T10:30:00.000Z",
  "recentDomains": [...]
}
```

### 2. Trigger Scraping
```
POST /api/domain-scraper/scrape
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "Scraping started in background"
}
```

### 3. Get All Domains
```
GET /api/domain-scraper/domains
Authorization: Bearer <token>

Response:
{
  "success": true,
  "domains": [...]
}
```

### 4. Get Status
```
GET /api/domain-scraper/status
Authorization: Bearer <token>

Response:
{
  "success": true,
  "isRunning": false
}
```

---

## Testing

### Test 1: Trigger Scraping
```bash
curl -X POST http://localhost:5000/api/domain-scraper/scrape \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test 2: Check Stats
```bash
curl http://localhost:5000/api/domain-scraper/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test 3: Check MongoDB
```javascript
db.scrapeddomains.countDocuments()
db.scrapeddomains.find().limit(5)
```

---

## Features

✅ **Autonomous Navigation** - Puppeteer navigates to WhoisXML page
✅ **Auto-detect CSV Links** - Finds all CSV download links automatically
✅ **Stream Processing** - No file downloads, streams CSV data directly
✅ **Real-time Parsing** - Parses domains as they stream
✅ **Deduplication** - MongoDB unique index prevents duplicates
✅ **Error Handling** - Continues processing even if one CSV fails
✅ **Progress Tracking** - Logs progress every 100 domains
✅ **Background Processing** - Runs asynchronously without blocking API

---

## Monitoring

Backend logs will show:
```
🚀 Starting domain scraper...
📋 Found 5 CSV links
📥 Processing: https://example.com/domains-2024-01-15.csv
📊 Progress: 100 processed, 95 new
📊 Progress: 200 processed, 190 new
✅ Finished processing: https://example.com/domains-2024-01-15.csv
✅ Scraping completed: { totalProcessed: 500, newDomains: 475, duplicates: 25, errors: 0 }
```

---

## Cron Job (Optional)

To run scraping automatically every day:

**File**: `cron/domainScraperCron.js`

```javascript
const cron = require('node-cron');
const domainScraperService = require('../services/domainScraperService');

// Run every day at 2 AM
cron.schedule('0 2 * * *', async () => {
  console.log('🕐 Running scheduled domain scraping...');
  try {
    await domainScraperService.scrapeNewDomains();
  } catch (error) {
    console.error('❌ Scheduled scraping failed:', error);
  }
});

console.log('✅ Domain scraper cron job registered');
```

Install: `npm install node-cron`

---

## Summary

**Files Created:**
1. `models/ScrapedDomain.js` - MongoDB model for domains
2. `models/Settings.js` - Update with API key fields
3. `services/domainEnrichmentService.js` - RDAP/WhoisFreaks/WhoisXML enrichment
4. `services/domainScraperService.js` - Scraper logic with enrichment
5. `controllers/domainScraperController.js` - API handlers
6. `routes/domainScraperRoutes.js` - Route definitions

**Dependencies:**
- `puppeteer` - Browser automation
- `axios` - HTTP requests
- `csv-parser` - CSV streaming
- `node-cron` (optional) - Scheduled tasks

**Enrichment Strategy:**
1. Try RDAP (free, no API key)
2. Fallback to WhoisFreaks API
3. Final fallback to WhoisXML API
4. Store enriched data with source tracking

**Time to Implement:** 3-4 hours

**Result:** Fully autonomous domain scraping + enrichment system with triple fallback strategy!
