# Recent Searches - Debugging Guide

## Issue
Recent Searches page shows "No searches yet" even after performing searches.

---

## Root Cause Analysis

The Recent Searches page calls:
```javascript
const response = await legacyFinderApi.getRecentSearches(20);
setSearches(response.data || []);
```

This expects the response format:
```json
{
  "data": [...]  // ❌ Searches array directly in data field
}
```

But the backend likely returns:
```json
{
  "success": true,
  "searches": [...]  // ✅ Searches array in searches field
}
```

---

## Backend API Response Format

### Current Backend Response (Likely)
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

### What Frontend Expects
```json
{
  "data": [
    {
      "_id": "...",
      "city": "San Francisco",
      "resultsCount": 45,
      "status": "completed",
      "createdAt": "2024-01-10T10:00:00Z"
    }
  ]
}
```

---

## Solution Options

### Option 1: Fix Frontend (Recommended)
Update `RecentSearches.tsx` to use correct response field:

**Change Line 88:**
```javascript
// FROM:
setSearches(response.data || []);

// TO:
setSearches(response.searches || response.data || []);
```

This handles both response formats.

### Option 2: Fix Backend
Update the `/api/searches/recent` endpoint to return `data` instead of `searches`:

**File: `controllers/searchController.js` or `controllers/legacyFinderController.js`**

```javascript
// FROM:
res.json({
  success: true,
  searches: searches
});

// TO:
res.json({
  success: true,
  data: searches  // Change field name
});
```

---

## Debugging Steps

### Step 1: Check Browser Console
Open DevTools (F12) → Console tab and look for:
```
🔍 API Response from getRecentSearches:
{success: true, searches: [...]}
```

### Step 2: Check Network Tab
1. Open DevTools (F12) → Network tab
2. Refresh Recent Searches page
3. Find request to `/api/searches/recent?limit=20`
4. Click on it and check Response tab
5. Verify the response structure

### Step 3: Test API Directly
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:5000/api/searches/recent?limit=20
```

Check if response has `searches` or `data` field.

---

## Backend Endpoint Requirements

### Endpoint: GET /api/searches/recent

**Required Response Format (for frontend to work):**
```json
{
  "success": true,
  "searches": [
    {
      "_id": "string",
      "city": "string",
      "state": "string",
      "country": "string",
      "radius": "number",
      "businessCategory": "string",
      "leadCap": "number",
      "resultsCount": "number",
      "status": "string",
      "createdAt": "date"
    }
  ]
}
```

**Controller Implementation:**
```javascript
exports.getRecentSearches = async (req, res) => {
  try {
    const userId = req.user._id;
    const limit = parseInt(req.query.limit) || 20;

    const searches = await Search.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json({
      success: true,
      searches: searches  // ✅ Use 'searches' field
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

## Frontend Fix (Immediate Solution)

Update `src/pages/RecentSearches.tsx`:

**Line 88 - Change:**
```typescript
const fetchSearches = async () => {
  setLoading(true);
  try {
    const response = await legacyFinderApi.getRecentSearches(20);
    console.log('📊 Recent Searches Response:', response);  // Add debug log
    setSearches(response.searches || response.data || []);  // Handle both formats
  } catch (error: any) {
    console.error('❌ Fetch searches error:', error);
    toast({
      title: "Error",
      description: error.message || "Failed to load search history",
      variant: "destructive"
    });
  } finally {
    setLoading(false);
  }
};
```

---

## Testing Checklist

After applying the fix:

- [ ] Open Recent Searches page
- [ ] Check browser console for debug logs
- [ ] Verify searches appear in the table
- [ ] Check stats cards show correct numbers
- [ ] Click "View" button on a search
- [ ] Verify businesses load in dialog
- [ ] Click "Download" button
- [ ] Verify Excel file downloads
- [ ] Click "Delete" button
- [ ] Verify search is removed

---

## Common Issues

### Issue 1: Empty Array Returned
**Symptom**: Response is `{success: true, searches: []}`
**Cause**: No searches in database for this user
**Solution**: Perform a search first via `/legacy/search` page

### Issue 2: 401 Unauthorized
**Symptom**: API call fails with 401 status
**Cause**: JWT token expired or missing
**Solution**: Logout and login again

### Issue 3: 404 Not Found
**Symptom**: API call fails with 404 status
**Cause**: Backend route not registered
**Solution**: Verify route exists in backend:
```javascript
router.get('/searches/recent', protect, searchController.getRecentSearches);
```

### Issue 4: Wrong User's Searches
**Symptom**: Seeing other users' searches
**Cause**: Backend not filtering by userId
**Solution**: Add userId filter in backend query:
```javascript
const searches = await Search.find({ userId: req.user._id });
```

---

## Quick Fix Summary

**Fastest Solution:**
Update line 88 in `RecentSearches.tsx`:
```typescript
setSearches(response.searches || response.data || []);
```

This makes the frontend compatible with both response formats and should immediately fix the issue if the backend is returning data in the `searches` field.

---

## Verification

After fix, you should see:
1. ✅ Searches appear in table
2. ✅ Stats cards show correct numbers
3. ✅ View button shows business details
4. ✅ Download button works
5. ✅ Delete button removes searches

If still not working, check:
- Backend is running
- JWT token is valid
- User has performed at least one search
- Backend endpoint returns correct data structure
