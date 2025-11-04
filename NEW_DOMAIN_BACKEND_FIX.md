# New Domain Tracker - Backend Fix for Optional Keywords

## Error
```
NewDomainSearch validation failed: keywords: Path `keywords` is required.
```

## Root Cause
The MongoDB model has `keywords` field marked as `required: true`, but the frontend now sends requests without keywords when searching all domains by TLD only.

---

## Backend Fix Required

### File: `models/NewDomainSearch.js`

**CHANGE THIS:**
```javascript
const newDomainSearchSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  keywords: { 
    type: String, 
    required: true  // ❌ REMOVE THIS
  },
  tlds: {
    type: [String],
    required: true
  },
  daysBack: { type: Number, default: 7 },
  leads: { type: Number, default: 100 },
  resultsCount: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  createdAt: { type: Date, default: Date.now }
});
```

**TO THIS:**
```javascript
const newDomainSearchSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  keywords: { 
    type: String, 
    required: false  // ✅ MAKE OPTIONAL
  },
  tlds: {
    type: [String],
    required: true
  },
  daysBack: { type: Number, default: 7 },
  leads: { type: Number, default: 100 },
  resultsCount: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  createdAt: { type: Date, default: Date.now }
});
```

---

## Controller Update (Optional)

### File: `controllers/newDomainController.js`

Update the scan function to handle optional keywords:

```javascript
exports.scanNewDomains = async (req, res) => {
  try {
    const { tlds, keywords, daysBack = 7, leads = 100 } = req.body;
    const userId = req.user._id;

    // Validate required fields
    if (!tlds || tlds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one TLD is required'
      });
    }

    // Create search record
    const searchData = {
      userId,
      tlds,
      daysBack,
      leads,
      status: 'processing'
    };

    // Only add keywords if provided
    if (keywords && keywords.trim()) {
      searchData.keywords = keywords.trim();
    }

    const search = await NewDomainSearch.create(searchData);

    // Rest of the scan logic...
    // Pass keywords to domain search service only if provided
    const domains = await domainSearchService.findNewDomains({
      tlds,
      keywords: keywords?.trim() || null,  // Pass null if empty
      daysBack,
      limit: leads
    });

    // ... rest of the code
  } catch (error) {
    console.error('New domain scan error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Scan failed'
    });
  }
};
```

---

## Domain Search Service Update

### File: `services/domainSearchService.js`

Update to handle null/empty keywords:

```javascript
exports.findNewDomains = async ({ tlds, keywords, daysBack, limit }) => {
  try {
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - daysBack);

    let domains = [];

    // Search Certificate Transparency logs
    for (const tld of tlds) {
      const ctDomains = await searchCertificateTransparency({
        tld,
        keywords: keywords || null,  // Handle null keywords
        dateThreshold,
        limit: Math.ceil(limit / tlds.length)
      });
      domains = domains.concat(ctDomains);
    }

    // If keywords provided, filter by keywords
    if (keywords) {
      const keywordList = keywords.toLowerCase().split(' ');
      domains = domains.filter(domain => 
        keywordList.some(kw => domain.domainName.toLowerCase().includes(kw))
      );
    }

    return domains.slice(0, limit);
  } catch (error) {
    console.error('Domain search error:', error);
    return [];
  }
};

async function searchCertificateTransparency({ tld, keywords, dateThreshold, limit }) {
  try {
    // Build query
    let query = `%.${tld}`;
    
    // If keywords provided, add to query
    if (keywords) {
      const keywordList = keywords.split(' ');
      query = `%${keywordList[0]}%.${tld}`;  // Use first keyword in CT query
    }

    // Query Certificate Transparency API
    const response = await axios.get('https://crt.sh/', {
      params: {
        q: query,
        output: 'json'
      }
    });

    // Filter by date and parse results
    const domains = response.data
      .filter(cert => new Date(cert.entry_timestamp) >= dateThreshold)
      .map(cert => ({
        domainName: cert.name_value,
        registrationDate: cert.entry_timestamp,
        tld: tld,
        source: 'certificate_transparency'
      }));

    return domains.slice(0, limit);
  } catch (error) {
    console.error('CT search error:', error);
    return [];
  }
}
```

---

## Testing

### Test 1: Search with Keywords
```bash
curl -X POST http://localhost:5000/api/new-domain/scan \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tlds": ["com", "net"],
    "keywords": "tech startup",
    "daysBack": 7,
    "leads": 50
  }'
```

### Test 2: Search without Keywords (All Domains)
```bash
curl -X POST http://localhost:5000/api/new-domain/scan \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tlds": ["com", "net"],
    "daysBack": 7,
    "leads": 50
  }'
```

### Test 3: Search with Empty Keywords
```bash
curl -X POST http://localhost:5000/api/new-domain/scan \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tlds": ["com"],
    "keywords": "",
    "daysBack": 7,
    "leads": 50
  }'
```

---

## Summary

**Required Changes:**
1. ✅ Update `NewDomainSearch` model - make `keywords` optional
2. ✅ Update controller - conditionally add keywords to search record
3. ✅ Update domain search service - handle null/empty keywords

**Expected Behavior:**
- With keywords: Filter domains containing those keywords
- Without keywords: Return all new domains for specified TLDs
- Empty keywords: Treat as no keywords (return all)

**Frontend Already Updated:**
- Keywords field is optional
- Only sends keywords if provided and not empty
- Results display working

Once backend is updated, the feature will work correctly!
