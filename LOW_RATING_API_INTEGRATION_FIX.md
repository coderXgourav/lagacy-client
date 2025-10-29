# Low Rating Business Finder - API Integration Fix Guide

## 🔴 Problem

The Low Rating Business Finder search is not showing results after the scan completes. The frontend is making API calls to the backend, but results are not displaying.

---

## 🔍 Root Cause

The backend endpoint `POST /api/low-rating/scan` is either:
1. Not implemented yet
2. Returning data in a different format than expected
3. Returning an error that's not being caught properly

---

## ✅ Expected API Response Format

The frontend expects the following response structure from `POST /api/low-rating/scan`:

```json
{
  "success": true,
  "message": "Found businesses with low ratings",
  "searchId": "507f1f77bcf86cd799439011",
  "resultsCount": 12,
  "businesses": [
    {
      "businessName": "Joe's Pizza",
      "name": "Joe's Pizza",
      "rating": 2.8,
      "totalReviews": 45,
      "phone": "+1-555-0123",
      "email": "contact@joespizza.com",
      "website": "https://joespizza.com",
      "address": "123 Main St",
      "city": "San Francisco",
      "state": "California",
      "country": "United States",
      "niche": "restaurant"
    }
  ]
}
```

### Required Fields:
- `businesses` (array) - List of business objects
- `searchId` (string) - MongoDB ObjectId of the search
- `resultsCount` (number) - Total count of businesses found
- `message` (string) - Success message

### Business Object Fields:
- `businessName` or `name` (string) - Business name
- `rating` (number) - Rating value (1.0-5.0)
- `totalReviews` (number) - Number of reviews
- `phone` (string) - Phone number
- `email` (string) - Email address
- `website` (string) - Website URL
- `address` (string) - Full address
- `city` (string) - City name
- `state` (string) - State/Province
- `country` (string) - Country name
- `niche` (string) - Business category

---

## 🛠️ Backend Implementation Steps

### Step 1: Create MongoDB Models

**File: `models/LowRatingSearch.js`**

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
  state: { type: String },
  country: { type: String, required: true },
  radius: { type: Number, default: 5000 },
  niche: { type: String },
  maxRating: { type: Number, default: 3.0 },
  leads: { type: Number, default: 200 },
  resultsCount: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('LowRatingSearch', lowRatingSearchSchema);
```

**File: `models/LowRatingBusiness.js`**

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
  rating: { type: Number, required: true },
  totalReviews: { type: Number, default: 0 },
  phone: { type: String },
  email: { type: String },
  website: { type: String },
  address: { type: String },
  city: { type: String },
  state: { type: String },
  country: { type: String },
  niche: { type: String },
  placeId: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('LowRatingBusiness', lowRatingBusinessSchema);
```

---

### Step 2: Create Controller

**File: `controllers/lowRatingController.js`**

