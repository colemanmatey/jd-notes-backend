const request = require('supertest');

// Mock the database connection first
jest.mock('../config/database', () => ({
  connectToDatabase: jest.fn().mockResolvedValue()
}));

// Mock Note model
jest.mock('../models/Note');
const Note = require('../models/Note');

// Mock helpers
jest.mock('../utils/helpers', () => ({
  ...jest.requireActual('../utils/helpers'),
  validateNoteData: jest.fn(),
  isValidObjectId: jest.fn()
}));

// Import constants for testing
const { HTTP_STATUS, NOTE_CATEGORIES, NOTE_TYPES, PRIORITY_LEVELS } = require('../constants/api');

// Import helpers after mocking
const { validateNoteData, isValidObjectId } = require('../utils/helpers');

// Import the app after mocks
const app = require('../server');

describe('Notes API Endpoints', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('GET /api/notes', () => {
    it('should get all notes with default pagination', async () => {
      const mockNotes = [
        {
          _id: '507f1f77bcf86cd799439011',
          title: 'Test Note 1',
          content: 'Test content 1',
          category: 'General',
          type: 'general',
          tags: ['test'],
          priority: 'medium',
          isArchived: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockNotes)
      };

      Note.find.mockReturnValue(mockQuery);
      Note.countDocuments.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/notes')
        .expect(HTTP_STATUS.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data.notes).toHaveLength(1);
      expect(response.body.data.pagination.totalNotes).toBe(1);
    });

    it('should filter notes by category', async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([])
      };

      Note.find.mockReturnValue(mockQuery);
      Note.countDocuments.mockResolvedValue(0);

      await request(app)
        .get('/api/notes?category=Sermons')
        .expect(HTTP_STATUS.OK);

      expect(Note.find).toHaveBeenCalledWith(
        expect.objectContaining({ category: 'Sermons' })
      );
    });
  });

  describe('GET /api/notes/:id', () => {
    it('should get a single note by ID', async () => {
      const mockNote = {
        _id: '507f1f77bcf86cd799439011',
        title: 'Test Note',
        content: 'Test content',
        category: 'General',
        type: 'general'
      };

      const mockQuery = {
        lean: jest.fn().mockResolvedValue(mockNote)
      };

      Note.findById.mockReturnValue(mockQuery);
      isValidObjectId.mockReturnValue(true);

      const response = await request(app)
        .get('/api/notes/507f1f77bcf86cd799439011')
        .expect(HTTP_STATUS.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Test Note');
    });

    it('should return 404 for non-existent note', async () => {
      const mockQuery = {
        lean: jest.fn().mockResolvedValue(null)
      };

      Note.findById.mockReturnValue(mockQuery);
      isValidObjectId.mockReturnValue(true);

      const response = await request(app)
        .get('/api/notes/507f1f77bcf86cd799439011')
        .expect(HTTP_STATUS.NOT_FOUND);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Note not found');
    });

    it('should return 400 for invalid ObjectId', async () => {
      isValidObjectId.mockReturnValue(false);

      const response = await request(app)
        .get('/api/notes/invalid-id')
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid note ID format');
    });
  });

  describe('POST /api/notes', () => {
    it('should create a new note with valid data', async () => {
      const noteData = {
        title: 'New Test Note',
        content: 'Test content',
        category: 'General',
        type: 'general'
      };

      const mockCreatedNote = {
        _id: '507f1f77bcf86cd799439011',
        ...noteData,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        toJSON: jest.fn().mockReturnValue({
          _id: '507f1f77bcf86cd799439011',
          ...noteData,
          isArchived: false
        })
      };

      validateNoteData.mockReturnValue(noteData);

      const mockNote = {
        save: jest.fn().mockResolvedValue(mockCreatedNote)
      };

      Note.mockImplementation(() => mockNote);

      const response = await request(app)
        .post('/api/notes')
        .send(noteData)
        .expect(HTTP_STATUS.CREATED);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(noteData.title);
      expect(response.body.message).toBe('Note created successfully');
    });

    it('should handle validation errors', async () => {
      const invalidData = {
        title: 'Test Note'
        // Missing required fields
      };

      validateNoteData.mockImplementation(() => {
        throw new Error('Validation failed');
      });

      const response = await request(app)
        .post('/api/notes')
        .send(invalidData)
        .expect(HTTP_STATUS.INTERNAL_SERVER_ERROR);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to create note');
    });
  });

  describe('PUT /api/notes/:id', () => {
    it('should update an existing note', async () => {
      const updateData = {
        title: 'Updated Note Title',
        content: 'Updated content',
        category: 'Sermons',
        type: 'sermon'
      };

      const mockUpdatedNote = {
        _id: '507f1f77bcf86cd799439011',
        ...updateData,
        isArchived: false,
        updatedAt: new Date()
      };

      isValidObjectId.mockReturnValue(true);
      validateNoteData.mockReturnValue(updateData);
      Note.findByIdAndUpdate.mockResolvedValue(mockUpdatedNote);

      const response = await request(app)
        .put('/api/notes/507f1f77bcf86cd799439011')
        .send(updateData)
        .expect(HTTP_STATUS.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(updateData.title);
      expect(response.body.message).toBe('Note updated successfully');
    });

    it('should return 404 for non-existent note', async () => {
      const updateData = {
        title: 'Updated Note',
        content: 'Updated content',
        category: 'General',
        type: 'general'
      };

      isValidObjectId.mockReturnValue(true);
      validateNoteData.mockReturnValue(updateData);
      Note.findByIdAndUpdate.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/notes/507f1f77bcf86cd799439011')
        .send(updateData)
        .expect(HTTP_STATUS.NOT_FOUND);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Note not found');
    });
  });

  describe('DELETE /api/notes/:id', () => {
    it('should delete an existing note', async () => {
      const mockDeletedNote = {
        _id: '507f1f77bcf86cd799439011',
        title: 'Note to Delete'
      };

      isValidObjectId.mockReturnValue(true);
      Note.findByIdAndDelete.mockResolvedValue(mockDeletedNote);

      const response = await request(app)
        .delete('/api/notes/507f1f77bcf86cd799439011')
        .expect(HTTP_STATUS.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Note deleted successfully');
    });

    it('should return 404 for non-existent note', async () => {
      isValidObjectId.mockReturnValue(true);
      Note.findByIdAndDelete.mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/notes/507f1f77bcf86cd799439011')
        .expect(HTTP_STATUS.NOT_FOUND);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Note not found');
    });
  });

  describe('PATCH /api/notes/:id/archive', () => {
    it('should archive an existing note', async () => {
      const mockArchivedNote = {
        _id: '507f1f77bcf86cd799439011',
        title: 'Note to Archive',
        isArchived: true
      };

      isValidObjectId.mockReturnValue(true);
      Note.findByIdAndUpdate.mockResolvedValue(mockArchivedNote);

      const response = await request(app)
        .patch('/api/notes/507f1f77bcf86cd799439011/archive')
        .expect(HTTP_STATUS.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Note archived successfully');
    });
  });

  describe('PATCH /api/notes/:id/unarchive', () => {
    it('should unarchive an existing note', async () => {
      const mockUnarchivedNote = {
        _id: '507f1f77bcf86cd799439011',
        title: 'Note to Unarchive',
        isArchived: false
      };

      isValidObjectId.mockReturnValue(true);
      Note.findByIdAndUpdate.mockResolvedValue(mockUnarchivedNote);

      const response = await request(app)
        .patch('/api/notes/507f1f77bcf86cd799439011/unarchive')
        .expect(HTTP_STATUS.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Note unarchived successfully');
    });
  });

  describe('GET /api/notes/stats/overview', () => {
    it('should get notes statistics', async () => {
      const mockStats = [
        { _id: 'General', count: 5 },
        { _id: 'Sermons', count: 3 }
      ];

      Note.aggregate.mockResolvedValue(mockStats);
      Note.countDocuments.mockImplementation((filter) => {
        if (filter && filter.isArchived === false) return Promise.resolve(10);
        if (filter && filter.isArchived === true) return Promise.resolve(2);
        return Promise.resolve(12);
      });

      const response = await request(app)
        .get('/api/notes/stats/overview')
        .expect(HTTP_STATUS.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data.overview).toBeDefined();
      expect(response.body.data.categories).toBeDefined();
    });
  });

  describe('GET /api/notes/categories/list', () => {
    it('should get list of available categories', async () => {
      const mockCategories = [
        { _id: 'General', count: 5 },
        { _id: 'Sermons', count: 3 }
      ];

      Note.aggregate.mockResolvedValue(mockCategories);

      const response = await request(app)
        .get('/api/notes/categories/list')
        .expect(HTTP_STATUS.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data.categories).toEqual(mockCategories);
      expect(response.body.data.total).toBe(2);
    });
  });

  describe('GET /api/notes/tags/list', () => {
    it('should get list of available tags', async () => {
      const mockTags = [
        { _id: 'sermon', count: 5 },
        { _id: 'prayer', count: 3 }
      ];

      Note.aggregate.mockResolvedValue(mockTags);

      const response = await request(app)
        .get('/api/notes/tags/list')
        .expect(HTTP_STATUS.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tags).toEqual(mockTags);
      expect(response.body.data.total).toBe(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockRejectedValue(new Error('Database connection failed'))
      };

      Note.find.mockReturnValue(mockQuery);

      const response = await request(app)
        .get('/api/notes')
        .expect(HTTP_STATUS.INTERNAL_SERVER_ERROR);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to fetch notes');
    });
  });
});
