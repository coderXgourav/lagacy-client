# Backend Setup Instructions

## Error: ERR_CONNECTION_REFUSED

The frontend is trying to connect to `http://localhost:5000` but the backend server is not running.

## Steps to Start Backend Server

### 1. Navigate to Backend Directory
```bash
cd path/to/legacy-backend-folder
```

### 2. Install Dependencies (if not done)
```bash
npm install
```

### 3. Create .env File
Create a `.env` file in the backend root with:
```
PORT=5000
MONGODB_URI=your_mongodb_connection_string
GOOGLE_PLACES_API_KEY=your_google_api_key
WHOISXML_API_KEY=your_whoisxml_api_key
HUNTER_API_KEY=your_hunter_api_key
```

### 4. Start the Server
```bash
npm start
# or
node server.js
# or
node index.js
```

### 5. Verify Server is Running
Open browser and go to: `http://localhost:5000/api/health`

You should see:
```json
{
  "status": "OK",
  "message": "Server is running"
}
```

## If Backend Doesn't Exist

If you don't have the backend code, you need to:

1. Create a Node.js/Express backend with the following endpoints:
   - `GET /api/health`
   - `POST /api/scan`
   - `GET /api/history`
   - `GET /api/history/:searchId/businesses`
   - `DELETE /api/history/:searchId`
   - `GET /api/download`

2. Or use the backend code from the Legacy Website Finder project

## Alternative: Change Frontend API URL

If your backend runs on a different port, update the API URL in:

**File:** `src/services/api.ts`

Change:
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
```

To your backend URL:
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:YOUR_PORT/api';
```

## Current Status

❌ Backend server is NOT running
✅ Frontend is running on port 5173 (Vite default)

**Action Required:** Start the backend server on port 5000
