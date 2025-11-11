# Frontend Changes - Backend Integration Required

## Overview
The frontend has been updated with two new features that require backend integration:
1. **OpenStreetMap Location Selector** - Users can now select locations on a map instead of just typing addresses
2. **Hunter.io Email Lookup Toggle** - Users can enable/disable email enrichment via Hunter.io API

---

## 🗺️ Feature 1: Map-Based Location Selection

### What Changed on Frontend

**Before:**
```json
{
  "city": "San Francisco",
  "state": "California",
  "country": "United States",
  "radius": 10000,
  "businessCategory": "restaurants"
}
```

**After (when map is used):**
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

**After (when map is NOT used):**
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

**Note:** Lead cap field has been removed from all three modules (Legacy, No Website, Low Rating).

### Key Points

1. **Radius is now FIXED at 5000 (5km)** - No longer user-selectable
2. **`lat` and `lng` are OPTIONAL** - Only sent when user selects location on map
3. **If `lat`/`lng` are present**, use them directly (skip geocoding)
4. **If `lat`/`lng` are absent**, geocode the city/state/country as before

---

## 📧 Feature 2: Hunter.io Email Lookup

### What Changed on Frontend

All three search pages now send:
```json
{
  "useHunter": true
}
```

- **Default value**: `true` (enabled by default)
- **Type**: Boolean
- **Purpose**: When true, backend should enrich results with email addresses from Hunter.io

---

## 🔧 Required Backend Changes

### 1. Update Request Handlers (ALL THREE MODULES)

#### Files to Update:
- `controllers/legacyFinderController.js` (Legacy Finder)
- `controllers/noWebsiteController.js` (No Website Finder)
- `controllers/lowRatingController.js` (Low Rating Finder)

### 2. Add Parameter Validation

```javascript
// In scanForBusinesses function or equivalent

const { 
  city, 
  state, 
  country, 
  radius = 5000,      // Default to 5km
  lat,                // Optional: latitude from map
  lng,                // Optional: longitude from map
  businessCategory,   // or 'niche' depending on module
  domainYear,         // Legacy Finder only
  filterMode,         // Legacy Finder only
  maxRating,          // Low Rating Finder only
  useHunter = false   // Optional: enable Hunter.io
} = req.body;

// Validation
if ((!lat || !lng) && (!city || !country)) {
  return res.status(400).json({ 
    success: false,
    error: 'Either coordinates (lat/lng) or location (city/country) required' 
  });
}
```

### 3. Update Location Resolution Logic

```javascript
/**
 * Get search coordinates
 * Priority: Use provided coordinates > Geocode address
 */
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
  
  try {
    // Your existing geocoding logic here
    const addressParts = [city, state, country].filter(Boolean);
    const address = addressParts.join(', ');
    
    // Example with Google Geocoding API
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.GOOGLE_PLACES_API_KEY}`;
    
    const response = await fetch(geocodeUrl);
    const data = await response.json();
    
    if (data.status === 'OK' && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      console.log(`✅ Geocoded to: ${location.lat}, ${location.lng}`);
      return { lat: location.lat, lng: location.lng };
    }
    
    throw new Error(`Geocoding failed: ${data.status}`);
  } catch (error) {
    console.error('❌ Geocoding error:', error);
    throw new Error('Unable to determine search location');
  }
}
```

### 4. Update Google Places Search Call

```javascript
// In your scanForBusinesses or equivalent function

