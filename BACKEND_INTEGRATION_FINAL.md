# Backend Integration Guide - Complete Frontend Changes

## 🎯 Overview

The frontend has been updated with three major changes:
1. ✅ **Lead Cap Removed** - No more user-defined limits on results
2. ✅ **OpenStreetMap Location Selector** - GPS coordinates for precise location selection
3. ✅ **Hunter.io Email Enrichment** - Optional email lookup toggle

---

## 📋 Summary of Changes

### What Was Removed:
- ❌ `leadCap` field (Legacy Finder)
- ❌ `leads` field (No Website & Low Rating Finders)
- ❌ `radius` selector dropdown (now fixed at 5km)

### What Was Added:
- ✅ `lat` & `lng` - GPS coordinates (optional)
- ✅ `useHunter` - Email enrichment toggle (boolean)
- ✅ Map-based location selection
- ✅ Fixed 5km search radius

---

## 📊 Request Format Changes

### Legacy Finder API (`/api/scan`)

**OLD Request:**
```json
{
  "city": "San Francisco",
  "state": "California",
  "country": "United States",
  "radius": 10000,
  "businessCategory": "restaurants",
  "leadCap": 50,
  "domainYear": "2020",
  "filterMode": "before"
}
```

**NEW Request (with map):**
```json
{
  "city": "San Francisco",
  "state": "California",
  "country": "United States",
  "radius": 5000,
  "lat": 37.7749,
  "lng": -122.4194,
  "businessCategory": "restaurants",
  "domainYear": "2020",
  "filterMode": "before",
  "useHunter": true
}
```

**NEW Request (without map):**
```json
{
  "city": "San Francisco",
  "state": "California",
  "country": "United States",
  "radius": 5000,
  "businessCategory": "restaurants",
  "domainYear": "2020",
  "filterMode": "before",
  "useHunter": true
}
```

---

### No Website Finder API (`/api/no-website/scan`)

**OLD Request:**
```json
{
  "city": "New York",
  "state": "NY",
  "country": "United States",
  "radius": 10000,
  "niche": "restaurants",
  "leads": 50
}
```

**NEW Request (with map):**
```json
{
  "city": "New York",
  "state": "NY",
  "country": "United States",
  "radius": 5000,
  "lat": 40.7128,
  "lng": -74.0060,
  "niche": "restaurants",
  "useHunter": true
}
```

**NEW Request (without map):**
```json
{
  "city": "New York",
  "state": "NY",
  "country": "United States",
  "radius": 5000,
  "niche": "restaurants",
  "useHunter": true
}
```

---

### Low Rating Finder API (`/api/low-rating/scan`)

**OLD Request:**
```json
{
  "city": "Los Angeles",
  "state": "CA",
  "country": "United States",
  "radius": 10000,
  "niche": "hotels",
  "maxRating": 3.0,
  "leads": 200
}
```

**NEW Request (with map):**
```json
{
  "city": "Los Angeles",
  "state": "CA",
  "country": "United States",
  "radius": 5000,
  "lat": 34.0522,
  "lng": -118.2437,
  "niche": "hotels",
  "maxRating": 3.0,
  "useHunter": true
}
```

**NEW Request (without map):**
```json
{
  "city": "Los Angeles",
  "state": "CA",
  "country": "United States",
  "radius": 5000,
  "niche": "hotels",
  "maxRating": 3.0,
  "useHunter": true
}
```

---

## 🔧 Required Backend Changes

### 1. Update ALL THREE Controllers

Files to modify:
- `controllers/legacyFinderController.js`
- `controllers/noWebsiteController.js`
- `controllers/lowRatingController.js`

---

### 2. Parameter Extraction & Validation

#### Legacy Finder Controller

