'use strict';

/**
 * HTTP Status Codes
 */
const HTTP_STATUS = Object.freeze({
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
});

/**
 * API Messages
 */
const API_MESSAGES = Object.freeze({
  // Health check
  HEALTH_CHECK_SUCCESS: 'JD Notes Backend is running successfully',
  HEALTH_CHECK_FAILED: 'Health check failed',
  
  // Database
  DATABASE_CONNECTION_SUCCESS: 'Connected to MongoDB Atlas successfully',
  DATABASE_CONNECTION_FAILED: 'Failed to connect to database',
  
  // Generic
  ROUTE_NOT_FOUND: 'Route not found',
  INTERNAL_SERVER_ERROR: 'Internal server error',
  VALIDATION_ERROR: 'Validation error',
  
  // Notes
  NOTE_CREATED: 'Note created successfully',
  NOTE_UPDATED: 'Note updated successfully',
  NOTE_DELETED: 'Note deleted successfully',
  NOTE_ARCHIVED: 'Note archived successfully',
  NOTE_UNARCHIVED: 'Note unarchived successfully',
  NOTE_NOT_FOUND: 'Note not found',
  NOTES_FETCHED: 'Notes fetched successfully'
});

/**
 * Database Configuration
 */
const DATABASE_CONFIG = Object.freeze({
  CONNECTION_OPTIONS: {
    bufferCommands: false,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    family: 4 // Use IPv4, skip trying IPv6
  },
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000
});

/**
 * Validation Constants
 */
const VALIDATION = Object.freeze({
  NOTE: {
    TITLE_MAX_LENGTH: 200,
    TITLE_MIN_LENGTH: 1,
    CONTENT_MIN_LENGTH: 1,
    MAX_TAGS: 10,
    TAG_MAX_LENGTH: 50
  },
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100
  }
});

/**
 * Note Categories and Types
 */
const NOTE_CATEGORIES = Object.freeze([
  'Sermons',
  'Prayer', 
  'Bible Study',
  'General',
  'Ministry',
  'Personal'
]);

const NOTE_TYPES = Object.freeze([
  'sermon',
  'prayer',
  'study',
  'general',
  'ministry',
  'personal'
]);

const PRIORITY_LEVELS = Object.freeze([
  'low',
  'medium',
  'high'
]);

module.exports = {
  HTTP_STATUS,
  API_MESSAGES,
  DATABASE_CONFIG,
  VALIDATION,
  NOTE_CATEGORIES,
  NOTE_TYPES,
  PRIORITY_LEVELS
};
