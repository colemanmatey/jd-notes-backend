'use strict';

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const notesRoutes = require('./routes/notes');
const authRoutes = require('./routes/auth');
const { connectToDatabase, closeDatabase } = require('./config/database');
const { corsOptions, helmetOptions } = require('./config/middleware');
const { HTTP_STATUS, API_MESSAGES } = require('./constants/api');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet(helmetOptions));

// Logging middleware
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// CORS middleware
app.use(cors(corsOptions));

// Body parsing middleware with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request timeout middleware
app.use((req, res, next) => {
  res.setTimeout(30000, () => {
    console.error('Request timeout for:', req.url);
    res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json({
      error: 'Request timeout',
      message: 'The request took too long to process'
    });
  });
  next();
});

// Connect to MongoDB
connectToDatabase()
  .then(() => {
    console.log('✅', API_MESSAGES.DATABASE_CONNECTION_SUCCESS);
  })
  .catch((error) => {
    console.error('❌', API_MESSAGES.DATABASE_CONNECTION_FAILED, error.message);
    process.exit(1);
  });

// Routes
app.use('/api/notes', notesRoutes);
app.use('/api/auth', authRoutes);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const healthData = {
      status: 'OK',
      message: API_MESSAGES.HEALTH_CHECK_SUCCESS,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      memory: process.memoryUsage()
    };

    // Quick database health check
    if (mongoose.connection.readyState === 1) {
      healthData.database = 'connected';
    } else {
      healthData.database = 'disconnected';
    }
    
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
      documentation: 'https://github.com/colemanmatey/jd-notes-backend/tree/main/docs'
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

// Graceful shutdown handlers
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  try {
    // Close database connection
    await closeDatabase();
    
    // Exit process
    console.log('Graceful shutdown completed.');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};

// Listen for termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

// Start server only if not in test environment
if (process.env.NODE_ENV !== 'test') {
  const server = app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🕒 Started at: ${new Date().toISOString()}`);
  });

  // Handle server errors
  server.on('error', (error) => {
    console.error('Server error:', error);
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use`);
      process.exit(1);
    }
  });
}

module.exports = app;
