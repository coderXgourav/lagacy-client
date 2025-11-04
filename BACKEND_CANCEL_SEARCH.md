# Backend: Handle Search Cancellation

## Overview
Frontend now allows users to cancel long-running searches. Backend needs to handle aborted requests gracefully and update search status accordingly.

---

## Problem
- Searches take 3-4 minutes to complete
- Users can now click "Cancel Search" button
- Backend continues processing even after frontend cancels
- Search status remains "processing" forever if cancelled

---

## Solution: Detect and Handle Aborted Requests

### Step 1: Add Cancelled Status to Models

Update all 5 search models to include "cancelled" status:

**Files to modify:**
- `models/Search.js` (Legacy Finder)
- `models/NoWebsiteSearch.js`
- `models/LowRatingSearch.js`
- `models/NewDomainSearch.js`
- `models/NewBusinessSearch.js`

**BEFORE:**
```javascript
status: {
  type: String,
  enum: ['pending', 'processing', 'completed', 'failed'],
  default: 'pending'
}
```

**AFTER:**
```javascript
status: {
  type: String,
  enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],  // ✅ ADD 'cancelled'
  default: 'pending'
}
```

---

### Step 2: Check for Aborted Requests in Controllers

Update all 5 controllers to detect when client disconnects:

**Files to modify:**
- `controllers/searchController.js` or `controllers/legacyFinderController.js`
- `controllers/noWebsiteController.js`
- `controllers/lowRatingController.js`
- `controllers/newDomainController.js`
- `controllers/newBusinessController.js`

