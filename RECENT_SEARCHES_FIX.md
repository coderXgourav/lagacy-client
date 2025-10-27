# Recent Searches Frontend Fix Documentation

## Problem
Recent Searches page is calling wrong API endpoint and not displaying data correctly.

---

## Backend API Endpoints Required

### 1. Get Downloadable Searches
**Endpoint:** `GET /api/searches/downloadable`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "search_id_123",
      "query": "Mumbai restaurants",
      "city": "Mumbai",
      "state": "Maharashtra",
      "country": "India",
      "radius": 5000,
      "businessCategory": "restaurants",
      "leadCap": 50,
      "resultsCount": 15,
      "status": "completed",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### 2. Get Search Results (for viewing)
**Endpoint:** `GET /api/searches/:searchId/results`

**Response:**
```json
{
  "success": true,
  "data": {
    "search": {
      "_id": "search_id_123",
      "query": "Mumbai restaurants",
      "resultsCount": 15
    },
    "results": [
      {
        "_id": "result_id_1",
        "businessName": "Heritage Restaurant",
        "category": "restaurant",
        "website": "https://heritage-restaurant.com",
        "domainCreationDate": "2015-03-15T00:00:00.000Z",
        "phone": "+91 22 1234 5678",
        "address": "123 Main St, Mumbai",
        "emails": ["info@heritage-restaurant.com"],
        "location": {
          "city": "Mumbai",
          "state": "Maharashtra",
          "country": "India"
        }
      }
    ]
  }
}
```

### 3. Download Search Results (Excel)
**Endpoint:** `GET /api/searches/:searchId/download`

**Response:** Binary Excel file

**Headers:**
```
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename=search-results.xlsx
```

### 4. Delete Search
**Endpoint:** `DELETE /api/searches/:searchId`

**Response:**
```json
{
  "success": true,
  "message": "Search deleted successfully"
}
```

---

## Backend Implementation Guide

### Database Schema

**Searches Collection:**
```javascript
{
  _id: ObjectId,
  query: String,
  city: String,
  state: String,
  country: String,
  radius: Number,
  businessCategory: String,
  leadCap: Number,
  resultsCount: Number,
  status: String, // 'completed', 'failed'
  createdAt: Date
}
```

**SearchResults Collection:**
```javascript
{
  _id: ObjectId,
  searchId: ObjectId, // Reference to Searches
  results: [
    {
      businessName: String,
      category: String,
      website: String,
      domainCreationDate: Date,
      phone: String,
      address: String,
      emails: [String],
      location: {
        city: String,
        state: String,
        country: String
      }
    }
  ],
  createdAt: Date,
  expiresAt: Date // Optional: Auto-delete after 30 days
}
```

---

## Backend Routes Implementation

### 1. Get Downloadable Searches
```javascript
router.get('/searches/downloadable', async (req, res) => {
  try {
    const searches = await Search.find({ status: 'completed' })
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json({
      success: true,
      data: searches
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch searches'
    });
  }
});
```

### 2. Get Search Results
```javascript
router.get('/searches/:searchId/results', async (req, res) => {
  try {
    const { searchId } = req.params;
    
    const search = await Search.findById(searchId);
    if (!search) {
      return res.status(404).json({
        success: false,
        error: 'Search not found'
      });
    }
    
    const searchResults = await SearchResults.findOne({ searchId });
    if (!searchResults) {
      return res.status(404).json({
        success: false,
        error: 'Results not found'
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
      error: 'Failed to fetch results'
    });
  }
});
```

### 3. Download Search Results
```javascript
const ExcelJS = require('exceljs');

router.get('/searches/:searchId/download', async (req, res) => {
  try {
    const { searchId } = req.params;
    
    const searchResults = await SearchResults.findOne({ searchId });
    if (!searchResults) {
      return res.status(404).json({
        success: false,
        error: 'Results not found'
      });
    }
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Results');
    
    worksheet.columns = [
      { header: 'Business Name', key: 'businessName', width: 30 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Website', key: 'website', width: 40 },
      { header: 'Domain Created', key: 'domainCreated', width: 15 },
      { header: 'Phone', key: 'phone', width: 20 },
      { header: 'Address', key: 'address', width: 40 },
      { header: 'Emails', key: 'emails', width: 40 },
      { header: 'City', key: 'city', width: 20 },
      { header: 'State', key: 'state', width: 20 },
      { header: 'Country', key: 'country', width: 20 }
    ];
    
    searchResults.results.forEach(result => {
      worksheet.addRow({
        businessName: result.businessName,
        category: result.category,
        website: result.website,
        domainCreated: new Date(result.domainCreationDate).toLocaleDateString(),
        phone: result.phone,
        address: result.address,
        emails: result.emails.join(', '),
        city: result.location.city,
        state: result.location.state,
        country: result.location.country
      });
    });
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=search-results.xlsx');
    
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate Excel file'
    });
  }
});
```

### 4. Store Search Results (Called from Frontend)
```javascript
router.post('/searches/results', async (req, res) => {
  try {
    const { searchId, results } = req.body;
    
    if (!searchId || !results) {
      return res.status(400).json({
        success: false,
        error: 'searchId and results are required'
      });
    }
    
    const searchResults = new SearchResults({
      searchId,
      results,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    });
    
    await searchResults.save();
    
    res.json({
      success: true,
      message: 'Results stored successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to store results'
    });
  }
});
```

### 5. Delete Search
```javascript
router.delete('/searches/:searchId', async (req, res) => {
  try {
    const { searchId } = req.params;
    
    await Search.findByIdAndDelete(searchId);
    await SearchResults.deleteOne({ searchId });
    
    res.json({
      success: true,
      message: 'Search deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete search'
    });
  }
});
```

---

## Frontend Integration (Already Done)

The frontend is already updated to use these endpoints:

1. **SearchPage** - Stores results after scan using `POST /api/searches/results`
2. **RecentSearches** - Fetches searches using `GET /api/searches/downloadable`
3. **RecentSearches** - Views results using `GET /api/searches/:searchId/results`
4. **RecentSearches** - Downloads Excel using frontend generation from results
5. **RecentSearches** - Deletes search using `DELETE /api/searches/:searchId`

---

## Testing

### Test Get Downloadable Searches
```bash
curl http://localhost:5000/api/searches/downloadable
```

### Test Get Search Results
```bash
curl http://localhost:5000/api/searches/SEARCH_ID/results
```

### Test Download
```bash
curl -O http://localhost:5000/api/searches/SEARCH_ID/download
```

### Test Store Results
```bash
curl -X POST http://localhost:5000/api/searches/results \
  -H "Content-Type: application/json" \
  -d '{
    "searchId": "SEARCH_ID",
    "results": [
      {
        "businessName": "Test Business",
        "category": "restaurant",
        "website": "https://test.com",
        "domainCreationDate": "2015-01-01",
        "phone": "+1234567890",
        "address": "123 Main St",
        "emails": ["test@test.com"],
        "location": {
          "city": "Mumbai",
          "state": "Maharashtra",
          "country": "India"
        }
      }
    ]
  }'
```

### Test Delete
```bash
curl -X DELETE http://localhost:5000/api/searches/SEARCH_ID
```

---

## Summary

**Backend must implement:**
1. `GET /api/searches/downloadable` - Return list of completed searches
2. `GET /api/searches/:searchId/results` - Return search results as JSON
3. `GET /api/searches/:searchId/download` - Return Excel file
4. `POST /api/searches/results` - Store search results
5. `DELETE /api/searches/:searchId` - Delete search and results

**Frontend is already configured to use these endpoints.**