```javascript
exports.scanForBusinesses = async (req, res) => {
  try {
    const { 
      city, 
      state, 
      country, 
      radius = 5000,           // Always 5km
      lat,                     // Optional: from map
      lng,                     // Optional: from map
      businessCategory,
      domainYear,
      filterMode,
      useHunter = false        // Optional: email enrichment
    } = req.body;
    
    // Validation: need either coordinates OR city/country
    if ((!lat || !lng) && (!city || !country)) {
      return res.status(400).json({ 
        success: false,
        error: 'Either coordinates (lat/lng) or location (city/country) required' 
      });
    }
    
    // Get search coordinates
    const searchLocation = await getSearchCoordinates({
      lat, lng, city, state, country
    });
    
    // Create search record
    const search = await Search.create({
      userId: req.user.id,
      city: city || 'Map Location',
      state,
      country: country || 'N/A',
      coordinates: searchLocation,
      radius: 5000,              // Fixed at 5km
      businessCategory,
      domainYear,
      filterMode,
      useHunter,
      status: 'processing',
      type: 'legacy-finder'
    });
    
    // Start background processing
    processLegacySearch(search._id, {
      location: searchLocation,
      radius: 5000,
      businessCategory,
      domainYear,
      filterMode,
      useHunter
    });
    
    res.json({
      success: true,
      searchId: search._id,
      message: 'Search started'
    });
    
  } catch (error) {
    console.error('❌ Scan error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
```

#### No Website Finder Controller

```javascript
exports.scanForBusinesses = async (req, res) => {
  try {
    const { 
      city, 
      state, 
      country, 
      radius = 5000,           // Always 5km
      lat,                     // Optional: from map
      lng,                     // Optional: from map
      niche,
      useHunter = false        // Optional: email enrichment
    } = req.body;
    
    // Validation
    if ((!lat || !lng) && (!city || !country)) {
      return res.status(400).json({ 
        success: false,
        error: 'Either coordinates (lat/lng) or location (city/country) required' 
      });
    }
    
    // Get search coordinates
    const searchLocation = await getSearchCoordinates({
      lat, lng, city, state, country
    });
    
    // Create search record
    const search = await Search.create({
      userId: req.user.id,
      city: city || 'Map Location',
      state,
      country: country || 'N/A',
      coordinates: searchLocation,
      radius: 5000,              // Fixed at 5km
      niche,
      useHunter,
      status: 'processing',
      type: 'no-website-finder'
    });
    
    // Start background processing (return ALL results)
    processNoWebsiteSearch(search._id, {
      location: searchLocation,
      radius: 5000,
      niche,
      useHunter
    });
    
    res.json({
      success: true,
      searchId: search._id,
      message: 'Search started'
    });
    
  } catch (error) {
    console.error('❌ Scan error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
```

#### Low Rating Finder Controller

```javascript
exports.scanForBusinesses = async (req, res) => {
  try {
    const { 
      city, 
      state, 
      country, 
      radius = 5000,           // Always 5km
      lat,                     // Optional: from map
      lng,                     // Optional: from map
      niche,
      maxRating = 3.0,
      useHunter = false        // Optional: email enrichment
    } = req.body;
    
    // Validation
    if ((!lat || !lng) && (!city || !country)) {
      return res.status(400).json({ 
        success: false,
        error: 'Either coordinates (lat/lng) or location (city/country) required' 
      });
    }
    
    // Get search coordinates
    const searchLocation = await getSearchCoordinates({
      lat, lng, city, state, country
    });
    
    // Create search record
    const search = await Search.create({
      userId: req.user.id,
      city: city || 'Map Location',
      state,
      country: country || 'N/A',
      coordinates: searchLocation,
      radius: 5000,              // Fixed at 5km
      niche,
      maxRating,
      useHunter,
      status: 'processing',
      type: 'low-rating-finder'
    });
    
    // Start background processing (return ALL results)
    processLowRatingSearch(search._id, {
      location: searchLocation,
      radius: 5000,
      niche,
      maxRating,
      useHunter
    });
    
    res.json({
      success: true,
      searchId: search._id,
      message: 'Search started'
    });
    
  } catch (error) {
    console.error('❌ Scan error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
```

---

### 3. Add Coordinate Resolution Function

Add this helper function to all three controllers (or in a shared utils file):

