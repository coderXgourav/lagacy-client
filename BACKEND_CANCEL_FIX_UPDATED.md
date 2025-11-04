# Backend: Proper Search Cancellation Fix

## Current Problem

**Issue**: When user clicks "Cancel Search":
- Frontend stops waiting for response (AbortController)
- Backend continues processing for 3-4 minutes
- Search never shows as "cancelled" in Recent Searches
- Backend logs show search completes as "completed" not "cancelled"

**Root Cause**: `AbortController` in frontend only cancels the fetch promise, it does NOT send a cancellation signal to the backend.

---

## Solution: Use Polling + Cancellation Endpoint

### Architecture Overview

1. Frontend sends search request → Backend starts processing
2. Backend returns `searchId` immediately
3. Backend processes search in background
4. Frontend polls `/api/searches/:id/status` every 2 seconds
5. If user cancels → Frontend calls `/api/searches/:id/cancel`
6. Backend checks cancellation flag during processing
7. Backend stops processing and marks as "cancelled"

---

## Step 1: Add Cancellation Endpoint to Routes

**File**: `routes/searchRoutes.js` (or equivalent for each module)

```javascript
const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');
const auth = require('../middleware/auth');

// Existing routes
router.post('/scan', auth, searchController.scanBusinesses);
router.get('/searches/recent', auth, searchController.getRecentSearches);
router.get('/searches/:id/results', auth, searchController.getSearchResults);

// ✅ ADD THESE NEW ROUTES
router.get('/searches/:id/status', auth, searchController.getSearchStatus);
router.post('/searches/:id/cancel', auth, searchController.cancelSearch);

module.exports = router;
```

**Add to ALL 5 route files:**
- `routes/searchRoutes.js` (Legacy)
- `routes/noWebsiteRoutes.js`
- `routes/lowRatingRoutes.js`
- `routes/newDomainRoutes.js`
- `routes/newBusinessRoutes.js`

---

## Step 2: Add Cancellation Flag to Models

**Files**: All 5 search models

Add `cancelRequested` field:

```javascript
const searchSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  city: { type: String, required: true },
  // ... other fields ...
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  cancelRequested: { type: Boolean, default: false },  // ✅ ADD THIS
  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date }
});
```

---

## Step 3: Add Controller Methods

Add these two methods to ALL 5 controllers:

### Method 1: Get Search Status

```javascript
// Get search status (for polling)
exports.getSearchStatus = async (req, res) => {
  try {
    const search = await Search.findOne({
      _id: req.params.id,
      userId: req.user._id
    }).select('status resultsCount cancelRequested');

    if (!search) {
      return res.status(404).json({
        success: false,
        message: 'Search not found'
      });
    }

    res.json({
      success: true,
      status: search.status,
      resultsCount: search.resultsCount || 0,
      cancelRequested: search.cancelRequested
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
```

### Method 2: Cancel Search

