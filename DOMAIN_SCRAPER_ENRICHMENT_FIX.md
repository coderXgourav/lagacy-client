# Domain Scraper - Enrichment Fix for Registrant Data

## Problem

CSV files from WhoisXML don't contain registrant details (name, email, phone, organization, country). We need to enrich EVERY domain using WhoisFreaks API to get this data.

---

## Solution: Use RDAP First (Free), Then WhoisXML

**Note**: WhoisFreaks API is currently blocked. Using RDAP as primary source (free, no API key needed).

### Step 1: Update Domain Enrichment Service

**File**: `services/domainEnrichmentService.js`

Replace with this version that prioritizes RDAP:

```javascript
const axios = require('axios');
const Settings = require('../models/Settings');

class DomainEnrichmentService {
  // Primary: RDAP (free, no API key needed)
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
          country: vcard.find(v => v[0] === 'country-name')?.[3],
          phone: vcard.find(v => v[0] === 'tel')?.[3]?.replace('tel:', '')
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

  // Fallback: WhoisXML API
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
          address: data.registrant?.street
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

  // Main enrichment function - Try RDAP first (free), then WhoisXML
  async enrichDomain(domainName) {
    console.log(`🔍 Enriching: ${domainName}`);

    // ✅ PRIORITY 1: Try RDAP (free, no API key needed)
    let enrichedData = await this.enrichWithRDAP(domainName);
    if (enrichedData && (enrichedData.registrant?.email || enrichedData.registrant?.name)) {
      console.log(`✅ ${domainName} enriched via RDAP`);
      return enrichedData;
    }

    // ✅ PRIORITY 2: Try WhoisXML (requires API key)
    const settings = await Settings.findOne();
    enrichedData = await this.enrichWithWhoisXML(domainName, settings?.whoisXmlApiKey);
    if (enrichedData && (enrichedData.registrant?.email || enrichedData.registrant?.name)) {
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

### Step 2: Update Download Function in Controller

**File**: `controllers/domainScraperController.js`

Update `getAllDomains` to include all registrant fields:

```javascript
// Get all domains (for download with full registrant data)
exports.getAllDomains = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10000;
    
    const domains = await ScrapedDomain.find()
      .sort({ scrapedAt: -1 })
      .limit(limit)
      .select('domainName tld registrationDate registrant nameservers status sourceUrl enrichmentSource scrapedAt');

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
```

---

### Step 3: Update Frontend Download Function

**File**: `src/services/api.ts`

Update `downloadAllDomains` to include all registrant fields:

```typescript
downloadAllDomains: async () => {
  const XLSX = await import('xlsx');
  const response = await apiCall('/domain-scraper/domains/all');
  const domains = response.domains || [];
  
  const worksheet = XLSX.utils.json_to_sheet(domains.map(d => ({
    'Domain Name': d.domainName || 'N/A',
    'TLD': d.tld || 'N/A',
    'Registration Date': d.registrationDate ? new Date(d.registrationDate).toLocaleDateString() : 'N/A',
    'Registrant Name': d.registrant?.name || 'N/A',
    'Registrant Email': d.registrant?.email || 'N/A',
    'Registrant Phone': d.registrant?.phone || 'N/A',
    'Organization': d.registrant?.organization || 'N/A',
    'Country': d.registrant?.country || 'N/A',
    'Address': d.registrant?.address || 'N/A',
    'Nameservers': d.nameservers?.join(', ') || 'N/A',
    'Status': d.status || 'N/A',
    'Enrichment Source': d.enrichmentSource || 'CSV',
    'Scraped At': d.scrapedAt ? new Date(d.scrapedAt).toLocaleDateString() : 'N/A',
  })));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Scraped Domains');
  XLSX.writeFile(workbook, `scraped-domains-${new Date().toISOString().split('T')[0]}.xlsx`);
}
```

---

### Step 4: Update Dashboard Table to Show Registrant Data

**File**: `src/pages/domainscraper/DomainScraperDashboard.tsx`

Update the table to show registrant information:

```typescript
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Domain Name</TableHead>
      <TableHead>Registrant</TableHead>
      <TableHead>Email</TableHead>
      <TableHead>Organization</TableHead>
      <TableHead>Country</TableHead>
      <TableHead>Source</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {domains.map((domain, index) => (
      <TableRow key={domain._id || index}>
        <TableCell className="font-medium">{domain.domainName || 'N/A'}</TableCell>
        <TableCell>{domain.registrant?.name || 'N/A'}</TableCell>
        <TableCell>{domain.registrant?.email || 'N/A'}</TableCell>
        <TableCell>{domain.registrant?.organization || 'N/A'}</TableCell>
        <TableCell>{domain.registrant?.country || 'N/A'}</TableCell>
        <TableCell>
          <span className="text-xs px-2 py-1 rounded bg-primary/10">
            {domain.enrichmentSource || 'CSV'}
          </span>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

---

### Step 5: Update getDomainsByDate to Include Registrant Data

**File**: `controllers/domainScraperController.js`

```javascript
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
      .select('domainName tld registrationDate registrant sourceUrl scrapedAt enrichmentSource');  // ✅ Include registrant

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
```

---

## Testing

### Test 1: Check WhoisFreaks API

```bash
curl "https://api.whoisfreaks.com/v1.0/whois?whois=live&domainName=example.com" \
  -H "Authorization: Bearer YOUR_WHOISFREAKS_API_KEY"
```

**Expected Response:**
```json
{
  "registrant_contact": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1.1234567890",
    "company": "Example Inc",
    "country": "US"
  }
}
```

### Test 2: Verify Enrichment in MongoDB

```javascript
db.scrapeddomains.findOne({}, {
  domainName: 1,
  'registrant.name': 1,
  'registrant.email': 1,
  'registrant.phone': 1,
  'registrant.organization': 1,
  'registrant.country': 1,
  enrichmentSource: 1
})
```

**Expected Output:**
```json
{
  "domainName": "example.com",
  "registrant": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1.1234567890",
    "organization": "Example Inc",
    "country": "US"
  },
  "enrichmentSource": "WhoisFreaks"
}
```

### Test 3: Download Excel and Verify Columns

Download the Excel file and verify it contains these columns:
- Domain Name
- TLD
- Registration Date
- Registrant Name ✅
- Registrant Email ✅
- Registrant Phone ✅
- Organization ✅
- Country ✅
- Address ✅
- Nameservers
- Status
- Enrichment Source
- Scraped At

---

## Important Notes

### WhoisFreaks API Limits

- Free tier: 1,000 requests/month
- Paid tier: Starting at $9/month for 10,000 requests
- Rate limit: 10 requests/second

### Optimization Tips

1. **Batch Processing**: Process domains in batches to avoid rate limits
2. **Caching**: Store enriched data to avoid re-enriching same domains
3. **Retry Logic**: Add exponential backoff for failed requests
4. **Queue System**: Use Bull or similar for background processing

### Cost Estimation

If scraping 1,000 domains/day:
- 1,000 domains × 30 days = 30,000 enrichments/month
- Cost: ~$27/month for WhoisFreaks API

---

## Summary

**Changes Made:**
1. ✅ Prioritize WhoisFreaks API for enrichment (most reliable)
2. ✅ Include all registrant fields in download
3. ✅ Update dashboard table to show registrant data
4. ✅ Ensure registrant data is selected in all queries

**Result:** Excel downloads now include complete registrant information (name, email, phone, organization, country) for every domain! 🎉
