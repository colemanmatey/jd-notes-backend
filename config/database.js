'use strict';

const mongoose = require('mongoose');
const { DATABASE_CONFIG, API_MESSAGES } = require('../constants/api');

// Connection cache for serverless
let cachedConnection = null;

/**
 * Connect to MongoDB with proper error handling and connection pooling
 * @returns {Promise<mongoose.Connection>} MongoDB connection
 */
const connectToDatabase = async () => {
  // Return cached connection if available
  if (cachedConnection && cachedConnection.readyState === 1) {
    return cachedConnection;
  }

  try {
    // Validate MongoDB URI
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }

    // Connect with retry logic
    const connection = await connectWithRetry();
    
    // Cache the connection
    cachedConnection = connection;
    
    console.log('✅', API_MESSAGES.DATABASE_CONNECTION_SUCCESS);
    return connection;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    throw new Error(`${API_MESSAGES.DATABASE_CONNECTION_FAILED}: ${error.message}`);
  }
};

/**
 * Connect to MongoDB with retry logic
 * @param {number} retryCount - Current retry attempt
 * @returns {Promise<mongoose.Connection>} MongoDB connection
 */
const connectWithRetry = async (retryCount = 0) => {
  try {
    const connection = await mongoose.connect(
      process.env.MONGODB_URI,
      DATABASE_CONFIG.CONNECTION_OPTIONS
    );

    return connection.connection;
  } catch (error) {
    if (retryCount < DATABASE_CONFIG.RETRY_ATTEMPTS) {
      console.log(`Retrying MongoDB connection... Attempt ${retryCount + 1}/${DATABASE_CONFIG.RETRY_ATTEMPTS}`);
      
      // Wait before retrying
      await new Promise(resolve => 
        setTimeout(resolve, DATABASE_CONFIG.RETRY_DELAY * (retryCount + 1))
      );
      
      return connectWithRetry(retryCount + 1);
    }
    
    throw error;
  }
};

/**
 * Gracefully close database connection
 */
const closeDatabase = async () => {
  try {
    if (cachedConnection) {
      await mongoose.connection.close();
      cachedConnection = null;
      console.log('🔌 Database connection closed');
    }
  } catch (error) {
    console.error('Error closing database connection:', error.message);
  }
};

/**
 * Check database connection health
 * @returns {Promise<boolean>} Connection health status
 */
const checkDatabaseHealth = async () => {
  try {
    if (!cachedConnection || cachedConnection.readyState !== 1) {
      return false;
    }
    
    // Ping the database
    await mongoose.connection.db.admin().ping();
    return true;
  } catch (error) {
    console.error('Database health check failed:', error.message);
    return false;
  }
};

module.exports = {
  connectToDatabase,
  closeDatabase,
  checkDatabaseHealth
};
