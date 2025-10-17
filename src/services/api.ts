const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper function for API calls
async function apiCall(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };
  
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

export default {
  settings: settingsApi,
  searches: searchesApi,
  leads: leadsApi,
};
