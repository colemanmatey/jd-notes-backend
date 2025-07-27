'use strict';

const express = require('express');
const User = require('../models/User');
const { 
  generateTokenPair, 
  validatePassword, 
  authenticateToken,
  checkRateLimit 
} = require('../utils/auth');
const { HTTP_STATUS, API_MESSAGES } = require('../constants/api');
const { sanitizeInput, validateEmail } = require('../utils/helpers');

const router = express.Router();

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, firstName, lastName } = req.body;

    // Input validation
    if (!username || !email || !password || !firstName || !lastName) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: 'Validation Error',
        message: 'All fields are required',
        required: ['username', 'email', 'password', 'firstName', 'lastName']
      });
    }

    // Sanitize inputs
    const sanitizedData = {
      username: sanitizeInput(username).trim(),
      email: sanitizeInput(email).trim().toLowerCase(),
      firstName: sanitizeInput(firstName).trim(),
      lastName: sanitizeInput(lastName).trim()
    };

    // Validate email format
    if (!validateEmail(sanitizedData.email)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: 'Validation Error',
        message: 'Please provide a valid email address'
      });
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: 'Validation Error',
        message: 'Password does not meet requirements',
        requirements: passwordValidation.errors,
        passwordStrength: passwordValidation.strength
      });
    }

    // Check if user already exists
    const existingEmail = await User.emailExists(sanitizedData.email);
    if (existingEmail) {
      return res.status(HTTP_STATUS.CONFLICT).json({
        error: 'User Already Exists',
        message: 'An account with this email already exists'
      });
    }

    const existingUsername = await User.usernameExists(sanitizedData.username);
    if (existingUsername) {
      return res.status(HTTP_STATUS.CONFLICT).json({
        error: 'User Already Exists',
        message: 'This username is already taken'
      });
    }

    // Create new user
    const newUser = new User({
      ...sanitizedData,
      password
    });

    await newUser.save();

    // Generate tokens
    const tokens = generateTokenPair(newUser);

    // Update last login
    await newUser.updateLastLogin();

    // Response data
    const userData = {
      id: newUser._id,
      username: newUser.username,
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      createdAt: newUser.createdAt,
      lastLogin: newUser.lastLogin
    };

    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Account created successfully',
      user: userData,
      tokens,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Registration error:', error);

    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: 'Validation Error',
        message: 'Invalid input data',
        details: errors
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(HTTP_STATUS.CONFLICT).json({
        error: 'Duplicate Entry',
        message: `${field} already exists`
      });
    }

    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: API_MESSAGES.INTERNAL_SERVER_ERROR,
      message: 'Failed to create account'
    });
  }
});

/**
 * @route POST /api/auth/login
 * @desc Authenticate user and return token
 * @access Public
 */
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress;

    // Input validation
    if (!identifier || !password) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: 'Validation Error',
        message: 'Email/username and password are required'
      });
    }

    // Rate limiting
    if (!checkRateLimit(clientIP)) {
      return res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
        error: 'Too Many Attempts',
        message: 'Too many login attempts. Please try again later.',
        retryAfter: '15 minutes'
      });
    }

    // Find user by email or username
    const user = await User.findByEmailOrUsername(sanitizeInput(identifier));

    if (!user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        error: 'Authentication Failed',
        message: 'Invalid credentials'
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        error: 'Account Locked',
        message: 'Account is temporarily locked due to too many failed login attempts'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        error: 'Account Inactive',
        message: 'Your account has been deactivated'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      // Increment login attempts
      await user.incLoginAttempts();
      
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        error: 'Authentication Failed',
        message: 'Invalid credentials'
      });
    }

    // Reset login attempts on successful login
    if (user.loginAttempts > 0) {
      await user.resetLoginAttempts();
    }

    // Update last login
    await user.updateLastLogin();

    // Generate tokens
    const tokens = generateTokenPair(user);

    // Response data
    const userData = {
      id: user._id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      lastLogin: new Date().toISOString()
    };

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Login successful',
      user: userData,
      tokens,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Login error:', error);
    
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: API_MESSAGES.INTERNAL_SERVER_ERROR,
      message: 'Login failed'
    });
  }
});

/**
 * @route POST /api/auth/logout
 * @desc Logout user (invalidate token - client-side handling)
 * @access Private
 */
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // In a stateless JWT system, logout is primarily handled client-side
    // The client should remove the token from storage
    // For enhanced security, you could maintain a blacklist of tokens
    
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Logged out successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Logout error:', error);
    
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: API_MESSAGES.INTERNAL_SERVER_ERROR,
      message: 'Logout failed'
    });
  }
});

/**
 * @route GET /api/auth/me
 * @desc Get current user profile
 * @access Private
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        error: 'User Not Found',
        message: 'User account not found'
      });
    }

    const userData = {
      id: user._id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      user: userData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get profile error:', error);
    
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: API_MESSAGES.INTERNAL_SERVER_ERROR,
      message: 'Failed to retrieve user profile'
    });
  }
});

/**
 * @route POST /api/auth/refresh
 * @desc Refresh access token
 * @access Public
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: 'Validation Error',
        message: 'Refresh token is required'
      });
    }

    // Verify refresh token
    const { verifyToken } = require('../utils/auth');
    const decoded = verifyToken(refreshToken);

    // Find user
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.isActive) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        error: 'Invalid Token',
        message: 'User not found or inactive'
      });
    }

    // Generate new tokens
    const tokens = generateTokenPair(user);

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Token refreshed successfully',
      tokens,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      error: 'Invalid Token',
      message: 'Invalid or expired refresh token'
    });
  }
});

/**
 * @route POST /api/auth/change-password
 * @desc Change user password
 * @access Private
 */
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: 'Validation Error',
        message: 'Current password and new password are required'
      });
    }

    // Find user with password
    const user = await User.findById(req.user.userId).select('+password');
    
    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        error: 'User Not Found',
        message: 'User account not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    
    if (!isCurrentPasswordValid) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        error: 'Authentication Failed',
        message: 'Current password is incorrect'
      });
    }

    // Validate new password
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: 'Validation Error',
        message: 'New password does not meet requirements',
        requirements: passwordValidation.errors
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Password changed successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Change password error:', error);
    
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: API_MESSAGES.INTERNAL_SERVER_ERROR,
      message: 'Failed to change password'
    });
  }
});

module.exports = router;
