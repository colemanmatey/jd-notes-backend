# Authentication API Documentation

This document provides comprehensive information about the authentication endpoints for the JD Notes Backend API.

## Table of Contents

1. [Overview](#overview)
2. [Authentication Flow](#authentication-flow)
3. [Error Handling](#error-handling)
4. [Endpoints](#endpoints)
5. [Request/Response Examples](#requestresponse-examples)
6. [Frontend Integration Guide](#frontend-integration-guide)
7. [Security Considerations](#security-considerations)

## Overview

The authentication system uses JWT (JSON Web Tokens) for stateless authentication. The system provides:

- User registration
- User login/logout
- Token refresh
- Password management
- Profile management
- Account security features (rate limiting, account locking)

### Base URL
- **Development**: `http://localhost:5000/api/auth`
- **Production**: `https://your-app.vercel.app/api/auth`

### Authentication Method
Bearer Token authentication using JWT tokens in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Authentication Flow

1. **Register/Login** → Receive access token and refresh token
2. **Store tokens** securely in frontend (localStorage/sessionStorage/httpOnly cookies)
3. **Include access token** in Authorization header for protected requests
4. **Refresh token** when access token expires
5. **Logout** → Remove tokens from storage

## Error Handling

All endpoints return consistent error responses:

```javascript
{
  "error": "Error Type",
  "message": "Human readable error message",
  "timestamp": "2025-07-26T10:30:00.000Z",
  // Additional error-specific fields
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created (registration)
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid credentials/token)
- `403` - Forbidden (account locked/inactive)
- `404` - Not Found
- `409` - Conflict (email/username already exists)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

## Endpoints

### 1. Register New User

**Endpoint**: `POST /register`  
**Access**: Public

Register a new user account.

#### Request Body
```javascript
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

#### Validation Rules
- **username**: 3-30 characters, alphanumeric + underscore only
- **email**: Valid email format
- **password**: Minimum 8 characters with uppercase, lowercase, number, and special character
- **firstName/lastName**: Required, max 50 characters

#### Success Response (201)
```javascript
{
  "success": true,
  "message": "Account created successfully",
  "user": {
    "id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "username": "johndoe",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "createdAt": "2025-07-26T10:30:00.000Z",
    "lastLogin": "2025-07-26T10:30:00.000Z"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": "7d"
  },
  "timestamp": "2025-07-26T10:30:00.000Z"
}
```

#### Error Responses
```javascript
// Validation Error (400)
{
  "error": "Validation Error",
  "message": "Password does not meet requirements",
  "requirements": [
    "Password must contain at least one uppercase letter",
    "Password must contain at least one special character"
  ],
  "passwordStrength": "weak"
}

// User Already Exists (409)
{
  "error": "User Already Exists",
  "message": "An account with this email already exists"
}
```

### 2. Login User

**Endpoint**: `POST /login`  
**Access**: Public

Authenticate user with email/username and password.

#### Request Body
```javascript
{
  "identifier": "john@example.com", // or "johndoe"
  "password": "SecurePass123!"
}
```

#### Success Response (200)
```javascript
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "username": "johndoe",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "lastLogin": "2025-07-26T10:30:00.000Z"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": "7d"
  },
  "timestamp": "2025-07-26T10:30:00.000Z"
}
```

#### Error Responses
```javascript
// Invalid Credentials (401)
{
  "error": "Authentication Failed",
  "message": "Invalid credentials"
}

// Account Locked (401)
{
  "error": "Account Locked",
  "message": "Account is temporarily locked due to too many failed login attempts"
}

// Rate Limited (429)
{
  "error": "Too Many Attempts",
  "message": "Too many login attempts. Please try again later.",
  "retryAfter": "15 minutes"
}
```

### 3. Logout User

**Endpoint**: `POST /logout`  
**Access**: Private (requires token)

Logout user (client-side token removal).

#### Headers
```
Authorization: Bearer <access-token>
```

#### Success Response (200)
```javascript
{
  "success": true,
  "message": "Logged out successfully",
  "timestamp": "2025-07-26T10:30:00.000Z"
}
```

### 4. Get Current User Profile

**Endpoint**: `GET /me`  
**Access**: Private (requires token)

Get current authenticated user's profile information.

#### Headers
```
Authorization: Bearer <access-token>
```

#### Success Response (200)
```javascript
{
  "success": true,
  "user": {
    "id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "username": "johndoe",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "isActive": true,
    "lastLogin": "2025-07-26T10:30:00.000Z",
    "createdAt": "2025-07-25T08:15:00.000Z",
    "updatedAt": "2025-07-26T10:30:00.000Z"
  },
  "timestamp": "2025-07-26T10:30:00.000Z"
}
```

### 5. Refresh Access Token

**Endpoint**: `POST /refresh`  
**Access**: Public

Refresh an expired access token using refresh token.

#### Request Body
```javascript
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### Success Response (200)
```javascript
{
  "success": true,
  "message": "Token refreshed successfully",
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": "7d"
  },
  "timestamp": "2025-07-26T10:30:00.000Z"
}
```

#### Error Response (401)
```javascript
{
  "error": "Invalid Token",
  "message": "Invalid or expired refresh token"
}
```

### 6. Change Password

**Endpoint**: `POST /change-password`  
**Access**: Private (requires token)

Change user's password.

#### Headers
```
Authorization: Bearer <access-token>
```

#### Request Body
```javascript
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewSecurePass456!"
}
```

#### Success Response (200)
```javascript
{
  "success": true,
  "message": "Password changed successfully",
  "timestamp": "2025-07-26T10:30:00.000Z"
}
```

#### Error Responses
```javascript
// Current Password Incorrect (401)
{
  "error": "Authentication Failed",
  "message": "Current password is incorrect"
}

// New Password Validation Error (400)
{
  "error": "Validation Error",
  "message": "New password does not meet requirements",
  "requirements": [
    "Password must contain at least one uppercase letter"
  ]
}
```

## Frontend Integration Guide

### 1. Set up API Client

```javascript
// api/auth.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class AuthAPI {
  constructor() {
    this.baseURL = `${API_BASE_URL}/auth`;
  }

  async register(userData) {
    const response = await fetch(`${this.baseURL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }
    
    return data;
  }

  async login(credentials) {
    const response = await fetch(`${this.baseURL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }
    
    return data;
  }

  async logout() {
    const token = localStorage.getItem('accessToken');
    
    const response = await fetch(`${this.baseURL}/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    return response.json();
  }

  async getCurrentUser() {
    const token = localStorage.getItem('accessToken');
    
    const response = await fetch(`${this.baseURL}/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to get user');
    }
    
    return data;
  }

  async refreshToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    
    const response = await fetch(`${this.baseURL}/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Token refresh failed');
    }
    
    return data;
  }
}

export const authAPI = new AuthAPI();
```

### 2. Token Management

```javascript
// utils/tokenManager.js
export const TokenManager = {
  setTokens(accessToken, refreshToken) {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  },

  getAccessToken() {
    return localStorage.getItem('accessToken');
  },

  getRefreshToken() {
    return localStorage.getItem('refreshToken');
  },

  clearTokens() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },

  isTokenExpired(token) {
    if (!token) return true;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return Date.now() >= payload.exp * 1000;
    } catch {
      return true;
    }
  }
};
```

### 3. HTTP Interceptor for Automatic Token Refresh

```javascript
// utils/httpInterceptor.js
import { authAPI } from '../api/auth';
import { TokenManager } from './tokenManager';

export const createAuthenticatedFetch = () => {
  return async (url, options = {}) => {
    let accessToken = TokenManager.getAccessToken();
    
    // Check if token is expired
    if (TokenManager.isTokenExpired(accessToken)) {
      try {
        const refreshResponse = await authAPI.refreshToken();
        TokenManager.setTokens(
          refreshResponse.tokens.accessToken,
          refreshResponse.tokens.refreshToken
        );
        accessToken = refreshResponse.tokens.accessToken;
      } catch (error) {
        // Refresh failed, redirect to login
        TokenManager.clearTokens();
        window.location.href = '/login';
        throw error;
      }
    }
    
    // Add authorization header
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${accessToken}`,
    };
    
    return fetch(url, { ...options, headers });
  };
};

export const authenticatedFetch = createAuthenticatedFetch();
```

### 4. React Context for Authentication

```javascript
// contexts/AuthContext.js
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authAPI } from '../api/auth';
import { TokenManager } from '../utils/tokenManager';

const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        loading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        loading: false,
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    isAuthenticated: false,
    loading: true,
  });

  useEffect(() => {
    // Check for existing token on app load
    const checkAuth = async () => {
      const token = TokenManager.getAccessToken();
      
      if (token && !TokenManager.isTokenExpired(token)) {
        try {
          const userData = await authAPI.getCurrentUser();
          dispatch({ type: 'LOGIN_SUCCESS', payload: userData });
        } catch (error) {
          TokenManager.clearTokens();
        }
      }
      
      dispatch({ type: 'SET_LOADING', payload: false });
    };

    checkAuth();
  }, []);

  const login = async (credentials) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await authAPI.login(credentials);
      
      TokenManager.setTokens(
        response.tokens.accessToken,
        response.tokens.refreshToken
      );
      
      dispatch({ type: 'LOGIN_SUCCESS', payload: response });
      return response;
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await authAPI.register(userData);
      
      TokenManager.setTokens(
        response.tokens.accessToken,
        response.tokens.refreshToken
      );
      
      dispatch({ type: 'LOGIN_SUCCESS', payload: response });
      return response;
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      // Continue with logout even if API call fails
    } finally {
      TokenManager.clearTokens();
      dispatch({ type: 'LOGOUT' });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

### 5. Protected Route Component

```javascript
// components/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>; // Or your loading component
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
```

### 6. Example Login Component

```javascript
// components/LoginForm.js
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const LoginForm = () => {
  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(formData);
      navigate('/dashboard');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="identifier">Email or Username:</label>
        <input
          type="text"
          id="identifier"
          value={formData.identifier}
          onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
          required
        />
      </div>
      
      <div>
        <label htmlFor="password">Password:</label>
        <input
          type="password"
          id="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
        />
      </div>
      
      {error && <div className="error">{error}</div>}
      
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
};

export default LoginForm;
```

## Security Considerations

### 1. Token Storage
- **Recommended**: Store tokens in httpOnly cookies for maximum security
- **Alternative**: Use localStorage/sessionStorage with XSS protection
- **Never**: Store tokens in regular cookies accessible by JavaScript

### 2. Token Expiration
- Access tokens expire in 7 days (configurable)
- Refresh tokens expire in 30 days (configurable)
- Implement automatic token refresh

### 3. HTTPS
- Always use HTTPS in production
- Tokens are sensitive and must be transmitted securely

### 4. Environment Variables
Required environment variables for production:

```bash
# Strong JWT secret (at least 32 characters)
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Token expiration times
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# CORS configuration
FRONTEND_URL=https://your-frontend-domain.com
```

### 5. Rate Limiting
- Login attempts are rate limited (5 attempts per 15 minutes per IP)
- Account locking after 5 failed attempts (2 hours lockout)

### 6. Password Security
- Minimum 8 characters
- Must contain uppercase, lowercase, number, and special character
- Passwords are hashed with bcrypt (cost factor 12)

### 7. Input Validation
- All inputs are sanitized to prevent XSS
- Email validation on both client and server
- Username format validation (alphanumeric + underscore only)

This documentation should provide your frontend team with everything they need to implement authentication in your React application!
