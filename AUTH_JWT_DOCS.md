# JWT Authentication - Backend Implementation

## Overview
Frontend uses JWT (JSON Web Token) authentication for user login and signup.

---

## API Endpoints

### 1. User Signup

**POST /api/auth/signup**

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_id_here",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

**Error Response (400/409):**
```json
{
  "success": false,
  "message": "User already exists"
}
```

---

### 2. User Login

**POST /api/auth/login**

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_id_here",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

---

## Backend Implementation

### 1. Install Dependencies

```bash
npm install jsonwebtoken bcryptjs
npm install --save-dev @types/jsonwebtoken @types/bcryptjs
```

### 2. Environment Variables

Add to `.env`:
```
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
JWT_EXPIRES_IN=7d
```

### 3. User Model

```javascript
// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
```

### 4. Auth Routes

```javascript
// routes/auth.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Create user
    const user = await User.create({ name, email, password });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;
```

### 5. Auth Middleware

```javascript
// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token, authorization denied'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from token
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token is not valid'
      });
    }

    // Add user to request
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Token is not valid'
    });
  }
};

module.exports = authMiddleware;
```

### 6. Protect Routes

```javascript
// server.js or app.js
const authRoutes = require('./routes/auth');
const authMiddleware = require('./middleware/auth');

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/scan', authMiddleware, scanRoutes);
app.use('/api/searches', authMiddleware, searchesRoutes);
app.use('/api/settings', authMiddleware, settingsRoutes);
```

---

## Frontend Integration

### Token Storage
- Token stored in `localStorage` as `token`
- User info stored in `localStorage` as `user`

### API Requests
All API requests automatically include JWT token in header:
```
Authorization: Bearer <token>
```

### Protected Routes
Frontend checks for token presence before rendering protected pages.

---

## Security Best Practices

1. **JWT Secret**: Use strong, random secret key (min 32 characters)
2. **HTTPS**: Always use HTTPS in production
3. **Token Expiry**: Set reasonable expiration (7 days default)
4. **Password**: Hash with bcrypt (10 rounds minimum)
5. **Validation**: Validate all inputs on backend
6. **Error Messages**: Don't reveal if email exists during login

---

## Testing

### Signup Test
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Login Test
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Protected Route Test
```bash
curl -X POST http://localhost:5000/api/scan \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_token_here>" \
  -d '{
    "city": "Mumbai",
    "country": "India"
  }'
```

---

## Summary

**Frontend Changes:**
- Login/Signup sends credentials to `/api/auth/login` or `/api/auth/signup`
- Stores JWT token in localStorage
- Includes token in all API requests via Authorization header
- Checks token presence for route protection

**Backend Must Implement:**
1. User model with password hashing
2. POST `/api/auth/signup` endpoint
3. POST `/api/auth/login` endpoint
4. JWT token generation
5. Auth middleware to verify tokens
6. Protect all routes except auth routes
