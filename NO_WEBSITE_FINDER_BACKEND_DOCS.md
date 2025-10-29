# No Website Finder - Backend Implementation Guide

## Overview
This document outlines the complete backend implementation for the No Website Finder feature, which discovers businesses without websites using Google Places API and enriches data with Facebook API.

## Flow Summary
1. User submits search form (city, state, country, radius, niche, leads)
2. Backend uses Google Places API to find businesses WITHOUT websites
3. For each business, attempt to find Facebook page using Facebook Graph API
4. Extract and store complete business information
5. Store results in MongoDB with userId for authorization
6. Return results to frontend for display and Excel download

---

## 1. MongoDB Schema

### NoWebsiteSearch Model
```javascript
const mongoose = require('mongoose');

const noWebsiteSearchSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  city: { type: String, required: true },
  state: String,
  country: { type: String, required: true },
  radius: { type: Number, required: true }, // in meters
  niche: String, // business category/type
  leads: { type: Number, default: 50 }, // lead cap
  resultsCount: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  createdAt: { type: Date, default: Date.now },
  executedAt: Date
});

module.exports = mongoose.model('NoWebsiteSearch', noWebsiteSearchSchema);
```

### NoWebsiteBusiness Model
```javascript
const noWebsiteBusinessSchema = new mongoose.Schema({
  searchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'NoWebsiteSearch',
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
  facebookPage: String, // Facebook page URL
  address: String,
  city: String,
  state: String,
  country: String,
  niche: String, // category
  location: {
    lat: Number,
    lng: Number
  },
  scannedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('NoWebsiteBusiness', noWebsiteBusinessSchema);
```

---

## 2. API Endpoints

### POST /api/no-website/scan
**Description**: Initiate a scan for businesses without websites

**Headers**:
```
Authorization: Bearer <JWT_TOKEN>
```

**Request Body**:
```json
{
  "city": "San Francisco",
  "state": "California",
  "country": "United States",
  "radius": 5000,
  "niche": "restaurants",
  "leads": 50
}
```

**Response**:
```json
{
  "success": true,
  "message": "Found 15 businesses without websites",
  "count": 15,
  "data": [
    {
      "_id": "search123",
      "ownerName": "John Doe",
      "businessName": "Joe's Pizza",
      "phone": "+1-555-0123",
      "email": "contact@joespizza.com",
      "facebookPage": "https://facebook.com/joespizza",
      "address": "123 Main St, San Francisco, CA 94102",
      "city": "San Francisco",
      "state": "California",
      "country": "United States",
      "niche": "Restaurant"
    }
  ]
}
```

### GET /api/no-website/searches/recent?limit=20
**Description**: Get recent searches for authenticated user

**Headers**:
```
Authorization: Bearer <JWT_TOKEN>
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "search123",
      "city": "San Francisco",
      "state": "California",
      "country": "United States",
      "radius": 5000,
      "niche": "restaurants",
      "leads": 50,
      "resultsCount": 15,
      "status": "completed",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### GET /api/no-website/searches/:searchId/results
**Description**: Get all businesses for a specific search

**Headers**:
```
Authorization: Bearer <JWT_TOKEN>
```

**Response**:
```json
{
  "success": true,
  "data": {
    "search": {
      "_id": "search123",
      "city": "San Francisco",
      "resultsCount": 15
    },
    "results": [
      {
        "_id": "biz123",
        "ownerName": "John Doe",
        "businessName": "Joe's Pizza",
        "phone": "+1-555-0123",
        "email": "contact@joespizza.com",
        "facebookPage": "https://facebook.com/joespizza",
        "address": "123 Main St",
        "city": "San Francisco",
        "state": "California",
        "country": "United States",
        "niche": "Restaurant"
      }
    ]
  }
}
```

### DELETE /api/no-website/searches/:searchId
**Description**: Delete a search and all associated businesses

**Headers**:
```
Authorization: Bearer <JWT_TOKEN>
```

**Response**:
```json
{
  "success": true,
  "message": "Search deleted successfully"
}
```

---

## 3. Backend Implementation

### Controller: noWebsiteController.js

```javascript
const NoWebsiteSearch = require('../models/NoWebsiteSearch');
const NoWebsiteBusiness = require('../models/NoWebsiteBusiness');
const googlePlacesService = require('../services/googlePlacesService');
const facebookService = require('../services/facebookService');

