# Low Rating Business Finder - Backend Implementation Guide

## Overview
This document outlines the complete backend implementation for the Low Rating Business Finder feature, which discovers businesses with low ratings using Google Places API.

## Flow Summary
1. User submits search form (city, state, country, radius, niche, maxRating, leads)
2. Backend uses Google Places API to find businesses in the location
3. Filter businesses with rating ≤ maxRating threshold
4. Extract complete business information including rating and review count
5. Store results in MongoDB with userId for authorization
6. Return results to frontend for display and Excel download

---

## 1. MongoDB Schema

### LowRatingSearch Model
**File**: `models/LowRatingSearch.js`

```javascript
const mongoose = require('mongoose');

const lowRatingSearchSchema = new mongoose.Schema({
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
  niche: String, // business category/keyword
  maxRating: { type: Number, default: 3.0 }, // rating threshold
  leads: { type: Number, default: 200 }, // max leads per run
  resultsCount: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  createdAt: { type: Date, default: Date.now },
  executedAt: Date
});

module.exports = mongoose.model('LowRatingSearch', lowRatingSearchSchema);
```

### LowRatingBusiness Model
**File**: `models/LowRatingBusiness.js`

```javascript
const mongoose = require('mongoose');

const lowRatingBusinessSchema = new mongoose.Schema({
  searchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LowRatingSearch',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  businessName: { type: String, required: true },
  rating: { type: Number, required: true }, // 1.0-5.0
  totalReviews: { type: Number, default: 0 }, // number of reviews
  phone: String,
  email: String,
  website: String,
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

module.exports = mongoose.model('LowRatingBusiness', lowRatingBusinessSchema);
```

---

## 2. API Endpoints

### POST /api/low-rating/scan
**Description**: Initiate a scan for businesses with low ratings

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
  "maxRating": 3.0,
  "leads": 200
}
```

**Response**:
```json
{
  "success": true,
  "message": "Found 25 businesses with low ratings",
  "count": 25,
  "data": [
    {
      "_id": "biz123",
      "businessName": "Joe's Pizza",
      "rating": 2.8,
      "totalReviews": 45,
      "phone": "+1-555-0123",
      "email": "contact@joespizza.com",
      "website": "https://joespizza.com",
      "address": "123 Main St, San Francisco, CA 94102",
      "city": "San Francisco",
      "state": "California",
      "country": "United States",
      "niche": "Restaurant"
    }
  ]
}
```

### GET /api/low-rating/searches/recent?limit=20
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
      "maxRating": 3.0,
      "leads": 200,
      "resultsCount": 25,
      "status": "completed",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### GET /api/low-rating/searches/:searchId/results
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
      "maxRating": 3.0,
      "resultsCount": 25
    },
    "results": [
      {
        "_id": "biz123",
        "businessName": "Joe's Pizza",
        "rating": 2.8,
        "totalReviews": 45,
        "phone": "+1-555-0123",
        "email": "contact@joespizza.com",
        "website": "https://joespizza.com",
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

### DELETE /api/low-rating/searches/:searchId
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

### Controller: lowRatingController.js
**File**: `controllers/lowRatingController.js`

```javascript
const LowRatingSearch = require('../models/LowRatingSearch');
const LowRatingBusiness = require('../models/LowRatingBusiness');
const googlePlacesService = require('../services/googlePlacesService');

