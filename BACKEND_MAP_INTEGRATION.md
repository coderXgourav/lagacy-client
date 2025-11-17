# Backend Integration Guide - Map Location Feature

## Quick Overview
The frontend now sends GPS coordinates (`lat`, `lng`) when users select a location on the map. The backend needs to handle these coordinates for the Google Places search.

---

## What Changed in Frontend

### Old Request Format
```json
{
  "city": "San Francisco",
  "state": "California",
  "country": "United States",
  "radius": 10000,
  "businessCategory": "restaurants",
  "leadCap": 50
}
```

### New Request Format
```json
{
  "city": "San Francisco",
  "state": "California", 
  "country": "United States",
  "radius": 5000,
  "lat": 37.7749,
  "lng": -122.4194,
  "businessCategory": "restaurants",
  "leadCap": 50,
  "useHunter": true
}
```

**Key Changes:**
1. ✅ `radius` is now ALWAYS 5000 (5km) - hardcoded, no longer user-selectable
2. ✅ `lat` and `lng` are optional new fields (null if user doesn't use map)
3. ✅ If `lat`/`lng` present, use them instead of geocoding the address

---

## Backend Changes Required

### File: `routes/scan.js` or `routes/legacyFinder.js`

#### Step 1: Update Request Validation

**Before:**
```javascript
router.post('/scan', async (req, res) => {
  const { city, state, country, radius, businessCategory, leadCap } = req.body;
  
  // Validation
  if (!city || !country) {
    return res.status(400).json({ error: 'City and country required' });
  }
  
  // ... rest of code
});
```

**After:**
```javascript
router.post('/scan', async (req, res) => {
  const { 
    city, 
    state, 
    country, 
    radius = 5000, // Default to 5km if not provided
    lat,           // NEW: optional latitude
    lng,           // NEW: optional longitude
    businessCategory, 
    leadCap,
    useHunter 
  } = req.body;
  
  // Updated validation - either coordinates OR city/country required
  if ((!lat || !lng) && (!city || !country)) {
    return res.status(400).json({ 
      error: 'Either coordinates (lat/lng) or location (city/country) required' 
    });
  }
  
  // ... rest of code
});
```

#### Step 2: Update Location Resolution

**Add this function before your route handler:**
```javascript
/**
 * Get search location coordinates
 * Uses provided coordinates if available, otherwise geocodes the address
 */
async function getSearchCoordinates(params) {
  const { lat, lng, city, state, country } = params;
  
  // If coordinates provided, use them directly
  if (lat && lng) {
    console.log(`Using provided coordinates: ${lat}, ${lng}`);
    return { lat, lng };
  }
  
  // Otherwise, geocode the address
  console.log(`Geocoding address: ${city}, ${state}, ${country}`);
  
  try {
    // Using Google Geocoding API (replace with your geocoding method)
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(`${city}, ${state}, ${country}`)}&key=${process.env.GOOGLE_PLACES_API_KEY}`;
    
    const response = await fetch(geocodeUrl);
    const data = await response.json();
    
    if (data.status === 'OK' && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return { lat: location.lat, lng: location.lng };
    }
    
    throw new Error(`Geocoding failed: ${data.status}`);
  } catch (error) {
    console.error('Geocoding error:', error);
    throw new Error('Unable to determine search location');
  }
}
```

#### Step 3: Update Google Places Search

**Before:**
```javascript
router.post('/scan', async (req, res) => {
  // ... validation code
  
  // Geocode city to get coordinates
  const coordinates = await geocodeCity(city, state, country);
  
  // Search Google Places
  const businesses = await searchGooglePlaces({
    location: coordinates,
    radius: radius,
    type: businessCategory
  });
  
  // ... rest of processing
});
```

**After:**
```javascript
router.post('/scan', async (req, res) => {
  const { 
    city, 
    state, 
    country, 
    radius = 5000,
    lat,
    lng,
    businessCategory, 
    leadCap,
    useHunter 
  } = req.body;
  
  // Updated validation
  if ((!lat || !lng) && (!city || !country)) {
    return res.status(400).json({ 
      error: 'Either coordinates or location required' 
    });
  }
  
  try {
    // Get coordinates (from params or geocode)
    const searchLocation = await getSearchCoordinates({
      lat,
      lng,
      city,
      state,
      country
    });
    
    console.log('Search location:', searchLocation);
    console.log('Search radius:', radius, 'meters');
    
    // Search Google Places with coordinates
    const businesses = await searchGooglePlaces({
      location: searchLocation,
      radius: radius, // Will always be 5000 from frontend
      type: businessCategory
    });
    
    // ... rest of processing (domain checks, Hunter.io, etc.)
    
    res.json({
      success: true,
      count: businesses.length,
      data: businesses
    });
    
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
```

---

## Complete Example Implementation

Here's a full working example:

```javascript
const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

// Helper function to get coordinates
async function getSearchCoordinates(params) {
  const { lat, lng, city, state, country } = params;
  
  // If coordinates provided, use them directly
  if (lat && lng) {
    console.log(`✅ Using map coordinates: ${lat}, ${lng}`);
    return { 
      lat: parseFloat(lat), 
      lng: parseFloat(lng) 
    };
  }
  
  // Otherwise, geocode the address
  console.log(`🔍 Geocoding address: ${city}, ${state}, ${country}`);
  
  const addressParts = [city, state, country].filter(Boolean);
  const address = addressParts.join(', ');
  
  const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.GOOGLE_PLACES_API_KEY}`;
  
  const response = await fetch(geocodeUrl);
  const data = await response.json();
  
  if (data.status === 'OK' && data.results.length > 0) {
    const location = data.results[0].geometry.location;
    console.log(`✅ Geocoded to: ${location.lat}, ${location.lng}`);
    return { lat: location.lat, lng: location.lng };
  }
  
  throw new Error(`Geocoding failed: ${data.status}`);
}

// Legacy Finder Scan Endpoint
router.post('/scan', authMiddleware, async (req, res) => {
  try {
    const { 
      city, 
      state, 
      country, 
      radius = 5000,  // Default 5km
      lat,            // Optional: from map selection
      lng,            // Optional: from map selection
      businessCategory, 
      leadCap = 50,
      domainYear,
      filterMode,
      useHunter = false
    } = req.body;
    
    const userId = req.user.id;
    
    // Validation - need either coordinates OR city/country
    if ((!lat || !lng) && (!city || !country)) {
      return res.status(400).json({ 
        success: false,
        error: 'Please provide either map coordinates or city/country' 
      });
    }
    
    console.log('=== Legacy Finder Search Request ===');
    console.log('User:', userId);
    console.log('Location params:', { city, state, country, lat, lng });
    console.log('Search params:', { radius, businessCategory, leadCap });
    
    // Get search coordinates (from map or geocode)
    const searchLocation = await getSearchCoordinates({
      lat,
      lng,
      city,
      state,
      country
    });
    
    // Create search record
    const search = await Search.create({
      userId,
      city: city || 'Map Location',
      state,
      country: country || 'N/A',
      coordinates: searchLocation,  // Store coordinates
      radius,
      businessCategory,
      leadCap,
      domainYear,
      filterMode,
      useHunter,
      status: 'processing',
      type: 'legacy-finder'
    });
    
    // Start background processing
    processLegacySearch(search._id, {
      location: searchLocation,  // Pass coordinates
      radius,
      businessCategory,
      leadCap,
      domainYear,
      filterMode,
      useHunter
    });
    
    res.json({
      success: true,
      searchId: search._id,
      message: 'Search started',
      location: searchLocation  // Return coordinates for confirmation
    });
    
  } catch (error) {
    console.error('❌ Scan error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Background processing function
async function processLegacySearch(searchId, params) {
  const { location, radius, businessCategory, leadCap, domainYear, filterMode, useHunter } = params;
  
  try {
    console.log(`🔍 Processing search ${searchId}`);
    console.log(`📍 Location: ${location.lat}, ${location.lng}`);
    console.log(`📏 Radius: ${radius}m`);
    
    // 1. Search Google Places
    const businesses = await searchGooglePlacesNearby({
      location: `${location.lat},${location.lng}`,
      radius: radius,
      type: businessCategory,
      key: process.env.GOOGLE_PLACES_API_KEY
    });
    
    console.log(`✅ Found ${businesses.length} businesses`);
    
    // 2. Filter businesses with websites
    const businessesWithWebsites = businesses.filter(b => b.website);
    console.log(`✅ ${businessesWithWebsites.length} have websites`);
    
    // 3. Check domain ages
    const legacyBusinesses = await filterByDomainAge(
      businessesWithWebsites,
      domainYear,
      filterMode
    );
    
    console.log(`✅ ${legacyBusinesses.length} are legacy sites`);
    
    // 4. Enrich with Hunter.io (if enabled)
    if (useHunter) {
      await enrichWithHunterEmails(legacyBusinesses);
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
    
    console.log(`✅ Search ${searchId} completed: ${results.length} results`);
    
  } catch (error) {
    console.error(`❌ Search ${searchId} failed:`, error);
    
    await Search.findByIdAndUpdate(searchId, {
      status: 'failed',
      error: error.message
    });
  }
}

module.exports = router;
```

---

## Database Schema Updates

### Update Search Model

Add coordinates field to store the search location:

```javascript
const searchSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Location info
  city: String,
  state: String,
  country: String,
  coordinates: {  // NEW: Store actual search coordinates
    lat: Number,
    lng: Number
  },
  
  // Search params
  radius: { type: Number, default: 5000 },
  businessCategory: String,
  leadCap: { type: Number, default: 50 },
  
  // Results
  status: { 
    type: String, 
    enum: ['processing', 'completed', 'failed', 'cancelled'],
    default: 'processing'
  },
  resultsCount: Number,
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  completedAt: Date,
  
  // Other fields...
});
```

---

## Testing the Integration

### Test Case 1: Map Location Selected

**Request:**
```bash
curl -X POST http://localhost:5000/api/scan \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT" \
  -d '{
    "lat": 37.7749,
    "lng": -122.4194,
    "city": "San Francisco",
    "state": "California",
    "country": "United States",
    "radius": 5000,
    "businessCategory": "restaurants",
    "leadCap": 10,
    "useHunter": true
  }'
```

**Expected Backend Behavior:**
- ✅ Use lat/lng directly (no geocoding needed)
- ✅ Search Google Places at coordinates 37.7749, -122.4194
- ✅ Use 5km radius
- ✅ Return businesses found at that location

### Test Case 2: Text Entry Only

**Request:**
```bash
curl -X POST http://localhost:5000/api/scan \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT" \
  -d '{
    "city": "New York",
    "state": "NY",
    "country": "United States",
    "radius": 5000,
    "businessCategory": "cafes",
    "leadCap": 10,
    "useHunter": false
  }'
```

**Expected Backend Behavior:**
- ✅ Notice lat/lng are missing
- ✅ Geocode "New York, NY, United States"
- ✅ Get coordinates from geocoding API
- ✅ Search Google Places at geocoded coordinates
- ✅ Use 5km radius
- ✅ Return results

---

## Common Issues & Solutions

### Issue 1: Geocoding Fails
**Symptom:** Error when user enters address but doesn't use map

**Solution:**
```javascript
async function getSearchCoordinates(params) {
  // ... existing code
  
  try {
    const response = await fetch(geocodeUrl);
    const data = await response.json();
    
    if (data.status === 'OK' && data.results.length > 0) {
      return { lat: location.lat, lng: location.lng };
    }
    
    // Fallback to default location or throw descriptive error
    if (data.status === 'ZERO_RESULTS') {
      throw new Error('Location not found. Please check the address or use the map.');
    }
    
    throw new Error(`Geocoding error: ${data.status}`);
  } catch (error) {
    console.error('Geocoding failed:', error);
    throw error;
  }
}
```

### Issue 2: Invalid Coordinates
**Symptom:** User somehow sends invalid lat/lng values

**Solution:**
```javascript
// Add coordinate validation
function validateCoordinates(lat, lng) {
  if (!lat || !lng) return false;
  
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);
  
  if (isNaN(latitude) || isNaN(longitude)) return false;
  if (latitude < -90 || latitude > 90) return false;
  if (longitude < -180 || longitude > 180) return false;
  
  return true;
}

// In route handler
if (lat && lng) {
  if (!validateCoordinates(lat, lng)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid coordinates provided'
    });
  }
}
```

### Issue 3: Radius Not Honored
**Symptom:** Search results don't respect 5km radius

**Solution:**
```javascript
// Ensure radius is always 5000
const radius = 5000;  // Don't trust client value

// OR validate and cap it
let radius = parseInt(req.body.radius) || 5000;
if (radius > 5000) {
  radius = 5000;  // Cap at 5km
  console.warn('Radius capped at 5000m');
}
```

---

## Logging Best Practices

Add these logs to help debug location issues:

```javascript
router.post('/scan', async (req, res) => {
  const { lat, lng, city, state, country } = req.body;
  
  console.log('=== LOCATION DEBUG ===');
  console.log('Has coordinates:', !!lat && !!lng);
  console.log('Coordinates:', { lat, lng });
  console.log('Has address:', !!city && !!country);
  console.log('Address:', { city, state, country });
  
  const searchLocation = await getSearchCoordinates({
    lat, lng, city, state, country
  });
  
  console.log('Final search location:', searchLocation);
  console.log('Distance from user input:', 
    calculateDistance(lat, lng, searchLocation.lat, searchLocation.lng)
  );
  console.log('=====================');
  
  // ... rest of code
});
```

---

## Performance Considerations

### Caching Geocoding Results

```javascript
const geocodeCache = new Map();

async function getSearchCoordinates(params) {
  const { lat, lng, city, state, country } = params;
  
  if (lat && lng) {
    return { lat: parseFloat(lat), lng: parseFloat(lng) };
  }
  
  // Check cache
  const cacheKey = `${city}-${state}-${country}`;
  if (geocodeCache.has(cacheKey)) {
    console.log('📦 Using cached coordinates');
    return geocodeCache.get(cacheKey);
  }
  
  // Geocode
  const coordinates = await geocodeAddress(city, state, country);
  
  // Cache for 24 hours
  geocodeCache.set(cacheKey, coordinates);
  setTimeout(() => geocodeCache.delete(cacheKey), 24 * 60 * 60 * 1000);
  
  return coordinates;
}
```

---

## Summary

### What You Need to Do:

1. ✅ **Update route handler** to accept `lat` and `lng` parameters
2. ✅ **Add coordinate validation** for when lat/lng are provided
3. ✅ **Implement getSearchCoordinates()** function to handle both cases
4. ✅ **Update Google Places calls** to use coordinates directly
5. ✅ **Add database field** to store coordinates in Search model
6. ✅ **Test both scenarios** (map location vs text entry)
7. ✅ **Add logging** for debugging location issues

### The Logic Flow:

```
Frontend Request
    ↓
Does it have lat/lng?
    ↓
YES → Use coordinates directly
    ↓
NO → Geocode city/state/country to get coordinates
    ↓
Search Google Places at coordinates with 5km radius
    ↓
Process results
    ↓
Return to frontend
```

That's it! The changes are straightforward - just check if coordinates are provided and use them, otherwise geocode the address. The radius is always 5km now.
