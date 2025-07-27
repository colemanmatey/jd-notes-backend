// Test setup file
require('dotenv').config({ path: '.env.test' });

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jd-notes-test';

// Increase timeout for database operations
jest.setTimeout(30000);

// Mock console.log during tests to reduce noise
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: console.error, // Keep error logs for debugging
};
