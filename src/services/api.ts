const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper function for API calls
async function apiCall(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const token = localStorage.getItem('token');
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }
  
  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };
  
  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Settings API
export const settingsApi = {
  getSettings: () => apiCall('/settings'),
  
  updateSettings: (settings: any) => 
    apiCall('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),
  
  updateApiKeys: (apiKeys: { whoisxml?: string; hunter?: string; googlePlaces?: string }) =>
    apiCall('/settings/api-keys', {
      method: 'PUT',
      body: JSON.stringify(apiKeys),
    }),
};

// Searches API
export const searchesApi = {
  getAllSearches: () => apiCall('/searches'),
  
  getRecentSearches: (limit = 10) => apiCall(`/searches/recent?limit=${limit}`),
  
  getSearchById: (id: string) => apiCall(`/searches/${id}`),
  
  createSearch: (searchData: any) =>
    apiCall('/searches', {
      method: 'POST',
      body: JSON.stringify(searchData),
    }),
  
  updateSearchStatus: (id: string, status: string, resultsCount?: number) =>
    apiCall(`/searches/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status, resultsCount }),
    }),
  
  deleteSearch: (id: string) =>
    apiCall(`/searches/${id}`, {
      method: 'DELETE',
    }),
};

// Leads API
export const leadsApi = {
  getAllLeads: (params?: { page?: number; limit?: number; status?: string; source?: string; searchId?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.source) queryParams.append('source', params.source);
    if (params?.searchId) queryParams.append('searchId', params.searchId);
    
    const queryString = queryParams.toString();
    return apiCall(`/leads${queryString ? `?${queryString}` : ''}`);
  },
  
  getLeadById: (id: string) => apiCall(`/leads/${id}`),
  
  getLeadsBySearchId: (searchId: string) => apiCall(`/leads/search/${searchId}`),
  
  createLead: (leadData: any) =>
    apiCall('/leads', {
      method: 'POST',
      body: JSON.stringify(leadData),
    }),
  
  createBulkLeads: (leads: any[], searchId?: string) =>
    apiCall('/leads/bulk', {
      method: 'POST',
      body: JSON.stringify({ leads, searchId }),
    }),
  
  updateLead: (id: string, leadData: any) =>
    apiCall(`/leads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(leadData),
    }),
  
  deleteLead: (id: string) =>
    apiCall(`/leads/${id}`, {
      method: 'DELETE',
    }),
};

// Legacy Website Finder API
export const legacyFinderApi = {
  healthCheck: () => apiCall('/health'),
  
  scan: (params: {
    city: string;
    state?: string;
    country: string;
    radius?: number;
    businessCategory?: string;
    leadCap?: number;
  }) => apiCall('/scan', {
    method: 'POST',
    body: JSON.stringify(params),
  }),
  
  storeSearchResults: (searchId: string, results: any[]) => apiCall('/searches/results', {
    method: 'POST',
    body: JSON.stringify({ searchId, results }),
  }),
  
  getHistory: () => apiCall('/history'),
  
  getDownloadableSearches: () => apiCall('/searches/downloadable'),
  
  getRecentSearches: (limit = 10) => apiCall(`/searches/recent?limit=${limit}`),
  
  getSearchResults: (searchId: string) => apiCall(`/searches/${searchId}/results`),
  
  getSearchResultsJson: (searchId: string) => apiCall(`/searches/${searchId}/results`),
  
  deleteSearch: (searchId: string) => apiCall(`/searches/${searchId}`, {
    method: 'DELETE',
  }),
  
  downloadSearchFromBackend: (searchId: string, searchName: string) => {
    const link = document.createElement('a');
    link.href = `${API_BASE_URL}/searches/${searchId}/download`;
    link.download = `${searchName}-results.xlsx`;
    link.click();
  },
  
  downloadExcel: async () => {
    const url = `${API_BASE_URL}/download`;
    const response = await fetch(url);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Download failed');
    }
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = 'legacy-websites.xlsx';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(downloadUrl);
    document.body.removeChild(a);
  },
  
  downloadSearchExcel: async (searchId: string, businesses: any[]) => {
    const XLSX = await import('xlsx');
    const worksheet = XLSX.utils.json_to_sheet(businesses.map(b => ({
      'Business Name': b.name || b.businessName || 'N/A',
      'Owner Name': b.ownerName || 'N/A',
      'Category': b.category || 'N/A',
      'Website': b.website || 'N/A',
      'Domain Created': b.domainCreationDate ? new Date(b.domainCreationDate).toLocaleDateString() : 'N/A',
      'Phone': b.phone || 'N/A',
      'Email': b.email || (b.emails && b.emails.length > 0 ? b.emails.join(', ') : 'N/A'),
      'Address': b.address || 'N/A',
      'City': b.city || b.location?.city || 'N/A',
      'State': b.state || b.location?.state || 'N/A',
      'Country': b.country || b.location?.country || 'N/A',
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Businesses');
    XLSX.writeFile(workbook, `search-${searchId}.xlsx`);
  },
};

// No Website Outreach API
export const noWebsiteApi = {
  startCampaign: (campaignData: {
    location: string;
    radius?: number;
    niche?: string;
    leadCap?: number;
  }) => apiCall('/outreach/campaign', {
    method: 'POST',
    body: JSON.stringify(campaignData),
  }),
  
  getCampaignStatus: (campaignId: string) => apiCall(`/outreach/campaign/${campaignId}`),
  
  getAllCampaigns: () => apiCall('/outreach/campaigns'),
};

// Auth API
export const authApi = {
  login: (credentials: { email: string; password: string }) =>
    apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  
  register: (userData: { name: string; email: string; password: string }) =>
    apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};

export default {
  auth: authApi,
  settings: settingsApi,
  searches: searchesApi,
  leads: leadsApi,
  legacyFinder: legacyFinderApi,
  noWebsite: noWebsiteApi,
};
