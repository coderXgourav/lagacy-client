# New Domain Registration Tracker - Backend Implementation Guide

## Overview
Track newly registered domains based on keywords and TLDs to find new businesses early in their lifecycle.

## API Endpoints

### POST /api/new-domain/scan
Track newly registered domains

**Request Body**:
```json
{
  "keywords": "tech shop consulting",
  "tlds": [".com", ".net", ".org", ".io"],
  "daysBack": 7,
  "leads": 100
}
```

**Response**:
```json
{
  "success": true,
  "message": "Found 45 newly registered domains",
  "count": 45,
  "searchId": "507f1f77bcf86cd799439011",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "domainName": "techshop.com",
      "registrationDate": "2024-01-10T00:00:00Z",
      "tld": ".com",
      "registrant": {
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "+1-555-0123",
        "organization": "Tech Shop LLC",
        "address": "123 Main St, San Francisco, CA 94102"
      },
      "nameservers": ["ns1.example.com", "ns2.example.com"],
      "status": "active"
    }
  ]
}
```

### GET /api/new-domain/searches/recent?limit=20
Get recent domain searches

**Response**:
```json
{
  "success": true,
  "searches": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "keywords": "tech shop",
      "tlds": [".com", ".net"],
      "daysBack": 7,
      "leads": 100,
      "resultsCount": 45,
      "status": "completed",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### GET /api/new-domain/searches/:id/results
Get domains for specific search

**Response**:
```json
{
  "success": true,
  "search": {
    "_id": "507f1f77bcf86cd799439011",
    "keywords": "tech shop",
    "resultsCount": 45
  },
  "results": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "domainName": "techshop.com",
      "registrationDate": "2024-01-10T00:00:00Z",
      "tld": ".com",
      "registrant": {
        "name": "John Doe",
        "email": "john@example.com"
      }
    }
  ]
}
```

### DELETE /api/new-domain/searches/:id
Delete a search

---

## MongoDB Models

### NewDomainSearch Model
```javascript
const mongoose = require('mongoose');

const newDomainSearchSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  keywords: { type: String, required: true },
  tlds: [{ type: String, required: true }], // Array of TLDs
  daysBack: { type: Number, default: 7 },
  leads: { type: Number, default: 100 },
  resultsCount: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('NewDomainSearch', newDomainSearchSchema);
```

### NewDomain Model
```javascript
const mongoose = require('mongoose');

const newDomainSchema = new mongoose.Schema({
  searchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'NewDomainSearch',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  domainName: { type: String, required: true, index: true },
  registrationDate: { type: Date, required: true },
  tld: { type: String, required: true },
  registrant: {
    name: String,
    email: String,
    phone: String,
    organization: String,
    address: String,
    city: String,
    state: String,
    country: String
  },
  nameservers: [String],
  status: { type: String, default: 'active' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('NewDomain', newDomainSchema);
```

---

## Controller Implementation

### File: `controllers/newDomainController.js`

```javascript
const NewDomainSearch = require('../models/NewDomainSearch');
const NewDomain = require('../models/NewDomain');
const whoisService = require('../services/whoisService');

// POST /api/new-domain/scan
exports.scanNewDomains = async (req, res) => {
  try {
    const { keywords, tlds, daysBack = 7, leads = 100 } = req.body;
    const userId = req.user._id;

    // Validation
    if (!keywords || !tlds || tlds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Keywords and at least one TLD are required'
      });
    }

    // Create search record
    const search = await NewDomainSearch.create({
      userId,
      keywords,
      tlds,
      daysBack,
      leads,
      status: 'processing'
    });

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    const allDomains = [];

    // Search for each TLD
    for (const tld of tlds) {
      try {
        // Query domain registration database or API
        const domains = await whoisService.findNewlyRegisteredDomains({
          keywords: keywords.split(' '),
          tld,
          startDate,
          endDate,
          limit: Math.ceil(leads / tlds.length)
        });

        // Enrich with WHOIS data
        for (const domain of domains) {
          try {
            const whoisData = await whoisService.getWhoisData(domain.name);
            
            const savedDomain = await NewDomain.create({
              searchId: search._id,
              userId,
              domainName: domain.name,
              registrationDate: domain.registrationDate,
              tld,
              registrant: {
                name: whoisData.registrant?.name,
                email: whoisData.registrant?.email,
                phone: whoisData.registrant?.phone,
                organization: whoisData.registrant?.organization,
                address: whoisData.registrant?.address,
                city: whoisData.registrant?.city,
                state: whoisData.registrant?.state,
                country: whoisData.registrant?.country
              },
              nameservers: whoisData.nameservers,
              status: whoisData.status
            });

            allDomains.push(savedDomain);

            if (allDomains.length >= leads) break;
          } catch (error) {
            console.error(`Error enriching domain ${domain.name}:`, error);
          }
        }

        if (allDomains.length >= leads) break;
      } catch (error) {
        console.error(`Error searching TLD ${tld}:`, error);
      }
    }

    // Update search status
    search.resultsCount = allDomains.length;
    search.status = 'completed';
    await search.save();

    res.json({
      success: true,
      message: `Found ${allDomains.length} newly registered domains`,
      count: allDomains.length,
      searchId: search._id,
      data: allDomains
    });

  } catch (error) {
    console.error('New domain scan error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Scan failed'
    });
  }
};

