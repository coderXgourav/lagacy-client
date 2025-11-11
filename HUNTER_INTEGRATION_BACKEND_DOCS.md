# Hunter.io Email Lookup - Backend Integration Guide

## Overview
This document provides complete implementation details for integrating Hunter.io email lookup functionality in the backend for Legacy Finder, No Website Finder, and Low Rating Finder modules.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Frontend Changes Summary](#frontend-changes-summary)
3. [Backend Implementation](#backend-implementation)
4. [Hunter.io API Reference](#hunterio-api-reference)
5. [Testing](#testing)
6. [Error Handling](#error-handling)

---

## Prerequisites

### Required Dependencies
```bash
npm install axios
```

### Environment Variables
Ensure `.env` file contains:
```env
HUNTER_API_KEY=your_hunter_api_key_here
```

### User Settings Schema
The User model should already have Hunter API key stored:
```javascript
{
  apiKeys: {
    hunter: String,
    whoisxml: String,
    googlePlaces: String,
    // ... other keys
  }
}
```

---

## Frontend Changes Summary

The frontend now sends a `useHunter` boolean parameter in all scan requests:

### Legacy Finder Request
```javascript
POST /api/scan
{
  "city": "San Francisco",
  "state": "California",
  "country": "United States",
  "radius": 5000,
  "businessCategory": "restaurants",
  "leadCap": 50,
  "domainYear": "2020",
  "filterMode": "before",
  "useHunter": true  // ← NEW PARAMETER
}
```

### No Website Finder Request
```javascript
POST /api/no-website/scan
{
  "city": "San Francisco",
  "state": "California",
  "country": "United States",
  "radius": 5000,
  "niche": "restaurants",
  "leads": 50,
  "useHunter": true  // ← NEW PARAMETER
}
```

### Low Rating Finder Request
```javascript
POST /api/low-rating/scan
{
  "city": "San Francisco",
  "state": "California",
  "country": "United States",
  "radius": 5000,
  "niche": "restaurants",
  "maxRating": 3.0,
  "leads": 200,
  "useHunter": true  // ← NEW PARAMETER
}
```

---

## Backend Implementation

### Step 1: Create Hunter.io Service

Create a new file: `services/hunterService.js`

```javascript
const axios = require('axios');

class HunterService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.hunter.io/v2';
  }

  /**
   * Find email addresses for a domain
   * @param {string} domain - The domain to search (e.g., "example.com")
   * @returns {Promise<Array>} Array of email objects
   */
  async findEmailsByDomain(domain) {
    if (!this.apiKey) {
      console.warn('Hunter.io API key not configured');
      return [];
    }

    // Clean domain (remove protocol, www, paths)
    const cleanDomain = this.cleanDomain(domain);
    if (!cleanDomain) {
      return [];
    }

    try {
      const response = await axios.get(`${this.baseUrl}/domain-search`, {
        params: {
          domain: cleanDomain,
          api_key: this.apiKey,
          limit: 10, // Limit results to avoid API quota issues
        },
        timeout: 10000, // 10 second timeout
      });

      if (response.data && response.data.data && response.data.data.emails) {
        return response.data.data.emails.map(email => ({
          email: email.value,
          firstName: email.first_name,
          lastName: email.last_name,
          position: email.position,
          department: email.department,
          type: email.type,
          confidence: email.confidence,
          verified: email.verification?.status === 'valid',
        }));
      }

      return [];
    } catch (error) {
      console.error(`Hunter.io domain search error for ${cleanDomain}:`, error.message);
      
      // Handle rate limiting
      if (error.response?.status === 429) {
        console.warn('Hunter.io API rate limit exceeded');
      }
      
      return [];
    }
  }

  /**
   * Verify a single email address
   * @param {string} email - Email to verify
   * @returns {Promise<Object>} Verification result
   */
  async verifyEmail(email) {
    if (!this.apiKey) {
      return { email, verified: false };
    }

    try {
      const response = await axios.get(`${this.baseUrl}/email-verifier`, {
        params: {
          email: email,
          api_key: this.apiKey,
        },
        timeout: 10000,
      });

      if (response.data && response.data.data) {
        const data = response.data.data;
        return {
          email: data.email,
          verified: data.status === 'valid',
          score: data.score,
          result: data.result,
          acceptAll: data.accept_all,
          disposable: data.disposable,
          free: data.free,
        };
      }

      return { email, verified: false };
    } catch (error) {
      console.error(`Hunter.io email verification error for ${email}:`, error.message);
      return { email, verified: false };
    }
  }

  /**
   * Find email by name and domain
   * @param {string} domain - Domain name
   * @param {string} firstName - First name
   * @param {string} lastName - Last name
   * @returns {Promise<Object>} Email finder result
   */
  async findEmailByName(domain, firstName, lastName) {
    if (!this.apiKey || !firstName || !lastName) {
      return null;
    }

    const cleanDomain = this.cleanDomain(domain);
    if (!cleanDomain) {
      return null;
    }

    try {
      const response = await axios.get(`${this.baseUrl}/email-finder`, {
        params: {
          domain: cleanDomain,
          first_name: firstName,
          last_name: lastName,
          api_key: this.apiKey,
        },
        timeout: 10000,
      });

      if (response.data && response.data.data && response.data.data.email) {
        const data = response.data.data;
        return {
          email: data.email,
          score: data.score,
          firstName: data.first_name,
          lastName: data.last_name,
          position: data.position,
          verified: data.verification?.status === 'valid',
        };
      }

      return null;
    } catch (error) {
      console.error(`Hunter.io email finder error:`, error.message);
      return null;
    }
  }

  /**
   * Clean and validate domain
   * @param {string} url - URL or domain
   * @returns {string|null} Cleaned domain or null
   */
  cleanDomain(url) {
    if (!url) return null;

    try {
      // Remove protocol
      let domain = url.replace(/^https?:\/\//, '');
      
      // Remove www
      domain = domain.replace(/^www\./, '');
      
      // Remove path, query, hash
      domain = domain.split('/')[0];
      domain = domain.split('?')[0];
      domain = domain.split('#')[0];
      
      // Remove port
      domain = domain.split(':')[0];
      
      // Basic validation
      if (domain.includes('.') && domain.length > 3) {
        return domain.toLowerCase();
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Batch find emails for multiple domains
   * @param {Array<string>} domains - Array of domains
   * @param {number} delay - Delay between requests in ms (default: 1000)
   * @returns {Promise<Object>} Map of domain to emails
   */
  async batchFindEmails(domains, delay = 1000) {
    const results = {};
    
    for (const domain of domains) {
      results[domain] = await this.findEmailsByDomain(domain);
      
      // Add delay to avoid rate limiting
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    return results;
  }
}

module.exports = HunterService;
```

---

### Step 2: Update Legacy Finder Route

File: `routes/legacyFinder.js` or `routes/scan.js`

```javascript
const HunterService = require('../services/hunterService');

// In your scan endpoint
router.post('/scan', async (req, res) => {
  try {
    const {
      city,
      state,
      country,
      radius,
      businessCategory,
      leadCap,
      domainYear,
      filterMode,
      useHunter = false  // ← NEW: Default to false for backward compatibility
    } = req.body;

    const userId = req.user.id; // From auth middleware
    
    // Validation
    if (!city || !country) {
      return res.status(400).json({
        success: false,
        message: 'City and country are required'
      });
    }

    // Get user settings for Hunter API key
    const user = await User.findById(userId);
    const hunterApiKey = user?.apiKeys?.hunter || process.env.HUNTER_API_KEY;
    
    // Initialize Hunter service if enabled
    let hunterService = null;
    if (useHunter && hunterApiKey) {
      hunterService = new HunterService(hunterApiKey);
      console.log('Hunter.io email lookup enabled for this search');
    } else if (useHunter && !hunterApiKey) {
      console.warn('Hunter.io requested but no API key configured');
    }

    // Create search record
    const search = await Search.create({
      userId,
      city,
      state,
      country,
      radius,
      businessCategory,
      leadCap,
      domainYear,
      filterMode,
      useHunter, // Store this flag
      status: 'processing',
      type: 'legacy-finder'
    });

    // Start background processing
    processLegacySearch(search._id, {
      city,
      state,
      country,
      radius,
      businessCategory,
      leadCap,
      domainYear,
      filterMode,
      hunterService // ← Pass Hunter service to background process
    });

    res.json({
      success: true,
      searchId: search._id,
      message: 'Search started'
    });

  } catch (error) {
    console.error('Legacy scan error:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed',
      error: error.message
    });
  }
});

// Background processing function
async function processLegacySearch(searchId, params) {
  const { city, state, country, radius, businessCategory, leadCap, domainYear, filterMode, hunterService } = params;
  
  try {
    // 1. Get businesses from Google Places
    const businesses = await getBusinessesFromGooglePlaces({
      city,
      state,
      country,
      radius,
      businessCategory
    });

    // 2. Filter businesses with websites
    const businessesWithWebsites = businesses.filter(b => b.website);

    // 3. Check domain ages using WhoisXML
    const legacyBusinesses = await filterByDomainAge(
      businessesWithWebsites,
      domainYear,
      filterMode
    );

    // 4. Enrich with Hunter.io emails (if enabled)
    if (hunterService) {
      console.log(`🔍 Finding emails for ${legacyBusinesses.length} businesses using Hunter.io`);
      
      for (let i = 0; i < legacyBusinesses.length; i++) {
        const business = legacyBusinesses[i];
        
        if (business.website) {
          try {
            // Find emails for the domain
            const emails = await hunterService.findEmailsByDomain(business.website);
            
            if (emails && emails.length > 0) {
              // Add all found emails
              business.emails = emails.map(e => e.email);
              
              // Set primary email (highest confidence)
              const primaryEmail = emails.sort((a, b) => b.confidence - a.confidence)[0];
              business.email = primaryEmail.email;
              business.emailConfidence = primaryEmail.confidence;
              business.emailVerified = primaryEmail.verified;
              
              console.log(`✅ Found ${emails.length} emails for ${business.website}`);
            }
          } catch (error) {
            console.error(`❌ Hunter.io error for ${business.website}:`, error.message);
          }
          
          // Rate limiting: 1 request per second (adjust based on your Hunter.io plan)
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    // 5. Save results
    const results = await Result.insertMany(
      legacyBusinesses.slice(0, leadCap).map(business => ({
        searchId,
        businessData: business,
        type: 'legacy-finder'
      }))
    );

    // 6. Update search status
    await Search.findByIdAndUpdate(searchId, {
      status: 'completed',
      completedAt: new Date(),
      resultsCount: results.length
    });

    console.log(`✅ Legacy search completed: ${results.length} businesses found`);

  } catch (error) {
    console.error('Legacy search processing error:', error);
    
    await Search.findByIdAndUpdate(searchId, {
      status: 'failed',
      error: error.message
    });
  }
}
```

---

### Step 3: Update No Website Finder Route

File: `routes/noWebsiteFinder.js`

```javascript
const HunterService = require('../services/hunterService');

router.post('/no-website/scan', async (req, res) => {
  try {
    const {
      city,
      state,
      country,
      radius,
      niche,
      leads,
      useHunter = false  // ← NEW
    } = req.body;

    const userId = req.user.id;
    
    // Validation
    if (!city || !country) {
      return res.status(400).json({
        success: false,
        message: 'City and country are required'
      });
    }

    // Get user settings
    const user = await User.findById(userId);
    const hunterApiKey = user?.apiKeys?.hunter || process.env.HUNTER_API_KEY;
    
    // Initialize Hunter service if enabled
    let hunterService = null;
    if (useHunter && hunterApiKey) {
      hunterService = new HunterService(hunterApiKey);
      console.log('Hunter.io email lookup enabled for no-website search');
    }

    // Create search record
    const search = await NoWebsiteSearch.create({
      userId,
      city,
      state,
      country,
      radius,
      niche,
      leads,
      useHunter,
      status: 'processing',
      type: 'no-website-finder'
    });

    // Start background processing
    processNoWebsiteSearch(search._id, {
      city,
      state,
      country,
      radius,
      niche,
      leads,
      hunterService,
      facebookApiKey: user?.apiKeys?.facebook
    });

    res.json({
      success: true,
      searchId: search._id,
      message: 'Search started'
    });

  } catch (error) {
    console.error('No-website scan error:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed',
      error: error.message
    });
  }
});

async function processNoWebsiteSearch(searchId, params) {
  const { city, state, country, radius, niche, leads, hunterService, facebookApiKey } = params;
  
  try {
    // 1. Get businesses from Google Places
    const businesses = await getBusinessesFromGooglePlaces({
      city,
      state,
      country,
      radius,
      niche
    });

    // 2. Filter businesses WITHOUT websites
    const businessesWithoutWebsites = businesses.filter(b => !b.website);

    // 3. Enrich with Facebook data
    if (facebookApiKey) {
      await enrichWithFacebookData(businessesWithoutWebsites, facebookApiKey);
    }

    // 4. Find emails using Hunter.io (if enabled)
    if (hunterService) {
      console.log(`🔍 Attempting to find emails for ${businessesWithoutWebsites.length} businesses`);
      
      for (let i = 0; i < businessesWithoutWebsites.length; i++) {
        const business = businessesWithoutWebsites[i];
        
        // Try to find email by name and Facebook domain
        if (business.ownerName && business.facebookPage) {
          try {
            const nameParts = business.ownerName.split(' ');
            const firstName = nameParts[0];
            const lastName = nameParts[nameParts.length - 1];
            
            // Try common email domains for the business
            const domains = ['gmail.com', 'yahoo.com', 'outlook.com'];
            
            for (const domain of domains) {
              const emailResult = await hunterService.findEmailByName(
                domain,
                firstName,
                lastName
              );
              
              if (emailResult && emailResult.email) {
                business.email = emailResult.email;
                business.emailVerified = emailResult.verified;
                console.log(`✅ Found email for ${business.businessName}: ${emailResult.email}`);
                break;
              }
            }
          } catch (error) {
            console.error(`❌ Hunter.io error for ${business.businessName}:`, error.message);
          }
          
          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    // 5. Save results
    const results = await NoWebsiteResult.insertMany(
      businessesWithoutWebsites.slice(0, leads).map(business => ({
        searchId,
        businessData: business,
        type: 'no-website-finder'
      }))
    );

    // 6. Update search status
    await NoWebsiteSearch.findByIdAndUpdate(searchId, {
      status: 'completed',
      completedAt: new Date(),
      resultsCount: results.length
    });

    console.log(`✅ No-website search completed: ${results.length} businesses found`);

  } catch (error) {
    console.error('No-website search processing error:', error);
    
    await NoWebsiteSearch.findByIdAndUpdate(searchId, {
      status: 'failed',
      error: error.message
    });
  }
}
```

---

### Step 4: Update Low Rating Finder Route

File: `routes/lowRatingFinder.js`

```javascript
const HunterService = require('../services/hunterService');

router.post('/low-rating/scan', async (req, res) => {
  try {
    const {
      city,
      state,
      country,
      radius,
      niche,
      maxRating,
      leads,
      useHunter = false  // ← NEW
    } = req.body;

    const userId = req.user.id;
    
    // Validation
    if (!city || !country) {
      return res.status(400).json({
        success: false,
        message: 'City and country are required'
      });
    }

    // Get user settings
    const user = await User.findById(userId);
    const hunterApiKey = user?.apiKeys?.hunter || process.env.HUNTER_API_KEY;
    
    // Initialize Hunter service if enabled
    let hunterService = null;
    if (useHunter && hunterApiKey) {
      hunterService = new HunterService(hunterApiKey);
      console.log('Hunter.io email lookup enabled for low-rating search');
    }

    // Create search record
    const search = await LowRatingSearch.create({
      userId,
      city,
      state,
      country,
      radius,
      niche,
      maxRating,
      leads,
      useHunter,
      status: 'processing',
      type: 'low-rating-finder'
    });

    // Start background processing
    processLowRatingSearch(search._id, {
      city,
      state,
      country,
      radius,
      niche,
      maxRating,
      leads,
      hunterService
    });

    res.json({
      success: true,
      searchId: search._id,
      message: 'Search started'
    });

  } catch (error) {
    console.error('Low-rating scan error:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed',
      error: error.message
    });
  }
});

async function processLowRatingSearch(searchId, params) {
  const { city, state, country, radius, niche, maxRating, leads, hunterService } = params;
  
  try {
    // 1. Get businesses from Google Places
    const businesses = await getBusinessesFromGooglePlaces({
      city,
      state,
      country,
      radius,
      niche
    });

    // 2. Filter businesses with low ratings
    const lowRatedBusinesses = businesses.filter(b => 
      b.rating && b.rating <= maxRating
    );

    // 3. Find emails using Hunter.io (if enabled)
    if (hunterService) {
      console.log(`🔍 Finding emails for ${lowRatedBusinesses.length} low-rated businesses`);
      
      for (let i = 0; i < lowRatedBusinesses.length; i++) {
        const business = lowRatedBusinesses[i];
        
        if (business.website) {
          try {
            // Find emails for the domain
            const emails = await hunterService.findEmailsByDomain(business.website);
            
            if (emails && emails.length > 0) {
              business.emails = emails.map(e => e.email);
              
              // Set primary email (highest confidence)
              const primaryEmail = emails.sort((a, b) => b.confidence - a.confidence)[0];
              business.email = primaryEmail.email;
              business.emailConfidence = primaryEmail.confidence;
              business.emailVerified = primaryEmail.verified;
              
              console.log(`✅ Found ${emails.length} emails for ${business.website}`);
            }
          } catch (error) {
            console.error(`❌ Hunter.io error for ${business.website}:`, error.message);
          }
          
          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    // 4. Save results
    const results = await LowRatingResult.insertMany(
      lowRatedBusinesses.slice(0, leads).map(business => ({
        searchId,
        businessData: business,
        type: 'low-rating-finder'
      }))
    );

    // 5. Update search status
    await LowRatingSearch.findByIdAndUpdate(searchId, {
      status: 'completed',
      completedAt: new Date(),
      resultsCount: results.length
    });

    console.log(`✅ Low-rating search completed: ${results.length} businesses found`);

  } catch (error) {
    console.error('Low-rating search processing error:', error);
    
    await LowRatingSearch.findByIdAndUpdate(searchId, {
      status: 'failed',
      error: error.message
    });
  }
}
```

---

## Hunter.io API Reference

### API Endpoints

#### 1. Domain Search
Find all email addresses associated with a domain.

```
GET https://api.hunter.io/v2/domain-search?domain=example.com&api_key=YOUR_API_KEY
```

**Response:**
```json
{
  "data": {
    "domain": "example.com",
    "emails": [
      {
        "value": "john@example.com",
        "type": "personal",
        "confidence": 95,
        "first_name": "John",
        "last_name": "Doe",
        "position": "CEO",
        "department": "executive",
        "verification": {
          "date": "2023-01-15",
          "status": "valid"
        }
      }
    ]
  },
  "meta": {
    "results": 1,
    "limit": 10
  }
}
```

#### 2. Email Finder
Find a specific email address using name and domain.

```
GET https://api.hunter.io/v2/email-finder?domain=example.com&first_name=John&last_name=Doe&api_key=YOUR_API_KEY
```

**Response:**
```json
{
  "data": {
    "email": "john@example.com",
    "score": 95,
    "first_name": "John",
    "last_name": "Doe",
    "position": "CEO",
    "verification": {
      "date": "2023-01-15",
      "status": "valid"
    }
  }
}
```

#### 3. Email Verifier
Verify if an email address is valid.

```
GET https://api.hunter.io/v2/email-verifier?email=john@example.com&api_key=YOUR_API_KEY
```

**Response:**
```json
{
  "data": {
    "status": "valid",
    "result": "deliverable",
    "score": 95,
    "email": "john@example.com",
    "accept_all": false,
    "disposable": false,
    "free": false
  }
}
```

### Rate Limits

| Plan | Requests/Month | Requests/Second |
|------|----------------|-----------------|
| Free | 50 | 1 |
| Starter | 1,000 | 10 |
| Growth | 10,000 | 20 |
| Business | 50,000 | 50 |

**Important:** Always implement rate limiting in your code to avoid hitting API limits.

---

## Testing

### 1. Test Hunter Service Directly

Create a test file: `tests/hunterService.test.js`

```javascript
const HunterService = require('../services/hunterService');

async function testHunterService() {
  const hunter = new HunterService(process.env.HUNTER_API_KEY);
  
  console.log('Testing Hunter.io Service...\n');
  
  // Test 1: Domain Search
  console.log('Test 1: Domain Search');
  const emails = await hunter.findEmailsByDomain('stripe.com');
  console.log('Found emails:', emails.length);
  console.log('Sample:', emails[0]);
  console.log('');
  
  // Test 2: Email Finder
  console.log('Test 2: Email Finder');
  const email = await hunter.findEmailByName('stripe.com', 'Patrick', 'Collison');
  console.log('Found email:', email);
  console.log('');
  
  // Test 3: Email Verifier
  console.log('Test 3: Email Verifier');
  if (email && email.email) {
    const verification = await hunter.verifyEmail(email.email);
    console.log('Verification:', verification);
  }
  console.log('');
  
  // Test 4: Clean Domain
  console.log('Test 4: Clean Domain');
  console.log('https://www.example.com/path =>', hunter.cleanDomain('https://www.example.com/path'));
  console.log('www.example.com:8080 =>', hunter.cleanDomain('www.example.com:8080'));
  console.log('example.com?query=1 =>', hunter.cleanDomain('example.com?query=1'));
}

testHunterService().catch(console.error);
```

Run: `node tests/hunterService.test.js`

### 2. Test API Endpoints

```bash
# Test Legacy Finder with Hunter enabled
curl -X POST http://localhost:5000/api/scan \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "city": "San Francisco",
    "country": "United States",
    "radius": 5000,
    "businessCategory": "restaurants",
    "leadCap": 5,
    "useHunter": true
  }'

# Test No Website Finder with Hunter enabled
curl -X POST http://localhost:5000/api/no-website/scan \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "city": "New York",
    "country": "United States",
    "radius": 5000,
    "niche": "cafes",
    "leads": 10,
    "useHunter": true
  }'

# Test Low Rating Finder with Hunter enabled
curl -X POST http://localhost:5000/api/low-rating/scan \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "city": "Los Angeles",
    "country": "United States",
    "radius": 5000,
    "maxRating": 3.0,
    "leads": 10,
    "useHunter": true
  }'
```

### 3. Verify Results

Check that the returned businesses include email fields:
```javascript
{
  "businessName": "Acme Corp",
  "website": "acmecorp.com",
  "email": "contact@acmecorp.com",  // ← Primary email
  "emails": [                         // ← All found emails
    "contact@acmecorp.com",
    "info@acmecorp.com",
    "sales@acmecorp.com"
  ],
  "emailConfidence": 95,              // ← Hunter confidence score
  "emailVerified": true               // ← Verification status
}
```

---

## Error Handling

### Common Errors and Solutions

#### 1. API Key Not Found
```javascript
if (!this.apiKey) {
  console.warn('Hunter.io API key not configured');
  return [];
}
```

**Solution:** Ensure user has Hunter API key in settings or set `HUNTER_API_KEY` in `.env`

#### 2. Rate Limit Exceeded
```javascript
if (error.response?.status === 429) {
  console.warn('Hunter.io API rate limit exceeded');
  // Implement exponential backoff or queue system
}
```

**Solution:** 
- Add delays between requests (1 second for free tier)
- Implement request queuing
- Upgrade Hunter.io plan

#### 3. Invalid Domain
```javascript
const cleanDomain = this.cleanDomain(domain);
if (!cleanDomain) {
  return [];
}
```

**Solution:** Hunter service automatically cleans domains

#### 4. Network Timeout
```javascript
axios.get(url, {
  timeout: 10000, // 10 second timeout
})
```

**Solution:** Implement retry logic with exponential backoff

### Logging Best Practices

```javascript
// Success logging
console.log(`✅ Found ${emails.length} emails for ${business.website}`);

// Error logging
console.error(`❌ Hunter.io error for ${business.website}:`, error.message);

// Warning logging
console.warn('Hunter.io requested but no API key configured');

// Info logging
console.log('🔍 Finding emails for ${businesses.length} businesses using Hunter.io');
```

---

## Performance Optimization

### 1. Batch Processing with Rate Limiting

```javascript
async function processBusinessesWithHunter(businesses, hunterService) {
  const BATCH_SIZE = 10;
  const DELAY_MS = 1000; // 1 second between requests
  
  for (let i = 0; i < businesses.length; i += BATCH_SIZE) {
    const batch = businesses.slice(i, i + BATCH_SIZE);
    
    await Promise.all(batch.map(async (business, index) => {
      // Stagger requests within batch
      await new Promise(resolve => setTimeout(resolve, index * (DELAY_MS / BATCH_SIZE)));
      
      if (business.website) {
        const emails = await hunterService.findEmailsByDomain(business.website);
        if (emails.length > 0) {
          business.emails = emails.map(e => e.email);
          business.email = emails[0].email;
        }
      }
    }));
    
    console.log(`Processed batch ${Math.floor(i / BATCH_SIZE) + 1}`);
  }
}
```

### 2. Caching Email Results

```javascript
// Using Redis or in-memory cache
const cache = new Map();

async function findEmailsWithCache(domain, hunterService) {
  const cacheKey = `hunter:${domain}`;
  
  // Check cache
  if (cache.has(cacheKey)) {
    console.log(`📦 Cache hit for ${domain}`);
    return cache.get(cacheKey);
  }
  
  // Fetch from Hunter
  const emails = await hunterService.findEmailsByDomain(domain);
  
  // Store in cache (expire after 24 hours)
  cache.set(cacheKey, emails);
  setTimeout(() => cache.delete(cacheKey), 24 * 60 * 60 * 1000);
  
  return emails;
}
```

### 3. Queue System for High Volume

```javascript
const Queue = require('bull');
const emailQueue = new Queue('email-lookup', 'redis://127.0.0.1:6379');

// Add to queue
emailQueue.add({
  searchId,
  businesses,
  hunterApiKey
});

// Process queue
emailQueue.process(async (job) => {
  const { searchId, businesses, hunterApiKey } = job.data;
  const hunterService = new HunterService(hunterApiKey);
  
  for (const business of businesses) {
    if (business.website) {
      const emails = await hunterService.findEmailsByDomain(business.website);
      // Update business in database
      await updateBusinessEmails(business.id, emails);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
});
```

---

## Database Schema Updates

### Add fields to Search models

```javascript
// Legacy Search
const legacySearchSchema = new Schema({
  // ... existing fields
  useHunter: {
    type: Boolean,
    default: false
  }
});

// No Website Search
const noWebsiteSearchSchema = new Schema({
  // ... existing fields
  useHunter: {
    type: Boolean,
    default: false
  }
});

// Low Rating Search
const lowRatingSearchSchema = new Schema({
  // ... existing fields
  useHunter: {
    type: Boolean,
    default: false
  }
});
```

### Add email fields to Result schemas

```javascript
const businessDataSchema = {
  // ... existing fields
  email: String,                    // Primary email
  emails: [String],                 // All found emails
  emailConfidence: Number,          // Hunter confidence score (0-100)
  emailVerified: Boolean,           // Email verification status
  emailSource: {                    // Where email was found
    type: String,
    enum: ['hunter', 'google', 'facebook', 'manual'],
    default: 'hunter'
  }
};
```

---

## Monitoring and Analytics

### Track Hunter.io Usage

```javascript
const hunterUsageSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  searchId: { type: Schema.Types.ObjectId, ref: 'Search' },
  endpoint: {
    type: String,
    enum: ['domain-search', 'email-finder', 'email-verifier']
  },
  domain: String,
  emailsFound: Number,
  creditsUsed: Number,
  timestamp: { type: Date, default: Date.now }
});

// Log usage
async function logHunterUsage(userId, searchId, endpoint, domain, emailsFound) {
  await HunterUsage.create({
    userId,
    searchId,
    endpoint,
    domain,
    emailsFound,
    creditsUsed: 1 // Hunter charges 1 credit per request
  });
}
```

### Generate Usage Reports

```javascript
router.get('/api/hunter/usage-report', async (req, res) => {
  const { startDate, endDate } = req.query;
  
  const usage = await HunterUsage.aggregate([
    {
      $match: {
        userId: req.user.id,
        timestamp: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }
    },
    {
      $group: {
        _id: '$endpoint',
        totalRequests: { $sum: 1 },
        totalEmailsFound: { $sum: '$emailsFound' },
        totalCreditsUsed: { $sum: '$creditsUsed' }
      }
    }
  ]);
  
  res.json({ success: true, usage });
});
```

---

## Security Best Practices

### 1. Never Expose API Keys to Frontend
```javascript
// ❌ NEVER DO THIS
res.json({
  hunterApiKey: user.apiKeys.hunter // WRONG!
});

// ✅ CORRECT
// Use API keys only in backend
const hunterService = new HunterService(user.apiKeys.hunter);
```

### 2. Validate and Sanitize Inputs
```javascript
const { domain } = req.body;

// Validate domain
if (!/^[a-z0-9-]+\.[a-z]{2,}$/i.test(domain)) {
  return res.status(400).json({ error: 'Invalid domain' });
}
```

### 3. Implement Usage Limits per User
```javascript
const MAX_HUNTER_REQUESTS_PER_DAY = 100;

const todayUsage = await HunterUsage.countDocuments({
  userId: req.user.id,
  timestamp: { $gte: startOfDay(new Date()) }
});

if (todayUsage >= MAX_HUNTER_REQUESTS_PER_DAY) {
  return res.status(429).json({
    error: 'Daily Hunter.io usage limit exceeded'
  });
}
```

### 4. Encrypt API Keys in Database
```javascript
const crypto = require('crypto');

function encryptApiKey(apiKey) {
  const cipher = crypto.createCipher('aes-256-cbc', process.env.ENCRYPTION_KEY);
  return cipher.update(apiKey, 'utf8', 'hex') + cipher.final('hex');
}

function decryptApiKey(encrypted) {
  const decipher = crypto.createDecipher('aes-256-cbc', process.env.ENCRYPTION_KEY);
  return decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8');
}
```

---

## Troubleshooting

### Issue: No emails found for businesses with websites

**Possible causes:**
1. Domain is not indexed by Hunter
2. No public email addresses on the website
3. API key has insufficient credits

**Solutions:**
- Check Hunter.io dashboard for remaining credits
- Verify domain is accessible and has contact information
- Try fallback email extraction methods (web scraping)

### Issue: Rate limit errors

**Solutions:**
```javascript
// Implement exponential backoff
async function retryWithBackoff(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.response?.status === 429 && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
        console.log(`Rate limited, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
}
```

---

## Appendix: Complete Example

### Full Implementation Example

```javascript
// routes/scan.js
const express = require('express');
const router = express.Router();
const HunterService = require('../services/hunterService');
const { authMiddleware } = require('../middleware/auth');

router.post('/scan', authMiddleware, async (req, res) => {
  try {
    const { city, country, useHunter = false } = req.body;
    const user = await User.findById(req.user.id);
    
    // Start search
    const search = await Search.create({
      userId: req.user.id,
      ...req.body,
      status: 'processing'
    });

    // Background processing
    (async () => {
      try {
        // Get businesses
        const businesses = await getBusinesses(city, country);
        
        // Hunter.io enrichment
        if (useHunter && user.apiKeys.hunter) {
          const hunter = new HunterService(user.apiKeys.hunter);
          
          for (const business of businesses) {
            if (business.website) {
              const emails = await hunter.findEmailsByDomain(business.website);
              business.emails = emails.map(e => e.email);
              business.email = emails[0]?.email;
            }
            await new Promise(r => setTimeout(r, 1000));
          }
        }
        
        // Save results
        await Result.insertMany(businesses.map(b => ({
          searchId: search._id,
          businessData: b
        })));
        
        await search.updateOne({ status: 'completed' });
      } catch (error) {
        console.error(error);
        await search.updateOne({ status: 'failed', error: error.message });
      }
    })();

    res.json({ success: true, searchId: search._id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

---

## Summary

You now have complete documentation to integrate Hunter.io email lookup in your backend:

1. ✅ Created `HunterService` class with all methods
2. ✅ Updated all three finder routes (Legacy, No Website, Low Rating)
3. ✅ Implemented proper error handling and rate limiting
4. ✅ Added caching and performance optimizations
5. ✅ Included testing procedures and troubleshooting guide

**Next Steps:**
1. Install dependencies: `npm install axios`
2. Create `services/hunterService.js` file
3. Update your route files with the new code
4. Add `useHunter` field to your database schemas
5. Test with the provided curl commands
6. Monitor Hunter.io API usage in your dashboard

**Important Notes:**
- Always respect Hunter.io rate limits
- Cache results to avoid redundant API calls
- Log all Hunter.io requests for billing tracking
- Provide fallback when Hunter.io fails or is disabled
