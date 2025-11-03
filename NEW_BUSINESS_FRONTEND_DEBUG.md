# New Business Finder - Frontend Debugging Guide

## Issue Identified
**Problem**: Loading screen appears and disappears without results
**Root Cause**: Frontend using mock data instead of actual API call

## Current Code Issue
```typescript
// WRONG - Mock implementation
const handleSearch = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSearching(true);
  try {
    await new Promise(resolve => setTimeout(resolve, 2000)); // ❌ Mock delay
    toast({
      title: "Coming Soon",
      description: "New Business Finder will be available soon", // ❌ Mock message
    });
  } catch (error: any) {
    // ...
  } finally {
    setIsSearching(false);
  }
};
```

## Fix Required
Replace mock implementation with actual API call:

```typescript
import { newBusinessApi } from '@/services/api';

const [results, setResults] = useState<any[]>([]);

const handleSearch = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSearching(true);
  setResults([]);

  try {
    console.log('🔍 Sending search request:', formData);
    
    const response = await newBusinessApi.scan({
      city: formData.city,
      state: formData.state,
      country: formData.country,
      radius: formData.radius,
      niche: formData.niche,
      daysBack: formData.daysBack,
      leads: formData.leads
    });

    console.log('✅ Search response:', response);

    if (response.success && response.data) {
      setResults(response.data);
      toast({
        title: "Search Complete",
        description: `Found ${response.count || response.data.length} businesses`,
      });
    } else {
      toast({
        title: "No Results",
        description: "No businesses found matching your criteria",
      });
    }
  } catch (error: any) {
    console.error('❌ Search error:', error);
    toast({
      title: "Error",
      description: error.message || "Search failed",
      variant: "destructive"
    });
  } finally {
    setIsSearching(false);
  }
};
```

## Debugging Checklist

### 1. Frontend Checks
- [ ] Import `newBusinessApi` from `@/services/api`
- [ ] Replace mock setTimeout with actual API call
- [ ] Add console.log for request/response debugging
- [ ] Add state for storing results: `const [results, setResults] = useState<any[]>([]);`
- [ ] Display results in UI after successful search

### 2. Backend Checks
- [ ] Backend server running on http://localhost:5000
- [ ] Route registered: `app.use('/api/new-business', newBusinessRoutes);`
- [ ] Controller file exists: `controllers/newBusinessController.js`
- [ ] Models created: `NewBusinessSearch`, `NewBusiness`
- [ ] Auth middleware working (JWT token valid)

### 3. Network Debugging
Open browser DevTools (F12) → Network tab:
- [ ] Check if POST request to `/api/new-business/scan` is sent
- [ ] Verify request payload contains all required fields
- [ ] Check response status (200 = success, 401 = auth issue, 500 = server error)
- [ ] Inspect response body for error messages

### 4. Console Debugging
Open browser DevTools (F12) → Console tab:
- [ ] Look for "🔍 Sending search request:" log
- [ ] Look for "✅ Search response:" log
- [ ] Check for any red error messages
- [ ] Verify JWT token exists: `localStorage.getItem('token')`

## Common Issues & Solutions

### Issue 1: 401 Unauthorized
**Symptom**: Request fails with 401 status
**Solution**: 
```javascript
// Check token in console
console.log('Token:', localStorage.getItem('token'));
// If null, login again
```

### Issue 2: 404 Not Found
**Symptom**: Request fails with 404 status
**Solution**: Backend route not registered
```javascript
// In app.js or server.js
const newBusinessRoutes = require('./routes/newBusinessRoutes');
app.use('/api/new-business', newBusinessRoutes);
```

### Issue 3: 500 Server Error
**Symptom**: Request fails with 500 status
**Solution**: Check backend console logs for error details

### Issue 4: CORS Error
**Symptom**: "CORS policy" error in console
**Solution**: Add CORS middleware in backend
```javascript
const cors = require('cors');
app.use(cors());
```

### Issue 5: No Results Displayed
**Symptom**: API returns data but UI doesn't show it
**Solution**: Add results display section in JSX

## Testing Steps

### Step 1: Test API Directly (Postman/curl)
```bash
curl -X POST http://localhost:5000/api/new-business/scan \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "city": "San Francisco",
    "state": "California",
    "country": "United States",
    "radius": 5000,
    "niche": "restaurant",
    "daysBack": 30,
    "leads": 50
  }'
```

### Step 2: Test Frontend API Call
```javascript
// In browser console
const token = localStorage.getItem('token');
fetch('http://localhost:5000/api/new-business/scan', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    city: 'San Francisco',
    country: 'United States',
    radius: 5000,
    daysBack: 30,
    leads: 50
  })
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

### Step 3: Check Backend Logs
Look for these logs in backend console:
- "New business scan request received"
- "Overpass API query sent"
- "Found X businesses"
- Any error messages

## Expected Response Structure
```json
{
  "success": true,
  "message": "Found 45 newly registered businesses",
  "count": 45,
  "searchId": "507f1f77bcf86cd799439011",
  "data": [
    {
      "_id": "...",
      "ownerName": "John Doe",
      "businessName": "Joe's Pizza",
      "phone": "+1-555-0123",
      "email": "john@example.com",
      "facebookPage": "https://facebook.com/joespizza",
      "address": "123 Main St",
      "city": "San Francisco",
      "state": "California",
      "country": "United States",
      "niche": "restaurant",
      "registrationDate": "2024-01-10T00:00:00Z"
    }
  ]
}
```

## Quick Fix Summary
1. Update `NewBusinessSearchPage.tsx` to use `newBusinessApi.scan()`
2. Add results state and display section
3. Add console.log for debugging
4. Test with browser DevTools open
5. Check Network tab for API calls
6. Check Console tab for errors
