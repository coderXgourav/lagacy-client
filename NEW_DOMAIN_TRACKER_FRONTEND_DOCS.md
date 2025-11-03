# New Domain Tracker - Frontend Integration Guide

## Overview
This guide shows you how to integrate the New Domain Tracker backend API with your existing frontend.

---

## 1. Add API Methods to `api.ts`

Add the following to `lagacy-client/src/services/api.ts`:

```typescript
// New Domain Tracker API
export const newDomainApi = {
  // Scan for newly registered domains
  scan: (params: {
    keywords: string;
    tlds: string[];
    daysBack: number;
    leads: number;
  }) => apiCall('/new-domain/scan', {
    method: 'POST',
    body: JSON.stringify(params),
  }),
  
  // Get recent searches
  getRecentSearches: (limit = 20) => apiCall(`/new-domain/searches/recent?limit=${limit}`),
  
  // Get results for specific search
  getSearchResults: (searchId: string) => apiCall(`/new-domain/searches/${searchId}/results`),
  
  // Delete search
  deleteSearch: (searchId: string) => apiCall(`/new-domain/searches/${searchId}`, {
    method: 'DELETE',
  }),
  
  // Download search results as Excel
  downloadSearchExcel: async (searchId: string, domains: any[]) => {
    const XLSX = await import('xlsx');
    const worksheet = XLSX.utils.json_to_sheet(domains.map(d => ({
      'Domain Name': d.domainName || 'N/A',
      'Registration Date': d.registrationDate ? new Date(d.registrationDate).toLocaleDateString() : 'N/A',
      'TLD': d.tld || 'N/A',
      'Registrant Name': d.registrant?.name || 'N/A',
      'Registrant Email': d.registrant?.email || 'N/A',
      'Registrant Phone': d.registrant?.phone || 'N/A',
      'Organization': d.registrant?.organization || 'N/A',
      'Country': d.registrant?.country || 'N/A',
      'Nameservers': d.nameservers?.join(', ') || 'N/A',
      'Status': d.status || 'N/A',
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'New Domains');
    XLSX.writeFile(workbook, `new-domains-${searchId}.xlsx`);
  },
};
```

Then update the default export at the bottom:

```typescript
export default {
  auth: authApi,
  settings: settingsApi,
  searches: searchesApi,
  leads: leadsApi,
  legacyFinder: legacyFinderApi,
  noWebsiteFinder: noWebsiteApi,
  lowRatingFinder: lowRatingApi,
  newDomainTracker: newDomainApi,  // ADD THIS LINE
};
```

---

## 2. Update `NewDomainSearchPage.tsx`

Replace the placeholder `handleSearch` function with actual API integration:

```typescript
import { newDomainApi } from "@/services/api";
import { useNavigate } from "react-router-dom";

// Inside component:
const navigate = useNavigate();

const handleSearch = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (formData.tlds.length === 0) {
    toast({
      title: "Error",
      description: "Please select at least one TLD",
      variant: "destructive"
    });
    return;
  }

  setIsSearching(true);

  try {
    const response = await newDomainApi.scan({
      keywords: formData.keywords,
      tlds: formData.tlds,
      daysBack: formData.daysBack,
      leads: formData.leads
    });

    toast({
      title: "Search Started",
      description: `Found ${response.resultsCount} domains. Redirecting to results...`,
    });

    // Redirect to results page after 1 second
    setTimeout(() => {
      navigate(`/new-domain/results/${response.searchId}`);
    }, 1000);

  } catch (error: any) {
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

---

## 3. Create Results Page

Create `lagacy-client/src/pages/newdomain/NewDomainResultsPage.tsx`:

```typescript
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { newDomainApi } from "@/services/api";
import { Download, ArrowLeft, Loader2, Calendar, Globe, Mail, Phone, Building } from "lucide-react";