exports.scanForBusinesses = async (req, res) => {
  try {
    const { 
      city, 
      state, 
      country, 
      radius = 5000,
      lat,
      lng,
      businessCategory,
      domainYear,      // Legacy Finder specific
      filterMode,      // Legacy Finder specific
      useHunter = false
    } = req.body;
    
    // Validate
    if ((!lat || !lng) && (!city || !country)) {
      return res.status(400).json({ 
        success: false,
        error: 'Either coordinates or location required' 
      });
    }
    
    // Get coordinates
    const searchLocation = await getSearchCoordinates({
      lat,
      lng,
      city,
      state,
      country
    });
    
    console.log('📍 Search location:', searchLocation);
    console.log('📏 Search radius:', radius, 'meters');
    
    // Create search record
    const search = await Search.create({
      userId: req.user.id,
      city: city || 'Map Location',
      state,
      country: country || 'N/A',
      coordinates: searchLocation,  // Store coordinates
      radius,
      businessCategory,
      domainYear,     // Legacy Finder specific
      filterMode,     // Legacy Finder specific
      useHunter,
      status: 'processing',
      type: 'legacy-finder'
    });
    
    // Start background processing
    processSearch(search._id, {
      location: searchLocation,  // Pass coordinates
      radius,
      businessCategory,
      domainYear,
      filterMode,
      useHunter
    });
    
    res.json({
      success: true,
      searchId: search._id,
      message: 'Search started',
      location: searchLocation
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

### 5. Update Google Places API Call

```javascript
// In your processSearch or background processing function

async function processSearch(searchId, params) {
  const { location, radius, businessCategory, domainYear, filterMode, useHunter } = params;
  
  try {
    console.log(`🔍 Processing search ${searchId}`);
    console.log(`📍 Location: ${location.lat}, ${location.lng}`);
    console.log(`📏 Radius: ${radius}m`);
    
    // Call Google Places with coordinates
    const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json`;
    const placesParams = {
      location: `${location.lat},${location.lng}`,  // Use coordinates
      radius: radius,                                // Always 5000
      type: businessCategory,
      key: process.env.GOOGLE_PLACES_API_KEY
    };
    
    const response = await axios.get(placesUrl, { params: placesParams });
    const businesses = response.data.results;
    
    console.log(`✅ Found ${businesses.length} businesses`);
    
    // Continue with your existing processing logic...
    // Filter, enrich, etc.
    
    // If useHunter is enabled, call Hunter.io
    if (useHunter) {
      await enrichWithHunterEmails(businesses);
    }
    
    // Save results...
    
  } catch (error) {
    console.error(`❌ Search ${searchId} failed:`, error);
    
    await Search.findByIdAndUpdate(searchId, {
      status: 'failed',
      error: error.message
    });
  }
}
```

### 6. Add Hunter.io Email Enrichment (Optional)

```javascript
/**
 * Enrich businesses with email addresses from Hunter.io
 */
async function enrichWithHunterEmails(businesses) {
  if (!process.env.HUNTER_API_KEY) {
    console.warn('⚠️ Hunter.io API key not configured');
    return;
  }
  
  console.log('📧 Enriching with Hunter.io emails...');
  
  for (const business of businesses) {
    if (!business.website) continue;
    
    try {
      // Extract domain from website URL
      const domain = new URL(business.website).hostname.replace('www.', '');
      
      // Call Hunter.io Domain Search API
      const response = await axios.get('https://api.hunter.io/v2/domain-search', {
        params: {
          domain: domain,
          api_key: process.env.HUNTER_API_KEY,
          limit: 5
        }
      });
      
      if (response.data.data.emails && response.data.data.emails.length > 0) {
        business.emails = response.data.data.emails.map(e => e.value);
        console.log(`✅ Found ${business.emails.length} emails for ${domain}`);
      }
      
      // Rate limiting: Hunter.io free tier = 1 req/sec
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`❌ Hunter.io error for ${business.website}:`, error.message);
    }
  }
}
```

---

## 📊 Database Schema Updates

### Add Coordinates Field to Search Model

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
  domainYear: String,           // Legacy Finder only
  filterMode: String,           // Legacy Finder only
  maxRating: Number,            // Low Rating Finder only
  niche: String,                // No Website / Low Rating Finder only
  useHunter: { type: Boolean, default: false },  // NEW
  
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
});
```

---

## 🧪 Testing

### Test Case 1: Map Location (with coordinates)

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
    "domainYear": "2020",
    "filterMode": "before",
    "useHunter": true
  }'
```

**Expected:**
- ✅ Use lat/lng directly (no geocoding)
- ✅ Search Google Places at 37.7749, -122.4194
- ✅ Use 5km radius
- ✅ Enrich with Hunter.io emails

### Test Case 2: Text Entry (no coordinates)

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
    "domainYear": "2020",
    "filterMode": "before",
    "useHunter": false
  }'
```

