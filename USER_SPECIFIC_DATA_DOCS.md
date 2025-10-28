# User-Specific Search Data - Backend Implementation

## Overview
Each user's search data must be stored and retrieved based on their user ID from the JWT token.

---

## Database Schema Updates

### Searches Collection
Add `userId` field to associate searches with users:

```javascript
{
  _id: ObjectId,
  userId: ObjectId,              // NEW: Reference to User
  city: String,
  state: String,
  country: String,
  radius: Number,
  businessCategory: String,
  leadCap: Number,
  domainYear: String,
  filterMode: String,
  resultsCount: Number,
  status: String,
  createdAt: Date
}
```

### SearchResults Collection
```javascript
{
  _id: ObjectId,
  searchId: ObjectId,            // Reference to Search
  userId: ObjectId,              // NEW: Reference to User
  results: Array,
  createdAt: Date
}
```

---

## Implementation

### 1. Update Search Model

```javascript
// models/Search.js
const mongoose = require('mongoose');

const searchSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true  // Index for faster queries
  },
  city: String,
  state: String,
  country: String,
  radius: Number,
  businessCategory: String,
  leadCap: Number,
  domainYear: String,
  filterMode: String,
  daysAgo: Number,
  resultsCount: Number,
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Search', searchSchema);
```

### 2. Update SearchResults Model

```javascript
// models/SearchResults.js
const mongoose = require('mongoose');

const searchResultsSchema = new mongoose.Schema({
  searchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Search',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  results: [{
    name: String,
    website: String,
    domainCreationDate: Date,
    ownerName: String,
    email: String,
    phone: String,
    address: String,
    city: String,
    state: String,
    country: String,
    category: String,
    isLegacy: Boolean,
    isNew: Boolean
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('SearchResults', searchResultsSchema);
```

---

## API Endpoints Updates

### 1. Create Search (POST /api/scan)

```javascript
router.post('/scan', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id; // From auth middleware
    const {
      city,
      state,
      country,
      radius,
      businessCategory,
      leadCap,
      domainYear,
      filterMode,
      daysAgo
    } = req.body;

    // Perform scan logic...
    const results = []; // Your scan results

    // Create search record with userId
    const search = await Search.create({
      userId,  // Associate with logged-in user
      city,
      state,
      country,
      radius,
      businessCategory,
      leadCap,
      domainYear,
      filterMode,
      daysAgo,
      resultsCount: results.length,
      status: 'completed'
    });

    // Store results with userId
    await SearchResults.create({
      searchId: search._id,
      userId,  // Associate with logged-in user
      results
    });

    res.json({
      success: true,
      searchId: search._id,
      count: results.length,
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Scan failed',
      error: error.message
    });
  }
});
```

### 2. Get User's Recent Searches (GET /api/searches/recent)

```javascript
router.get('/searches/recent', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const limit = parseInt(req.query.limit) || 10;

    // Only get searches for this user
    const searches = await Search.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('-__v');

    res.json({
      success: true,
      data: searches
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch searches',
      error: error.message
    });
  }
});
```

### 3. Get Search Results (GET /api/searches/:searchId/results)

```javascript
router.get('/searches/:searchId/results', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const { searchId } = req.params;

    // Verify search belongs to user
    const search = await Search.findOne({ _id: searchId, userId });
    if (!search) {
      return res.status(404).json({
        success: false,
        message: 'Search not found or access denied'
      });
    }

    // Get results only if user owns the search
    const searchResults = await SearchResults.findOne({ 
      searchId, 
      userId 
    });

    if (!searchResults) {
      return res.status(404).json({
        success: false,
        message: 'Results not found'
      });
    }

    res.json({
      success: true,
      data: {
        search,
        results: searchResults.results
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch results',
      error: error.message
    });
  }
});
```

### 4. Delete Search (DELETE /api/searches/:searchId)

```javascript
router.delete('/searches/:searchId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const { searchId } = req.params;

    // Only delete if user owns the search
    const search = await Search.findOneAndDelete({ 
      _id: searchId, 
      userId 
    });

    if (!search) {
      return res.status(404).json({
        success: false,
        message: 'Search not found or access denied'
      });
    }

    // Delete associated results
    await SearchResults.deleteOne({ searchId, userId });

    res.json({
      success: true,
      message: 'Search deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete search',
      error: error.message
    });
  }
});
```

### 5. Get All User Searches (GET /api/searches)

```javascript
router.get('/searches', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Get only user's searches
    const searches = await Search.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Search.countDocuments({ userId });

    res.json({
      success: true,
      data: searches,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch searches',
      error: error.message
    });
  }
});
```

---

## Security Considerations

### 1. Always Verify Ownership
```javascript
// Before any operation, verify the resource belongs to the user
const search = await Search.findOne({ _id: searchId, userId: req.user._id });
if (!search) {
  return res.status(404).json({ message: 'Not found or access denied' });
}
```

### 2. Use Indexes
```javascript
// Add indexes for faster queries
searchSchema.index({ userId: 1, createdAt: -1 });
searchResultsSchema.index({ userId: 1, searchId: 1 });
```

### 3. Prevent Data Leaks
- Never return data without checking userId
- Always filter queries by userId
- Use proper error messages (don't reveal if resource exists)

---

## Testing

### 1. Create Search as User 1
```bash
# Login as user1
TOKEN1=$(curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user1@example.com","password":"password"}' \
  | jq -r '.token')

# Create search
curl -X POST http://localhost:5000/api/scan \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN1" \
  -d '{
    "city": "Mumbai",
    "country": "India",
    "leadCap": 10
  }'
```

### 2. Try to Access as User 2 (Should Fail)
```bash
# Login as user2
TOKEN2=$(curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user2@example.com","password":"password"}' \
  | jq -r '.token')

# Try to access user1's search (should return 404)
curl -X GET http://localhost:5000/api/searches/SEARCH_ID_FROM_USER1/results \
  -H "Authorization: Bearer $TOKEN2"
```

### 3. Get Own Searches
```bash
# User1 gets their searches
curl -X GET http://localhost:5000/api/searches/recent \
  -H "Authorization: Bearer $TOKEN1"
```

---

## Summary

**Key Changes:**
1. Add `userId` field to Search and SearchResults models
2. Extract `userId` from JWT token in auth middleware (`req.user._id`)
3. Always include `userId` when creating records
4. Always filter by `userId` when querying records
5. Verify ownership before allowing access/modification/deletion

**Security:**
- Users can only see their own searches
- Users can only access their own results
- Users can only delete their own searches
- Proper 404 responses for unauthorized access attempts
