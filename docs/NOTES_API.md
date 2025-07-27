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
  "title": "Meeting Notes",
  "content": "Discussed project timeline and deliverables...",
  "category": "work",
  "type": "note",
  "tags": ["meeting", "project", "timeline"],
  "priority": "medium",
  "isArchived": false,
  "isFavorite": false,
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
| `category` | String | Yes | Note category | One of: personal, work, study, projects, ideas, reminders, other |
| `type` | String | Yes | Note type | One of: note, task, reminder, idea, draft |
| `tags` | Array | No | Associated tags | Array of strings, max 10 tags |
| `priority` | String | No | Priority level | One of: low, medium, high, urgent |
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

## Endpoints

### 1. Get All Notes

**Endpoint**: `GET /`  
**Access**: Public

Retrieve all notes with optional filtering, sorting, and pagination.

#### Query Parameters

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `page` | Number | Page number for pagination | 1 |
| `limit` | Number | Number of notes per page (max 100) | 10 |
| `sortBy` | String | Field to sort by | createdAt |
| `sortOrder` | String | Sort direction (asc/desc) | desc |
| `category` | String | Filter by category | - |
| `type` | String | Filter by type | - |
| `priority` | String | Filter by priority | - |
| `archived` | Boolean | Show archived notes | false |
| `search` | String | Search in title and content | - |
| `tags` | String | Filter by tags (comma-separated) | - |

#### Example Request
```bash
GET /api/notes?page=1&limit=20&category=work&sortBy=priority&sortOrder=desc&search=meeting
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
        "title": "Meeting Notes",
        "content": "Discussed project timeline...",
        "category": "work",
        "type": "note",
        "tags": ["meeting", "project"],
        "priority": "medium",
        "isArchived": false,
        "isFavorite": false,
        "createdAt": "2025-07-25T08:15:00.000Z",
        "updatedAt": "2025-07-26T10:30:00.000Z"
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
    "title": "Meeting Notes",
    "content": "Discussed project timeline and deliverables for Q3...",
    "category": "work",
    "type": "note",
    "tags": ["meeting", "project", "timeline"],
    "priority": "medium",
    "isArchived": false,
    "isFavorite": false,
    "reminderDate": "2025-07-30T10:00:00.000Z",
    "metadata": {
      "wordCount": 157,
      "readTime": "1 min",
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
  "title": "Meeting Notes",
  "content": "Discussed project timeline and deliverables for Q3. Key decisions made about resource allocation.",
  "category": "work",
  "type": "note",
  "tags": ["meeting", "project", "timeline"],
  "priority": "medium",
  "reminderDate": "2025-07-30T10:00:00.000Z"
}
```

#### Required Fields
- `title` (String): Note title
- `content` (String): Note content
- `category` (String): Must be one of: personal, work, study, projects, ideas, reminders, other
- `type` (String): Must be one of: note, task, reminder, idea, draft

#### Success Response (201)
```javascript
{
  "success": true,
  "message": "Note created successfully",
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "title": "Meeting Notes",
    "content": "Discussed project timeline and deliverables for Q3...",
    "category": "work",
    "type": "note",
    "tags": ["meeting", "project", "timeline"],
    "priority": "medium",
    "isArchived": false,
    "isFavorite": false,
    "reminderDate": "2025-07-30T10:00:00.000Z",
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

#### Validation Error Response (400)
```javascript
{
  "success": false,
  "error": "Validation failed",
  "message": "Invalid input data",
  "details": [
    "Title is required",
    "Category must be one of: personal, work, study, projects, ideas, reminders, other"
  ],
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
  "title": "Updated Meeting Notes",
  "content": "Updated content with additional decisions and action items...",
  "category": "work",
  "type": "note",
  "tags": ["meeting", "project", "timeline", "decisions"],
  "priority": "high",
  "reminderDate": "2025-07-30T10:00:00.000Z"
}
```

#### Success Response (200)
```javascript
{
  "success": true,
  "message": "Note updated successfully",
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "title": "Updated Meeting Notes",
    "content": "Updated content with additional decisions...",
    "category": "work",
    "type": "note",
    "tags": ["meeting", "project", "timeline", "decisions"],
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

This comprehensive documentation provides everything needed to integrate with the Notes API, including all endpoints, data models, query parameters, error handling, and React integration examples!
