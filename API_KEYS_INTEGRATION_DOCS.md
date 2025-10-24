# API Keys Integration Documentation

## Overview
This document explains how API keys are passed from the frontend to the backend in the Legacy Website Finder application.

---

## Base URL
```
http://localhost:5000/api
```

---

## API Keys Endpoints

### 1. Get Settings (Including API Keys)

**Endpoint:** `GET /api/settings`

**Purpose:** Retrieve all settings including API keys

**Request:** None

**Response:**
```json
{
  "success": true,
  "data": {
    "apiKeys": {
      "whoisxml": "your_whoisxml_api_key",
      "hunter": "your_hunter_api_key",
      "googlePlaces": "your_google_places_api_key"
    },
    "notifications": {
      "email": false,
      "slack": false
    },
    "exportSettings": {
      "autoExport": false,
      "emailRecipients": ""
    }
  }
}
```

**Frontend Code:**
```javascript
const response = await fetch('http://localhost:5000/api/settings');
const data = await response.json();
// data.data.apiKeys contains the API keys
```

---

### 2. Update API Keys Only

**Endpoint:** `PUT /api/settings/api-keys`

**Purpose:** Update only the API keys without affecting other settings

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "whoisxml": "new_whoisxml_api_key",
  "hunter": "new_hunter_api_key",
  "googlePlaces": "new_google_places_api_key"
}
```

**Response:**
```json
{
  "success": true,
  "message": "API keys updated successfully"
}
```

**Frontend Code:**
```javascript
const response = await fetch('http://localhost:5000/api/settings/api-keys', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    whoisxml: "your_key_here",
    hunter: "your_key_here",
    googlePlaces: "your_key_here"
  })
});
```

---

### 3. Update All Settings

**Endpoint:** `PUT /api/settings`

**Purpose:** Update all settings including API keys, notifications, and export settings

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "apiKeys": {
    "whoisxml": "your_whoisxml_api_key",
    "hunter": "your_hunter_api_key",
    "googlePlaces": "your_google_places_api_key"
  },
  "notifications": {
    "email": true,
    "slack": false
  },
  "exportSettings": {
    "autoExport": true,
    "emailRecipients": "admin@company.com"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Settings updated successfully"
}
```

---

## Frontend Implementation Details

### Settings Page Component
Location: `src/pages/SettingsPage.tsx`

**State Management:**
```javascript
const [apiKeys, setApiKeys] = useState({
  whoisxml: "",
  hunter: "",
  googlePlaces: ""
});
```

**Fetch Settings on Load:**
```javascript
useEffect(() => {
  fetchSettings();
}, []);

const fetchSettings = async () => {
  const response = await settingsApi.getSettings();
  if (response.success && response.data) {
    setApiKeys(response.data.apiKeys || {});
  }
};
```

**Save API Keys:**
```javascript
const saveApiKeys = async () => {
  const response = await settingsApi.updateApiKeys(apiKeys);
  if (response.success) {
    // Show success toast
  }
};
```

---

## API Service Layer

Location: `src/services/api.ts`

```javascript
export const settingsApi = {
  // Get all settings
  getSettings: () => apiCall('/settings'),
  
  // Update all settings
  updateSettings: (settings) => 
    apiCall('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),
  
  // Update only API keys
  updateApiKeys: (apiKeys) =>
    apiCall('/settings/api-keys', {
      method: 'PUT',
      body: JSON.stringify(apiKeys),
    }),
};
```

---

## Backend Requirements

### Database Schema

**Settings Collection/Table:**
```javascript
{
  _id: ObjectId,
  apiKeys: {
    whoisxml: String,
    hunter: String,
    googlePlaces: String
  },
  notifications: {
    email: Boolean,
    slack: Boolean
  },
  exportSettings: {
    autoExport: Boolean,
    emailRecipients: String
  },
  updatedAt: Date,
  createdAt: Date
}
```

### Backend Routes

**1. GET /api/settings**
```javascript
router.get('/settings', async (req, res) => {
  try {
    const settings = await Settings.findOne();
    res.json({
      success: true,
      data: settings || {
        apiKeys: {},
        notifications: {},
        exportSettings: {}
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch settings'
    });
  }
});
```

