# Domain Scraper - Complete Backend Implementation Guide

## Overview

Build an autonomous AI agent that:
1. Navigates to https://newly-registered-domains.whoisxmlapi.com/
2. Finds all CSV download links
3. Streams CSV data (no file downloads)
4. Enriches domains with RDAP → WhoisFreaks → WhoisXML
5. Stores unique domains in MongoDB

---

## Prerequisites

```bash
npm install puppeteer axios csv-parser node-cron mongoose
```

---

## Step 1: Update Settings Model

**File**: `models/Settings.js`

Add API key fields:

```javascript
const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  // Existing fields...
  googlePlacesApiKey: String,
  hunterApiKey: String,
  whoisxmlApiKey: String,
  
  // ✅ ADD THESE NEW FIELDS
  whoisFreaksApiKey: String,
  whoisXmlApiKey: String,
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Settings', settingsSchema);
```

---

## Step 2: Create ScrapedDomain Model

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
  enrichmentSource: {
    type: String,
    enum: ['RDAP', 'WhoisFreaks', 'WhoisXML', 'CSV'],
    default: 'CSV'
  },
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

---

## Step 3: Create Domain Enrichment Service

**File**: `services/domainEnrichmentService.js`

```javascript
const axios = require('axios');
const Settings = require('../models/Settings');

class DomainEnrichmentService {
  // Try RDAP first (free, no API key needed)
  async enrichWithRDAP(domainName) {
    try {
      const response = await axios.get(`https://rdap.org/domain/${domainName}`, {
        timeout: 5000
      });

      const data = response.data;
      const entities = data.entities || [];
      const mainEntity = entities[0];
      const vcard = mainEntity?.vcardArray?.[1] || [];

      return {
        registrant: {
          name: vcard.find(v => v[0] === 'fn')?.[3],
          email: vcard.find(v => v[0] === 'email')?.[3],
          organization: vcard.find(v => v[0] === 'org')?.[3],
        },
        nameservers: data.nameservers?.map(ns => ns.ldhName) || [],
        status: data.status?.[0],
        source: 'RDAP'
      };
    } catch (error) {
      console.log(`⚠️ RDAP failed for ${domainName}: ${error.message}`);
      return null;
    }
  }

  // Fallback to WhoisFreaks API
  async enrichWithWhoisFreaks(domainName, apiKey) {
    if (!apiKey) {
      console.log('⚠️ WhoisFreaks API key not configured');
      return null;
    }

    try {
      const response = await axios.get('https://api.whoisfreaks.com/v1.0/whois', {
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
        nameservers: data.name_servers || [],
        status: data.domain_status,
        source: 'WhoisFreaks'
      };
    } catch (error) {
      console.log(`⚠️ WhoisFreaks failed for ${domainName}: ${error.message}`);
      return null;
    }
  }

  // Final fallback to WhoisXML API
  async enrichWithWhoisXML(domainName, apiKey) {
    if (!apiKey) {
      console.log('⚠️ WhoisXML API key not configured');
      return null;
    }

    try {
      const response = await axios.get('https://www.whoisxmlapi.com/whoisserver/WhoisService', {
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
        nameservers: data.nameServers?.hostNames || [],
        status: data.status,
        source: 'WhoisXML'
      };
    } catch (error) {
      console.log(`⚠️ WhoisXML failed for ${domainName}: ${error.message}`);
      return null;
    }
  }

  // Main enrichment function with fallback chain
  async enrichDomain(domainName) {
    console.log(`🔍 Enriching: ${domainName}`);

    // Try RDAP first (free)
    let enrichedData = await this.enrichWithRDAP(domainName);
    if (enrichedData) {
      console.log(`✅ ${domainName} enriched via RDAP`);
      return enrichedData;
    }

    // Get API keys from settings
    const settings = await Settings.findOne();

    // Try WhoisFreaks
    enrichedData = await this.enrichWithWhoisFreaks(domainName, settings?.whoisFreaksApiKey);
    if (enrichedData) {
      console.log(`✅ ${domainName} enriched via WhoisFreaks`);
      return enrichedData;
    }

    // Try WhoisXML as last resort
    enrichedData = await this.enrichWithWhoisXML(domainName, settings?.whoisXmlApiKey);
    if (enrichedData) {
      console.log(`✅ ${domainName} enriched via WhoisXML`);
      return enrichedData;
    }

    console.log(`❌ All enrichment methods failed for ${domainName}`);
    return null;
  }
}

module.exports = new DomainEnrichmentService();
```

---

## Step 4: Create Domain Scraper Service

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
      csvLinks: [],
      startTime: new Date()
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

      results.endTime = new Date();
      results.duration = (results.endTime - results.startTime) / 1000;
      console.log(`✅ Scraping completed in ${results.duration}s:`, results);
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
      await page.goto(this.targetUrl, { 
        waitUntil: 'networkidle2',
        timeout: 30000
      });

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
      responseType: 'stream',
      timeout: 60000
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
          console.log(`✅ Finished: ${csvUrl}`);
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
        console.log(`📊 Progress: ${results.totalProcessed} processed, ${results.newDomains} new, ${results.duplicates} duplicates`);
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

## Step 5: Create Controller

**File**: `controllers/domainScraperController.js`

```javascript
const domainScraperService = require('../services/domainScraperService');
const ScrapedDomain = require('../models/ScrapedDomain');

// Get dashboard stats with date grouping
exports.getDashboardStats = async (req, res) => {
  try {
    const totalDomains = await ScrapedDomain.countDocuments();
    
    // Group domains by date
    const dateStats = await ScrapedDomain.aggregate([
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$scrapedAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } },
      { $limit: 30 },
      {
        $project: {
          _id: 0,
          date: '$_id',
          count: 1
        }
      }
    ]);

    res.json({
      success: true,
      totalDomains,
      dateStats
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
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
    console.error('Trigger scrape error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get domains by date with pagination
exports.getDomainsByDate = async (req, res) => {
  try {
    const { date } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date parameter is required'
      });
    }

    // Parse date range (entire day)
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const query = {
      scrapedAt: { $gte: startDate, $lte: endDate }
    };

    const total = await ScrapedDomain.countDocuments(query);
    const domains = await ScrapedDomain.find(query)
      .sort({ scrapedAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('domainName tld registrationDate sourceUrl scrapedAt enrichmentSource');

    res.json({
      success: true,
      domains,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get domains by date error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get all domains (for download)
exports.getAllDomains = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10000;
    
    const domains = await ScrapedDomain.find()
      .sort({ scrapedAt: -1 })
      .limit(limit);

    res.json({
      success: true,
      count: domains.length,
      domains
    });
  } catch (error) {
    console.error('Get domains error:', error);
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
    console.error('Get status error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
```

---

## Step 6: Create Routes

**File**: `routes/domainScraperRoutes.js`

```javascript
const express = require('express');
const router = express.Router();
const domainScraperController = require('../controllers/domainScraperController');
const auth = require('../middleware/auth');

// Get dashboard stats with date grouping
router.get('/stats', auth, domainScraperController.getDashboardStats);

// Trigger scraping
router.post('/scrape', auth, domainScraperController.triggerScrape);

// Get domains by date with pagination
router.get('/domains', auth, domainScraperController.getDomainsByDate);

// Get all domains (for download)
router.get('/domains/all', auth, domainScraperController.getAllDomains);

// Get scraping status
router.get('/status', auth, domainScraperController.getStatus);

module.exports = router;
```

---

## Step 7: Register Routes in Main App

**File**: `server.js` or `app.js`

```javascript
const domainScraperRoutes = require('./routes/domainScraperRoutes');

// Register routes
app.use('/api/domain-scraper', domainScraperRoutes);
```

---

## Step 8: Update Settings Controller

**File**: `controllers/settingsController.js`

Update the `updateApiKeys` method to include new fields:

```javascript
exports.updateApiKeys = async (req, res) => {
  try {
    const { 
      whoisxml, 
      hunter, 
      googlePlaces,
      whoisFreaksApiKey,  // ✅ ADD THIS
      whoisXmlApiKey      // ✅ ADD THIS
    } = req.body;

    let settings = await Settings.findOne({ userId: req.user._id });

    if (!settings) {
      settings = new Settings({ userId: req.user._id });
    }

    if (whoisxml) settings.whoisxmlApiKey = whoisxml;
    if (hunter) settings.hunterApiKey = hunter;
    if (googlePlaces) settings.googlePlacesApiKey = googlePlaces;
    if (whoisFreaksApiKey) settings.whoisFreaksApiKey = whoisFreaksApiKey;  // ✅ ADD THIS
    if (whoisXmlApiKey) settings.whoisXmlApiKey = whoisXmlApiKey;          // ✅ ADD THIS

    settings.updatedAt = new Date();
    await settings.save();

    res.json({
      success: true,
      message: 'API keys updated successfully'
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

## Step 9: Optional - Add Cron Job

**File**: `cron/domainScraperCron.js`

```javascript
const cron = require('node-cron');
const domainScraperService = require('../services/domainScraperService');

// Run every day at 2 AM
cron.schedule('0 2 * * *', async () => {
  console.log('🕐 Running scheduled domain scraping...');
  try {
    const results = await domainScraperService.scrapeNewDomains();
    console.log('✅ Scheduled scraping completed:', results);
  } catch (error) {
    console.error('❌ Scheduled scraping failed:', error);
  }
});

console.log('✅ Domain scraper cron job registered (runs daily at 2 AM)');

module.exports = {};
```

Register in `server.js`:

```javascript
require('./cron/domainScraperCron');
```

---

## Testing

### Test 1: Trigger Scraping

```bash
curl -X POST http://localhost:5000/api/domain-scraper/scrape \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Scraping started in background"
}
```

### Test 2: Check Dashboard Stats

```bash
curl http://localhost:5000/api/domain-scraper/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "totalDomains": 1500,
  "todayDomains": 500,
  "lastScrapedAt": "2024-01-15T10:30:00.000Z",
  "recentDomains": [...]
}
```

### Test 3: Get All Domains

```bash
curl http://localhost:5000/api/domain-scraper/domains?limit=100 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test 4: Check MongoDB

```javascript
// Check total domains
db.scrapeddomains.countDocuments()

// Check recent domains
db.scrapeddomains.find().sort({scrapedAt: -1}).limit(5)

// Check enrichment sources
db.scrapeddomains.aggregate([
  { $group: { _id: "$enrichmentSource", count: { $sum: 1 } } }
])
```

---

## Backend Logs

You should see logs like:

```
🚀 Starting domain scraper...
📋 Found 5 CSV links
📥 Processing: https://example.com/domains-2024-01-15.csv
🔍 Enriching: example.com
✅ example.com enriched via RDAP
📊 Progress: 100 processed, 95 new, 5 duplicates
🔍 Enriching: test.com
⚠️ RDAP failed for test.com: timeout
✅ test.com enriched via WhoisFreaks
📊 Progress: 200 processed, 190 new, 10 duplicates
✅ Finished: https://example.com/domains-2024-01-15.csv
✅ Scraping completed in 245s: {
  totalProcessed: 500,
  newDomains: 475,
  duplicates: 25,
  errors: 0,
  csvLinks: [...]
}
```

---

## File Structure

```
backend/
├── models/
│   ├── Settings.js (updated)
│   └── ScrapedDomain.js (new)
├── services/
│   ├── domainEnrichmentService.js (new)
│   └── domainScraperService.js (new)
├── controllers/
│   ├── domainScraperController.js (new)
│   └── settingsController.js (updated)
├── routes/
│   └── domainScraperRoutes.js (new)
├── cron/
│   └── domainScraperCron.js (optional)
└── server.js (updated)
```

---

## Summary

**Files Created:**
1. `models/ScrapedDomain.js`
2. `services/domainEnrichmentService.js`
3. `services/domainScraperService.js`
4. `controllers/domainScraperController.js`
5. `routes/domainScraperRoutes.js`
6. `cron/domainScraperCron.js` (optional)

**Files Updated:**
1. `models/Settings.js` - Added API key fields
2. `controllers/settingsController.js` - Added API key handling
3. `server.js` - Registered routes

**Time to Implement:** 3-4 hours

**Result:** Fully autonomous domain scraping + enrichment system! 🚀
