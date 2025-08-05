'use strict';

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const notesRoutes = require('../routes/notes');
const authRoutes = require('../routes/auth');
const { connectToDatabase } = require('../config/database');
const { corsOptions, helmetOptions } = require('../config/middleware');
const { HTTP_STATUS, API_MESSAGES } = require('../constants/api');

const app = express();

// Security middleware
app.use(helmet(helmetOptions));

// Logging middleware (only in development for serverless)
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('combined'));
}

// CORS middleware
app.use(cors(corsOptions));

// Body parsing middleware with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
// Routes (no /api prefix needed in serverless function)
app.use('/notes', notesRoutes);
app.use('/auth', authRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  try {
    const healthData = {
      status: 'OK',
      message: API_MESSAGES.HEALTH_CHECK_SUCCESS,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0'
    };
    
    return res.status(HTTP_STATUS.OK).json(healthData);
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      status: 'ERROR',
      message: API_MESSAGES.HEALTH_CHECK_FAILED,
      timestamp: new Date().toISOString()
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  const apiInfo = {
    message: 'JD Notes Backend API',
    version: process.env.npm_package_version || '1.0.0',
    endpoints: {
      health: '/api/health',
      notes: '/api/notes',
      auth: '/api/auth',
      documentation: 'https://github.com/colemanmatey/jd-notes-backend'
    },
    environment: process.env.NODE_ENV || 'development'
  };
  
  return res.status(HTTP_STATUS.OK).json(apiInfo);
});

// Catch all handler for undefined routes
app.use('*', (req, res) => {
  const errorResponse = {
    error: API_MESSAGES.ROUTE_NOT_FOUND,
    message: `${req.method} ${req.originalUrl} is not a valid endpoint`,
    availableEndpoints: ['/api/health', '/api/notes', '/api/auth'],
    timestamp: new Date().toISOString()
  };
  
  return res.status(HTTP_STATUS.NOT_FOUND).json(errorResponse);
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Unhandled error:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  const errorResponse = {
    error: API_MESSAGES.INTERNAL_SERVER_ERROR,
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  };

  return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(errorResponse);
});

// Serverless function handler
module.exports = async (req, res) => {
  try {
    // Connect to database on each request (serverless requirement)
    await connectToDatabase();
    
    // Handle the request
    return app(req, res);
  } catch (error) {
    console.error('Serverless function error:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: API_MESSAGES.DATABASE_CONNECTION_FAILED,
      message: 'Failed to connect to database',
      timestamp: new Date().toISOString()
    });
  }
};