// POST /api/no-website/scan
exports.scanForBusinesses = async (req, res) => {
  try {
    const { city, state, country, radius, niche, leads } = req.body;
    const userId = req.user._id; // from JWT auth middleware

    // Create search record
    const search = await NoWebsiteSearch.create({
      userId,
      city,
      state,
      country,
      radius,
      niche,
      leads,
      status: 'processing',
      executedAt: new Date()
    });

    // Step 1: Find businesses WITHOUT websites using Google Places
    const businesses = await googlePlacesService.findBusinessesWithoutWebsite({
      city,
      state,
      country,
      radius,
      category: niche,
      limit: leads
    });

    const enrichedBusinesses = [];

    // Step 2: Enrich each business with Facebook data
    for (const business of businesses) {
      try {
        // Find Facebook page
        const facebookData = await facebookService.findBusinessPage({
          name: business.name,
          phone: business.phone,
          address: business.address
        });

        // Extract owner name from Facebook or other sources
        const ownerName = facebookData?.ownerName || business.ownerName || null;

        // Store business in database
        const savedBusiness = await NoWebsiteBusiness.create({
          searchId: search._id,
          userId,
          ownerName,
          businessName: business.name,
          phone: business.phone,
          email: business.email || facebookData?.email,
          facebookPage: facebookData?.pageUrl,
          address: business.address,
          city: business.city || city,
          state: business.state || state,
          country: business.country || country,
          niche: business.category || niche,
          location: business.location
        });

        enrichedBusinesses.push(savedBusiness);
      } catch (error) {
        console.error(`Error enriching business ${business.name}:`, error);
        // Still save business even if Facebook lookup fails
        const savedBusiness = await NoWebsiteBusiness.create({
          searchId: search._id,
          userId,
          businessName: business.name,
          phone: business.phone,
          email: business.email,
          address: business.address,
          city: business.city || city,
          state: business.state || state,
          country: business.country || country,
          niche: business.category || niche,
          location: business.location
        });
        enrichedBusinesses.push(savedBusiness);
      }
    }

    // Update search with results count
    search.resultsCount = enrichedBusinesses.length;
    search.status = 'completed';
    await search.save();

    res.json({
      success: true,
      message: `Found ${enrichedBusinesses.length} businesses without websites`,
      count: enrichedBusinesses.length,
      data: enrichedBusinesses
    });

  } catch (error) {
    console.error('Scan error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Scan failed'
    });
  }
};