// POST /api/low-rating/scan
exports.scanForLowRatingBusinesses = async (req, res) => {
  try {
    const { city, state, country, radius, niche, maxRating, leads } = req.body;
    const userId = req.user._id; // from JWT auth middleware

    // Validate maxRating
    const ratingThreshold = maxRating || 3.0;
    if (ratingThreshold < 1.0 || ratingThreshold > 5.0) {
      return res.status(400).json({
        success: false,
        message: 'maxRating must be between 1.0 and 5.0'
      });
    }

    // Create search record
    const search = await LowRatingSearch.create({
      userId,
      city,
      state,
      country,
      radius,
      niche,
      maxRating: ratingThreshold,
      leads: leads || 200,
      status: 'processing',
      executedAt: new Date()
    });

    // Step 1: Find businesses using Google Places
    const businesses = await googlePlacesService.findBusinessesByRating({
      city,
      state,
      country,
      radius,
      category: niche,
      maxRating: ratingThreshold,
      limit: leads || 200
    });

    const savedBusinesses = [];

    // Step 2: Store each business in database
    for (const business of businesses) {
      try {
        const savedBusiness = await LowRatingBusiness.create({
          searchId: search._id,
          userId,
          businessName: business.name,
          rating: business.rating,
          totalReviews: business.totalReviews || business.user_ratings_total || 0,
          phone: business.phone,
          email: business.email,
          website: business.website,
          address: business.address,
          city: business.city || city,
          state: business.state || state,
          country: business.country || country,
          niche: business.category || niche,
          location: business.location
        });

        savedBusinesses.push(savedBusiness);
      } catch (error) {
        console.error(`Error saving business ${business.name}:`, error);
      }
    }

    // Update search with results count
    search.resultsCount = savedBusinesses.length;
    search.status = 'completed';
    await search.save();

    res.json({
      success: true,
      message: `Found ${savedBusinesses.length} businesses with ratings ≤ ${ratingThreshold}`,
      count: savedBusinesses.length,
      data: savedBusinesses
    });

  } catch (error) {
    console.error('Scan error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Scan failed'
    });
  }
};