**Expected:**
- ✅ Geocode "New York, NY, United States"
- ✅ Use geocoded coordinates
- ✅ Search Google Places at geocoded location
- ✅ Use 5km radius
- ✅ Skip Hunter.io enrichment (useHunter: false)

---

## 🚨 Common Issues & Solutions

### Issue 1: "Cannot read properties of undefined (reading 'geometry')"

**Cause:** Backend tries to access `results[0].geometry` but geocoding response is empty or failed

**Solution:**
```javascript
// Add proper error handling
if (!data.results || data.results.length === 0) {
  throw new Error('Location not found');
}

const location = data.results[0]?.geometry?.location;
if (!location) {
  throw new Error('Invalid geocoding response');
}
```

### Issue 2: Coordinates Not Being Used

**Cause:** Backend checks for coordinates but doesn't use them

**Solution:**
```javascript
// Check if coordinates exist AND are valid numbers
if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
  // Use coordinates
  return { lat: parseFloat(lat), lng: parseFloat(lng) };
}
```

### Issue 3: Radius Not Fixed

**Cause:** Backend still allowing variable radius

**Solution:**
```javascript
// Force radius to 5000
const radius = 5000;  // Ignore client value, always use 5km

// OR validate it
let radius = parseInt(req.body.radius) || 5000;
if (radius > 5000) {
  radius = 5000;  // Cap at 5km
}
```

---

## 📝 Summary of Changes Needed

### For ALL THREE Modules (Legacy, No Website, Low Rating):

1. ✅ **Accept new parameters**: `lat`, `lng`, `useHunter`
2. ✅ **Update validation**: Allow coordinates OR city/country
3. ✅ **Add coordinate resolution logic**: Use coordinates if present, else geocode
4. ✅ **Update Google Places calls**: Use resolved coordinates
5. ✅ **Fix radius**: Always use 5000 meters
6. ✅ **Add Hunter.io integration** (optional, if useHunter is true)
7. ✅ **Update database schema**: Store coordinates
8. ✅ **Add error handling**: Handle missing/invalid data gracefully

---

## 🔑 Environment Variables Needed

Add to `.env`:

```bash
# Google Places API (existing)
GOOGLE_PLACES_API_KEY=your_google_api_key

# Hunter.io API (new - optional)
HUNTER_API_KEY=your_hunter_api_key
```

Get Hunter.io API key from: https://hunter.io/api-keys

---

## 📚 Additional Resources

- **Hunter.io API Docs**: https://hunter.io/api-docs
- **Google Places API Docs**: https://developers.google.com/maps/documentation/places/web-service/search-nearby
- **Google Geocoding API Docs**: https://developers.google.com/maps/documentation/geocoding/overview

---

## ✅ Testing Checklist

After making changes, verify:

- [ ] Search with map location works (lat/lng provided)
- [ ] Search without map works (city/state/country only)
- [ ] Radius is fixed at 5km for all searches
- [ ] Hunter.io enrichment works when enabled
- [ ] Hunter.io is skipped when disabled
- [ ] Coordinates are stored in database
- [ ] Error handling works for invalid locations
- [ ] All three modules (Legacy, No Website, Low Rating) work correctly

---

## 🎯 Priority

**HIGH PRIORITY**: Fix the geocoding error first
- The error `Cannot read properties of undefined (reading 'geometry')` happens when coordinates are not provided
- Add the `getSearchCoordinates()` function to handle both cases

**MEDIUM PRIORITY**: Hunter.io integration
- Can be added later if needed
- Works independently of the coordinate fix

---

**Questions?** Check the frontend code in:
- `src/pages/SearchPage.tsx` (Legacy Finder)
- `src/pages/nowebsite/NoWebsiteSearchPage.tsx` (No Website)
- `src/pages/lowrating/LowRatingSearchPage.tsx` (Low Rating)
- `src/components/LocationMap.tsx` (Map component)
