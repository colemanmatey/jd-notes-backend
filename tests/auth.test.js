const request = require('supertest');

// Complete mocking setup
jest.mock('../config/database', () => ({
  connectToDatabase: jest.fn().mockResolvedValue(true),
  closeDatabase: jest.fn().mockResolvedValue(true)
}));

jest.mock('mongoose', () => ({
  Schema: jest.fn().mockImplementation(() => ({
    pre: jest.fn(),
    post: jest.fn(),
    methods: {},
    statics: {},
    index: jest.fn(),
    virtual: jest.fn().mockReturnValue({
      get: jest.fn(),
      set: jest.fn()
    })
  })),
  model: jest.fn(),
  connection: { readyState: 1 },
  connect: jest.fn().mockResolvedValue(true),
  disconnect: jest.fn().mockResolvedValue(true)
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn().mockResolvedValue(true),
  genSalt: jest.fn().mockResolvedValue('salt')
}));

jest.mock('validator', () => ({
  isEmail: jest.fn().mockReturnValue(true),
  escape: jest.fn(str => str),
  trim: jest.fn(str => str)
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock-jwt-token'),
  verify: jest.fn().mockReturnValue({ userId: 'mock-user-id', exp: Math.floor(Date.now() / 1000) + 3600 })
}));

// Mock User model
const mockUserData = {
  _id: 'mock-user-id',
  username: 'testuser',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  isLocked: false,
  isActive: true,
  loginAttempts: 0
};

const mockUser = {
  ...mockUserData,
  save: jest.fn().mockResolvedValue(mockUserData),
  comparePassword: jest.fn().mockResolvedValue(true),
  updateLastLogin: jest.fn().mockResolvedValue(true),
  incLoginAttempts: jest.fn().mockResolvedValue(true),
  resetLoginAttempts: jest.fn().mockResolvedValue(true),
  toObject: jest.fn().mockReturnValue(mockUserData)
};

const mockUserWithSelect = {
  select: jest.fn((fields) => {
    if (fields === '+password') {
      const userWithPassword = {
        ...mockUser,
        password: 'hashedCurrentPassword',
        save: jest.fn().mockResolvedValue(true),
        comparePassword: jest.fn((password) => {
          // Return true for correct password, false for wrong password
          return Promise.resolve(password === 'currentPass123');
        })
      };
      return Promise.resolve(userWithPassword);
    }
    return Promise.resolve(mockUser);
  })
};

const mockUserConstructor = jest.fn().mockImplementation(() => mockUser);
mockUserConstructor.findById = jest.fn((userId) => {
  if (userId === 'user123' || userId === 'mock-user-id') {
    return mockUserWithSelect;
  }
  // For non-existent user scenario  
  if (userId === 'non-existent-user') {
    return {
      select: jest.fn().mockResolvedValue(null)
    };
  }
  return mockUserWithSelect;
});
mockUserConstructor.findByEmailOrUsername = jest.fn().mockResolvedValue(mockUser);
mockUserConstructor.emailExists = jest.fn().mockResolvedValue(false);
mockUserConstructor.usernameExists = jest.fn().mockResolvedValue(false);

jest.mock('../models/User', () => mockUserConstructor);

// Mock auth utilities
jest.mock('../utils/auth', () => ({
  verifyToken: jest.fn().mockReturnValue({ userId: 'mock-user-id' }),
  authenticateToken: jest.fn((req, res, next) => {
    req.user = { userId: 'mock-user-id' };
    next();
  }),
  generateTokens: jest.fn().mockReturnValue({
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token'
  }),
  generateTokenPair: jest.fn().mockReturnValue({
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token'
  }),
  validatePassword: jest.fn().mockReturnValue({
    isValid: true,
    strength: 'Strong',
    errors: []
  }),
  checkRateLimit: jest.fn().mockReturnValue(true)
}));

// Import the app after mocking
const app = require('../server');