// GET /api/new-domain/searches/recent
exports.getRecentSearches = async (req, res) => {
  try {
    const userId = req.user._id;
    const limit = parseInt(req.query.limit) || 20;

    const searches = await NewDomainSearch.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json({
      success: true,
      searches
    });
  } catch (error) {
    console.error('Get recent searches error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch searches'
    });
  }
};

// GET /api/new-domain/searches/:id/results
exports.getSearchResults = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const search = await NewDomainSearch.findOne({ _id: id, userId });
    if (!search) {
      return res.status(404).json({
        success: false,
        message: 'Search not found'
      });
    }

    const results = await NewDomain.find({ searchId: id, userId });

    res.json({
      success: true,
      search,
      results
    });
  } catch (error) {
    console.error('Get search results error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch results'
    });
  }
};

// DELETE /api/new-domain/searches/:id
exports.deleteSearch = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const search = await NewDomainSearch.findOneAndDelete({ _id: id, userId });
    if (!search) {
      return res.status(404).json({
        success: false,
        message: 'Search not found'
      });
    }

    await NewDomain.deleteMany({ searchId: id, userId });

    res.json({
      success: true,
      message: 'Search deleted successfully'
    });
  } catch (error) {
    console.error('Delete search error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete search'
    });
  }
};
```

---

## WHOIS Service

### File: `services/whoisService.js`

```javascript
const axios = require('axios');

// Find newly registered domains
exports.findNewlyRegisteredDomains = async ({ keywords, tld, startDate, endDate, limit }) => {
  try {
    // Option 1: Use WhoisXML API
    const response = await axios.get('https://newly-registered-domains.whoisxmlapi.com/api/v1', {
      params: {
        apiKey: process.env.WHOISXML_API_KEY,
        sinceDate: startDate.toISOString().split('T')[0],
        createdDateTo: endDate.toISOString().split('T')[0],
        tlds: tld.replace('.', ''),
        includeKeywords: keywords.join(','),
        mode: 'purchase',
        outputFormat: 'json'
      }
    });

    return response.data.domainsList || [];

  } catch (error) {
    console.error('Error finding new domains:', error);
    return [];
  }
};

// Get WHOIS data for domain
exports.getWhoisData = async (domainName) => {
  try {
    // Option 1: Use WhoisXML API
    const response = await axios.get('https://www.whoisxmlapi.com/whoisserver/WhoisService', {
      params: {
        apiKey: process.env.WHOISXML_API_KEY,
        domainName,
        outputFormat: 'json'
      }
    });

    const whois = response.data.WhoisRecord;

    return {
      registrant: {
        name: whois.registrant?.name,
        email: whois.registrant?.email,
        phone: whois.registrant?.telephone,
        organization: whois.registrant?.organization,
        address: whois.registrant?.street1,
        city: whois.registrant?.city,
        state: whois.registrant?.state,
        country: whois.registrant?.country
      },
      nameservers: whois.nameServers?.hostNames || [],
      status: whois.status,
      registrationDate: whois.createdDate,
      expirationDate: whois.expiresDate
    };

  } catch (error) {
    console.error(`Error getting WHOIS for ${domainName}:`, error);
    return null;
  }
};
```

---

## Routes Configuration

### File: `routes/newDomainRoutes.js`

```javascript
const express = require('express');
const router = express.Router();
const newDomainController = require('../controllers/newDomainController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/scan', newDomainController.scanNewDomains);
router.get('/searches/recent', newDomainController.getRecentSearches);
router.get('/searches/:id/results', newDomainController.getSearchResults);
router.delete('/searches/:id', newDomainController.deleteSearch);

module.exports = router;
```

### Register in `app.js`:
```javascript
const newDomainRoutes = require('./routes/newDomainRoutes');
app.use('/api/new-domain', newDomainRoutes);
```

---

## Environment Variables

Add to `.env`:
```
WHOISXML_API_KEY=your_whoisxml_api_key_here
```

---

## API Provider Options

### 1. WhoisXML API (Recommended)
- **Newly Registered Domains API**: Track new registrations
- **WHOIS API**: Get registrant details
- **Pricing**: Pay per request
- **Signup**: https://www.whoisxmlapi.com/

### 2. DomainTools API
- Domain search and WHOIS lookup
- More expensive but comprehensive

### 3. RapidAPI Domain Services
- Various domain tracking APIs available

---

## Testing

```bash
# Test scan endpoint
curl -X POST http://localhost:5000/api/new-domain/scan \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "keywords": "tech shop",
    "tlds": [".com", ".net", ".io"],
    "daysBack": 7,
    "leads": 50
  }'

# Test recent searches
curl -X GET http://localhost:5000/api/new-domain/searches/recent?limit=10 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Implementation Checklist

- [ ] Create MongoDB models (NewDomainSearch, NewDomain)
- [ ] Implement whoisService.js
- [ ] Create newDomainController.js
- [ ] Create routes file
- [ ] Register routes in app.js
- [ ] Add WHOISXML_API_KEY to .env
- [ ] Test with Postman/cURL
- [ ] Verify user isolation (userId filtering)
- [ ] Test with multiple TLDs
- [ ] Test Excel download from frontend

---

## Notes

- **Multiple TLDs**: Backend loops through each TLD and searches separately
- **Rate Limiting**: WhoisXML API has rate limits, implement delays if needed
- **Cost**: Each domain lookup costs API credits
- **Privacy**: Some domains have WHOIS privacy protection (limited data)
- **Validation**: Ensure TLDs start with "." (e.g., ".com" not "com")