```javascript
/**
 * Get search coordinates - use provided coordinates or geocode address
 * @param {Object} params - Location parameters
 * @param {number} params.lat - Latitude (optional)
 * @param {number} params.lng - Longitude (optional)
 * @param {string} params.city - City name
 * @param {string} params.state - State/province
 * @param {string} params.country - Country name
 * @returns {Promise<{lat: number, lng: number}>}
 */
async function getSearchCoordinates(params) {
  const { lat, lng, city, state, country } = params;
  
  // Priority 1: Use provided coordinates
  if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
    console.log(`✅ Using map coordinates: ${lat}, ${lng}`);
    return { 
      lat: parseFloat(lat), 
      lng: parseFloat(lng) 
    };
  }
  
  // Priority 2: Geocode the address
  console.log(`🔍 Geocoding address: ${city}, ${state}, ${country}`);
  
  try {
    const addressParts = [city, state, country].filter(Boolean);
    const address = addressParts.join(', ');
    
    if (!address) {
      throw new Error('No location information provided');
    }
    
    // Using Google Geocoding API
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json`;
    const params = new URLSearchParams({
      address: address,
      key: process.env.GOOGLE_PLACES_API_KEY
    });
    
    const response = await fetch(`${geocodeUrl}?${params}`);
    const data = await response.json();
    
    // Validate response
    if (!data.results || data.results.length === 0) {
      throw new Error(`Location not found: ${address}`);
    }
    
    if (data.status !== 'OK') {
      throw new Error(`Geocoding failed: ${data.status}`);
    }
    
    const location = data.results[0]?.geometry?.location;
    if (!location || !location.lat || !location.lng) {
      throw new Error('Invalid geocoding response');
    }
    
    console.log(`✅ Geocoded to: ${location.lat}, ${location.lng}`);
    return { 
      lat: location.lat, 
      lng: location.lng 
    };
    
  } catch (error) {
    console.error('❌ Geocoding error:', error);
    throw new Error(`Unable to determine search location: ${error.message}`);
  }
}
```

---

### 4. Update Google Places API Calls

Update your background processing functions to use coordinates:

```javascript
async function processLegacySearch(searchId, params) {
  const { location, radius, businessCategory, domainYear, filterMode, useHunter } = params;
  
  try {
    console.log(`🔍 Processing search ${searchId}`);
    console.log(`📍 Location: ${location.lat}, ${location.lng}`);
    console.log(`📏 Radius: ${radius}m (${radius/1000}km)`);
    
    // Call Google Places API with coordinates
    const placesUrl = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
    const placesParams = {
      location: `${location.lat},${location.lng}`,  // Use coordinates
      radius: radius,                                // Always 5000
      type: businessCategory,
      key: process.env.GOOGLE_PLACES_API_KEY
    };
    
    const response = await axios.get(placesUrl, { params: placesParams });
    
    if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
      throw new Error(`Google Places API error: ${response.data.status}`);
    }
    
    const businesses = response.data.results || [];
    console.log(`✅ Found ${businesses.length} businesses`);
    
    // Filter by domain age
    const legacyBusinesses = await filterByDomainAge(
      businesses.filter(b => b.website), // Only businesses with websites
      domainYear,
      filterMode
    );
    
    console.log(`✅ ${legacyBusinesses.length} are legacy sites`);
    
    // Enrich with Hunter.io if enabled
    if (useHunter) {
      await enrichWithHunterEmails(legacyBusinesses);
    }
    
    // Save ALL results (no lead cap limit)
    const results = await Result.insertMany(
      legacyBusinesses.map(business => ({
        searchId,
        businessData: business,
        type: 'legacy-finder'
      }))
    );
    
    // Update search status
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
```

---

### 5. Hunter.io Email Enrichment (Optional)

Add this function to enrich results with emails:

```javascript
/**
 * Enrich businesses with email addresses from Hunter.io
 * @param {Array} businesses - Array of business objects
 */
async function enrichWithHunterEmails(businesses) {
  if (!process.env.HUNTER_API_KEY) {
    console.warn('⚠️ Hunter.io API key not configured, skipping email enrichment');
    return;
  }
  
  console.log(`📧 Enriching ${businesses.length} businesses with Hunter.io emails...`);
  
  let enrichedCount = 0;
  
  for (const business of businesses) {
    if (!business.website) continue;
    
    try {
      // Extract domain from website URL
      const url = new URL(business.website.startsWith('http') 
        ? business.website 
        : `https://${business.website}`
      );
      const domain = url.hostname.replace('www.', '');
      
      // Call Hunter.io Domain Search API
      const response = await axios.get('https://api.hunter.io/v2/domain-search', {
        params: {
          domain: domain,
          api_key: process.env.HUNTER_API_KEY,
          limit: 5
        }
      });
      
      if (response.data?.data?.emails && response.data.data.emails.length > 0) {
        business.emails = response.data.data.emails
          .map(e => e.value)
          .filter(Boolean);
        enrichedCount++;
        console.log(`✅ Found ${business.emails.length} emails for ${domain}`);
      }
      
      // Rate limiting: Hunter.io free tier = 1 req/sec
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      // Don't fail the entire search if Hunter.io fails
      console.error(`⚠️ Hunter.io error for ${business.website}:`, error.message);
    }
  }
  
  console.log(`📧 Enriched ${enrichedCount}/${businesses.length} businesses with emails`);
}
```

---

### 6. Update Database Schema

Add new fields to your Search model:

```javascript
const searchSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  
  // Location info
  city: String,
  state: String,
  country: String,
  coordinates: {              // NEW: Store actual search coordinates
    lat: Number,
    lng: Number
  },
  
  // Search params
  radius: { 
    type: Number, 
    default: 5000             // Fixed at 5km
  },
  
  // Module-specific fields
  businessCategory: String,   // Legacy Finder
  domainYear: String,         // Legacy Finder
  filterMode: String,         // Legacy Finder
  niche: String,              // No Website / Low Rating
  maxRating: Number,          // Low Rating Finder
  
  // NEW: Email enrichment
  useHunter: { 
    type: Boolean, 
    default: false 
  },
  
  // Results tracking
  status: { 
    type: String, 
    enum: ['processing', 'completed', 'failed', 'cancelled'],
    default: 'processing'
  },
  resultsCount: Number,
  
  // Type identifier
  type: {
    type: String,
    enum: ['legacy-finder', 'no-website-finder', 'low-rating-finder']
  },
  
  // Error tracking
  error: String,
  
  // Timestamps
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  completedAt: Date
});

