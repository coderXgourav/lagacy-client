# New Business Finder - Frontend Integration

## 1. Update api.ts

Add to `src/services/api.ts`:

```typescript
export const newBusinessApi = {
  scan: (params: {
    city: string;
    state?: string;
    country: string;
    radius?: number;
    niche?: string;
    daysBack?: number;
    leads?: number;
  }) => apiCall('/new-business/scan', {
    method: 'POST',
    body: JSON.stringify(params),
  }),
  
  getRecentSearches: (limit = 20) => apiCall(`/new-business/searches/recent?limit=${limit}`),
  getSearchResults: (searchId: string) => apiCall(`/new-business/searches/${searchId}/results`),
  deleteSearch: (searchId: string) => apiCall(`/new-business/searches/${searchId}`, { method: 'DELETE' }),
  
  downloadSearchExcel: async (searchId: string, businesses: any[]) => {
    const XLSX = await import('xlsx');
    const worksheet = XLSX.utils.json_to_sheet(businesses.map(b => ({
      'Business Name': b.businessName || 'N/A',
      'Phone': b.phone || 'N/A',
      'Website': b.website || 'N/A',
      'Address': b.address || 'N/A',
      'City': b.city || 'N/A',
      'Niche': b.niche || 'N/A',
      'Registration Date': b.registrationDate ? new Date(b.registrationDate).toLocaleDateString() : 'N/A',
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'New Businesses');
    XLSX.writeFile(workbook, `new-businesses-${searchId}.xlsx`);
  },
};

// Update default export
export default {
  ...existing,
  newBusinessFinder: newBusinessApi,
};
```

## 2. API Response Structure

```typescript
// POST /api/new-business/scan
{
  success: true,
  message: "Found 45 newly registered businesses",
  count: 45,
  searchId: "507f1f77bcf86cd799439011",
  data: [...]
}

// GET /api/new-business/searches/recent
{
  success: true,
  searches: [...]
}

// GET /api/new-business/searches/:id/results
{
  success: true,
  search: {...},
  results: [...]
}
```

## 3. Key Features

- **100% Free** - Uses OpenStreetMap (no API keys)
- **Date Filtering** - Find businesses added in last 7-90 days
- **Niche Filtering** - Filter by business type
- **Radius Search** - 2km to 20km
- **Excel Export** - Download results

## 4. Usage Example

```typescript
const response = await newBusinessApi.scan({
  city: "San Francisco",
  state: "California",
  country: "United States",
  radius: 5000,
  niche: "restaurant",
  daysBack: 30,
  leads: 100
});
```

## 5. Notes

- OpenStreetMap data shows when business was added to OSM, not actual registration date
- Best coverage in urban areas with active OSM contributors
- No API keys or subscriptions needed