```javascript
const LowRatingSearch = require('../models/LowRatingSearch');
const LowRatingBusiness = require('../models/LowRatingBusiness');
const googlePlacesService = require('../services/googlePlacesService');

// POST /api/low-rating/scan
exports.scanLowRatingBusinesses = async (req, res) => {
  try {
    const { city, state, country, radius = 5000, niche, maxRating = 3.0, leads = 200 } = req.body;
    const userId = req.user._id;

    // Validation
    if (!city || !country) {
      return res.status(400).json({
        success: false,
        message: 'City and country are required'
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
      maxRating,
      leads,
      status: 'processing'
    });

    // Search for businesses using Google Places API
    const location = `${city}${state ? ', ' + state : ''}, ${country}`;
    const businesses = await googlePlacesService.findBusinessesByRating({
      location,
      radius,
      type: niche,
      maxRating,
      maxResults: leads
    });

    // Save businesses to database
    const businessDocs = businesses.map(b => ({
      searchId: search._id,
      userId,
      businessName: b.name,
      rating: b.rating,
      totalReviews: b.user_ratings_total || 0,
      phone: b.formatted_phone_number,
      email: b.email,
      website: b.website,
      address: b.formatted_address,
      city: b.city || city,
      state: b.state || state,
      country: b.country || country,
      niche: b.types?.[0] || niche,
      placeId: b.place_id
    }));

    await LowRatingBusiness.insertMany(businessDocs);

    // Update search status
    search.resultsCount = businessDocs.length;
    search.status = 'completed';
    await search.save();

    res.json({
      success: true,
      message: `Found ${businessDocs.length} businesses with ratings below ${maxRating}`,
      searchId: search._id,
      resultsCount: businessDocs.length,
      businesses: businessDocs
    });

  } catch (error) {
    console.error('Low rating scan error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to scan for low rating businesses'
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
      .limit(limit);

    res.json({
      success: true,
      searches
    });
  } catch (error) {
    console.error('Get recent searches error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch recent searches'
    });
  }
};

// GET /api/low-rating/searches/:id/results
exports.getSearchResults = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const search = await LowRatingSearch.findOne({ _id: id, userId });
    if (!search) {
      return res.status(404).json({
        success: false,
        message: 'Search not found'
      });
    }

    const businesses = await LowRatingBusiness.find({ searchId: id, userId });

    res.json({
      success: true,
      search,
      businesses
    });
  } catch (error) {
    console.error('Get search results error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch search results'
    });
  }
};

// DELETE /api/low-rating/searches/:id
exports.deleteSearch = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const search = await LowRatingSearch.findOneAndDelete({ _id: id, userId });
    if (!search) {
      return res.status(404).json({
        success: false,
        message: 'Search not found'
      });
    }

    await LowRatingBusiness.deleteMany({ searchId: id, userId });

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

### Step 3: Update Google Places Service

**File: `services/googlePlacesService.js`**

Add this function to your existing Google Places service:

```javascript
// Find businesses by rating threshold
exports.findBusinessesByRating = async ({ location, radius, type, maxRating, maxResults = 200 }) => {
  const allBusinesses = [];
  let nextPageToken = null;
  const maxPages = 3; // Google Places API limit
  let pageCount = 0;

  try {
    do {
      const params = {
        query: type ? `${type} in ${location}` : location,
        radius,
        key: process.env.GOOGLE_PLACES_API_KEY
      };

      if (nextPageToken) {
        params.pagetoken = nextPageToken;
        // Required delay between page requests
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      const response = await axios.get(
        'https://maps.googleapis.com/maps/api/place/textsearch/json',
        { params }
      );

      if (response.data.status === 'OK') {
        // Filter by rating
        const filteredResults = response.data.results.filter(place => {
          return place.rating && place.rating <= maxRating;
        });

        allBusinesses.push(...filteredResults);
        nextPageToken = response.data.next_page_token;
        pageCount++;

        // Stop if we have enough results
        if (allBusinesses.length >= maxResults) {
          break;
        }
      } else {
        console.error('Google Places API error:', response.data.status);
        break;
      }
    } while (nextPageToken && pageCount < maxPages && allBusinesses.length < maxResults);

    // Limit to requested number of results
    return allBusinesses.slice(0, maxResults);

  } catch (error) {
    console.error('Error finding businesses by rating:', error);
    throw error;
  }
};
```

---

### Step 4: Create Routes

**File: `routes/lowRatingRoutes.js`**

```javascript
const express = require('express');
const router = express.Router();
const lowRatingController = require('../controllers/lowRatingController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// POST /api/low-rating/scan
router.post('/scan', lowRatingController.scanLowRatingBusinesses);

// GET /api/low-rating/searches/recent
router.get('/searches/recent', lowRatingController.getRecentSearches);

// GET /api/low-rating/searches/:id/results
router.get('/searches/:id/results', lowRatingController.getSearchResults);

// DELETE /api/low-rating/searches/:id
router.delete('/searches/:id', lowRatingController.deleteSearch);

module.exports = router;
```

---

### Step 5: Register Routes in Main App

**File: `app.js` or `server.js`**

Add this line with your other route registrations:

```javascript
const lowRatingRoutes = require('./routes/lowRatingRoutes');

// Register routes
app.use('/api/low-rating', lowRatingRoutes);
```

---

## 🧪 Testing the API

### Test with cURL:

```bash
# 1. Login to get token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# 2. Scan for low rating businesses
curl -X POST http://localhost:5000/api/low-rating/scan \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "city": "San Francisco",
    "state": "California",
    "country": "United States",
    "radius": 5000,
    "niche": "restaurant",
    "maxRating": 3.0,
    "leads": 50
  }'

# 3. Get recent searches
curl -X GET http://localhost:5000/api/low-rating/searches/recent?limit=10 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 4. Get search results
curl -X GET http://localhost:5000/api/low-rating/searches/SEARCH_ID/results \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 5. Delete search
curl -X DELETE http://localhost:5000/api/low-rating/searches/SEARCH_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🔧 Debugging Steps

### 1. Check Backend Logs

Look for errors in your backend console when the scan is triggered.

### 2. Check Frontend Network Tab

Open browser DevTools → Network tab → Look for the `/api/low-rating/scan` request:
- Check the request payload
- Check the response status code
- Check the response body

### 3. Verify API Response Structure

The response MUST include:
```json
{
  "businesses": [...],
  "searchId": "...",
  "resultsCount": 12
}
```

### 4. Check for CORS Issues

If you see CORS errors, add this to your backend:

```javascript
app.use(cors({
  origin: 'http://localhost:5173', // Your frontend URL
  credentials: true
}));
```

### 5. Verify JWT Token

Make sure the JWT token is being sent in the Authorization header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🚨 Common Issues & Solutions

### Issue 1: "Cannot read property 'length' of undefined"
**Solution**: Backend is not returning `businesses` array. Check response format.

### Issue 2: Results show "0 businesses found" but backend found results
**Solution**: Check if backend is returning `resultsCount` and `businesses` fields.

### Issue 3: API returns 401 Unauthorized
**Solution**: JWT token is missing or invalid. Check authentication middleware.

### Issue 4: API returns 404 Not Found
**Solution**: Route is not registered. Check `app.js` for route registration.

### Issue 5: Google Places API returns no results
**Solution**: 
- Check API key is valid
- Check API key has Places API enabled
- Check billing is enabled on Google Cloud Console

---

## ✅ Verification Checklist

- [ ] Models created (LowRatingSearch, LowRatingBusiness)
- [ ] Controller created with all 4 endpoints
- [ ] Google Places service updated with rating filter
- [ ] Routes file created
- [ ] Routes registered in main app
- [ ] JWT authentication middleware applied
- [ ] Google Places API key configured
- [ ] Test with cURL - scan endpoint works
- [ ] Test with cURL - recent searches works
- [ ] Test with frontend - results display
- [ ] Test with frontend - download works

---

## 📊 Expected Frontend Behavior

After backend is implemented correctly:

1. **User fills form** → Clicks "Start Scan"
2. **Loading overlay appears** → "Scanning for Low Rating Businesses..."
3. **API call made** → `POST /api/low-rating/scan`
4. **Backend processes** → Searches Google Places, filters by rating
5. **Response received** → Contains `businesses` array
6. **Results card appears** → Shows "Found X Businesses with Low Ratings"
7. **Business cards display** → Each business with rating, phone, email, etc.
8. **Download button works** → Generates Excel file

---

## 🎯 Quick Fix Summary

If you just want to get it working quickly:

1. Copy the controller code above
2. Copy the models code above
3. Copy the routes code above
4. Add the Google Places service function
5. Register routes in app.js
6. Restart backend server
7. Test from frontend

The frontend is already configured correctly and will work once the backend returns the proper response format.

---

## 📞 Need Help?

Check these files for reference:
- `LOW_RATING_FINDER_BACKEND_DOCS.md` - Full backend documentation
- `src/services/api.ts` - Frontend API calls
- `src/pages/lowrating/LowRatingSearchPage.tsx` - Frontend search page

The issue is 100% on the backend side. The frontend is ready and waiting for the correct API response.