**Implementation Pattern:**

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
      // ... other fields
      status: 'processing'
    });
    await search.save();

    // ✅ ADD: Listen for client disconnect
    req.on('close', async () => {
      if (!res.headersSent && search) {
        console.log('⚠️ Client disconnected, marking search as cancelled');
        search.status = 'cancelled';
        search.completedAt = new Date();
        await search.save();
      }
    });

    // ✅ ADD: Check if request was aborted before expensive operations
    if (req.aborted) {
      search.status = 'cancelled';
      search.completedAt = new Date();
      await search.save();
      return;
    }

    // Perform search operations
    const businesses = await performSearch(req.body);

    // ✅ ADD: Check again before saving results
    if (req.aborted) {
      search.status = 'cancelled';
      search.completedAt = new Date();
      await search.save();
      return;
    }

    // Update search status
    search.resultsCount = businesses.length;
    search.status = 'completed';
    search.completedAt = new Date();
    await search.save();

    res.json({
      success: true,
      message: `Found ${businesses.length} businesses`,
      searchId: search._id,
      data: businesses
    });

  } catch (error) {
    console.error('Search error:', error);
    
    if (search) {
      search.status = 'failed';
      search.completedAt = new Date();
      await search.save();
    }
    
    // Don't send response if client already disconnected
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
};
```

---

### Step 3: Add Abort Checks Between Long Operations

For better responsiveness, check for abort between expensive operations:

```javascript
// Example: Legacy Finder Controller
exports.scanBusinesses = async (req, res) => {
  let search;
  
  try {
    search = new Search({ /* ... */ });
    await search.save();

    // Listen for disconnect
    req.on('close', async () => {
      if (!res.headersSent && search) {
        search.status = 'cancelled';
        search.completedAt = new Date();
        await search.save();
      }
    });

    // Step 1: Get businesses from Google Places
    const businesses = await googlePlacesService.searchBusinesses(req.body);
    
    // ✅ CHECK: Abort if cancelled
    if (req.aborted) {
      search.status = 'cancelled';
      search.completedAt = new Date();
      await search.save();
      return;
    }

    // Step 2: Check domain ages
    const withDomains = await domainService.checkDomainAges(businesses);
    
    // ✅ CHECK: Abort if cancelled
    if (req.aborted) {
      search.status = 'cancelled';
      search.completedAt = new Date();
      await search.save();
      return;
    }

    // Step 3: Extract emails
    const withEmails = await emailService.extractEmails(withDomains);
    
    // ✅ CHECK: Abort if cancelled
    if (req.aborted) {
      search.status = 'cancelled';
      search.completedAt = new Date();
      await search.save();
      return;
    }

    // Complete search
    search.resultsCount = withEmails.length;
    search.status = 'completed';
    search.completedAt = new Date();
    await search.save();

    res.json({
      success: true,
      data: withEmails
    });

  } catch (error) {
    // ... error handling
  }
};
```

---

## Alternative: Simpler Implementation (Minimum Changes)

If you want minimal changes, just add the disconnect listener:

```javascript
exports.scanBusinesses = async (req, res) => {
  let search;
  
  try {
    search = new Search({ /* ... */ });
    await search.save();

    // ✅ ONLY ADD THIS
    req.on('close', async () => {
      if (!res.headersSent && search && search.status === 'processing') {
        console.log('Client disconnected, marking as cancelled');
        search.status = 'cancelled';
        search.completedAt = new Date();
        await search.save();
      }
    });

    // ... rest of your existing code unchanged
    
  } catch (error) {
    // ... existing error handling
  }
};
```

---

## Testing

### Test 1: Cancel During Search

1. Start a search from frontend
2. Click "Cancel Search" button after 10 seconds
3. Check MongoDB:

```javascript
db.searches.findOne({}, {status: 1, completedAt: 1}).sort({createdAt: -1})
```

**Expected Output:**
```json
{
  "_id": "...",
  "status": "cancelled",
  "completedAt": "2024-01-15T10:00:15.000Z"
}
```

### Test 2: Check Backend Logs

You should see:
```
⚠️ Client disconnected, marking search as cancelled
```

### Test 3: Verify No Wasted Resources

After cancellation:
- Backend should stop processing
- No results should be saved
- Search status should be "cancelled"

---

## Dashboard Impact

With these changes, cancelled searches will:
- Show status as "Cancelled" in Recent Searches
- Not be counted in "Total Searches" (optional - filter by status)
- Have accurate `completedAt` timestamp
- Not waste server resources

---

## Summary of Changes

### Required Changes (All 5 Modules):

1. **Models** (5 files):
   - Add `'cancelled'` to status enum

2. **Controllers** (5 files):
   - Add `req.on('close')` listener
   - Check `req.aborted` before expensive operations
   - Set `status = 'cancelled'` and `completedAt` when detected

### Files to Modify:

**Legacy Finder:**
- `models/Search.js`
- `controllers/searchController.js`

**No Website Finder:**
- `models/NoWebsiteSearch.js`
- `controllers/noWebsiteController.js`

**Low Rating Finder:**
- `models/LowRatingSearch.js`
- `controllers/lowRatingController.js`

**New Domain Tracker:**
- `models/NewDomainSearch.js`
- `controllers/newDomainController.js`

**New Business Finder:**
- `models/NewBusinessSearch.js`
- `controllers/newBusinessController.js`

---

## Code Snippets for Each Controller

### Legacy Finder Controller

```javascript
exports.scanBusinesses = async (req, res) => {
  let search;
  try {
    search = new Search({
      userId: req.user._id,
      city: req.body.city,
      state: req.body.state,
      country: req.body.country,
      radius: req.body.radius,
      businessCategory: req.body.businessCategory,
      leadCap: req.body.leadCap,
      domainYear: req.body.domainYear,
      filterMode: req.body.filterMode,
      status: 'processing'
    });
    await search.save();

    req.on('close', async () => {
      if (!res.headersSent && search && search.status === 'processing') {
        search.status = 'cancelled';
        search.completedAt = new Date();
        await search.save();
      }
    });

    // ... existing search logic ...

    if (req.aborted) {
      search.status = 'cancelled';
      search.completedAt = new Date();
      await search.save();
      return;
    }

    search.resultsCount = businesses.length;
    search.status = 'completed';
    search.completedAt = new Date();
    await search.save();

    res.json({ success: true, data: businesses });
  } catch (error) {
    if (search) {
      search.status = 'failed';
      search.completedAt = new Date();
      await search.save();
    }
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};
```

### No Website Finder Controller

```javascript
exports.scanBusinesses = async (req, res) => {
  let search;
  try {
    search = new NoWebsiteSearch({
      userId: req.user._id,
      city: req.body.city,
      state: req.body.state,
      country: req.body.country,
      radius: req.body.radius,
      niche: req.body.niche,
      leads: req.body.leads,
      status: 'processing'
    });
    await search.save();

    req.on('close', async () => {
      if (!res.headersSent && search && search.status === 'processing') {
        search.status = 'cancelled';
        search.completedAt = new Date();
        await search.save();
      }
    });

    // ... existing search logic ...

    if (req.aborted) {
      search.status = 'cancelled';
      search.completedAt = new Date();
      await search.save();
      return;
    }

    search.resultsCount = businesses.length;
    search.status = 'completed';
    search.completedAt = new Date();
    await search.save();

    res.json({ success: true, data: businesses });
  } catch (error) {
    if (search) {
      search.status = 'failed';
      search.completedAt = new Date();
      await search.save();
    }
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};
```

### Low Rating Finder Controller

```javascript
exports.scanBusinesses = async (req, res) => {
  let search;
  try {
    search = new LowRatingSearch({
      userId: req.user._id,
      city: req.body.city,
      state: req.body.state,
      country: req.body.country,
      radius: req.body.radius,
      niche: req.body.niche,
      maxRating: req.body.maxRating,
      leads: req.body.leads,
      status: 'processing'
    });
    await search.save();

    req.on('close', async () => {
      if (!res.headersSent && search && search.status === 'processing') {
        search.status = 'cancelled';
        search.completedAt = new Date();
        await search.save();
      }
    });

    // ... existing search logic ...

    if (req.aborted) {
      search.status = 'cancelled';
      search.completedAt = new Date();
      await search.save();
      return;
    }

    search.resultsCount = businesses.length;
    search.status = 'completed';
    search.completedAt = new Date();
    await search.save();

    res.json({ success: true, data: businesses });
  } catch (error) {
    if (search) {
      search.status = 'failed';
      search.completedAt = new Date();
      await search.save();
    }
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};
```

### New Domain Tracker Controller

```javascript
exports.scanDomains = async (req, res) => {
  let search;
  try {
    search = new NewDomainSearch({
      userId: req.user._id,
      keywords: req.body.keywords,
      tlds: req.body.tlds,
      daysBack: req.body.daysBack,
      leads: req.body.leads,
      status: 'processing'
    });
    await search.save();

    req.on('close', async () => {
      if (!res.headersSent && search && search.status === 'processing') {
        search.status = 'cancelled';
        search.completedAt = new Date();
        await search.save();
      }
    });

    // ... existing search logic ...

    if (req.aborted) {
      search.status = 'cancelled';
      search.completedAt = new Date();
      await search.save();
      return;
    }

    search.resultsCount = domains.length;
    search.status = 'completed';
    search.completedAt = new Date();
    await search.save();

    res.json({ success: true, data: domains });
  } catch (error) {
    if (search) {
      search.status = 'failed';
      search.completedAt = new Date();
      await search.save();
    }
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};
```

### New Business Finder Controller

```javascript
exports.scanBusinesses = async (req, res) => {
  let search;
  try {
    search = new NewBusinessSearch({
      userId: req.user._id,
      city: req.body.city,
      state: req.body.state,
      country: req.body.country,
      radius: req.body.radius,
      niche: req.body.niche,
      daysBack: req.body.daysBack,
      leads: req.body.leads,
      status: 'processing'
    });
    await search.save();

    req.on('close', async () => {
      if (!res.headersSent && search && search.status === 'processing') {
        search.status = 'cancelled';
        search.completedAt = new Date();
        await search.save();
      }
    });

    // ... existing search logic ...

    if (req.aborted) {
      search.status = 'cancelled';
      search.completedAt = new Date();
      await search.save();
      return;
    }

    search.resultsCount = businesses.length;
    search.status = 'completed';
    search.completedAt = new Date();
    await search.save();

    res.json({ success: true, data: businesses });
  } catch (error) {
    if (search) {
      search.status = 'failed';
      search.completedAt = new Date();
      await search.save();
    }
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};
```

---

## Verification Checklist

After implementing:
- [ ] All 5 models have 'cancelled' in status enum
- [ ] All 5 controllers have `req.on('close')` listener
- [ ] All 5 controllers check `req.aborted`
- [ ] All 5 controllers set `completedAt` on cancellation
- [ ] Test cancellation works (status becomes 'cancelled')
- [ ] Backend stops processing after cancellation
- [ ] No errors in backend logs
- [ ] Dashboard shows cancelled searches correctly

---

## Time to Implement

- **Per module**: 5 minutes
- **Total (5 modules)**: 25 minutes
- **Impact**: High - Saves server resources and improves UX
