# New Business Registration Finder - Backend Implementation Guide

## Overview
Track newly registered businesses (last 90 days) using OpenStreetMap and Overpass API, extract owner and contact details.

## API Endpoints

### POST /api/new-business/scan
**Request Body**:
```json
{
  "city": "San Francisco",
  "state": "California",
  "country": "United States",
  "radius": 5000,
  "niche": "restaurant",
  "daysBack": 30,
  "leads": 100
}
```

**Response**:
```json
{
  "success": true,
  "message": "Found 45 newly registered businesses",
  "count": 45,
  "searchId": "507f1f77bcf86cd799439011",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "ownerName": "John Doe",
      "businessName": "Joe's Pizza",
      "phone": "+1-555-0123",
      "email": "john@example.com",
      "facebookPage": "https://facebook.com/joespizza",
      "address": "123 Main St, San Francisco, CA 94102",
      "city": "San Francisco",
      "state": "California",
      "country": "United States",
      "niche": "restaurant",
      "registrationDate": "2024-01-10T00:00:00Z"
    }
  ]
}
```

### GET /api/new-business/searches/recent?limit=20
### GET /api/new-business/searches/:id/results
### DELETE /api/new-business/searches/:id

---

## MongoDB Models

### NewBusinessSearch Model
```javascript
const mongoose = require('mongoose');

const newBusinessSearchSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  city: { type: String, required: true },
  state: String,
  country: { type: String, required: true },
  radius: { type: Number, default: 5000 },
  niche: String,
  daysBack: { type: Number, default: 30 },
  leads: { type: Number, default: 100 },
  resultsCount: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('NewBusinessSearch', newBusinessSearchSchema);
```

### NewBusiness Model
```javascript
const mongoose = require('mongoose');

const newBusinessSchema = new mongoose.Schema({
  searchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'NewBusinessSearch',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  ownerName: String,
  businessName: { type: String, required: true },
  phone: String,
  email: String,
  facebookPage: String,
  address: String,
  city: String,
  state: String,
  country: String,
  niche: String,
  registrationDate: Date,
  location: {
    lat: Number,
    lng: Number
  },
  osmId: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('NewBusiness', newBusinessSchema);
```

---

## Controller Implementation

### File: `controllers/newBusinessController.js`

```javascript
const NewBusinessSearch = require('../models/NewBusinessSearch');
const NewBusiness = require('../models/NewBusiness');
const overpassService = require('../services/overpassService');
const enrichmentService = require('../services/enrichmentService');

// POST /api/new-business/scan
exports.scanNewBusinesses = async (req, res) => {
  try {
    const { city, state, country, radius = 5000, niche, daysBack = 30, leads = 100 } = req.body;
    const userId = req.user._id;

    if (!city || !country) {
      return res.status(400).json({
        success: false,
        message: 'City and country are required'
      });
    }

    // Create search record
    const search = await NewBusinessSearch.create({
      userId,
      city,
      state,
      country,
      radius,
      niche,
      daysBack,
      leads,
      status: 'processing'
    });

    // Calculate date threshold
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - daysBack);

    // Search using Overpass API
    const businesses = await overpassService.findNewBusinesses({
      city,
      state,
      country,
      radius,
      niche,
      dateThreshold,
      limit: leads
    });

    const enrichedBusinesses = [];

    // Enrich each business with contact details
    for (const business of businesses) {
      try {
        // Get owner and contact info
        const enrichedData = await enrichmentService.enrichBusiness({
          name: business.name,
          phone: business.phone,
          address: business.address,
          city: business.city || city
        });

        const savedBusiness = await NewBusiness.create({
          searchId: search._id,
          userId,
          ownerName: enrichedData.ownerName,
          businessName: business.name,
          phone: enrichedData.phone || business.phone,
          email: enrichedData.email,
          facebookPage: enrichedData.facebookPage,
          address: business.address,
          city: business.city || city,
          state: business.state || state,
          country: business.country || country,
          niche: business.niche || niche,
          registrationDate: business.timestamp,
          location: business.location,
          osmId: business.osmId
        });

        enrichedBusinesses.push(savedBusiness);

        if (enrichedBusinesses.length >= leads) break;
      } catch (error) {
        console.error(`Error enriching business ${business.name}:`, error);
        // Save without enrichment
        const savedBusiness = await NewBusiness.create({
          searchId: search._id,
          userId,
          businessName: business.name,
          phone: business.phone,
          address: business.address,
          city: business.city || city,
          state: business.state || state,
          country: business.country || country,
          niche: business.niche || niche,
          registrationDate: business.timestamp,
          location: business.location,
          osmId: business.osmId
        });
        enrichedBusinesses.push(savedBusiness);
      }
    }

    // Update search status
    search.resultsCount = enrichedBusinesses.length;
    search.status = 'completed';
    await search.save();

    res.json({
      success: true,
      message: `Found ${enrichedBusinesses.length} newly registered businesses`,
      count: enrichedBusinesses.length,
      searchId: search._id,
      data: enrichedBusinesses
    });

  } catch (error) {
    console.error('New business scan error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Scan failed'
    });
  }
};

// GET /api/new-business/searches/recent
exports.getRecentSearches = async (req, res) => {
  try {
    const userId = req.user._id;
    const limit = parseInt(req.query.limit) || 20;

    const searches = await NewBusinessSearch.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json({
      success: true,
      searches
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// GET /api/new-business/searches/:id/results
exports.getSearchResults = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const search = await NewBusinessSearch.findOne({ _id: id, userId });
    if (!search) {
      return res.status(404).json({
        success: false,
        message: 'Search not found'
      });
    }

    const results = await NewBusiness.find({ searchId: id, userId });

    res.json({
      success: true,
      search,
      results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// DELETE /api/new-business/searches/:id
exports.deleteSearch = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const search = await NewBusinessSearch.findOneAndDelete({ _id: id, userId });
    if (!search) {
      return res.status(404).json({
        success: false,
        message: 'Search not found'
      });
    }

    await NewBusiness.deleteMany({ searchId: id, userId });

    res.json({
      success: true,
      message: 'Search deleted successfully'
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

## Overpass Service

### File: `services/overpassService.js`

```javascript
const axios = require('axios');