// GET /api/low-rating/searches/recent
exports.getRecentSearches = async (req, res) => {
  try {
    const userId = req.user._id;
    const limit = parseInt(req.query.limit) || 20;

    const searches = await LowRatingSearch.find({ userId })
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

// GET /api/low-rating/searches/:searchId/results
exports.getSearchResults = async (req, res) => {
  try {
    const { searchId } = req.params;
    const userId = req.user._id;

    // Verify search belongs to user
    const search = await LowRatingSearch.findOne({ _id: searchId, userId });
    if (!search) {
      return res.status(404).json({
        success: false,
        message: 'Search not found'
      });
    }

    // Get all businesses for this search
    const businesses = await LowRatingBusiness.find({ 
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

// DELETE /api/low-rating/searches/:searchId
exports.deleteSearch = async (req, res) => {
  try {
    const { searchId } = req.params;
    const userId = req.user._id;

    // Delete search (only if belongs to user)
    const search = await LowRatingSearch.findOneAndDelete({ 
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
    await LowRatingBusiness.deleteMany({ searchId, userId });

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

### Service: googlePlacesService.js
**File**: `services/googlePlacesService.js`

Add this method to your existing Google Places service:

```javascript
const axios = require('axios');

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

/**
 * Find businesses with ratings below threshold
 */
exports.findBusinessesByRating = async ({ city, state, country, radius, category, maxRating, limit }) => {
  try {
    // Step 1: Geocode the location
    const location = await geocodeLocation(`${city}, ${state}, ${country}`);
    
    // Step 2: Search for businesses
    const query = category ? `${category} in ${city}` : city;
    const placesUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json`;
    
    let allBusinesses = [];
    let nextPageToken = null;

    // Google Places returns max 20 results per page, need to paginate
    do {
      const params = {
        query,
        location: `${location.lat},${location.lng}`,
        radius,
        key: GOOGLE_PLACES_API_KEY
      };

      if (nextPageToken) {
        params.pagetoken = nextPageToken;
      }

      const response = await axios.get(placesUrl, { params });
      
      // Filter businesses with rating <= maxRating
      for (const place of response.data.results) {
        if (allBusinesses.length >= limit) break;

        // Get place details
        const details = await getPlaceDetails(place.place_id);
        
        // Only include if rating exists and is <= maxRating
        if (details.rating && details.rating <= maxRating) {
          allBusinesses.push({
            name: details.name,
            rating: details.rating,
            totalReviews: details.user_ratings_total || 0,
            phone: details.formatted_phone_number,
            website: details.website,
            address: details.formatted_address,
            category: details.types?.[0],
            email: null, // Not provided by Google Places
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

      nextPageToken = response.data.next_page_token;
      
      // Need to wait 2 seconds before requesting next page
      if (nextPageToken && allBusinesses.length < limit) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

    } while (nextPageToken && allBusinesses.length < limit);

    return allBusinesses.slice(0, limit);

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
      fields: 'name,rating,user_ratings_total,formatted_phone_number,formatted_address,website,types,geometry',
      key: GOOGLE_PLACES_API_KEY
    }
  });
  
  return response.data.result;
}
```

---

## 5. Routes Configuration

### Routes: lowRatingRoutes.js
**File**: `routes/lowRatingRoutes.js`

```javascript
const express = require('express');
const router = express.Router();
const lowRatingController = require('../controllers/lowRatingController');
const authMiddleware = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

router.post('/scan', lowRatingController.scanForLowRatingBusinesses);
router.get('/searches/recent', lowRatingController.getRecentSearches);
router.get('/searches/:searchId/results', lowRatingController.getSearchResults);
router.delete('/searches/:searchId', lowRatingController.deleteSearch);

module.exports = router;
```

### Main app.js integration

```javascript
const lowRatingRoutes = require('./routes/lowRatingRoutes');

app.use('/api/low-rating', lowRatingRoutes);
```

---

## 6. Environment Variables

Add to `.env` file:

```env
GOOGLE_PLACES_API_KEY=your_google_places_api_key
JWT_SECRET=your_jwt_secret
MONGODB_URI=your_mongodb_connection_string
```

---

## 7. Authorization & Security

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

## 8. Data Fields Summary

For each business found, the system collects:

| Field | Source | Required | Type |
|-------|--------|----------|------|
| Business Name | Google Places | Yes | String |
| Rating | Google Places | Yes | Number (1.0-5.0) |
| Total Reviews | Google Places | Yes | Number |
| Phone Number | Google Places | No | String |
| Email | Not available | No | String |
| Website | Google Places | No | String |
| Full Address | Google Places | Yes | String |
| Niche/Category | Google Places | Yes | String |
| City | Search params / Google Places | Yes | String |
| State | Search params / Google Places | No | String |
| Country | Search params | Yes | String |

---

## 9. Search Parameters

### Request Parameters:
```javascript
{
  city: String,           // Required - "San Francisco"
  state: String,          // Optional - "California"
  country: String,        // Required - "United States"
  radius: Number,         // Required - 5000 (meters)
  niche: String,          // Optional - "restaurants"
  maxRating: Number,      // Optional - 3.0 (default)
  leads: Number           // Optional - 200 (default, max 200)
}
```

### Validation Rules:
- `maxRating`: Must be between 1.0 and 5.0
- `leads`: Must be between 1 and 200
- `radius`: Must be between 1000 and 50000 meters
- `city` and `country`: Required fields

---

## 10. Rating Filter Logic

### How Rating Filtering Works:

```javascript
// Only include businesses where rating <= maxRating
if (details.rating && details.rating <= maxRating) {
  // Include this business
}
```

### Examples:
- `maxRating: 3.0` → Returns businesses with ratings 1.0, 1.5, 2.0, 2.5, 3.0
- `maxRating: 2.5` → Returns businesses with ratings 1.0, 1.5, 2.0, 2.5
- `maxRating: 4.0` → Returns businesses with ratings up to 4.0

### Best Practices:
- **Default threshold**: 3.0 (good balance)
- **Strict filter**: 2.5 or below (very low ratings)
- **Moderate filter**: 3.5 or below (below average)
- **Minimum reviews**: Consider filtering businesses with < 10 reviews (optional)

---

## 11. Pagination & Limits

### Google Places API Limits:
- **Max per page**: 20 results
- **Max total**: 60 results per query (3 pages)
- **Page delay**: 2 seconds between page requests

### Implementation Strategy:
```javascript
// To get more results, use multiple queries with different parameters
// Example: Search by different categories or split radius into grid
```

### Lead Limit:
- Frontend default: 200 leads
- Backend should handle pagination to reach 200 results
- May require multiple Google Places queries

---

## 12. Error Handling

### Common Errors:

```javascript
// Invalid rating threshold
if (maxRating < 1.0 || maxRating > 5.0) {
  return res.status(400).json({
    success: false,
    message: 'maxRating must be between 1.0 and 5.0'
  });
}

// Location not found
if (!location) {
  throw new Error('Location not found');
}

// Google Places API error
catch (error) {
  console.error('Google Places error:', error);
  throw new Error('Failed to fetch businesses from Google Places');
}

// Search not found or unauthorized
if (!search) {
  return res.status(404).json({
    success: false,
    message: 'Search not found'
  });
}
```

---

## 13. Testing Guide

### Manual Testing:

1. **Create Search**:
```bash
curl -X POST http://localhost:5000/api/low-rating/scan \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "city": "San Francisco",
    "state": "California",
    "country": "United States",
    "radius": 5000,
    "niche": "restaurants",
    "maxRating": 3.0,
    "leads": 50
  }'
```

2. **Get Recent Searches**:
```bash
curl -X GET http://localhost:5000/api/low-rating/searches/recent?limit=10 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

3. **Get Search Results**:
```bash
curl -X GET http://localhost:5000/api/low-rating/searches/SEARCH_ID/results \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

4. **Delete Search**:
```bash
curl -X DELETE http://localhost:5000/api/low-rating/searches/SEARCH_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 14. Implementation Checklist

### Database:
- [ ] Create `LowRatingSearch` model
- [ ] Create `LowRatingBusiness` model
- [ ] Add indexes on `userId` and `searchId`

### Services:
- [ ] Add `findBusinessesByRating` method to Google Places service
- [ ] Implement rating filter logic
- [ ] Handle pagination for multiple pages

### Controllers:
- [ ] Implement `scanForLowRatingBusinesses`
- [ ] Implement `getRecentSearches`
- [ ] Implement `getSearchResults`
- [ ] Implement `deleteSearch`
- [ ] Add validation for maxRating and leads

### Routes:
- [ ] Create `/api/low-rating/scan` endpoint
- [ ] Create `/api/low-rating/searches/recent` endpoint
- [ ] Create `/api/low-rating/searches/:searchId/results` endpoint
- [ ] Create `/api/low-rating/searches/:searchId` DELETE endpoint
- [ ] Add JWT authentication middleware

### Testing:
- [ ] Test with different rating thresholds
- [ ] Test with different locations
- [ ] Test pagination for large result sets
- [ ] Test user isolation (can't access other users' data)
- [ ] Test error handling

---

## 15. Performance Optimization

### Strategies:
1. **Caching**: Cache geocoding results for common locations
2. **Batch Processing**: Process multiple businesses in parallel
3. **Database Indexes**: Add indexes on frequently queried fields
4. **Rate Limiting**: Implement rate limiting to prevent API abuse
5. **Background Jobs**: For large searches, use queue system (Bull, Agenda)

---

## 16. Future Enhancements

### Potential Features:
- [ ] Email extraction from websites
- [ ] Sentiment analysis of reviews
- [ ] Competitor analysis
- [ ] Automated outreach campaigns
- [ ] Review monitoring and alerts
- [ ] Reputation score calculation
- [ ] Historical rating tracking

---

## Summary

This backend implementation provides:
- ✅ Complete MongoDB schema for searches and businesses
- ✅ Full CRUD API endpoints with JWT authentication
- ✅ Google Places integration with rating filter
- ✅ User-specific data isolation
- ✅ Error handling and validation
- ✅ Pagination support for large result sets
- ✅ Comprehensive testing guide

**Status**: Ready for implementation by AI agent or developer

**Estimated Time**: 4-6 hours for complete implementation

**Dependencies**: 
- mongoose
- express
- axios
- jsonwebtoken
- dotenv
