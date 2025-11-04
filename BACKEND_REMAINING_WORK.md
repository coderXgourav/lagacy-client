# Backend Remaining Work for Search Cancellation

## ✅ Already Completed

### Models (5/5 Done):
- ✅ Search.js - Added `cancelRequested` field
- ✅ NoWebsiteSearch.js - Added `cancelRequested` field
- ✅ LowRatingSearch.js - Added `cancelRequested` field
- ✅ NewDomainSearch.js - Added `cancelRequested` field
- ✅ NewBusinessSearch.js - Added `cancelRequested` field

### Controllers (2/5 Done):
- ✅ searchController.js - Added `cancelSearch()` method
- ✅ lowRatingController.js - Added `cancelSearch()` method and checks

### Routes (2/5 Done):
- ✅ searches.js - Added POST `/searches/:id/cancel` route
- ✅ lowRatingRoutes.js - Added POST `/searches/:searchId/cancel` route

### Frontend (5/5 Done):
- ✅ api.ts - Added `cancelSearch()` to all 5 API objects
- ✅ SearchPage.tsx - Calls `legacyFinderApi.cancelSearch()`
- ✅ NoWebsiteSearchPage.tsx - Calls `noWebsiteApi.cancelSearch()`
- ✅ LowRatingSearchPage.tsx - Calls `lowRatingApi.cancelSearch()`
- ✅ NewDomainSearchPage.tsx - Calls `newDomainApi.cancelSearch()`
- ✅ NewBusinessSearchPage.tsx - Calls `newBusinessApi.cancelSearch()`

---

## ❌ Still Need To Add

### 3 Remaining Controllers:

#### 1. noWebsiteController.js

Add this method:

```javascript
// Cancel search
exports.cancelSearch = async (req, res) => {
  try {
    const search = await NoWebsiteSearch.findOne({
      _id: req.params.searchId,
      userId: req.user._id
    });

    if (!search) {
      return res.status(404).json({
        success: false,
        message: 'Search not found'
      });
    }

    if (search.status === 'completed' || search.status === 'failed') {
      return res.json({
        success: false,
        message: 'Search already completed'
      });
    }

    search.cancelRequested = true;
    
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

**Also add cancellation checks in the scan method:**

```javascript
// In your scan/processing loop, add:
const search = await NoWebsiteSearch.findById(searchId);
if (search.cancelRequested) {
  search.status = 'cancelled';
  search.completedAt = new Date();
  await search.save();
  console.log(`🚫 Search ${searchId} cancelled`);
  return;
}
```

---

#### 2. newDomainController.js

Add this method:

```javascript
// Cancel search
exports.cancelSearch = async (req, res) => {
  try {
    const search = await NewDomainSearch.findOne({
      _id: req.params.searchId,
      userId: req.user._id
    });

    if (!search) {
      return res.status(404).json({
        success: false,
        message: 'Search not found'
      });
    }

    if (search.status === 'completed' || search.status === 'failed') {
      return res.json({
        success: false,
        message: 'Search already completed'
      });
    }

    search.cancelRequested = true;
    
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

**Also add cancellation checks in the scan method:**

```javascript
// In your scan/processing loop, add:
const search = await NewDomainSearch.findById(searchId);
if (search.cancelRequested) {
  search.status = 'cancelled';
  search.completedAt = new Date();
  await search.save();
  console.log(`🚫 Search ${searchId} cancelled`);
  return;
}
```

---

#### 3. newBusinessController.js

Add this method:

```javascript
// Cancel search
exports.cancelSearch = async (req, res) => {
  try {
    const search = await NewBusinessSearch.findOne({
      _id: req.params.searchId,
      userId: req.user._id
    });

    if (!search) {
      return res.status(404).json({
        success: false,
        message: 'Search not found'
      });
    }

    if (search.status === 'completed' || search.status === 'failed') {
      return res.json({
        success: false,
        message: 'Search already completed'
      });
    }

    search.cancelRequested = true;
    
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

**Also add cancellation checks in the scan method:**

```javascript
// In your scan/processing loop, add:
const search = await NewBusinessSearch.findById(searchId);
if (search.cancelRequested) {
  search.status = 'cancelled';
  search.completedAt = new Date();
  await search.save();
  console.log(`🚫 Search ${searchId} cancelled`);
  return;
}
```

---

### 3 Remaining Routes:

#### 1. noWebsiteRoutes.js

Add this route:

```javascript
router.post('/searches/:searchId/cancel', auth, noWebsiteController.cancelSearch);
```

---

#### 2. newDomainRoutes.js

Add this route:

```javascript
router.post('/searches/:searchId/cancel', auth, newDomainController.cancelSearch);
```

---

#### 3. newBusinessRoutes.js

Add this route:

```javascript
router.post('/searches/:searchId/cancel', auth, newBusinessController.cancelSearch);
```

---

## Testing Checklist

After adding the remaining code, test each module:

### Test 1: No Website Finder
```bash
# Start search
POST /api/no-website/scan
# Response: { searchId: "..." }

# Cancel it (wait 10 seconds)
POST /api/no-website/searches/:searchId/cancel

# Check MongoDB
db.nowebsitesearches.findOne().sort({createdAt: -1})
# Should show: { status: "cancelled", cancelRequested: true }
```

### Test 2: New Domain Tracker
```bash
# Start search
POST /api/new-domain/scan
# Response: { searchId: "..." }

# Cancel it
POST /api/new-domain/searches/:searchId/cancel

# Check MongoDB
db.newdomainsearches.findOne().sort({createdAt: -1})
# Should show: { status: "cancelled", cancelRequested: true }
```

### Test 3: New Business Finder
```bash
# Start search
POST /api/new-business/scan
# Response: { searchId: "..." }

# Cancel it
POST /api/new-business/searches/:searchId/cancel

# Check MongoDB
db.newbusinesssearches.findOne().sort({createdAt: -1})
# Should show: { status: "cancelled", cancelRequested: true }
```

---

## Summary

**Total Remaining Work:**
- 3 controllers to update (add `cancelSearch()` method + checks)
- 3 routes to add (one line each)
- **Time estimate**: 30 minutes

**Files to Modify:**
1. `controllers/noWebsiteController.js`
2. `controllers/newDomainController.js`
3. `controllers/newBusinessController.js`
4. `routes/noWebsiteRoutes.js`
5. `routes/newDomainRoutes.js`
6. `routes/newBusinessRoutes.js`

**Pattern to Follow:**
- Copy the `cancelSearch()` method from `lowRatingController.js`
- Change model name (NoWebsiteSearch, NewDomainSearch, NewBusinessSearch)
- Add cancellation checks in scan method (check `cancelRequested` flag)
- Add route: `router.post('/searches/:searchId/cancel', auth, controller.cancelSearch)`

---

## Expected Behavior After Completion

1. User clicks "Cancel Search" → Frontend calls backend cancel endpoint
2. Backend sets `cancelRequested = true` in database
3. Processing code checks database periodically
4. When `cancelRequested === true`, stops processing and marks as "cancelled"
5. Recent Searches page shows "Cancelled" status
6. Backend logs show "🚫 Search cancelled" message
7. No wasted resources on cancelled searches

---

## Verification

After implementing, verify:
- [ ] All 3 controllers have `cancelSearch()` method
- [ ] All 3 routes have cancel endpoint
- [ ] All 3 scan methods check `cancelRequested` flag
- [ ] Cancellation works in frontend (click button → search stops)
- [ ] MongoDB shows `status: "cancelled"` for cancelled searches
- [ ] Backend logs show cancellation messages
- [ ] Recent Searches displays cancelled status correctly
