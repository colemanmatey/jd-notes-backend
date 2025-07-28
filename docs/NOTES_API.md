# Notes API Documentation

This document provides comprehensive information about the notes management endpoints for the JD Notes Backend API.

## Table of Contents

1. [Overview](#overview)
2. [Data Model](#data-model)
3. [Authentication](#authentication)
4. [Endpoints](#endpoints)
5. [Query Parameters](#query-parameters)
6. [Error Handling](#error-handling)
7. [Frontend Integration Examples](#frontend-integration-examples)

## Overview

The Notes API provides full CRUD (Create, Read, Update, Delete) operations for managing notes, along with advanced features like filtering, searching, pagination, categorization, and statistics.

### Base URL
- **Development**: `http://localhost:5000/api/notes`
- **Production**: `https://your-app.vercel.app/api/notes`

### Content Type
All requests and responses use JSON format:
```
Content-Type: application/json
```

## Data Model

### Note Object Structure

```javascript
{
  "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
  "title": "Sunday Morning Sermon Notes",
  "content": "Today's sermon focused on the parable of the Good Samaritan...",
  "category": "Sermons",
  "type": "sermon",
  "tags": ["compassion", "neighborly love", "parable"],
  "priority": "medium",
  "isArchived": false,
  "isFavorite": true,
  "reminderDate": "2025-07-30T10:00:00.000Z",
  "expiryDate": null,
  "metadata": {
    "wordCount": 157,
    "readTime": "1 min",
    "lastViewed": "2025-07-26T10:30:00.000Z"
  },
  "createdAt": "2025-07-25T08:15:00.000Z",
  "updatedAt": "2025-07-26T10:30:00.000Z"
}
```

### Field Descriptions

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| `title` | String | Yes | Note title | 1-200 characters |
| `content` | String | Yes | Note content | Minimum 1 character |
| `category` | String | Yes | Note category | One of: Sermons, Prayer, Bible Study, General, Ministry, Personal |
| `type` | String | Yes | Note type | One of: sermon, prayer, study, general, ministry, personal |
| `tags` | Array | No | Associated tags | Array of strings, max 10 tags, each tag max 50 characters |
| `priority` | String | No | Priority level | One of: low, medium, high |
| `isArchived` | Boolean | No | Archive status | Default: false |
| `isFavorite` | Boolean | No | Favorite status | Default: false |
| `reminderDate` | Date | No | Reminder timestamp | ISO 8601 date string |
| `expiryDate` | Date | No | Expiration date | ISO 8601 date string |

## Authentication

**Current Status**: All endpoints are currently **public** (no authentication required).  
**Future**: Will require JWT authentication when user system is integrated.

When authentication is implemented, include the JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Input Validation & Error Handling

### Validation Rules
The API enforces strict validation to prevent errors:

#### Note Creation/Update Validation
- **title**: Required, 1-200 characters
- **content**: Required, minimum 1 character  
- **category**: Required, must be one of: `Sermons`, `Prayer`, `Bible Study`, `General`, `Ministry`, `Personal`
- **type**: Required, must be one of: `sermon`, `prayer`, `study`, `general`, `ministry`, `personal`
- **tags**: Optional array, maximum 10 tags, each tag maximum 50 characters
- **priority**: Optional, must be one of: `low`, `medium`, `high`
- **reminderDate**: Optional, must be valid ISO 8601 date string
- **expiryDate**: Optional, must be valid ISO 8601 date string

#### Query Parameter Validation
- **page**: Positive integer, default 1
- **limit**: Positive integer, maximum 100, default 10
- **sortBy**: Must be valid field name (title, createdAt, updatedAt, priority)
- **sortOrder**: Must be 'asc' or 'desc', default 'desc'
- **ObjectId**: All ID parameters must be valid MongoDB ObjectIds

### Common Error Responses

#### Validation Errors (400)
```javascript
// Missing required fields
{
  "success": false,
  "error": "Validation error",
  "message": "Title and content are required",
  "timestamp": "2025-07-26T10:30:00.000Z"
}

// Invalid category
{
  "success": false,
  "error": "Validation error", 
  "message": "Invalid category. Must be one of: Sermons, Prayer, Bible Study, General, Ministry, Personal",
  "timestamp": "2025-07-26T10:30:00.000Z"
}

// Title too long
{
  "success": false,
  "error": "Validation error",
  "message": "Title must be 200 characters or less",
  "timestamp": "2025-07-26T10:30:00.000Z"
}

// Too many tags
{
  "success": false,
  "error": "Validation error",
  "message": "Maximum 10 tags allowed",
  "timestamp": "2025-07-26T10:30:00.000Z"
}
```

#### Invalid ID Errors (400)
```javascript
{
  "success": false,
  "error": "Invalid ID format",
  "message": "Invalid note ID format",
  "timestamp": "2025-07-26T10:30:00.000Z"
}
```

#### Not Found Errors (404)
```javascript
{
  "success": false,
  "error": "Note not found",
  "message": "No note found with this ID",
  "timestamp": "2025-07-26T10:30:00.000Z"
}
```

#### Server Errors (500)
```javascript
{
  "success": false,
  "error": "Internal server error",
  "message": "Failed to process request",
  "timestamp": "2025-07-26T10:30:00.000Z"
}
```

## Endpoints

### 1. Get All Notes

**Endpoint**: `GET /`  
**Access**: Public

Retrieve all notes with optional filtering, sorting, and pagination.

#### Query Parameters

| Parameter | Type | Description | Default | Valid Values |
|-----------|------|-------------|---------|--------------|
| `page` | Number | Page number for pagination | 1 | Positive integers |
| `limit` | Number | Number of notes per page | 10 | 1-100 |
| `sortBy` | String | Field to sort by | createdAt | title, createdAt, updatedAt, priority |
| `sortOrder` | String | Sort direction | desc | asc, desc |
| `category` | String | Filter by category | - | Sermons, Prayer, Bible Study, General, Ministry, Personal |
| `type` | String | Filter by type | - | sermon, prayer, study, general, ministry, personal |
| `priority` | String | Filter by priority | - | low, medium, high |
| `archived` | Boolean | Show archived notes | false | true, false |
| `search` | String | Search in title and content | - | Any string |
| `tags` | String | Filter by tags (comma-separated) | - | tag1,tag2,tag3 |

#### Example Requests
```bash
# Get all notes with default pagination
GET /api/notes

# Get notes with filtering and sorting  
GET /api/notes?category=Sermons&sortBy=priority&sortOrder=desc

# Search and paginate
GET /api/notes?search=prayer&page=2&limit=20

# Filter by multiple criteria
GET /api/notes?type=sermon&priority=high&archived=false&tags=sunday,worship
```

#### Success Response (200)
```javascript
{
  "success": true,
  "message": "Notes retrieved successfully",
  "data": {
    "notes": [
      {
        "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
        "title": "Sunday Morning Sermon",
        "content": "Today's message focused on faith and perseverance...",
        "category": "Sermons",
        "type": "sermon",
        "tags": ["faith", "perseverance", "sunday"],
        "priority": "high",
        "isArchived": false,
        "isFavorite": true,
        "createdAt": "2025-07-25T08:15:00.000Z",
        "updatedAt": "2025-07-26T10:30:00.000Z"
      },
      {
        "_id": "60f7b3b3b3b3b3b3b3b3b3b4",
        "title": "Morning Prayer Requests",
        "content": "Pray for the Johnson family during their difficult time...",
        "category": "Prayer",
        "type": "prayer",
        "tags": ["family", "healing", "support"],
        "priority": "medium",
        "isArchived": false,
        "isFavorite": false,
        "createdAt": "2025-07-25T09:30:00.000Z",
        "updatedAt": "2025-07-25T09:30:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalNotes": 47,
      "notesPerPage": 10,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  },
  "timestamp": "2025-07-26T10:30:00.000Z"
}
```

### 2. Get Single Note

**Endpoint**: `GET /:id`  
**Access**: Public

Retrieve a specific note by its ID.

#### Path Parameters
- `id` (String, required): MongoDB ObjectId of the note

#### Example Request
```bash
GET /api/notes/60f7b3b3b3b3b3b3b3b3b3b3
```

#### Success Response (200)
```javascript
{
  "success": true,
  "message": "Note retrieved successfully",
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "title": "Wednesday Bible Study Notes",
    "content": "Today we studied Romans chapter 8, focusing on the concept of living by the Spirit...",
    "category": "Bible Study",
    "type": "study",
    "tags": ["romans", "spirit", "wednesday"],
    "priority": "medium",
    "isArchived": false,
    "isFavorite": true,
    "reminderDate": "2025-07-30T19:00:00.000Z",
    "metadata": {
      "wordCount": 245,
      "readTime": "2 min",
      "lastViewed": "2025-07-26T10:30:00.000Z"
    },
    "createdAt": "2025-07-25T08:15:00.000Z",
    "updatedAt": "2025-07-26T10:30:00.000Z"
  },
  "timestamp": "2025-07-26T10:30:00.000Z"
}
```

#### Error Response (404)
```javascript
{
  "success": false,
  "error": "Note not found",
  "message": "No note found with this ID",
  "timestamp": "2025-07-26T10:30:00.000Z"
}
```

### 3. Create New Note

**Endpoint**: `POST /`  
**Access**: Public

Create a new note.

#### Request Body
```javascript
{
  "title": "Sunday Evening Prayer",
  "content": "Tonight's prayer focused on healing for our community members and guidance for upcoming ministry decisions.",
  "category": "Prayer",
  "type": "prayer",
  "tags": ["healing", "guidance", "community"],
  "priority": "high",
  "reminderDate": "2025-07-28T19:00:00.000Z"
}
```

#### Required Fields
- `title` (String): Note title (1-200 characters)
- `content` (String): Note content (minimum 1 character)
- `category` (String): Must be one of: `Sermons`, `Prayer`, `Bible Study`, `General`, `Ministry`, `Personal`
- `type` (String): Must be one of: `sermon`, `prayer`, `study`, `general`, `ministry`, `personal`

#### Optional Fields
- `tags` (Array): Maximum 10 tags, each tag maximum 50 characters
- `priority` (String): Must be one of: `low`, `medium`, `high`
- `reminderDate` (String): ISO 8601 date string
- `expiryDate` (String): ISO 8601 date string
- `isFavorite` (Boolean): Default false
- `isArchived` (Boolean): Default false

#### Success Response (201)
```javascript
{
  "success": true,
  "message": "Note created successfully",
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "title": "Sunday Evening Prayer",
    "content": "Tonight's prayer focused on healing for our community members...",
    "category": "Prayer",
    "type": "prayer",
    "tags": ["healing", "guidance", "community"],
    "priority": "high",
    "isArchived": false,
    "isFavorite": false,
    "reminderDate": "2025-07-28T19:00:00.000Z",
    "metadata": {
      "wordCount": 157,
      "readTime": "1 min"
    },
    "createdAt": "2025-07-26T10:30:00.000Z",
    "updatedAt": "2025-07-26T10:30:00.000Z"
  },
  "timestamp": "2025-07-26T10:30:00.000Z"
}
```

#### Error Responses

##### Missing Required Fields (400)
```javascript
{
  "success": false,
  "error": "Validation error",
  "message": "Title and content are required",
  "timestamp": "2025-07-26T10:30:00.000Z"
}
```

##### Invalid Category (400)
```javascript
{
  "success": false,
  "error": "Validation error",
  "message": "Invalid category. Must be one of: Sermons, Prayer, Bible Study, General, Ministry, Personal",
  "timestamp": "2025-07-26T10:30:00.000Z"
}
```

##### Invalid Type (400)
```javascript
{
  "success": false,
  "error": "Validation error",
  "message": "Invalid type. Must be one of: sermon, prayer, study, general, ministry, personal",
  "timestamp": "2025-07-26T10:30:00.000Z"
}
```

##### Title Too Long (400)
```javascript
{
  "success": false,
  "error": "Validation error",
  "message": "Title must be 200 characters or less",
  "timestamp": "2025-07-26T10:30:00.000Z"
}
```

##### Too Many Tags (400)
```javascript
{
  "success": false,
  "error": "Validation error",
  "message": "Maximum 10 tags allowed",
  "timestamp": "2025-07-26T10:30:00.000Z"
}
```

##### Server Error (500)
```javascript
{
  "success": false,
  "error": "Internal server error",
  "message": "Failed to create note",
  "timestamp": "2025-07-26T10:30:00.000Z"
}
```

### 4. Update Note

**Endpoint**: `PUT /:id`  
**Access**: Public

Update an existing note completely (replaces all fields).

#### Path Parameters
- `id` (String, required): MongoDB ObjectId of the note

#### Request Body
```javascript
{
  "title": "Updated Ministry Planning Notes",
  "content": "Updated content with additional ministry plans and outreach strategies for the coming quarter...",
  "category": "Ministry",
  "type": "ministry",
  "tags": ["planning", "outreach", "quarterly"],
  "priority": "high",
  "reminderDate": "2025-07-30T10:00:00.000Z"
}
```

#### Validation Requirements
- Same validation rules as Create Note apply
- All required fields must be provided (title, content, category, type)
- Optional fields will be updated or removed if not provided

#### Success Response (200)
```javascript
{
  "success": true,
  "message": "Note updated successfully",
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "title": "Updated Ministry Planning Notes",
    "content": "Updated content with additional ministry plans...",
    "category": "Ministry",
    "type": "ministry",
    "tags": ["planning", "outreach", "quarterly"],
    "priority": "high",
    "isArchived": false,
    "isFavorite": false,
    "reminderDate": "2025-07-30T10:00:00.000Z",
    "metadata": {
      "wordCount": 198,
      "readTime": "1 min"
    },
    "createdAt": "2025-07-25T08:15:00.000Z",
    "updatedAt": "2025-07-26T11:15:00.000Z"
  },
  "timestamp": "2025-07-26T11:15:00.000Z"
}
```

#### Error Responses

##### Invalid ID (400)
```javascript
{
  "success": false,
  "error": "Invalid ID format",
  "message": "Invalid note ID format",
  "timestamp": "2025-07-26T10:30:00.000Z"
}
```

##### Note Not Found (404)
```javascript
{
  "success": false,
  "error": "Note not found",
  "message": "No note found with this ID",
  "timestamp": "2025-07-26T10:30:00.000Z"
}
```

##### Validation Errors (400)
Same validation error responses as Create Note endpoint.

### 5. Delete Note

**Endpoint**: `DELETE /:id`  
**Access**: Public

Permanently delete a note.

#### Path Parameters
- `id` (String, required): MongoDB ObjectId of the note

#### Example Request
```bash
DELETE /api/notes/60f7b3b3b3b3b3b3b3b3b3b3
```

#### Success Response (200)
```javascript
{
  "success": true,
  "message": "Note deleted successfully",
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "title": "Meeting Notes"
  },
  "timestamp": "2025-07-26T10:30:00.000Z"
}
```

### 6. Archive Note

**Endpoint**: `PATCH /:id/archive`  
**Access**: Public

Archive a note (sets isArchived to true).

#### Path Parameters
- `id` (String, required): MongoDB ObjectId of the note

#### Success Response (200)
```javascript
{
  "success": true,
  "message": "Note archived successfully",
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "title": "Meeting Notes",
    "isArchived": true,
    "updatedAt": "2025-07-26T10:30:00.000Z"
  },
  "timestamp": "2025-07-26T10:30:00.000Z"
}
```

### 7. Unarchive Note

**Endpoint**: `PATCH /:id/unarchive`  
**Access**: Public

Unarchive a note (sets isArchived to false).

#### Path Parameters
- `id` (String, required): MongoDB ObjectId of the note

#### Success Response (200)
```javascript
{
  "success": true,
  "message": "Note unarchived successfully",
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "title": "Meeting Notes",
    "isArchived": false,
    "updatedAt": "2025-07-26T10:30:00.000Z"
  },
  "timestamp": "2025-07-26T10:30:00.000Z"
}
```

### 8. Get Notes Statistics

**Endpoint**: `GET /stats/overview`  
**Access**: Public

Get overview statistics about notes.

#### Success Response (200)
```javascript
{
  "success": true,
  "message": "Statistics retrieved successfully",
  "data": {
    "totalNotes": 47,
    "archivedNotes": 12,
    "activeNotes": 35,
    "notesByCategory": {
      "work": 18,
      "personal": 12,
      "study": 8,
      "projects": 5,
      "ideas": 3,
      "reminders": 1
    },
    "notesByType": {
      "note": 32,
      "task": 8,
      "reminder": 4,
      "idea": 2,
      "draft": 1
    },
    "notesByPriority": {
      "low": 15,
      "medium": 20,
      "high": 8,
      "urgent": 4
    },
    "recentActivity": {
      "notesCreatedToday": 3,
      "notesCreatedThisWeek": 8,
      "notesUpdatedToday": 5
    }
  },
  "timestamp": "2025-07-26T10:30:00.000Z"
}
```

### 9. Get Categories List

**Endpoint**: `GET /categories/list`  
**Access**: Public

Get list of available note categories with counts.

#### Success Response (200)
```javascript
{
  "success": true,
  "message": "Categories retrieved successfully",
  "data": {
    "categories": [
      { "name": "work", "count": 18, "description": "Work-related notes" },
      { "name": "personal", "count": 12, "description": "Personal notes" },
      { "name": "study", "count": 8, "description": "Study and learning notes" },
      { "name": "projects", "count": 5, "description": "Project documentation" },
      { "name": "ideas", "count": 3, "description": "Ideas and brainstorming" },
      { "name": "reminders", "count": 1, "description": "Reminders and tasks" },
      { "name": "other", "count": 0, "description": "Miscellaneous notes" }
    ],
    "totalCategories": 7
  },
  "timestamp": "2025-07-26T10:30:00.000Z"
}
```

### 10. Get Tags List

**Endpoint**: `GET /tags/list`  
**Access**: Public

Get list of all tags used in notes with usage counts.

#### Success Response (200)
```javascript
{
  "success": true,
  "message": "Tags retrieved successfully",
  "data": {
    "tags": [
      { "name": "meeting", "count": 15 },
      { "name": "project", "count": 12 },
      { "name": "timeline", "count": 8 },
      { "name": "urgent", "count": 6 },
      { "name": "research", "count": 5 },
      { "name": "ideas", "count": 4 },
      { "name": "todo", "count": 3 }
    ],
    "totalTags": 24,
    "totalUsage": 67
  },
  "timestamp": "2025-07-26T10:30:00.000Z"
}
```

## Query Parameters

### Filtering Options

| Parameter | Description | Example |
|-----------|-------------|---------|
| `category` | Filter by category | `?category=work` |
| `type` | Filter by type | `?type=task` |
| `priority` | Filter by priority level | `?priority=high` |
| `archived` | Show archived notes | `?archived=true` |
| `tags` | Filter by tags (comma-separated) | `?tags=meeting,urgent` |
| `search` | Search in title and content | `?search=project timeline` |

### Sorting Options

| Parameter | Description | Example |
|-----------|-------------|---------|
| `sortBy` | Field to sort by | `?sortBy=title` |
| `sortOrder` | Sort direction (asc/desc) | `?sortOrder=asc` |

Available sort fields: `createdAt`, `updatedAt`, `title`, `category`, `type`, `priority`

### Pagination Options

| Parameter | Description | Default | Max |
|-----------|-------------|---------|-----|
| `page` | Page number | 1 | - |
| `limit` | Items per page | 10 | 100 |

### Complex Query Examples

```bash
# Get high priority work notes, sorted by creation date
GET /api/notes?category=work&priority=high&sortBy=createdAt&sortOrder=desc

# Search for meeting notes with pagination
GET /api/notes?search=meeting&page=2&limit=20

# Get archived notes from last month
GET /api/notes?archived=true&sortBy=updatedAt&sortOrder=desc

# Filter by multiple tags
GET /api/notes?tags=project,timeline,urgent&sortBy=priority
```

## Error Handling

### Common Error Responses

#### Validation Error (400)
```javascript
{
  "success": false,
  "error": "Validation failed",
  "message": "Invalid input data",
  "details": ["Specific validation errors"],
  "timestamp": "2025-07-26T10:30:00.000Z"
}
```

#### Not Found Error (404)
```javascript
{
  "success": false,
  "error": "Note not found",
  "message": "No note found with this ID",
  "timestamp": "2025-07-26T10:30:00.000Z"
}
```

#### Server Error (500)
```javascript
{
  "success": false,
  "error": "Internal server error",
  "message": "An unexpected error occurred",
  "timestamp": "2025-07-26T10:30:00.000Z"
}
```

### HTTP Status Codes

| Code | Status | Description |
|------|--------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Note created successfully |
| 400 | Bad Request | Invalid request data |
| 404 | Not Found | Note not found |
| 500 | Internal Server Error | Server error |

## Frontend Integration Examples

### 1. React Hooks for Notes Management

```javascript
// hooks/useNotes.js
import { useState, useEffect } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const useNotes = (filters = {}) => {
  const [notes, setNotes] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotes = async (queryParams = {}) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ ...filters, ...queryParams });
      const response = await fetch(`${API_BASE_URL}/notes?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setNotes(data.data.notes);
        setPagination(data.data.pagination);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to fetch notes');
    } finally {
      setLoading(false);
    }
  };

  const createNote = async (noteData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(noteData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setNotes(prev => [data.data, ...prev]);
        return data.data;
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateNote = async (id, noteData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/notes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(noteData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setNotes(prev => 
          prev.map(note => note._id === id ? data.data : note)
        );
        return data.data;
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const deleteNote = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/notes/${id}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (data.success) {
        setNotes(prev => prev.filter(note => note._id !== id));
        return true;
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const archiveNote = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/notes/${id}/archive`, {
        method: 'PATCH',
      });
      
      const data = await response.json();
      
      if (data.success) {
        setNotes(prev => 
          prev.map(note => 
            note._id === id ? { ...note, isArchived: true } : note
          )
        );
        return data.data;
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  return {
    notes,
    pagination,
    loading,
    error,
    fetchNotes,
    createNote,
    updateNote,
    deleteNote,
    archiveNote,
    refetch: () => fetchNotes()
  };
};
```

### 2. Notes List Component

```javascript
// components/NotesList.js
import React, { useState } from 'react';
import { useNotes } from '../hooks/useNotes';

const NotesList = () => {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    category: '',
    search: ''
  });
  
  const {
    notes,
    pagination,
    loading,
    error,
    fetchNotes,
    deleteNote,
    archiveNote
  } = useNotes(filters);

  const handleFilterChange = (newFilters) => {
    const updatedFilters = { ...filters, ...newFilters, page: 1 };
    setFilters(updatedFilters);
    fetchNotes(updatedFilters);
  };

  const handlePageChange = (page) => {
    const updatedFilters = { ...filters, page };
    setFilters(updatedFilters);
    fetchNotes(updatedFilters);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      try {
        await deleteNote(id);
        alert('Note deleted successfully');
      } catch (err) {
        alert('Failed to delete note');
      }
    }
  };

  const handleArchive = async (id) => {
    try {
      await archiveNote(id);
      alert('Note archived successfully');
    } catch (err) {
      alert('Failed to archive note');
    }
  };

  if (loading) return <div>Loading notes...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="notes-list">
      {/* Filters */}
      <div className="filters">
        <input
          type="text"
          placeholder="Search notes..."
          value={filters.search}
          onChange={(e) => handleFilterChange({ search: e.target.value })}
        />
        
        <select
          value={filters.category}
          onChange={(e) => handleFilterChange({ category: e.target.value })}
        >
          <option value="">All Categories</option>
          <option value="work">Work</option>
          <option value="personal">Personal</option>
          <option value="study">Study</option>
          <option value="projects">Projects</option>
          <option value="ideas">Ideas</option>
          <option value="reminders">Reminders</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Notes List */}
      <div className="notes">
        {notes.map(note => (
          <div key={note._id} className="note-card">
            <h3>{note.title}</h3>
            <p>{note.content.substring(0, 150)}...</p>
            <div className="note-meta">
              <span className="category">{note.category}</span>
              <span className="type">{note.type}</span>
              <span className="priority">{note.priority}</span>
            </div>
            <div className="note-actions">
              <button onClick={() => handleArchive(note._id)}>
                Archive
              </button>
              <button onClick={() => handleDelete(note._id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="pagination">
          <button 
            disabled={!pagination.hasPrevPage}
            onClick={() => handlePageChange(pagination.currentPage - 1)}
          >
            Previous
          </button>
          
          <span>
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          
          <button 
            disabled={!pagination.hasNextPage}
            onClick={() => handlePageChange(pagination.currentPage + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default NotesList;
```

### 3. Create Note Form Component

```javascript
// components/CreateNoteForm.js
import React, { useState } from 'react';
import { useNotes } from '../hooks/useNotes';

const CreateNoteForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'personal',
    type: 'note',
    tags: '',
    priority: 'medium',
    reminderDate: ''
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  
  const { createNote } = useNotes();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const noteData = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        reminderDate: formData.reminderDate || null
      };

      const newNote = await createNote(noteData);
      
      // Reset form
      setFormData({
        title: '',
        content: '',
        category: 'personal',
        type: 'note',
        tags: '',
        priority: 'medium',
        reminderDate: ''
      });
      
      if (onSuccess) onSuccess(newNote);
      alert('Note created successfully!');
      
    } catch (err) {
      setErrors({ general: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="create-note-form">
      <h2>Create New Note</h2>
      
      {errors.general && (
        <div className="error">{errors.general}</div>
      )}

      <div className="form-group">
        <label htmlFor="title">Title *</label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          maxLength="200"
        />
      </div>

      <div className="form-group">
        <label htmlFor="content">Content *</label>
        <textarea
          id="content"
          name="content"
          value={formData.content}
          onChange={handleChange}
          required
          rows="6"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="category">Category *</label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
          >
            <option value="personal">Personal</option>
            <option value="work">Work</option>
            <option value="study">Study</option>
            <option value="projects">Projects</option>
            <option value="ideas">Ideas</option>
            <option value="reminders">Reminders</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="type">Type *</label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            required
          >
            <option value="note">Note</option>
            <option value="task">Task</option>
            <option value="reminder">Reminder</option>
            <option value="idea">Idea</option>
            <option value="draft">Draft</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="priority">Priority</label>
          <select
            id="priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="tags">Tags (comma-separated)</label>
        <input
          type="text"
          id="tags"
          name="tags"
          value={formData.tags}
          onChange={handleChange}
          placeholder="meeting, project, urgent"
        />
      </div>

      <div className="form-group">
        <label htmlFor="reminderDate">Reminder Date</label>
        <input
          type="datetime-local"
          id="reminderDate"
          name="reminderDate"
          value={formData.reminderDate}
          onChange={handleChange}
        />
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Note'}
      </button>
    </form>
  );
};

export default CreateNoteForm;
```

## Troubleshooting Guide

### Common Frontend Implementation Issues

#### 1. "Validation error" on Note Creation

**Most Common Causes**:
- Missing required fields (title, content, category, type)
- Invalid category or type values
- Title exceeding 200 characters
- Too many tags (>10) or tags too long (>50 chars each)

**Solutions**:

```javascript
// ✅ Correct format for creating notes
const noteData = {
  title: "Sunday Morning Sermon",                    // Required: 1-200 chars
  content: "Today's message was about faith...",     // Required: min 1 char
  category: "Sermons",                               // Required: valid category
  type: "sermon",                                    // Required: valid type
  tags: ["faith", "sunday", "worship"],             // Optional: max 10, each max 50 chars
  priority: "high",                                  // Optional: low/medium/high
  reminderDate: "2025-07-30T10:00:00.000Z"         // Optional: valid ISO date
};

// ❌ Common mistakes that cause validation errors
const badData = {
  title: "",                                         // Empty title
  content: "",                                       // Empty content
  category: "InvalidCategory",                       // Invalid category
  type: "invalidType",                              // Invalid type
  tags: Array(15).fill("tag"),                     // Too many tags
  priority: "urgent",                               // Invalid priority (should be 'high')
  reminderDate: "invalid-date"                      // Invalid date format
};
```

**Valid Values Reference**:
```javascript
// Always use these exact values (case-sensitive)
const VALID_CATEGORIES = [
  'Sermons', 'Prayer', 'Bible Study', 'General', 'Ministry', 'Personal'
];

const VALID_TYPES = [
  'sermon', 'prayer', 'study', 'general', 'ministry', 'personal'
];

const VALID_PRIORITIES = [
  'low', 'medium', 'high'  // Note: NOT 'urgent'
];
```

#### 2. "Invalid ID format" Error

**Cause**: Malformed MongoDB ObjectId

**Solutions**:
```javascript
// ✅ Valid ObjectId format (24 hex characters)
const validId = "60f7b3b3b3b3b3b3b3b3b3b3";

// ❌ Invalid formats
const invalidIds = [
  "123",                    // Too short
  "not-an-objectid",       // Invalid characters
  "",                      // Empty
  null,                    // Null
  undefined                // Undefined
];

// Always validate IDs before making requests
const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

if (!isValidObjectId(noteId)) {
  setError('Invalid note ID');
  return;
}
```

#### 3. "Note not found" (404) Error

**Causes**:
- Note was deleted
- Incorrect note ID
- Note doesn't belong to user (when auth is implemented)

**Solution**:
```javascript
const handleNoteNotFound = (error) => {
  if (error.response?.status === 404) {
    setError('Note not found. It may have been deleted.');
    // Redirect to notes list or show appropriate UI
    navigate('/notes');
  }
};
```

#### 4. Query Parameter Issues

**Common Problems**:
- Invalid pagination values
- Invalid sort parameters
- Invalid filter values

**Solutions**:
```javascript
// ✅ Correct query parameter usage
const buildQueryString = (filters) => {
  const params = new URLSearchParams();
  
  // Pagination (positive integers only)
  if (filters.page && filters.page > 0) {
    params.append('page', filters.page);
  }
  
  if (filters.limit && filters.limit > 0 && filters.limit <= 100) {
    params.append('limit', filters.limit);
  }
  
  // Sorting (valid fields only)
  const validSortFields = ['title', 'createdAt', 'updatedAt', 'priority'];
  if (filters.sortBy && validSortFields.includes(filters.sortBy)) {
    params.append('sortBy', filters.sortBy);
  }
  
  if (filters.sortOrder && ['asc', 'desc'].includes(filters.sortOrder)) {
    params.append('sortOrder', filters.sortOrder);
  }
  
  // Filters (valid values only)
  if (filters.category && VALID_CATEGORIES.includes(filters.category)) {
    params.append('category', filters.category);
  }
  
  if (filters.type && VALID_TYPES.includes(filters.type)) {
    params.append('type', filters.type);
  }
  
  return params.toString();
};

// Usage
const queryString = buildQueryString({
  page: 1,
  limit: 20,
  category: 'Sermons',
  sortBy: 'createdAt',
  sortOrder: 'desc'
});

const url = `/api/notes?${queryString}`;
```

#### 5. Date Format Issues

**Problem**: Invalid date strings causing validation errors

**Solution**:
```javascript
// ✅ Correct date format (ISO 8601)
const formatDateForAPI = (date) => {
  if (!date) return null;
  
  // If date is from datetime-local input
  if (typeof date === 'string' && !date.includes('T')) {
    date = date + 'T00:00:00.000Z';
  }
  
  // Ensure it's a valid ISO string
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    throw new Error('Invalid date');
  }
  
  return dateObj.toISOString();
};

// Usage in form submission
const handleSubmit = (formData) => {
  const noteData = {
    ...formData,
    reminderDate: formatDateForAPI(formData.reminderDate),
    expiryDate: formatDateForAPI(formData.expiryDate)
  };
  
  // Submit noteData
};
```

#### 6. Tag Processing Issues

**Problem**: Tags not being processed correctly

**Solution**:
```javascript
// ✅ Proper tag processing
const processTags = (tagString) => {
  if (!tagString) return [];
  
  return tagString
    .split(',')
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0 && tag.length <= 50)
    .slice(0, 10); // Limit to 10 tags
};

// Usage
const noteData = {
  // ... other fields
  tags: processTags(formData.tags) // "tag1, tag2, tag3" → ["tag1", "tag2", "tag3"]
};
```

### Complete Error Handling Example

```javascript
const createNote = async (noteData) => {
  try {
    setLoading(true);
    setError('');
    
    const response = await fetch('/api/notes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(noteData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      // Handle specific errors
      switch (response.status) {
        case 400:
          if (data.message.includes('Title')) {
            setError('Title is required and must be 200 characters or less');
          } else if (data.message.includes('category')) {
            setError('Please select a valid category');
          } else if (data.message.includes('type')) {
            setError('Please select a valid note type');
          } else if (data.message.includes('tags')) {
            setError('Too many tags or tags too long (max 10 tags, 50 chars each)');
          } else {
            setError(data.message || 'Invalid input data');
          }
          break;
          
        case 500:
          setError('Server error. Please try again later.');
          break;
          
        default:
          setError('Failed to create note. Please try again.');
      }
      
      throw new Error(data.message);
    }
    
    // Success
    setSuccess('Note created successfully!');
    return data.data;
    
  } catch (error) {
    console.error('Create note error:', error);
    if (!error.message.includes('fetch')) {
      // Network error
      setError('Network error. Please check your connection.');
    }
    throw error;
  } finally {
    setLoading(false);
  }
};
```

### Error Code Quick Reference

| Status | Error | Common Causes | Solutions |
|--------|-------|---------------|-----------|
| 400 | Validation error | Missing required fields, invalid values | Check field requirements and valid values |
| 400 | Invalid ID format | Malformed ObjectId | Validate ID format before requests |
| 404 | Note not found | Wrong ID, deleted note | Check ID exists, handle gracefully |
| 500 | Internal server error | Server issues, database problems | Retry request, contact support |

### Testing Checklist

Before deploying your frontend:

- [ ] Test with valid and invalid note data
- [ ] Test all CRUD operations (Create, Read, Update, Delete)
- [ ] Test pagination with different page/limit values
- [ ] Test filtering by category, type, priority
- [ ] Test search functionality
- [ ] Test archive/unarchive operations
- [ ] Test with edge cases (empty strings, very long content, special characters)
- [ ] Test error handling for network failures
- [ ] Test with invalid ObjectIds
- [ ] Verify all date formats are ISO 8601

This comprehensive documentation should prevent most internal server errors and provide clear guidance for troubleshooting any issues that arise!