**2. PUT /api/settings/api-keys**
```javascript
router.put('/settings/api-keys', async (req, res) => {
  try {
    const { whoisxml, hunter, googlePlaces } = req.body;
    
    const settings = await Settings.findOneAndUpdate(
      {},
      {
        $set: {
          'apiKeys.whoisxml': whoisxml,
          'apiKeys.hunter': hunter,
          'apiKeys.googlePlaces': googlePlaces,
          updatedAt: new Date()
        }
      },
      { upsert: true, new: true }
    );
    
    res.json({
      success: true,
      message: 'API keys updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update API keys'
    });
  }
});
```

**3. PUT /api/settings**
```javascript
router.put('/settings', async (req, res) => {
  try {
    const { apiKeys, notifications, exportSettings } = req.body;
    
    const settings = await Settings.findOneAndUpdate(
      {},
      {
        $set: {
          apiKeys,
          notifications,
          exportSettings,
          updatedAt: new Date()
        }
      },
      { upsert: true, new: true }
    );
    
    res.json({
      success: true,
      message: 'Settings updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update settings'
    });
  }
});
```

---

## Security Considerations

### 1. API Key Storage
- Store API keys encrypted in the database
- Use environment variables for sensitive keys
- Never expose API keys in frontend code

### 2. Backend Implementation
```javascript
// Encrypt before saving
const encryptApiKey = (key) => {
  // Use crypto library to encrypt
  return encrypted;
};

// Decrypt when retrieving
const decryptApiKey = (encrypted) => {
  // Use crypto library to decrypt
  return decrypted;
};
```

### 3. Input Validation
```javascript
router.put('/settings/api-keys', async (req, res) => {
  const { whoisxml, hunter, googlePlaces } = req.body;
  
  // Validate input
  if (!whoisxml || !hunter || !googlePlaces) {
    return res.status(400).json({
      success: false,
      error: 'All API keys are required'
    });
  }
  
  // Validate key format
  if (whoisxml.length < 10 || hunter.length < 10) {
    return res.status(400).json({
      success: false,
      error: 'Invalid API key format'
    });
  }
  
  // Continue with update...
});
```

---

## Usage Flow

1. **User opens Settings page**
   - Frontend calls `GET /api/settings`
   - Backend returns existing API keys (if any)
   - Frontend populates form fields

2. **User enters API keys**
   - User types keys into password input fields
   - Keys are stored in component state

3. **User clicks "Save API Keys"**
   - Frontend calls `PUT /api/settings/api-keys`
   - Backend validates and saves keys
   - Backend returns success response
   - Frontend shows success toast

4. **API keys are used in scans**
   - When user starts a scan, backend retrieves API keys from database
   - Backend uses keys to call external APIs (Google Places, WhoisXML, Hunter)

---

## Error Handling

### Frontend
```javascript
try {
  await settingsApi.updateApiKeys(apiKeys);
  toast({
    title: "Success",
    description: "API keys saved successfully"
  });
} catch (error) {
  toast({
    title: "Error",
    description: error.message || "Failed to save API keys",
    variant: "destructive"
  });
}
```

### Backend
```javascript
try {
  // Update logic
} catch (error) {
  console.error('Error updating API keys:', error);
  res.status(500).json({
    success: false,
    error: 'Failed to update API keys',
    details: error.message
  });
}
```

---

## Testing

### Test API Keys Endpoint
```bash
# Get settings
curl http://localhost:5000/api/settings

# Update API keys
curl -X PUT http://localhost:5000/api/settings/api-keys \
  -H "Content-Type: application/json" \
  -d '{
    "whoisxml": "test_key_123",
    "hunter": "test_key_456",
    "googlePlaces": "test_key_789"
  }'
```

---

## Summary

**Frontend sends API keys to backend via:**
- `PUT /api/settings/api-keys` - Update only API keys
- `PUT /api/settings` - Update all settings including API keys

**Request format:**
```json
{
  "whoisxml": "string",
  "hunter": "string",
  "googlePlaces": "string"
}
```

**Response format:**
```json
{
  "success": boolean,
  "message": "string"
}
```

**Backend must:**
1. Accept PUT requests to `/api/settings/api-keys`
2. Validate API key inputs
3. Store keys securely (encrypted)
4. Return success/error response
5. Use stored keys when performing scans
