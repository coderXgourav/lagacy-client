# Legacy Dashboard - Backend Requirements

## Overview
The Legacy Dashboard now fetches real-time statistics. The backend needs to ensure the Search model includes `completedAt` timestamp for accurate response time calculation.

---

## Current Backend Status

### ✅ Already Working (No Changes Needed)
The dashboard uses existing API endpoint:
```
GET /api/searches/recent?limit=10
```

This endpoint should already return:
```json
{
  "success": true,
  "searches": [
    {
      "_id": "...",
      "userId": "...",
      "city": "San Francisco",
      "state": "California",
      "country": "United States",
      "radius": 5000,
      "businessCategory": "restaurants",
      "leadCap": 100,
      "resultsCount": 45,
      "status": "completed",
      "createdAt": "2024-01-10T10:00:00Z"
    }
  ]
}
```

---

## Optional Enhancement: Add completedAt Field

### Why?
Currently, the dashboard calculates "Avg Response Time" but the Search model may not have a `completedAt` timestamp. Adding this field will provide accurate response time metrics.

### File: `models/Search.js` or `models/LegacySearch.js`

**Current Schema (Likely):**
```javascript
const searchSchema = new mongoose.Schema({
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
  businessCategory: String,
  leadCap: { type: Number, default: 100 },
  resultsCount: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  createdAt: { type: Date, default: Date.now }
  // ❌ Missing completedAt field
});
```

**Enhanced Schema:**
```javascript
const searchSchema = new mongoose.Schema({
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
  businessCategory: String,
  leadCap: { type: Number, default: 100 },
  resultsCount: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date }  // ✅ Add this field
});
```

---

## Controller Update

### File: `controllers/legacyFinderController.js` or `controllers/searchController.js`

Update the scan endpoint to set `completedAt` when search completes:

**Before:**
```javascript
exports.scanBusinesses = async (req, res) => {
  try {
    // ... search logic ...

    // Update search status
    search.resultsCount = businesses.length;
    search.status = 'completed';
    await search.save();

    res.json({
      success: true,
      message: `Found ${businesses.length} businesses`,
      searchId: search._id,
      data: businesses
    });
  } catch (error) {
    // ... error handling ...
  }
};
```

**After:**
```javascript
exports.scanBusinesses = async (req, res) => {
  try {
    // ... search logic ...

    // Update search status
    search.resultsCount = businesses.length;
    search.status = 'completed';
    search.completedAt = new Date();  // ✅ Add completion timestamp
    await search.save();

    res.json({
      success: true,
      message: `Found ${businesses.length} businesses`,
      searchId: search._id,
      data: businesses
    });
  } catch (error) {
    // ... error handling ...
  }
};
```

---

## Dashboard Stats Calculation

The frontend calculates these stats from the API response:

### 1. Total Searches
```javascript
const totalSearches = searches.length;
```

### 2. Leads Found
```javascript
const totalLeads = searches.reduce((sum, s) => sum + (s.resultsCount || 0), 0);
```

### 3. Legacy Sites
```javascript
const legacySites = searches.filter(s => s.status === 'completed').length;
```

### 4. Avg Response Time
```javascript
const completedSearches = searches.filter(s => s.status === 'completed');
const avgTime = completedSearches.length > 0
  ? completedSearches.reduce((sum, s) => {
      const duration = s.completedAt && s.createdAt 
        ? (new Date(s.completedAt).getTime() - new Date(s.createdAt).getTime()) / 1000
        : 0;
      return sum + duration;
    }, 0) / completedSearches.length
  : 0;
```

---

## Testing

### Test 1: Verify Existing Endpoint
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/searches/recent?limit=10
```

**Expected Response:**
```json
{
  "success": true,
  "searches": [
    {
      "_id": "...",
      "city": "San Francisco",
      "country": "United States",
      "resultsCount": 45,
      "status": "completed",
      "createdAt": "2024-01-10T10:00:00Z",
      "completedAt": "2024-01-10T10:02:30Z"
    }
  ]
}
```

### Test 2: Run a Search and Check Dashboard
1. Execute a search via `/api/scan`
2. Refresh dashboard
3. Verify stats update correctly

---

## Summary

### ✅ No Changes Required If:
- `/api/searches/recent` endpoint already exists
- Returns searches with `resultsCount`, `status`, `createdAt`
- Dashboard will work with basic stats (Total Searches, Leads Found, Legacy Sites)

### 🔧 Optional Enhancement:
- Add `completedAt` field to Search model
- Update controller to set `completedAt` when search completes
- Enables accurate "Avg Response Time" calculation

### 📊 Frontend Already Complete:
- Fetches data from `/api/searches/recent`
- Calculates all stats dynamically
- Displays recent activity
- Shows loading and empty states

---

## Implementation Priority

**Priority 1 (Required):**
- ✅ Ensure `/api/searches/recent` endpoint exists
- ✅ Returns searches array with basic fields

**Priority 2 (Optional):**
- Add `completedAt` field for accurate response time
- Improves user experience with precise metrics

**Priority 3 (Future):**
- Add pagination for searches
- Add date range filters
- Add search analytics dashboard

---

## Verification Checklist

- [ ] `/api/searches/recent` endpoint exists
- [ ] Endpoint requires authentication (JWT)
- [ ] Returns user-specific searches (filtered by userId)
- [ ] Includes `resultsCount`, `status`, `createdAt` fields
- [ ] Optional: Includes `completedAt` field
- [ ] Frontend dashboard displays real stats
- [ ] Recent activity section shows searches
- [ ] Loading state works correctly
- [ ] Empty state shows when no searches exist

---

## Notes

- The dashboard works with existing backend if `/api/searches/recent` exists
- `completedAt` field is optional but recommended for accurate metrics
- All calculations happen on frontend - no new backend endpoints needed
- Stats refresh on every dashboard page load
- No caching implemented - fetches fresh data each time