// GET /api/no-website/searches/recent
exports.getRecentSearches = async (req, res) => {
  try {
    const userId = req.user._id;
    const limit = parseInt(req.query.limit) || 20;

    const searches = await NoWebsiteSearch.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.json({
      success: true,
      data: searches
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// GET /api/no-website/searches/:searchId/results
exports.getSearchResults = async (req, res) => {
  try {
    const { searchId } = req.params;
    const userId = req.user._id;

    // Verify search belongs to user
    const search = await NoWebsiteSearch.findOne({ _id: searchId, userId });
    if (!search) {
      return res.status(404).json({
        success: false,
        message: 'Search not found'
      });
    }

    // Get all businesses for this search
    const businesses = await NoWebsiteBusiness.find({ 
      searchId, 
      userId 
    }).lean();

    res.json({
      success: true,
      data: {
        search,
        results: businesses
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// DELETE /api/no-website/searches/:searchId
exports.deleteSearch = async (req, res) => {
  try {
    const { searchId } = req.params;
    const userId = req.user._id;

    // Delete search (only if belongs to user)
    const search = await NoWebsiteSearch.findOneAndDelete({ 
      _id: searchId, 
      userId 
    });

    if (!search) {
      return res.status(404).json({
        success: false,
        message: 'Search not found'
      });
    }

    // Delete all associated businesses
    await NoWebsiteBusiness.deleteMany({ searchId, userId });

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

## 4. Google Places Service

### services/googlePlacesService.js

```javascript
const axios = require('axios');

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

exports.findBusinessesWithoutWebsite = async ({ city, state, country, radius, category, limit }) => {
  try {
    // Step 1: Geocode the location
    const location = await geocodeLocation(`${city}, ${state}, ${country}`);
    
    // Step 2: Search for businesses
    const query = category ? `${category} in ${city}` : city;
    const placesUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json`;
    
    const response = await axios.get(placesUrl, {
      params: {
        query,
        location: `${location.lat},${location.lng}`,
        radius,
        key: GOOGLE_PLACES_API_KEY
      }
    });

    const businesses = [];
    
    // Step 3: Filter businesses WITHOUT websites
    for (const place of response.data.results) {
      if (businesses.length >= limit) break;

      // Get place details
      const details = await getPlaceDetails(place.place_id);
      
      // ONLY include if NO website
      if (!details.website) {
        businesses.push({
          name: details.name,
          phone: details.formatted_phone_number,
          address: details.formatted_address,
          category: details.types?.[0],
          email: null, // Will be enriched later
          location: {
            lat: details.geometry.location.lat,
            lng: details.geometry.location.lng
          },
          city,
          state,
          country
        });
      }
    }

    return businesses;
  } catch (error) {
    console.error('Google Places error:', error);
    throw new Error('Failed to fetch businesses from Google Places');
  }
};

async function geocodeLocation(address) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json`;
  const response = await axios.get(url, {
    params: {
      address,
      key: GOOGLE_PLACES_API_KEY
    }
  });
  
  const location = response.data.results[0]?.geometry?.location;
  if (!location) throw new Error('Location not found');
  
  return location;
}

async function getPlaceDetails(placeId) {
  const url = `https://maps.googleapis.com/maps/api/place/details/json`;
  const response = await axios.get(url, {
    params: {
      place_id: placeId,
      fields: 'name,formatted_phone_number,formatted_address,website,types,geometry',
      key: GOOGLE_PLACES_API_KEY
    }
  });
  
  return response.data.result;
}
```

---

## 5. Facebook Service

### services/facebookService.js

```javascript
const axios = require('axios');

const FACEBOOK_ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN;

exports.findBusinessPage = async ({ name, phone, address }) => {
  try {
    // Search for Facebook page by business name
    const searchUrl = `https://graph.facebook.com/v18.0/pages/search`;
    
    const response = await axios.get(searchUrl, {
      params: {
        q: name,
        type: 'place',
        fields: 'id,name,link,emails,phone',
        access_token: FACEBOOK_ACCESS_TOKEN
      }
    });

    if (!response.data.data || response.data.data.length === 0) {
      return null;
    }

    // Get the first matching page
    const page = response.data.data[0];
    
    // Get additional page details
    const pageDetails = await getPageDetails(page.id);

    return {
      pageUrl: page.link || `https://facebook.com/${page.id}`,
      email: pageDetails.emails?.[0] || page.emails?.[0],
      ownerName: pageDetails.owner?.name || null,
      phone: page.phone || null
    };

  } catch (error) {
    console.error('Facebook API error:', error);
    return null; // Return null if Facebook lookup fails
  }
};

async function getPageDetails(pageId) {
  try {
    const url = `https://graph.facebook.com/v18.0/${pageId}`;
    const response = await axios.get(url, {
      params: {
        fields: 'emails,owner,phone,about',
        access_token: FACEBOOK_ACCESS_TOKEN
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Facebook page details error:', error);
    return {};
  }
}
```

---

## 6. Routes Configuration

### routes/noWebsiteRoutes.js

```javascript
const express = require('express');
const router = express.Router();
const noWebsiteController = require('../controllers/noWebsiteController');
const authMiddleware = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

router.post('/scan', noWebsiteController.scanForBusinesses);
router.get('/searches/recent', noWebsiteController.getRecentSearches);
router.get('/searches/:searchId/results', noWebsiteController.getSearchResults);
router.delete('/searches/:searchId', noWebsiteController.deleteSearch);

module.exports = router;
```

### Main app.js integration

```javascript
const noWebsiteRoutes = require('./routes/noWebsiteRoutes');

app.use('/api/no-website', noWebsiteRoutes);
```

---

## 7. Environment Variables

Add to `.env` file:

```env
GOOGLE_PLACES_API_KEY=your_google_places_api_key
FACEBOOK_ACCESS_TOKEN=your_facebook_access_token
```

---

## 8. Authorization & Security

### Key Security Features:
1. **JWT Authentication**: All endpoints require valid JWT token
2. **User Isolation**: All queries filter by `userId` from JWT token
3. **Ownership Verification**: Users can only access their own searches and results
4. **Data Privacy**: No cross-user data leakage

### Auth Middleware Example:
```javascript
// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Contains _id, email, name
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};
```

---

## 9. Data Fields Summary

For each business found, the system collects:

| Field | Source | Required |
|-------|--------|----------|
| Owner's Name | Facebook API / Google Places | No |
| Business Name | Google Places | Yes |
| Phone Number | Google Places / Facebook | No |
| Email | Facebook API | No |
| Facebook Page | Facebook Graph API | No |
| Full Address | Google Places | Yes |
| Niche/Category | Google Places | Yes |
| City | Search params / Google Places | Yes |
| State | Search params / Google Places | No |
| Country | Search params | Yes |

---

## 10. Excel Download

Frontend handles Excel generation using the same approach as Legacy page:

```javascript
// Frontend downloads results and generates Excel client-side
const results = await api.getSearchResults(searchId);
const XLSX = await import('xlsx');
const worksheet = XLSX.utils.json_to_sheet(results.data.results.map(b => ({
  'Owner Name': b.ownerName || 'N/A',
  'Business Name': b.businessName,
  'Phone': b.phone || 'N/A',
  'Email': b.email || 'N/A',
  'Facebook Page': b.facebookPage || 'N/A',
  'Address': b.address,
  'City': b.city,
  'State': b.state || 'N/A',
  'Country': b.country,
  'Niche': b.niche || 'N/A'
})));
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, 'Businesses');
XLSX.writeFile(workbook, 'no-website-businesses.xlsx');
```

---

## Implementation Checklist

- [ ] Create MongoDB models (NoWebsiteSearch, NoWebsiteBusiness)
- [ ] Implement Google Places service to find businesses WITHOUT websites
- [ ] Implement Facebook service to enrich business data
- [ ] Create API endpoints with JWT authentication
- [ ] Add userId filtering to all database queries
- [ ] Test authorization (users can only see their own data)
- [ ] Configure environment variables
- [ ] Test complete flow: search → store → retrieve → download
