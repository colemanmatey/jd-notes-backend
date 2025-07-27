'use strict';

const { VALIDATION } = require('../constants/api');

/**
 * Sanitize and validate pagination parameters
 * @param {Object} query - Query parameters from request
 * @returns {Object} Sanitized pagination parameters
 */
const getPaginationParams = (query) => {
  const page = Math.max(1, parseInt(query.page, 10) || VALIDATION.PAGINATION.DEFAULT_PAGE);
  const limit = Math.min(
    VALIDATION.PAGINATION.MAX_LIMIT,
    Math.max(1, parseInt(query.limit, 10) || VALIDATION.PAGINATION.DEFAULT_LIMIT)
  );
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

/**
 * Build MongoDB sort object from query parameters
 * @param {string} sortBy - Field to sort by
 * @param {string} sortOrder - Sort order (asc/desc)
 * @returns {Object} MongoDB sort object
 */
const getSortParams = (sortBy = 'createdAt', sortOrder = 'desc') => {
  const allowedSortFields = [
    'createdAt',
    'updatedAt',
    'title',
    'category',
    'type',
    'priority'
  ];

  const field = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
  const order = ['asc', 'desc'].includes(sortOrder) ? sortOrder : 'desc';

  return { [field]: order === 'desc' ? -1 : 1 };
};

/**
 * Build filter object for MongoDB queries
 * @param {Object} query - Query parameters
 * @returns {Object} MongoDB filter object
 */
const getFilterParams = (query) => {
  const filter = { isArchived: query.archived === 'true' };

  // Category filter
  if (query.category) {
    filter.category = query.category;
  }

  // Type filter
  if (query.type) {
    filter.type = query.type;
  }

  // Priority filter
  if (query.priority) {
    filter.priority = query.priority;
  }

  // Tags filter
  if (query.tags) {
    const tagArray = query.tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
    
    if (tagArray.length > 0) {
      filter.tags = { $in: tagArray };
    }
  }

  // Search filter
  if (query.search && query.search.trim()) {
    const searchTerm = query.search.trim();
    filter.$or = [
      { title: { $regex: searchTerm, $options: 'i' } },
      { content: { $regex: searchTerm, $options: 'i' } },
      { tags: { $in: [new RegExp(searchTerm, 'i')] } }
    ];
  }

  return filter;
};

/**
 * Create standardized API response
 * @param {Object} data - Response data
 * @param {string} message - Response message
 * @param {number} statusCode - HTTP status code
 * @returns {Object} Standardized response object
 */
const createApiResponse = (data = null, message = 'Success', statusCode = 200) => {
  const response = {
    success: statusCode >= 200 && statusCode < 300,
    message,
    timestamp: new Date().toISOString()
  };

  if (data !== null) {
    response.data = data;
  }

  return response;
};

/**
 * Create standardized error response
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {Object} details - Additional error details
 * @returns {Object} Standardized error response
 */
const createErrorResponse = (message = 'An error occurred', statusCode = 500, details = null) => {
  const response = {
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
    statusCode
  };

  if (details && process.env.NODE_ENV === 'development') {
    response.details = details;
  }

  return response;
};

/**
 * Validate and sanitize note data
 * @param {Object} noteData - Note data to validate
 * @returns {Object} Validated and sanitized note data
 */
const validateNoteData = (noteData) => {
  const sanitized = {};

  // Title validation
  if (noteData.title) {
    sanitized.title = noteData.title.trim();
    if (sanitized.title.length > VALIDATION.NOTE.TITLE_MAX_LENGTH) {
      throw new Error(`Title must be ${VALIDATION.NOTE.TITLE_MAX_LENGTH} characters or less`);
    }
  }

  // Content validation
  if (noteData.content) {
    sanitized.content = noteData.content.trim();
  }

  // Category validation
  if (noteData.category) {
    sanitized.category = noteData.category.trim();
  }

  // Type validation
  if (noteData.type) {
    sanitized.type = noteData.type.toLowerCase().trim();
  }

  // Tags validation and sanitization
  if (noteData.tags && Array.isArray(noteData.tags)) {
    sanitized.tags = noteData.tags
      .map(tag => tag.toString().toLowerCase().trim())
      .filter(tag => tag.length > 0 && tag.length <= VALIDATION.NOTE.TAG_MAX_LENGTH)
      .slice(0, VALIDATION.NOTE.MAX_TAGS); // Limit number of tags
  }

  // Priority validation
  if (noteData.priority) {
    sanitized.priority = noteData.priority.toLowerCase().trim();
  }

  // Boolean fields
  if (typeof noteData.isArchived === 'boolean') {
    sanitized.isArchived = noteData.isArchived;
  }

  return sanitized;
};

/**
 * Check if a value is a valid MongoDB ObjectId
 * @param {string} id - ID to validate
 * @returns {boolean} True if valid ObjectId
 */
const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Sanitize user input to prevent XSS and injection attacks
 * @param {string} input - Input string to sanitize
 * @returns {string} Sanitized string
 */
const sanitizeInput = (input) => {
  if (typeof input !== 'string') {
    return '';
  }
  
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/['"]/g, '') // Remove quotes
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email format
 */
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Generate a random string for tokens/IDs
 * @param {number} length - Length of random string
 * @returns {string} Random string
 */
const generateRandomString = (length = 32) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

module.exports = {
  getPaginationParams,
  getSortParams,
  getFilterParams,
  createApiResponse,
  createErrorResponse,
  validateNoteData,
  isValidObjectId,
  sanitizeInput,
  validateEmail,
  generateRandomString
};
