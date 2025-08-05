# JD Notes Backend API Documentation

Welcome to the comprehensive API documentation for the JD Notes Backend. This documentation covers all available endpoints, authentication, data models, error handling, and complete integration examples to prevent internal server errors.

## 📚 Documentation Overview

This API provides a complete notes management system with user authentication. The system is built with Node.js, Express, and MongoDB, designed for serverless deployment on Vercel.

### 🔗 Quick Links

- **[Authentication API](./AUTH_API.md)** - Complete user authentication system with troubleshooting
- **[Notes API](./NOTES_API.md)** - Full notes CRUD operations with comprehensive error handling

---

## 🚀 Getting Started

### Base URLs

| Environment | URL | Description |
|-------------|-----|-------------|
| **Development** | `http://localhost:5000/api` | Local development server |
| **Production** | `https://your-app.vercel.app/api` | Deployed Vercel app |

### API Structure

```
/api/
├── health         # System health check
├── auth/          # Authentication endpoints (6 endpoints)
│   ├── register   # User registration
│   ├── login      # User login  
│   ├── logout     # User logout
│   ├── me         # Get current user profile
│   ├── refresh    # Refresh access token
│   └── change-password # Change user password
└── notes/         # Notes management endpoints (10 endpoints)
    ├── /          # CRUD operations (GET, POST, PUT, DELETE)
    ├── /:id/archive   # Archive note
    ├── /:id/unarchive # Unarchive note
    ├── stats/overview # Notes statistics
    ├── categories/list # Available categories
    └── tags/list  # Available tags
```

---

## 🔐 Authentication System

The API uses **JWT (JSON Web Tokens)** for stateless authentication with the following features:

- ✅ User registration with comprehensive validation
- ✅ Secure login/logout with rate limiting
- ✅ Account locking after failed attempts
- ✅ Password strength requirements
- ✅ Automatic token refresh
- ✅ Complete error handling and troubleshooting guides
- ✅ Password strength requirements
- ✅ Account security (rate limiting, account locking)
- ✅ Automatic token refresh
- ✅ Complete error handling and troubleshooting guides

### 🛡️ Error Prevention Features

Our documentation includes comprehensive guides to prevent common frontend integration issues:

- **Detailed Validation Rules** - Exact field requirements and constraints
- **Complete Error Response Examples** - All possible error scenarios covered
- **Input Validation Guides** - Prevent 400 validation errors
- **Rate Limiting Documentation** - Handle 429 rate limit responses  
- **Troubleshooting Sections** - Step-by-step problem resolution
- **Testing Checklists** - Verify implementation before deployment

### Authentication Flow

1. **Register/Login** → Receive access & refresh tokens
2. **Store tokens** securely in frontend
3. **Include access token** in Authorization header
4. **Refresh when needed** using refresh token
5. **Logout** → Clear tokens from storage

**📖 [View Complete Authentication Documentation](./AUTH_API.md)**

---

## 📝 Notes Management System

Comprehensive notes management with advanced features designed for spiritual note-taking:

- ✅ Full CRUD operations (Create, Read, Update, Delete)
- ✅ Advanced filtering and search
- ✅ Spiritual categorization (Sermons, Prayer, Bible Study, etc.)
- ✅ Priority levels and archiving
- ✅ Statistics and analytics
- ✅ Pagination and sorting
- ✅ Complete validation and error handling

### Available Categories
- **Sermons**, **Prayer**, **Bible Study**, **General**, **Ministry**, **Personal**

### Note Types  
- **sermon**, **prayer**, **study**, **general**, **ministry**, **personal**

### Priority Levels
- **low**, **medium**, **high**

**📖 [View Complete Notes API Documentation](./NOTES_API.md)**

---

## 🚨 Preventing Internal Server Errors

Our documentation is specifically designed to help frontend developers avoid common issues that cause 500 internal server errors:

### ✅ Input Validation Covered
- All required fields clearly documented
- Exact validation rules and constraints
- Valid values for enums (categories, types, priorities)
- Field length limits and format requirements

### ✅ Error Handling Comprehensive
- Complete error response examples for all endpoints
- HTTP status code meanings and appropriate actions
- Specific error messages and troubleshooting steps
- Network error handling patterns