export default function NewDomainResultsPage() {
  const { searchId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [domains, setDomains] = useState<any[]>([]);

  useEffect(() => {
    loadResults();
  }, [searchId]);

  const loadResults = async () => {
    try {
      const response = await newDomainApi.getSearchResults(searchId!);
      setDomains(response.domains || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load results",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      await newDomainApi.downloadSearchExcel(searchId!, domains);
      toast({
        title: "Success",
        description: "Results downloaded successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to download results",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/new-domain")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Search Results</h1>
            <p className="text-muted-foreground">{domains.length} domains found</p>
          </div>
        </div>
        <Button onClick={handleDownload} disabled={domains.length === 0}>
          <Download className="w-4 h-4 mr-2" />
          Download Excel
        </Button>
      </div>

      <div className="grid gap-4">
        {domains.map((domain) => (
          <Card key={domain._id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                {domain.domainName}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Registered:</span>
                  <span>{new Date(domain.registrationDate).toLocaleDateString()}</span>
                </div>
                
                {domain.registrant?.name && (
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">Registrant:</span>
                    <span>{domain.registrant.name}</span>
                  </div>
                )}
                
                {domain.registrant?.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">Email:</span>
                    <span>{domain.registrant.email}</span>
                  </div>
                )}
                
                {domain.registrant?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">Phone:</span>
                    <span>{domain.registrant.phone}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

---

## 4. Create History Page

Create `lagacy-client/src/pages/newdomain/NewDomainHistoryPage.tsx`:

```typescript
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { newDomainApi } from "@/services/api";
import { Eye, Trash2, Loader2, Calendar, Tag } from "lucide-react";

export default function NewDomainHistoryPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [searches, setSearches] = useState<any[]>([]);

  useEffect(() => {
    loadSearches();
  }, []);

  const loadSearches = async () => {
    try {
      const response = await newDomainApi.getRecentSearches(50);
      setSearches(response.searches || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load searches",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (searchId: string) => {
    if (!confirm("Delete this search and all its results?")) return;

    try {
      await newDomainApi.deleteSearch(searchId);
      toast({
        title: "Success",
        description: "Search deleted successfully",
      });
      loadSearches();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete search",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Search History</h1>
        <p className="text-muted-foreground">{searches.length} searches</p>
      </div>

      <div className="grid gap-4">
        {searches.map((search) => (
          <Card key={search._id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tag className="w-5 h-5" />
                  {search.keywords}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/new-domain/results/${search._id}`)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(search._id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {new Date(search.createdAt).toLocaleDateString()}
                </div>
                <div>TLDs: {search.tlds.join(", ")}</div>
                <div>Results: {search.resultsCount}</div>
                <div>Status: {search.status}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

---

## 5. Add Routes

Update your router configuration to include the new pages:

```typescript
import NewDomainSearchPage from "@/pages/newdomain/NewDomainSearchPage";
import NewDomainResultsPage from "@/pages/newdomain/NewDomainResultsPage";
import NewDomainHistoryPage from "@/pages/newdomain/NewDomainHistoryPage";

// Add these routes:
{
  path: "/new-domain",
  element: <NewDomainLayout />,
  children: [
    { index: true, element: <NewDomainSearchPage /> },
    { path: "results/:searchId", element: <NewDomainResultsPage /> },
    { path: "history", element: <NewDomainHistoryPage /> },
  ]
}
```

---

## 6. API Response Structure

### Scan Response
```typescript
{
  success: true,
  searchId: "507f1f77bcf86cd799439011",
  resultsCount: 42,
  message: "Found 42 domains matching your criteria"
}
```

### Get Results Response
```typescript
{
  success: true,
  search: {
    _id: "507f1f77bcf86cd799439011",
    keywords: "tech",
    tlds: [".com", ".io"],
    daysBack: 7,
    leads: 100,
    resultsCount: 42,
    status: "completed",
    createdAt: "2024-01-15T10:30:00Z"
  },
  domains: [
    {
      _id: "507f1f77bcf86cd799439012",
      domainName: "techstartup.com",
      registrationDate: "2024-01-14T00:00:00Z",
      tld: ".com",
      registrant: {
        name: "John Doe",
        email: "john@example.com",
        phone: "+1-555-0123",
        organization: "Tech Startup Inc",
        address: "123 Main St",
        city: "San Francisco",
        state: "CA",
        country: "US"
      },
      nameservers: ["ns1.example.com", "ns2.example.com"],
      status: "active"
    }
  ]
}
```

### Get Recent Searches Response
```typescript
{
  success: true,
  searches: [
    {
      _id: "507f1f77bcf86cd799439011",
      keywords: "tech",
      tlds: [".com", ".io"],
      daysBack: 7,
      leads: 100,
      resultsCount: 42,
      status: "completed",
      createdAt: "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

## 7. Environment Variables

Ensure your `.env` file has:

```env
VITE_API_URL=http://localhost:5000/api
```

---

## 8. Required Dependencies

Make sure you have these installed:

```bash
npm install xlsx
```

---

## Summary

**Changes Required:**
1. ✅ Add `newDomainApi` to `api.ts`
2. ✅ Update `NewDomainSearchPage.tsx` with real API integration
3. ✅ Create `NewDomainResultsPage.tsx`
4. ✅ Create `NewDomainHistoryPage.tsx`
5. ✅ Add routes to router configuration
6. ✅ Install `xlsx` dependency

**API Endpoints:**
- `POST /api/new-domain/scan` - Start domain search
- `GET /api/new-domain/searches/recent` - Get search history
- `GET /api/new-domain/searches/:id/results` - Get search results
- `DELETE /api/new-domain/searches/:id` - Delete search

**Features:**
- Multi-TLD support with badge UI
- Real-time search with loading states
- Results page with domain details
- History page with search management
- Excel export functionality
- User-isolated data (JWT auth)