```javascript
// Cancel search
exports.cancelSearch = async (req, res) => {
  try {
    const search = await Search.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!search) {
      return res.status(404).json({
        success: false,
        message: 'Search not found'
      });
    }

    // If already completed/failed, can't cancel
    if (search.status === 'completed' || search.status === 'failed') {
      return res.json({
        success: false,
        message: 'Search already completed'
      });
    }

    // Set cancellation flag
    search.cancelRequested = true;
    
    // If still pending, mark as cancelled immediately
    if (search.status === 'pending') {
      search.status = 'cancelled';
      search.completedAt = new Date();
    }
    
    await search.save();

    console.log(`🚫 Cancellation requested for search ${search._id}`);

    res.json({
      success: true,
      message: 'Cancellation requested'
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

## Step 4: Modify Scan Method to Check Cancellation

Update the main scan method to check `cancelRequested` flag:

```javascript
exports.scanBusinesses = async (req, res) => {
  let search;
  
  try {
    // Create search record
    search = new Search({
      userId: req.user._id,
      city: req.body.city,
      state: req.body.state,
      country: req.body.country,
      radius: req.body.radius,
      businessCategory: req.body.businessCategory,
      leadCap: req.body.leadCap,
      status: 'processing',
      cancelRequested: false
    });
    await search.save();

    // Return searchId immediately so frontend can poll
    res.json({
      success: true,
      message: 'Search started',
      searchId: search._id
    });

    // ✅ Process search in background (don't await)
    processSearchInBackground(search._id, req.body);

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ✅ ADD: Background processing function
async function processSearchInBackground(searchId, searchParams) {
  let search;
  
  try {
    search = await Search.findById(searchId);
    if (!search) return;

    // Step 1: Get businesses from Google Places
    const businesses = await googlePlacesService.searchBusinesses(searchParams);
    
    // ✅ CHECK: If cancelled, stop processing
    await search.reload(); // Refresh from DB
    if (search.cancelRequested) {
      search.status = 'cancelled';
      search.completedAt = new Date();
      await search.save();
      console.log(`🚫 Search ${searchId} cancelled after Google Places`);
      return;
    }

    // Step 2: Check domain ages
    const withDomains = await domainService.checkDomainAges(businesses);
    
    // ✅ CHECK: If cancelled, stop processing
    await search.reload();
    if (search.cancelRequested) {
      search.status = 'cancelled';
      search.completedAt = new Date();
      await search.save();
      console.log(`🚫 Search ${searchId} cancelled after domain check`);
      return;
    }

    // Step 3: Extract emails
    const withEmails = await emailService.extractEmails(withDomains);
    
    // ✅ CHECK: If cancelled, stop processing
    await search.reload();
    if (search.cancelRequested) {
      search.status = 'cancelled';
      search.completedAt = new Date();
      await search.save();
      console.log(`🚫 Search ${searchId} cancelled after email extraction`);
      return;
    }

    // Save results
    await Business.insertMany(withEmails.map(b => ({
      ...b,
      searchId: search._id,
      userId: search.userId
    })));

    // Complete search
    search.resultsCount = withEmails.length;
    search.status = 'completed';
    search.completedAt = new Date();
    await search.save();

    console.log(`✅ Search ${searchId} completed with ${withEmails.length} results`);

  } catch (error) {
    console.error(`❌ Search ${searchId} failed:`, error);
    if (search) {
      search.status = 'failed';
      search.completedAt = new Date();
      await search.save();
    }
  }
}
```

**Note**: Add `.reload()` method if using Mongoose:

```javascript
// Add this to your schema if not exists
searchSchema.methods.reload = async function() {
  return await this.constructor.findById(this._id);
};
```

Or use this simpler approach:

```javascript
// Instead of search.reload(), use:
search = await Search.findById(searchId);
if (search.cancelRequested) {
  // ... cancel logic
}
```

---

## Step 5: Update Frontend API Service

**File**: `src/services/api.ts`

Add new methods:

```typescript
// Add to legacyFinderApi object
getSearchStatus: async (searchId: string) => {
  const response = await fetch(`${API_BASE_URL}/searches/${searchId}/status`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });
  if (!response.ok) throw new Error('Failed to get search status');
  return response.json();
},

cancelSearch: async (searchId: string) => {
  const response = await fetch(`${API_BASE_URL}/searches/${searchId}/cancel`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });
  if (!response.ok) throw new Error('Failed to cancel search');
  return response.json();
}
```

**Add these methods to ALL 5 API objects:**
- `legacyFinderApi`
- `noWebsiteApi`
- `lowRatingApi`
- `newDomainApi`
- `newBusinessApi`

---

## Step 6: Update Frontend Search Pages

**Example for SearchPage.tsx** (apply to all 5 search pages):

```typescript
const handleSearch = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSearching(true);
  setResults(null);

  try {
    // Start search - returns immediately with searchId
    const response = await legacyFinderApi.scan(formData);
    const searchId = response.searchId;

    // Poll for status
    const pollInterval = setInterval(async () => {
      try {
        const statusResponse = await legacyFinderApi.getSearchStatus(searchId);
        
        if (statusResponse.status === 'completed') {
          clearInterval(pollInterval);
          // Fetch results
          const resultsResponse = await legacyFinderApi.getSearchResults(searchId);
          setResults(resultsResponse);
          setIsSearching(false);
          toast({
            title: "Scan Complete! 🎉",
            description: `Found ${resultsResponse.count} legacy websites`,
          });
        } else if (statusResponse.status === 'cancelled') {
          clearInterval(pollInterval);
          setIsSearching(false);
          toast({
            title: "Search Cancelled",
            description: "The search was cancelled",
          });
        } else if (statusResponse.status === 'failed') {
          clearInterval(pollInterval);
          setIsSearching(false);
          toast({
            title: "Search Failed",
            description: "An error occurred during the search",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 2000); // Poll every 2 seconds

    // Store interval ID for cancellation
    (window as any).currentSearchInterval = pollInterval;
    (window as any).currentSearchId = searchId;

  } catch (error: any) {
    setIsSearching(false);
    toast({
      title: "Error",
      description: error.message || "Scan failed",
      variant: "destructive"
    });
  }
};

const handleCancel = async () => {
  const searchId = (window as any).currentSearchId;
  const pollInterval = (window as any).currentSearchInterval;

  if (searchId) {
    try {
      await legacyFinderApi.cancelSearch(searchId);
      clearInterval(pollInterval);
      setIsSearching(false);
      toast({
        title: "Search Cancelled",
        description: "The search was cancelled by user",
      });
    } catch (error: any) {
      console.error('Cancel error:', error);
      toast({
        title: "Error",
        description: "Failed to cancel search",
        variant: "destructive"
      });
    }
  }
};
```

---

## Summary of Changes

### Backend Changes (All 5 Modules):

1. **Models**: Add `cancelRequested: { type: Boolean, default: false }`
2. **Routes**: Add `/searches/:id/status` and `/searches/:id/cancel` endpoints
3. **Controllers**: 
   - Add `getSearchStatus()` method
   - Add `cancelSearch()` method
   - Modify `scanBusinesses()` to return immediately with searchId
   - Add `processSearchInBackground()` function that checks `cancelRequested`

### Frontend Changes (All 5 Search Pages):

1. **API Service**: Add `getSearchStatus()` and `cancelSearch()` methods
2. **Search Pages**: 
   - Implement polling for search status
   - Update `handleCancel()` to call backend cancel endpoint
   - Handle different status states (completed, cancelled, failed)

---

## Testing Procedure

1. **Start a search**:
   - Click "Start Scan"
   - Verify backend returns searchId immediately
   - Verify frontend starts polling

2. **Cancel search**:
   - Click "Cancel Search" after 10 seconds
   - Check backend logs: Should see "🚫 Cancellation requested"
   - Check MongoDB: `db.searches.findOne().sort({createdAt: -1})`
   - Should show `status: "cancelled"`, `cancelRequested: true`

3. **Check Recent Searches**:
   - Navigate to Recent Searches page
   - Cancelled search should appear with "Cancelled" status

4. **Verify backend stopped**:
   - Backend logs should show cancellation message
   - No "completed" message after cancellation
   - No results saved for cancelled search

---

## Files to Modify

### Backend (Per Module):

1. `models/Search.js` - Add `cancelRequested` field
2. `routes/searchRoutes.js` - Add status and cancel routes
3. `controllers/searchController.js` - Add methods and background processing

### Frontend:

1. `src/services/api.ts` - Add status and cancel methods
2. `src/pages/SearchPage.tsx` - Implement polling and cancel
3. `src/pages/nowebsite/NoWebsiteSearchPage.tsx` - Same
4. `src/pages/lowrating/LowRatingSearchPage.tsx` - Same
5. `src/pages/newdomain/NewDomainSearchPage.tsx` - Same
6. `src/pages/newbusiness/NewBusinessSearchPage.tsx` - Same

---

## Time Estimate

- **Backend per module**: 15 minutes
- **Backend total (5 modules)**: 75 minutes
- **Frontend per page**: 10 minutes
- **Frontend total (5 pages + API)**: 60 minutes
- **Total**: ~2.5 hours

---

## Benefits

✅ **Real cancellation** - Backend actually stops processing
✅ **Accurate status** - Shows "cancelled" in Recent Searches
✅ **Resource savings** - No wasted API calls or processing
✅ **Better UX** - Immediate feedback when cancelling
✅ **Scalable** - Works for long-running searches