// Find newly registered businesses using Overpass API
exports.findNewBusinesses = async ({ city, state, country, radius, niche, dateThreshold, limit }) => {
  try {
    // Geocode location first
    const location = await geocodeLocation(city, state, country);
    
    // Build Overpass query
    const query = buildOverpassQuery({
      lat: location.lat,
      lng: location.lng,
      radius,
      niche,
      dateThreshold
    });

    const response = await axios.post('https://overpass-api.de/api/interpreter', query, {
      headers: { 'Content-Type': 'text/plain' }
    });

    const businesses = parseOverpassResponse(response.data, limit);
    return businesses;

  } catch (error) {
    console.error('Overpass API error:', error);
    return [];
  }
};

// Geocode location using Nominatim
async function geocodeLocation(city, state, country) {
  try {
    const query = `${city}${state ? ', ' + state : ''}, ${country}`;
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: query,
        format: 'json',
        limit: 1
      },
      headers: {
        'User-Agent': 'NewBusinessFinder/1.0'
      }
    });

    if (response.data.length > 0) {
      return {
        lat: parseFloat(response.data[0].lat),
        lng: parseFloat(response.data[0].lon)
      };
    }
    throw new Error('Location not found');
  } catch (error) {
    throw new Error(`Geocoding failed: ${error.message}`);
  }
}

// Build Overpass QL query
function buildOverpassQuery({ lat, lng, radius, niche, dateThreshold }) {
  const dateStr = dateThreshold.toISOString().split('T')[0];
  
  // Base query for nodes and ways
  let nicheFilter = '';
  if (niche) {
    nicheFilter = `["amenity"~"${niche}|shop|restaurant|cafe"]`;
  } else {
    nicheFilter = '["amenity"]';
  }

  return `
    [out:json][timeout:25];
    (
      node${nicheFilter}(around:${radius},${lat},${lng})(newer:"${dateStr}");
      way${nicheFilter}(around:${radius},${lat},${lng})(newer:"${dateStr}");
    );
    out body;
    >;
    out skel qt;
  `;
}

// Parse Overpass response
function parseOverpassResponse(data, limit) {
  const businesses = [];
  
  if (!data.elements) return businesses;

  for (const element of data.elements) {
    if (businesses.length >= limit) break;

    const tags = element.tags || {};
    
    // Only process if it has a name
    if (!tags.name) continue;

    businesses.push({
      osmId: element.id,
      name: tags.name,
      phone: tags.phone || tags['contact:phone'],
      address: buildAddress(tags),
      city: tags['addr:city'],
      state: tags['addr:state'],
      country: tags['addr:country'],
      niche: tags.amenity || tags.shop || tags.cuisine,
      location: {
        lat: element.lat || element.center?.lat,
        lng: element.lon || element.center?.lon
      },
      timestamp: element.timestamp
    });
  }

  return businesses;
}