describe('Authentication Endpoints', () => {
  
  describe('POST /api/auth/register', () => {
    test('should register a new user with valid data', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Account created successfully');
      expect(response.body.user).toHaveProperty('username', 'testuser');
      expect(response.body.user).toHaveProperty('email', 'test@example.com');
      expect(response.body.tokens).toHaveProperty('accessToken');
      expect(response.body.tokens).toHaveProperty('refreshToken');
    });

    test('should return validation error for invalid email', async () => {
      const userData = {
        username: 'testuser',
        email: 'invalid-email',
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User'
      };

      require('validator').isEmail.mockReturnValueOnce(false);

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
      expect(response.body.message).toBe('Please provide a valid email address');
    });

    test('should return conflict error for existing email', async () => {
      const userData = {
        username: 'testuser',
        email: 'existing@example.com',
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User'
      };

      mockUserConstructor.emailExists.mockResolvedValueOnce(true);

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body.error).toBe('User Already Exists');
      expect(response.body.message).toBe('An account with this email already exists');
    });

    test('should return conflict error for existing username', async () => {
      const userData = {
        username: 'existinguser',
        email: 'test@example.com',
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User'
      };

      mockUserConstructor.usernameExists.mockResolvedValueOnce(true);

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body.error).toBe('User Already Exists');
      expect(response.body.message).toBe('This username is already taken');
    });

    test('should return validation error for missing fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({})
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
      expect(response.body.message).toBe('All fields are required');
    });
  });

  describe('POST /api/auth/login', () => {
    test('should login with valid credentials', async () => {
      const loginData = {
        identifier: 'test@example.com',
        password: 'TestPassword123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.user).toHaveProperty('username');
      expect(response.body.tokens).toHaveProperty('accessToken');
      expect(response.body.tokens).toHaveProperty('refreshToken');
    });

    test('should return validation error for missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
      expect(response.body.message).toBe('Email/username and password are required');
    });

    test('should return authentication failed for non-existent user', async () => {
      const loginData = {
        identifier: 'nonexistent@example.com',
        password: 'password'
      };

      mockUserConstructor.findByEmailOrUsername.mockResolvedValueOnce(null);

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.error).toBe('Authentication Failed');
      expect(response.body.message).toBe('Invalid credentials');
    });

    test('should return account locked error for locked account', async () => {
      const loginData = {
        identifier: 'test@example.com',
        password: 'password'
      };

      const lockedUser = { ...mockUser, isLocked: true };
      mockUserConstructor.findByEmailOrUsername.mockResolvedValueOnce(lockedUser);

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.error).toBe('Account Locked');
      expect(response.body.message).toBe('Account is temporarily locked due to too many failed login attempts');
    });

    test('should return account inactive error for inactive account', async () => {
      const loginData = {
        identifier: 'test@example.com',
        password: 'password'
      };

      const inactiveUser = { ...mockUser, isActive: false };
      mockUserConstructor.findByEmailOrUsername.mockResolvedValueOnce(inactiveUser);

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.error).toBe('Account Inactive');
      expect(response.body.message).toBe('Your account has been deactivated');
    });

    test('should return authentication failed for wrong password', async () => {
      const loginData = {
        identifier: 'test@example.com',
        password: 'wrongpassword'
      };

      const userWithWrongPassword = {
        ...mockUser,
        comparePassword: jest.fn().mockResolvedValue(false),
        incLoginAttempts: jest.fn().mockResolvedValue(true)
      };
      mockUserConstructor.findByEmailOrUsername.mockResolvedValueOnce(userWithWrongPassword);

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.error).toBe('Authentication Failed');
      expect(response.body.message).toBe('Invalid credentials');
      expect(userWithWrongPassword.incLoginAttempts).toHaveBeenCalled();
    });
  });

  describe('POST /api/auth/logout', () => {
    test('should logout successfully with valid token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer mock-jwt-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logged out successfully');
    });

    test('should return access denied without token', async () => {
      require('../utils/auth').authenticateToken.mockImplementationOnce((req, res, next) => {
        return res.status(401).json({
          error: 'Access denied',
          message: 'No token provided'
        });
      });

      const response = await request(app)
        .post('/api/auth/logout')
        .expect(401);

      expect(response.body.error).toBe('Access denied');
      expect(response.body.message).toBe('No token provided');
    });
  });

  describe('GET /api/auth/me', () => {
    test('should return user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer mock-jwt-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user).toHaveProperty('username');
      expect(response.body.user).toHaveProperty('email');
    });

    test('should return access denied without token', async () => {
      require('../utils/auth').authenticateToken.mockImplementationOnce((req, res, next) => {
        return res.status(401).json({
          error: 'Access denied',
          message: 'No token provided'
        });
      });

      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.error).toBe('Access denied');
      expect(response.body.message).toBe('No token provided');
    });

    test('should return user not found for non-existent user', async () => {
      mockUserConstructor.findById.mockResolvedValueOnce(null);

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer mock-jwt-token')
        .expect(404);

      expect(response.body.error).toBe('User Not Found');
      expect(response.body.message).toBe('User account not found');
    });
  });

  describe('POST /api/auth/refresh', () => {
    test('should refresh token with valid refresh token', async () => {
      const refreshData = {
        refreshToken: 'mock-refresh-token'
      };

      const response = await request(app)
        .post('/api/auth/refresh')
        .send(refreshData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Token refreshed successfully');
      expect(response.body.tokens).toHaveProperty('accessToken');
      expect(response.body.tokens).toHaveProperty('refreshToken');
    });

    test('should return validation error for missing refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({})
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
      expect(response.body.message).toBe('Refresh token is required');
    });

    test('should return invalid token for malformed token', async () => {
      const refreshData = {
        refreshToken: 'invalid-token'
      };

      require('../utils/auth').verifyToken.mockImplementationOnce(() => {
        throw new Error('Invalid token');
      });

      const response = await request(app)
        .post('/api/auth/refresh')
        .send(refreshData)
        .expect(401);

      expect(response.body.error).toBe('Invalid Token');
      expect(response.body.message).toBe('Invalid or expired refresh token');
    });

    test('should return invalid token for inactive user', async () => {
      const refreshData = {
        refreshToken: 'mock-refresh-token'
      };

      const inactiveUser = { ...mockUser, isActive: false };
      mockUserConstructor.findById.mockResolvedValueOnce(inactiveUser);

      const response = await request(app)
        .post('/api/auth/refresh')
        .send(refreshData)
        .expect(401);

      expect(response.body.error).toBe('Invalid Token');
      expect(response.body.message).toBe('User not found or inactive');
    });
  });

  describe('POST /api/auth/change-password', () => {
    test('should change password with valid data', async () => {
      const passwordData = {
        currentPassword: 'currentPass123',
        newPassword: 'NewPassword123!'
      };

      // Create a mock that supports the select chain
      const userWithPassword = {
        _id: 'mock-user-id',
        password: 'hashedCurrentPassword',
        comparePassword: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(true)
      };

      // Override the findById mock for this test to return an object with select method
      mockUserConstructor.findById.mockReturnValueOnce({
        select: jest.fn().mockResolvedValue(userWithPassword)
      });

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', 'Bearer mock-jwt-token')
        .send(passwordData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Password changed successfully');
    });

    test('should return validation error for missing passwords', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', 'Bearer mock-jwt-token')
        .send({})
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
      expect(response.body.message).toBe('Current password and new password are required');
    });

    test('should return authentication failed for wrong current password', async () => {
      const passwordData = {
        currentPassword: 'WrongPassword123!',
        newPassword: 'NewPassword123!'
      };

      const userWithWrongPassword = {
        _id: 'mock-user-id',
        password: 'hashedCurrentPassword',
        comparePassword: jest.fn().mockResolvedValue(false),
        save: jest.fn().mockResolvedValue(true)
      };

      // Override the findById mock for this test to return an object with select method
      mockUserConstructor.findById.mockReturnValueOnce({
        select: jest.fn().mockResolvedValue(userWithWrongPassword)
      });

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', 'Bearer mock-jwt-token')
        .send(passwordData)
        .expect(401);

      expect(response.body.error).toBe('Authentication Failed');
      expect(response.body.message).toBe('Current password is incorrect');
    });

    test('should return access denied without token', async () => {
      const passwordData = {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword123!'
      };

      require('../utils/auth').authenticateToken.mockImplementationOnce((req, res, next) => {
        return res.status(401).json({
          error: 'Access denied',
          message: 'No token provided'
        });
      });

      const response = await request(app)
        .post('/api/auth/change-password')
        .send(passwordData)
        .expect(401);

      expect(response.body.error).toBe('Access denied');
      expect(response.body.message).toBe('No token provided');
    });

    test('should return user not found for non-existent user', async () => {
      const passwordData = {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword123!'
      };

      // Override the findById mock for this test to return null after select
      mockUserConstructor.findById.mockReturnValueOnce({
        select: jest.fn().mockResolvedValue(null)
      });

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', 'Bearer mock-jwt-token')
        .send(passwordData)
        .expect(404);

      expect(response.body.error).toBe('User Not Found');
      expect(response.body.message).toBe('User account not found');
    });
  });

  // Reset mocks after each test
  afterEach(() => {
    jest.clearAllMocks();
    // Reset default implementations
    mockUserConstructor.emailExists.mockResolvedValue(false);
    mockUserConstructor.usernameExists.mockResolvedValue(false);
    mockUserConstructor.findByEmailOrUsername.mockResolvedValue(mockUser);
    mockUserConstructor.findById.mockResolvedValue(mockUser);
    require('validator').isEmail.mockReturnValue(true);
  });
});