module.exports = mongoose.model('Search', searchSchema);
```

---

## 🧪 Testing

### Test Case 1: Legacy Finder with Map Location

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
    "domainYear": "2020",
    "filterMode": "before",
    "useHunter": true
  }'
```

**Expected:**
- ✅ Uses lat/lng directly (no geocoding)
- ✅ Searches at coordinates 37.7749, -122.4194
- ✅ Uses 5km radius
- ✅ Filters domains created before 2020
- ✅ Enriches with Hunter.io emails
- ✅ Returns ALL matching results (no limit)

---

### Test Case 2: No Website Finder without Map

```bash
curl -X POST http://localhost:5000/api/no-website/scan \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT" \
  -d '{
    "city": "New York",
    "state": "NY",
    "country": "United States",
    "radius": 5000,
    "niche": "cafes",
    "useHunter": false
  }'
```

**Expected:**
- ✅ Geocodes "New York, NY, United States"
- ✅ Uses geocoded coordinates
- ✅ Searches at geocoded location with 5km radius
- ✅ Finds businesses without websites
- ✅ Skips Hunter.io enrichment
- ✅ Returns ALL matching results

---

### Test Case 3: Low Rating Finder with Map

```bash
curl -X POST http://localhost:5000/api/low-rating/scan \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT" \
  -d '{
    "lat": 34.0522,
    "lng": -118.2437,
    "city": "Los Angeles",
    "state": "CA",
    "country": "United States",
    "radius": 5000,
    "niche": "hotels",
    "maxRating": 3.0,
    "useHunter": true
  }'
```

**Expected:**
- ✅ Uses lat/lng directly
- ✅ Searches at coordinates 34.0522, -118.2437
- ✅ Uses 5km radius
- ✅ Filters businesses with rating ≤ 3.0
- ✅ Enriches with Hunter.io emails
- ✅ Returns ALL matching results

---

## 🚨 Common Issues & Fixes

### Issue 1: "Cannot read properties of undefined (reading 'geometry')"

**Cause:** Geocoding response is empty or malformed