function buildAddress(tags) {
  const parts = [
    tags['addr:housenumber'],
    tags['addr:street'],
    tags['addr:city'],
    tags['addr:postcode']
  ].filter(Boolean);
  
  return parts.join(', ');
}
```

---

## Enrichment Service

### File: `services/enrichmentService.js`

```javascript
const axios = require('axios');

// Enrich business with owner and contact details
exports.enrichBusiness = async ({ name, phone, address, city }) => {
  const enrichedData = {
    ownerName: null,
    email: null,
    phone: phone,
    facebookPage: null
  };

  try {
    // Try Hunter.io for email
    if (process.env.HUNTER_API_KEY) {
      const email = await findEmailWithHunter(name, city);
      if (email) enrichedData.email = email;
    }

    // Try to find Facebook page
    const facebookPage = await findFacebookPage(name, city);
    if (facebookPage) enrichedData.facebookPage = facebookPage;

    // Try to extract owner name from various sources
    const ownerName = await findOwnerName(name, address);
    if (ownerName) enrichedData.ownerName = ownerName;

  } catch (error) {
    console.error('Enrichment error:', error);
  }

  return enrichedData;
};

async function findEmailWithHunter(businessName, city) {
  try {
    const response = await axios.get('https://api.hunter.io/v2/domain-search', {
      params: {
        company: businessName,
        api_key: process.env.HUNTER_API_KEY
      }
    });

    if (response.data.data.emails.length > 0) {
      return response.data.data.emails[0].value;
    }
  } catch (error) {
    console.error('Hunter.io error:', error);
  }
  return null;
}

async function findFacebookPage(businessName, city) {
  try {
    // Use Facebook Graph API search
    if (process.env.FACEBOOK_ACCESS_TOKEN) {
      const response = await axios.get('https://graph.facebook.com/v18.0/pages/search', {
        params: {
          q: `${businessName} ${city}`,
          access_token: process.env.FACEBOOK_ACCESS_TOKEN,
          fields: 'id,name,link'
        }
      });

      if (response.data.data.length > 0) {
        return response.data.data[0].link;
      }
    }
  } catch (error) {
    console.error('Facebook search error:', error);
  }
  return null;
}

async function findOwnerName(businessName, address) {
  // Placeholder - implement with business registry APIs
  // Could use: Companies House API, OpenCorporates, etc.
  return null;
}
```

---

## Routes Configuration

### File: `routes/newBusinessRoutes.js`

```javascript
const express = require('express');
const router = express.Router();
const newBusinessController = require('../controllers/newBusinessController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/scan', newBusinessController.scanNewBusinesses);
router.get('/searches/recent', newBusinessController.getRecentSearches);
router.get('/searches/:id/results', newBusinessController.getSearchResults);
router.delete('/searches/:id', newBusinessController.deleteSearch);

module.exports = router;
```

### Register in `app.js`:
```javascript
const newBusinessRoutes = require('./routes/newBusinessRoutes');
app.use('/api/new-business', newBusinessRoutes);
```

---

## Environment Variables

```env
HUNTER_API_KEY=your_hunter_api_key
FACEBOOK_ACCESS_TOKEN=your_facebook_token
```

---

## Key Features

1. **Overpass API**: Free, no API key required
2. **OpenStreetMap Data**: Crowdsourced, global coverage
3. **Date Filtering**: Uses `newer:` parameter to filter by date
4. **Enrichment**: Hunter.io for emails, Facebook for pages
5. **Geocoding**: Nominatim (OSM) for location lookup

---

## Testing

```bash
curl -X POST http://localhost:5000/api/new-business/scan \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "city": "San Francisco",
    "state": "California",
    "country": "United States",
    "radius": 5000,
    "niche": "restaurant",
    "daysBack": 30,
    "leads": 50
  }'
```

---

## Implementation Checklist

- [ ] Create MongoDB models
- [ ] Implement overpassService.js
- [ ] Implement enrichmentService.js
- [ ] Create controller
- [ ] Create routes
- [ ] Register routes in app.js
- [ ] Add API keys to .env
- [ ] Test with Postman
- [ ] Verify user isolation
- [ ] Test date filtering

---

## Notes

- **Free APIs**: Overpass and Nominatim are free
- **Rate Limits**: Overpass has timeout limits (25s default)
- **Date Accuracy**: OSM timestamps show when data was added to OSM, not business registration
- **Coverage**: Best in urban areas with active OSM contributors
- **Enrichment**: Optional, works without API keys but limited data
