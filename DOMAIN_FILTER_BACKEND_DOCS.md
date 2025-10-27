# Domain Filter Backend Implementation

## Overview
Frontend now sends two new optional parameters for filtering domains by creation date.

---

## Updated API Request

### POST /api/scan

**Request Body:**
```json
{
  "city": "Mumbai",
  "state": "Maharashtra",
  "country": "India",
  "radius": 5000,
  "businessCategory": "restaurants",
  "leadCap": 50,
  "domainYear": "2020",           // NEW: Year to filter by
  "filterMode": "before"          // NEW: "before" or "after"
}
```

**Field Details:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| domainYear | string | No | Year (e.g., "2020"). Year to filter domains by |
| filterMode | string | No | "before" or "after". Defaults to "before" if not provided |

---

## Backend Logic

### 1. Parse Request Parameters
```javascript
router.post('/scan', async (req, res) => {
  const {
    city,
    country,
    radius = 5000,
    businessCategory,
    leadCap = 50,
    domainYear,
    filterMode = 'before'
  } = req.body;
  
  // Calculate date filter
  let domainDateFilter;
  
  if (domainYear) {
    domainDateFilter = new Date(`${domainYear}-01-01`);
  }
  
  // Continue with scan logic...
});
```

---

## Implementation Examples

### Option 1: Filter After Fetching
```javascript
// After getting domain creation dates from WhoisXML
const filteredBusinesses = businesses.filter(business => {
  if (!domainDateFilter) return true; // No filter applied
  
  const domainDate = new Date(business.domainCreationDate);
  
  if (filterMode === 'after') {
    // After: Keep domains created AFTER the filter date (newer domains)
    return domainDate >= domainDateFilter;
  } else {
    // Before: Keep domains created BEFORE the filter date (older domains)
    return domainDate < domainDateFilter;
  }
});
```

### Option 2: Filter During Processing
```javascript
// When checking each business
const checkDomain = async (business) => {
  const domainInfo = await whoisXMLAPI.getDomainInfo(business.website);
  const domainDate = new Date(domainInfo.createdDate);
  
  // Apply filter
  if (domainDateFilter) {
    if (filterMode === 'after') {
      // After: SKIP if domain is TOO OLD (created before filter date)
      if (domainDate < domainDateFilter) {
        return null; // Skip - domain is too old
      }
    } else {
      // Before: SKIP if domain is TOO NEW (created after filter date)
      if (domainDate >= domainDateFilter) {
        return null; // Skip - domain is too new
      }
    }
  }
  
  return {
    ...business,
    domainCreationDate: domainInfo.createdDate,
    isLegacy: !enableRecent
  };
};
```

---

## Complete Example

```javascript
router.post('/scan', async (req, res) => {
  try {
    const {
      city,
      country,
      radius = 5000,
      businessCategory,
      leadCap = 50,
      domainYear,
      filterMode = 'before'
    } = req.body;
    
    // Calculate domain date filter
    let domainDateFilter = null;
    
    if (domainYear) {
      domainDateFilter = new Date(`${domainYear}-01-01`);
    }
    
    // 1. Get businesses from Google Places
    const businesses = await googlePlacesAPI.search({
      city,
      country,
      radius,
      category: businessCategory
    });
    
    // 2. Check domains and filter
    const results = [];
    
    for (const business of businesses) {
      if (results.length >= leadCap) break;
      
      // Get domain info
      const domainInfo = await whoisXMLAPI.getDomainInfo(business.website);
      const domainDate = new Date(domainInfo.createdDate);
      
      // Apply filter
      if (domainDateFilter) {
        if (filterMode === 'after') {
          // After: SKIP if domain is TOO OLD (created before filter date)
          if (domainDate < domainDateFilter) {
            continue; // Skip - domain is too old
          }
        } else {
          // Before: SKIP if domain is TOO NEW (created after filter date)
          if (domainDate >= domainDateFilter) {
            continue; // Skip - domain is too new
          }
        }
      }
      
      // Get emails
      const emails = await hunterAPI.findEmails(business.website);
      
      results.push({
        name: business.name,
        website: business.website,
        domainCreationDate: domainInfo.createdDate,
        ownerName: domainInfo.registrant,
        email: emails[0],
        phone: business.phone,
        address: business.address,
        city: business.city,
        state: business.state,
        country: business.country,
        category: business.category,
        isLegacy: true
      });
    }
    
    // 3. Store results
    const search = await Search.create({
      city,
      country,
      radius,
      businessCategory,
      leadCap,
      domainYear,
      enableRecent,
      recentPeriod,
      resultsCount: results.length,
      status: 'completed'
    });
    
    await SearchResults.create({
      searchId: search._id,
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
      error: 'Scan failed',
      details: error.message
    });
  }
});
```

---

## Database Schema Update

### Searches Collection
```javascript
{
  _id: ObjectId,
  city: String,
  country: String,
  radius: Number,
  businessCategory: String,
  leadCap: Number,
  domainYear: String,        // NEW
  filterMode: String,        // NEW: "before" or "after"
  resultsCount: Number,
  status: String,
  createdAt: Date
}
```

---

## Filter Logic Summary

**Logic:**
1. If `domainYear` is provided → Filter by that year using `filterMode`
2. Else → No filter (return all domains)

**Filter Modes:**
- `filterMode: "before"` + `domainYear: "2020"` → Domains created BEFORE January 1, 2020 (old domains)
- `filterMode: "after"` + `domainYear: "2020"` → Domains created AFTER January 1, 2020 (new domains)

---

## Testing

### Test Case 1: Before Year Filter (Old Domains)
```bash
curl -X POST http://localhost:5000/api/scan \
  -H "Content-Type: application/json" \
  -d '{
    "city": "Mumbai",
    "country": "India",
    "domainYear": "2020",
    "filterMode": "before",
    "leadCap": 10
  }'
```

### Test Case 2: After Year Filter (New Domains)
```bash
curl -X POST http://localhost:5000/api/scan \
  -H "Content-Type: application/json" \
  -d '{
    "city": "Mumbai",
    "country": "India",
    "domainYear": "2020",
    "filterMode": "after",
    "leadCap": 10
  }'
```

### Test Case 3: No Filter
```bash
curl -X POST http://localhost:5000/api/scan \
  -H "Content-Type: application/json" \
  -d '{
    "city": "Mumbai",
    "country": "India",
    "leadCap": 10
  }'
```

---

## Summary

**Frontend sends:**
- `domainYear` (optional) - Year string like "2020"
- `filterMode` (optional) - "before" or "after" (defaults to "before")

**Backend must:**
1. Parse domainYear and filterMode parameters
2. If domainYear is provided, create filter date as January 1 of that year
3. Apply filter based on filterMode:
   - "before": Keep domains where `domainDate < filterDate`
   - "after": Keep domains where `domainDate >= filterDate`
4. Store the filter parameters in the database
5. Return only filtered results

**Filter Examples:**
- `domainYear: "2020"` + `filterMode: "before"` → Domains created BEFORE Jan 1, 2020 (old/legacy domains)
- `domainYear: "2020"` + `filterMode: "after"` → Domains created AFTER Jan 1, 2020 (newer domains)