**Fix:**
```javascript
// Add proper validation
if (!data.results || data.results.length === 0) {
  throw new Error('Location not found');
}

const location = data.results[0]?.geometry?.location;
if (!location || !location.lat || !location.lng) {
  throw new Error('Invalid geocoding response');
}
```

---

### Issue 2: Coordinates Not Used

**Cause:** Backend doesn't check for coordinates first

**Fix:**
```javascript
// ALWAYS check coordinates first before geocoding
if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
  return { lat: parseFloat(lat), lng: parseFloat(lng) };
}
// Only geocode if coordinates not provided
```

---

### Issue 3: Wrong Radius

**Cause:** Backend using old radius values

**Fix:**
```javascript
// ALWAYS force radius to 5000
const radius = 5000;  // Ignore any client value
```

---

### Issue 4: Hunter.io Rate Limit

**Cause:** Too many requests to Hunter.io

**Fix:**
```javascript
// Add 1 second delay between requests
await new Promise(resolve => setTimeout(resolve, 1000));

// OR use try-catch to handle errors gracefully
try {
  // Hunter.io call
} catch (error) {
  console.warn('Hunter.io error:', error.message);
  // Continue processing - don't fail entire search
}
```

---

## 📝 Checklist

### For ALL THREE Modules:

- [ ] Remove `leadCap`/`leads` parameter handling
- [ ] Accept `lat` and `lng` parameters (optional)
- [ ] Accept `useHunter` parameter (boolean)
- [ ] Add `getSearchCoordinates()` helper function
- [ ] Update validation: allow coordinates OR city/country
- [ ] Update Google Places calls to use coordinates
- [ ] Force radius to 5000 meters
- [ ] Add Hunter.io enrichment function
- [ ] Update database schema with new fields
- [ ] Return ALL results (remove artificial limits)
- [ ] Add proper error handling
- [ ] Test with coordinates
- [ ] Test without coordinates
- [ ] Test with useHunter enabled
- [ ] Test with useHunter disabled

---

## 🔑 Environment Variables

Add to `.env`:

```bash
# Google Places API (existing)
GOOGLE_PLACES_API_KEY=your_google_api_key_here

# Hunter.io API (new - optional)
HUNTER_API_KEY=your_hunter_api_key_here
```

Get Hunter.io API key: https://hunter.io/api-keys

**Free Tier Limits:**
- 25 searches/month
- 50 verifications/month  
- 1 request/second rate limit

---

## 📚 API Documentation

### Hunter.io Domain Search

```javascript
GET https://api.hunter.io/v2/domain-search
  ?domain=example.com
  &api_key=YOUR_API_KEY
  &limit=5

Response:
{
  "data": {
    "domain": "example.com",
    "emails": [
      {
        "value": "john@example.com",
        "type": "personal",
        "confidence": 95
      }
    ]
  }
}
```

### Google Geocoding API

```javascript
GET https://maps.googleapis.com/maps/api/geocode/json
  ?address=San+Francisco,CA,USA
  &key=YOUR_API_KEY

Response:
{
  "results": [
    {
      "geometry": {
        "location": {
          "lat": 37.7749,
          "lng": -122.4194
        }
      }
    }
  ],
  "status": "OK"
}
```

---

## ✅ Success Criteria

After implementing these changes:

1. ✅ Searches work with map coordinates
2. ✅ Searches work with text addresses
3. ✅ All searches use 5km radius
4. ✅ All results are returned (no artificial limits)
5. ✅ Hunter.io enrichment works when enabled
6. ✅ Hunter.io is skipped when disabled
7. ✅ Coordinates are stored in database
8. ✅ Proper error messages for invalid locations
9. ✅ All three modules work correctly

---

## 🆘 Need Help?

Frontend code reference:
- `src/pages/SearchPage.tsx` (Legacy Finder)
- `src/pages/nowebsite/NoWebsiteSearchPage.tsx` (No Website)
- `src/pages/lowrating/LowRatingSearchPage.tsx` (Low Rating)
- `src/components/LocationMap.tsx` (Map component)

Key changes:
1. Map sends `lat` & `lng` when location selected
2. `useHunter` toggle sends boolean value
3. Radius fixed at 5000 (not user-selectable)
4. No lead cap - return all results
