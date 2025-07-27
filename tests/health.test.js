const request = require('supertest');

// Mock database connection for testing
jest.mock('../config/database', () => ({
  connectToDatabase: jest.fn().mockResolvedValue(true),
  closeDatabase: jest.fn().mockResolvedValue(true)
}));

// Mock mongoose completely
jest.mock('mongoose', () => {
  const mockSchema = jest.fn().mockImplementation((definition) => ({
    pre: jest.fn(),
    post: jest.fn(),
    methods: {},
    statics: {},
    index: jest.fn(), // Add index method
    virtual: jest.fn().mockReturnValue({
      get: jest.fn(),
      set: jest.fn()
    })
  }));
  
  return {
    Schema: mockSchema,
    model: jest.fn().mockReturnValue({}),
    connection: {
      readyState: 1,
      db: { admin: jest.fn() }
    },
    connect: jest.fn().mockResolvedValue(true),
    disconnect: jest.fn().mockResolvedValue(true)
  };
});

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn().mockResolvedValue(true),
  genSalt: jest.fn().mockResolvedValue('salt')
}));

// Mock validator
jest.mock('validator', () => ({
  isEmail: jest.fn().mockReturnValue(true),
  escape: jest.fn(str => str),
  trim: jest.fn(str => str)
}));

const app = require('../server');

describe('Health Check', () => {
  it('should return 200 for health check endpoint', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);

    expect(response.body.status).toBe('OK');
    expect(response.body.message).toBe('JD Notes Backend is running successfully');
    expect(response.body.timestamp).toBeDefined();
  });

  it('should return 404 for non-existent endpoint', async () => {
    const response = await request(app)
      .get('/api/non-existent')
      .expect(404);

    expect(response.body.error).toBe('Route not found');
  });
});
