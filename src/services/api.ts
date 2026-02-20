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
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
      }
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

  updateApiKeys: (apiKeys: any) =>
    apiCall('/settings/api-keys', {
      method: 'PUT',
      body: JSON.stringify(apiKeys),
    }),
};

// Searches API
export const searchesApi = {
  getAllSearches: () => apiCall('/searches'),

  getRecentSearches: (limit = 10, page = 1) => apiCall(`/searches/recent?limit=${limit}&page=${page}`),

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

  getRecentSearches: (limit = 10, page = 1) => apiCall(`/searches/recent?limit=${limit}&page=${page}`),

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
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, { headers });
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

  cancelSearch: (searchId: string) => apiCall(`/searches/${searchId}/cancel`, {
    method: 'POST',
  }),
};

// No Website Finder API
export const noWebsiteApi = {
  // Scan for businesses without websites
  scan: (params: {
    city: string;
    state?: string;
    country: string;
    radius?: number;
    niche?: string;
    leads?: number;
  }) => apiCall('/no-website/scan', {
    method: 'POST',
    body: JSON.stringify(params),
  }),

  // Get recent searches
  getRecentSearches: (limit = 20, page = 1) => apiCall(`/no-website/searches/recent?limit=${limit}&page=${page}`),

  // Get results for specific search
  getSearchResults: (searchId: string) => apiCall(`/no-website/searches/${searchId}/results`),

  // Delete search
  deleteSearch: (searchId: string) => apiCall(`/no-website/searches/${searchId}`, {
    method: 'DELETE',
  }),

  // Download search results as Excel
  downloadSearchExcel: async (searchId: string, businesses: any[]) => {
    const XLSX = await import('xlsx');
    const worksheet = XLSX.utils.json_to_sheet(businesses.map(b => ({
      'Owner Name': b.ownerName || 'N/A',
      'Business Name': b.businessName || b.name || 'N/A',
      'Rating': b.rating || 'N/A',
      'Phone': b.phone || 'N/A',
      'Email': b.email || 'N/A',
      'Social Media': b.facebookPage || 'N/A',
      'Address': b.address || 'N/A',
      'City': b.city || 'N/A',
      'State': b.state || 'N/A',
      'Country': b.country || 'N/A',
      'Niche': b.niche || b.category || 'N/A',
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'No Website Businesses');
    XLSX.writeFile(workbook, `no-website-${searchId}.xlsx`);
  },

  cancelSearch: (searchId: string) => apiCall(`/no-website/searches/${searchId}/cancel`, {
    method: 'POST',
  }),
};

// Low Rating Finder API
export const lowRatingApi = {
  scan: (params: {
    city: string;
    state?: string;
    country: string;
    radius?: number;
    niche?: string;
    maxRating?: number;
    leads?: number;
  }) => apiCall('/low-rating/scan', {
    method: 'POST',
    body: JSON.stringify(params),
  }),

  getRecentSearches: (limit = 20, page = 1) => apiCall(`/low-rating/searches/recent?limit=${limit}&page=${page}`),

  getSearchResults: (searchId: string) => apiCall(`/low-rating/searches/${searchId}/results`),

  deleteSearch: (searchId: string) => apiCall(`/low-rating/searches/${searchId}`, {
    method: 'DELETE',
  }),

  downloadSearchExcel: async (searchId: string, businesses: any[]) => {
    const XLSX = await import('xlsx');
    const worksheet = XLSX.utils.json_to_sheet(businesses.map(b => ({
      'Business Name': b.businessName || b.name || 'N/A',
      'Rating': b.rating || 'N/A',
      'Total Reviews': b.totalReviews || 'N/A',
      'Phone': b.phone || 'N/A',
      'Email': b.email || 'N/A',
      'Website': b.website || 'N/A',
      'Address': b.address || 'N/A',
      'City': b.city || 'N/A',
      'State': b.state || 'N/A',
      'Country': b.country || 'N/A',
      'Niche': b.niche || b.category || 'N/A',
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Low Rating Businesses');
    XLSX.writeFile(workbook, `low-rating-${searchId}.xlsx`);
  },

  cancelSearch: (searchId: string) => apiCall(`/low-rating/searches/${searchId}/cancel`, {
    method: 'POST',
  }),
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

// New Domain Tracker API
export const newDomainApi = {
  scan: (params: {
    keywords: string;
    tlds: string[];
    daysBack: number;
    leads: number;
  }) => apiCall('/new-domain/scan', {
    method: 'POST',
    body: JSON.stringify(params),
  }),

  getRecentSearches: (limit = 20, page = 1) => apiCall(`/new-domain/searches/recent?limit=${limit}&page=${page}`),

  getSearchResults: (searchId: string) => apiCall(`/new-domain/searches/${searchId}/results`),

  deleteSearch: (searchId: string) => apiCall(`/new-domain/searches/${searchId}`, {
    method: 'DELETE',
  }),

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

  cancelSearch: (searchId: string) => apiCall(`/new-domain/searches/${searchId}/cancel`, {
    method: 'POST',
  }),
};

// New Business Registration Finder API
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

  getRecentSearches: (limit = 20, page = 1) => apiCall(`/new-business/searches/recent?limit=${limit}&page=${page}`),

  getSearchResults: (searchId: string) => apiCall(`/new-business/searches/${searchId}/results`),

  deleteSearch: (searchId: string) => apiCall(`/new-business/searches/${searchId}`, {
    method: 'DELETE',
  }),

  downloadSearchExcel: async (searchId: string, businesses: any[]) => {
    const XLSX = await import('xlsx');
    const worksheet = XLSX.utils.json_to_sheet(businesses.map(b => ({
      'Owner Name': b.ownerName || 'N/A',
      'Business Name': b.businessName || 'N/A',
      'Phone': b.phone || 'N/A',
      'Email': b.email || 'N/A',
      'Social Media': b.facebookPage || 'N/A',
      'Address': b.address || 'N/A',
      'City': b.city || 'N/A',
      'State': b.state || 'N/A',
      'Country': b.country || 'N/A',
      'Niche': b.niche || 'N/A',
      'Registration Date': b.registrationDate ? new Date(b.registrationDate).toLocaleDateString() : 'N/A',
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'New Businesses');
    XLSX.writeFile(workbook, `new-businesses-${searchId}.xlsx`);
  },

  cancelSearch: (searchId: string) => apiCall(`/new-business/searches/${searchId}/cancel`, {
    method: 'POST',
  }),
};

// Domain Scraper API
export const domainScraperApi = {
  getDashboardStats: () => apiCall('/domain-scraper/stats'),

  getDomainsByDate: (date: string, page = 1, limit = 50) =>
    apiCall(`/domain-scraper/domains?date=${date}&page=${page}&limit=${limit}`),

  getDomains: (page = 1, limit = 50) =>
    apiCall(`/domain-scraper/domains?page=${page}&limit=${limit}`),

  triggerScrape: () => apiCall('/domain-scraper/scrape', {
    method: 'POST',
  }),

  downloadAllDomains: async () => {
    const XLSX = await import('xlsx');
    const response = await apiCall('/domain-scraper/domains');
    const domains = response.domains || [];

    const worksheet = XLSX.utils.json_to_sheet(domains.map(d => ({
      'Domain Name': d.domainName || 'N/A',
      'TLD': d.tld || 'N/A',
      'Registration Date': d.registrationDate ? new Date(d.registrationDate).toLocaleDateString() : 'N/A',
      'Registrant Name': d.registrant?.name || 'N/A',
      'Registrant Email': d.registrant?.email || 'N/A',
      'Registrant Phone': d.registrant?.phone || 'N/A',
      'Organization': d.registrant?.organization || 'N/A',
      'Country': d.registrant?.country || 'N/A',
      'Scraped At': d.scrapedAt ? new Date(d.scrapedAt).toLocaleDateString() : 'N/A',
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Scraped Domains');
    XLSX.writeFile(workbook, `scraped-domains-${new Date().toISOString().split('T')[0]}.xlsx`);
  },
};

// CSV Filter API
export const csvFilterApi = {
  uploadCsv: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    // Direct fetch to handle FormData correctly (browser sets Content-Type)
    const url = `${API_BASE_URL}/csv-filter/upload-csv`;
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Upload failed');
    return data;
  },

  filterCsv: (params: { fileId: string; country: string; page?: number; limit?: number }) =>
    apiCall('/csv-filter/filter-csv', {
      method: 'POST',
      body: JSON.stringify(params)
    }),

  downloadResult: (fileId: string, country: string) => {
    // Direct download link logic
    const token = localStorage.getItem('token');
    // For download, we might need to use fetch/blob if auth is required in headers
    // But usually download links are GET. If token is needed, we might have to pass it as query param or use fetch->blob->a.click
    // The current backend doesn't seem to check auth strictly on that specific endpoint?
    // Wait, app.js doesn't show global auth middleware usage on API routes?
    // "app.use('/api/auth', authRoutes);"
    // Let's check if auth is applied globally.
    // app.js: 
    // app.use('/api/csv-filter', csvFilterRoutes);
    // csvFilterRoutes doesn't import auth middleware.
    // So it's public.

    const link = document.createElement('a');
    link.href = `${API_BASE_URL}/csv-filter/download-result?fileId=${fileId}&country=${encodeURIComponent(country)}`;
    link.click();
  }
};

// Kyptronix Leads API
export const kyptronixApi = {
  getLeads: (source?: string) => {
    const queryParams = new URLSearchParams();
    if (source) queryParams.append('source', source);
    return apiCall(`/kyptronix-leads?${queryParams.toString()}`);
  }
};

export default {
  auth: authApi,
  settings: settingsApi,
  searches: searchesApi,
  leads: leadsApi,
  legacyFinder: legacyFinderApi,
  noWebsiteFinder: noWebsiteApi,
  lowRatingFinder: lowRatingApi,
  newDomainTracker: newDomainApi,
  newBusinessFinder: newBusinessApi,
  domainScraper: domainScraperApi,
  csvFilter: csvFilterApi,
  kyptronixLeads: kyptronixApi,
};