### ✅ Data Format Specifications
- Exact JSON structure for requests and responses
- Date format requirements (ISO 8601)
- ObjectId format validation
- Query parameter constraints

### ✅ Testing Guidance
- Pre-deployment testing checklists
- Edge case testing scenarios
- Common mistake examples and solutions
- Error reproduction and debugging tips

---

## 🛠️ Quick Integration Examples

### React Authentication Hook

```javascript
import { useAuth } from './contexts/AuthContext';

function MyComponent() {
  const { user, login, logout, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <LoginForm onLogin={login} />;
  }
  
  return (
    <div>
      <h1>Welcome, {user.firstName}!</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Notes Management Hook

```javascript
import { useNotes } from './hooks/useNotes';

function NotesList() {
  const { notes, createNote, updateNote, deleteNote } = useNotes();
  
  return (
    <div>
      {notes.map(note => (
        <NoteCard 
          key={note._id} 
          note={note}
          onUpdate={updateNote}
          onDelete={deleteNote}
        />
      ))}
    </div>
  );
}
```

---

## 🔧 Environment Configuration

### Required Environment Variables

```bash
# Database Connection (Required)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# JWT Authentication (Required)
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# CORS Configuration
FRONTEND_URL=https://your-frontend-domain.com

# Environment
NODE_ENV=production
```

### Development Setup

```bash
# Clone repository
git clone <repository-url>
cd jd-notes-backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your actual values

# Start development server
npm run dev
```

---

## 📊 API Response Format

All API responses follow a consistent format:

### Success Response
```javascript
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { /* Response data */ },
  "timestamp": "2025-07-26T10:30:00.000Z"
}
```

### Error Response
```javascript
{
  "success": false,
  "error": "Error Type",
  "message": "Human readable error message",
  "timestamp": "2025-07-26T10:30:00.000Z"
}
```

---

## 🚨 Error Handling

### HTTP Status Codes

| Code | Status | Description |
|------|--------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Access denied |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists |
| 429 | Too Many Requests | Rate limited |
| 500 | Internal Server Error | Server error |

### Rate Limiting

- **Login attempts**: 5 attempts per 15 minutes per IP
- **Account locking**: After 5 failed attempts (2-hour lockout)
- **General requests**: No current limits (may be added in future)

---

## 🔒 Security Features

### Authentication Security
- Password hashing with bcrypt (cost factor 12)
- JWT tokens with configurable expiration
- Refresh token rotation
- Account locking for failed attempts
- Input sanitization and validation

### Data Security
- MongoDB injection protection
- XSS prevention through input sanitization
- CORS configuration for frontend domains
- Helmet.js security headers
- Request size limits

---

## 🚀 Deployment

### Vercel Deployment

The API is optimized for serverless deployment on Vercel:

1. **Connect repository** to Vercel
2. **Set environment variables** in Vercel dashboard
3. **Deploy automatically** on git push

### Environment Variables in Vercel

Add these in your Vercel project settings:

```bash
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-jwt-secret
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.vercel.app
```

---

## 🤝 Contributing

### Development Workflow

1. Create feature branch from `develop`
2. Implement changes with tests
3. Update documentation
4. Submit pull request

### Code Standards

- Use ES6+ features and async/await
- Follow JSDoc commenting conventions
- Implement comprehensive error handling
- Write descriptive commit messages

---

## 📞 Support

### Documentation

- **[Authentication API](./AUTH_API.md)** - Complete auth system documentation
- **[Notes API](./NOTES_API.md)** - Notes management documentation

### Resources

- [MongoDB Atlas Setup](https://docs.atlas.mongodb.com/)
- [Vercel Deployment Guide](https://vercel.com/docs)
- [JWT Introduction](https://jwt.io/introduction)
- [Express.js Documentation](https://expressjs.com/)

---

## 📅 Version History

| Version | Date | Features |
|---------|------|----------|
| **v1.1.0** | 2025-07-26 | ✅ Complete authentication system with JWT |
| **v1.0.0** | 2025-07-25 | ✅ Initial notes CRUD API with advanced features |

---

**🎉 Ready to build amazing note-taking applications!**

For detailed implementation examples and complete API specifications, visit the individual documentation pages above.
