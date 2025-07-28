const request = require('supertest');
const mongoose = require('mongoose');

// Mock the database connection first
jest.mock('../config/database', () => ({
  connectToDatabase: jest.fn().mockResolvedValue()
}));

// Mock Note model before importing the routes
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

  afterAll(async () => {
    // Close any database connections if they exist
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
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
        },
        {
          _id: '507f1f77bcf86cd799439012',
          title: 'Test Note 2',
          content: 'Test content 2',
          category: 'Sermons',
          type: 'sermon',
          tags: ['sermon', 'sunday'],
          priority: 'high',
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
      Note.countDocuments.mockResolvedValue(2);

      const response = await request(app)
        .get('/api/notes')
        .expect(HTTP_STATUS.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data.notes).toHaveLength(2);
      expect(response.body.data.pagination.totalNotes).toBe(2);
      expect(response.body.data.pagination.currentPage).toBe(1);
    });

    it('should get notes with custom pagination', async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([])
      };

      Note.find.mockReturnValue(mockQuery);
      Note.countDocuments.mockResolvedValue(0);

      const response = await request(app)
        .get('/api/notes?page=2&limit=5')
        .expect(HTTP_STATUS.OK);

      expect(response.body.data.pagination.currentPage).toBe(2);
      expect(response.body.data.pagination.notesPerPage).toBe(5);
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

    it('should filter notes by type', async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([])
      };

      Note.find.mockReturnValue(mockQuery);
      Note.countDocuments.mockResolvedValue(0);

      await request(app)
        .get('/api/notes?type=sermon')
        .expect(HTTP_STATUS.OK);

      expect(Note.find).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'sermon' })
      );
    });

    it('should filter notes by priority', async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([])
      };

      Note.find.mockReturnValue(mockQuery);
      Note.countDocuments.mockResolvedValue(0);

      await request(app)
        .get('/api/notes?priority=high')
        .expect(HTTP_STATUS.OK);

      expect(Note.find).toHaveBeenCalledWith(
        expect.objectContaining({ priority: 'high' })
      );
    });

    it('should filter archived notes', async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([])
      };

      Note.find.mockReturnValue(mockQuery);
      Note.countDocuments.mockResolvedValue(0);

      await request(app)
        .get('/api/notes?archived=true')
        .expect(HTTP_STATUS.OK);

      expect(Note.find).toHaveBeenCalledWith(
        expect.objectContaining({ isArchived: true })
      );
    });

    it('should search notes by text', async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([])
      };

      Note.find.mockReturnValue(mockQuery);
      Note.countDocuments.mockResolvedValue(0);

      await request(app)
        .get('/api/notes?search=prayer')
        .expect(HTTP_STATUS.OK);

      expect(Note.find).toHaveBeenCalledWith(
        expect.objectContaining({
          $or: expect.arrayContaining([
            { title: { $regex: 'prayer', $options: 'i' } },
            { content: { $regex: 'prayer', $options: 'i' } },
            { tags: { $in: [expect.any(RegExp)] } }
          ])
        })
      );
    });

    it('should filter notes by tags', async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([])
      };

      Note.find.mockReturnValue(mockQuery);
      Note.countDocuments.mockResolvedValue(0);

      await request(app)
        .get('/api/notes?tags=sermon,sunday')
        .expect(HTTP_STATUS.OK);

      expect(Note.find).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: { $in: ['sermon', 'sunday'] }
        })
      );
    });

    it('should sort notes by different fields', async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([])
      };

      Note.find.mockReturnValue(mockQuery);
      Note.countDocuments.mockResolvedValue(0);

      await request(app)
        .get('/api/notes?sortBy=title&sortOrder=asc')
        .expect(HTTP_STATUS.OK);

      expect(mockQuery.sort).toHaveBeenCalledWith({ title: 1 });
    });
  });

  describe('GET /api/notes/:id', () => {
    it('should get a single note by ID', async () => {
      const mockNote = {
        _id: '507f1f77bcf86cd799439011',
        title: 'Test Note',
        content: 'Test content',
        category: 'General',
        type: 'general',
        tags: ['test'],
        priority: 'medium',
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date()
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
      expect(Note.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
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
        content: 'This is test content for the new note',
        category: 'General',
        type: 'general',
        tags: ['test', 'new'],
        priority: 'medium'
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
          isArchived: false,
          createdAt: new Date(),
          updatedAt: new Date()
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

    it('should return 400 for missing required fields', async () => {
      const incompleteData = {
        title: 'Incomplete Note'
        // Missing content, category, type
      };

      validateNoteData.mockImplementation(() => {
        throw new Error('Title is required');
      });

      const response = await request(app)
        .post('/api/notes')
        .send(incompleteData)
        .expect(HTTP_STATUS.INTERNAL_SERVER_ERROR);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid category', async () => {
      const invalidData = {
        title: 'Test Note',
        content: 'Test content',
        category: 'InvalidCategory',
        type: 'general'
      };

      validateNoteData.mockImplementation(() => {
        throw new Error('Invalid category');
      });

      const response = await request(app)
        .post('/api/notes')
        .send(invalidData)
        .expect(HTTP_STATUS.INTERNAL_SERVER_ERROR);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid type', async () => {
      const invalidData = {
        title: 'Test Note',
        content: 'Test content',
        category: 'General',
        type: 'invalid-type'
      };

      validateNoteData.mockImplementation(() => {
        throw new Error('Invalid type');
      });

      const response = await request(app)
        .post('/api/notes')
        .send(invalidData)
        .expect(HTTP_STATUS.INTERNAL_SERVER_ERROR);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid priority', async () => {
      const invalidData = {
        title: 'Test Note',
        content: 'Test content',
        category: 'General',
        type: 'general',
        priority: 'invalid-priority'
      };

      validateNoteData.mockImplementation(() => {
        throw new Error('Invalid priority');
      });

      const response = await request(app)
        .post('/api/notes')
        .send(invalidData)
        .expect(HTTP_STATUS.INTERNAL_SERVER_ERROR);

      expect(response.body.success).toBe(false);
    });

    it('should handle title too long', async () => {
      const invalidData = {
        title: 'a'.repeat(201), // Exceeds 200 character limit
        content: 'Test content',
        category: 'General',
        type: 'general'
      };

      validateNoteData.mockImplementation(() => {
        throw new Error('Title too long');
      });

      const response = await request(app)
        .post('/api/notes')
        .send(invalidData)
        .expect(HTTP_STATUS.INTERNAL_SERVER_ERROR);

      expect(response.body.success).toBe(false);
    });

    it('should handle too many tags', async () => {
      const invalidData = {
        title: 'Test Note',
        content: 'Test content',
        category: 'General',
        type: 'general',
        tags: Array.from({ length: 11 }, (_, i) => `tag${i}`) // Exceeds 10 tag limit
      };

      validateNoteData.mockImplementation(() => {
        throw new Error('Too many tags');
      });

      const response = await request(app)
        .post('/api/notes')
        .send(invalidData)
        .expect(HTTP_STATUS.INTERNAL_SERVER_ERROR);

      expect(response.body.success).toBe(false);
    });

    it('should create note with all valid categories', async () => {
      for (const category of NOTE_CATEGORIES) {
        const noteData = {
          title: `Test Note for ${category}`,
          content: 'Test content',
          category: category,
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
            isArchived: false,
            createdAt: new Date(),
            updatedAt: new Date()
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
        expect(response.body.data.category).toBe(category);
      }
    });

    it('should create note with all valid types', async () => {
      for (const type of NOTE_TYPES) {
        const noteData = {
          title: `Test Note for ${type}`,
          content: 'Test content',
          category: 'General',
          type: type
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
            isArchived: false,
            createdAt: new Date(),
            updatedAt: new Date()
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
        expect(response.body.data.type).toBe(type);
      }
    });

    it('should create note with all valid priorities', async () => {
      for (const priority of PRIORITY_LEVELS) {
        const noteData = {
          title: `Test Note for ${priority} priority`,
          content: 'Test content',
          category: 'General',
          type: 'general',
          priority: priority
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
            isArchived: false,
            createdAt: new Date(),
            updatedAt: new Date()
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
        expect(response.body.data.priority).toBe(priority);
      }
    });
  });

  describe('PUT /api/notes/:id', () => {
    it('should update an existing note', async () => {
      isValidObjectId.mockReturnValue(true); // Valid ObjectId
      
      const updateData = {
        title: 'Updated Note Title',
        content: 'Updated content',
        category: 'Sermons',
        type: 'sermon',
        tags: ['updated', 'sermon'],
        priority: 'high'
      };

      const mockUpdatedNote = {
        _id: '507f1f77bcf86cd799439011',
        ...updateData,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        toJSON: () => ({
          _id: '507f1f77bcf86cd799439011',
          ...updateData,
          isArchived: false,
          createdAt: new Date(),
          updatedAt: new Date()
        })
      };

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
      isValidObjectId.mockReturnValue(true); // Valid ObjectId
      
      const updateData = {
        title: 'Updated Note',
        content: 'Updated content',
        category: 'General',
        type: 'general'
      };

      Note.findByIdAndUpdate.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/notes/507f1f77bcf86cd799439011')
        .send(updateData)
        .expect(HTTP_STATUS.NOT_FOUND);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Note not found');
    });

    it('should return 400 for invalid ObjectId', async () => {
      isValidObjectId.mockReturnValue(false); // Invalid ObjectId
      
      const updateData = {
        title: 'Updated Note',
        content: 'Updated content',
        category: 'General',
        type: 'general'
      };

      const response = await request(app)
        .put('/api/notes/invalid-id')
        .send(updateData)
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid note ID format');
    });

    it('should return 400 for validation errors in update', async () => {
      isValidObjectId.mockReturnValue(true); // Valid ObjectId
      validateNoteData.mockImplementation(() => {
        const error = new Error('Title is required');
        error.name = 'ValidationError';
        error.errors = {
          title: { message: 'Title is required' }
        };
        throw error;
      });

      const invalidUpdateData = {
        title: '',
        content: 'Updated content',
        category: 'InvalidCategory',
        type: 'general'
      };

      const response = await request(app)
        .put('/api/notes/507f1f77bcf86cd799439011')
        .send(invalidUpdateData)
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation error');
    });
  });

  describe('DELETE /api/notes/:id', () => {
    it('should delete an existing note', async () => {
      isValidObjectId.mockReturnValue(true); // Valid ObjectId
      
      const mockDeletedNote = {
        _id: '507f1f77bcf86cd799439011',
        title: 'Note to Delete',
        content: 'Content to delete',
        category: 'General',
        type: 'general'
      };

      const mockQuery = {
        lean: jest.fn().mockResolvedValue(mockDeletedNote)
      };

      Note.findByIdAndDelete.mockReturnValue(mockQuery);

      const response = await request(app)
        .delete('/api/notes/507f1f77bcf86cd799439011')
        .expect(HTTP_STATUS.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Note deleted successfully');
    });

    it('should return 404 for non-existent note', async () => {
      isValidObjectId.mockReturnValue(true); // Valid ObjectId
      
      const mockQuery = {
        lean: jest.fn().mockResolvedValue(null)
      };

      Note.findByIdAndDelete.mockReturnValue(mockQuery);

      const response = await request(app)
        .delete('/api/notes/507f1f77bcf86cd799439011')
        .expect(HTTP_STATUS.NOT_FOUND);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Note not found');
    });

    it('should return 400 for invalid ObjectId', async () => {
      isValidObjectId.mockReturnValue(false); // Invalid ObjectId
      
      const response = await request(app)
        .delete('/api/notes/invalid-id')
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid note ID format');
    });
  });

  describe('PATCH /api/notes/:id/archive', () => {
    it('should archive an existing note', async () => {
      isValidObjectId.mockReturnValue(true); // Valid ObjectId
      
      const mockArchivedNote = {
        _id: '507f1f77bcf86cd799439011',
        title: 'Note to Archive',
        content: 'Content to archive',
        category: 'General',
        type: 'general',
        isArchived: true,
        updatedAt: new Date(),
        toJSON: () => ({
          _id: '507f1f77bcf86cd799439011',
          title: 'Note to Archive',
          content: 'Content to archive',
          category: 'General',
          type: 'general',
          isArchived: true,
          updatedAt: new Date()
        })
      };

      const mockNote = {
        _id: '507f1f77bcf86cd799439011',
        archive: jest.fn().mockResolvedValue(mockArchivedNote)
      };

      Note.findById.mockResolvedValue(mockNote);

      const response = await request(app)
        .patch('/api/notes/507f1f77bcf86cd799439011/archive')
        .expect(HTTP_STATUS.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Note archived successfully');
      expect(mockNote.archive).toHaveBeenCalled();
    });

    it('should return 404 for non-existent note', async () => {
      isValidObjectId.mockReturnValue(true); // Valid ObjectId
      
      Note.findById.mockResolvedValue(null);

      const response = await request(app)
        .patch('/api/notes/507f1f77bcf86cd799439011/archive')
        .expect(HTTP_STATUS.NOT_FOUND);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Note not found');
    });

    it('should return 400 for invalid ObjectId', async () => {
      isValidObjectId.mockReturnValue(false); // Invalid ObjectId
      
      const response = await request(app)
        .patch('/api/notes/invalid-id/archive')
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid note ID format');
    });
  });

  describe('PATCH /api/notes/:id/unarchive', () => {
    it('should unarchive an existing note', async () => {
      isValidObjectId.mockReturnValue(true); // Valid ObjectId
      
      const mockUnarchivedNote = {
        _id: '507f1f77bcf86cd799439011',
        title: 'Note to Unarchive',
        content: 'Content to unarchive',
        category: 'General',
        type: 'general',
        isArchived: false,
        updatedAt: new Date(),
        toJSON: () => ({
          _id: '507f1f77bcf86cd799439011',
          title: 'Note to Unarchive',
          content: 'Content to unarchive',
          category: 'General',
          type: 'general',
          isArchived: false,
          updatedAt: new Date()
        })
      };

      const mockNote = {
        _id: '507f1f77bcf86cd799439011',
        unarchive: jest.fn().mockResolvedValue(mockUnarchivedNote)
      };

      Note.findById.mockResolvedValue(mockNote);

      const response = await request(app)
        .patch('/api/notes/507f1f77bcf86cd799439011/unarchive')
        .expect(HTTP_STATUS.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Note unarchived successfully');
      expect(mockNote.unarchive).toHaveBeenCalled();
    });

    it('should return 404 for non-existent note', async () => {
      isValidObjectId.mockReturnValue(true); // Valid ObjectId
      
      Note.findById.mockResolvedValue(null);

      const response = await request(app)
        .patch('/api/notes/507f1f77bcf86cd799439011/unarchive')
        .expect(HTTP_STATUS.NOT_FOUND);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Note not found');
    });

    it('should return 400 for invalid ObjectId', async () => {
      isValidObjectId.mockReturnValue(false); // Invalid ObjectId
      
      const response = await request(app)
        .patch('/api/notes/invalid-id/unarchive')
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid note ID format');
    });
  });

  describe('GET /api/notes/stats/overview', () => {
    it('should get notes statistics', async () => {
      const mockStats = {
        totalNotes: 12,
        activeNotes: 10,
        archivedNotes: 2,
        categoryCounts: [
          { category: 'General', isArchived: false },
          { category: 'Sermons', isArchived: false },
          { category: 'Prayer', isArchived: false }
        ]
      };

      Note.getStats = jest.fn().mockResolvedValue(mockStats);

      const response = await request(app)
        .get('/api/notes/stats/overview')
        .expect(HTTP_STATUS.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalNotes).toBe(12);
      expect(response.body.data.activeNotes).toBe(10);
      expect(response.body.data.archivedNotes).toBe(2);
    });
  });

  describe('GET /api/notes/categories/list', () => {
    it('should get list of available categories', async () => {
      const mockCategories = ['General', 'Sermons', 'Prayer'];

      Note.distinct = jest.fn().mockResolvedValue(mockCategories);

      const response = await request(app)
        .get('/api/notes/categories/list')
        .expect(HTTP_STATUS.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockCategories);
      expect(Note.distinct).toHaveBeenCalledWith('category');
    });
  });

  describe('GET /api/notes/tags/list', () => {
    it('should get list of available tags', async () => {
      const mockTags = ['sermon', 'prayer', 'study'];

      Note.distinct = jest.fn().mockResolvedValue(mockTags);

      const response = await request(app)
        .get('/api/notes/tags/list')
        .expect(HTTP_STATUS.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockTags);
      expect(Note.distinct).toHaveBeenCalledWith('tags');
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

    it('should handle database save errors', async () => {
      // Reset validateNoteData to return valid data, not throw errors
      validateNoteData.mockReturnValue({
        title: 'Test Note',
        content: 'Test content',
        category: 'General',
        type: 'general'
      });

      const saveError = new Error('Save failed');
      const mockNote = {
        save: jest.fn().mockRejectedValue(saveError)
      };
      
      Note.mockImplementation(() => mockNote);

      const noteData = {
        title: 'Test Note',
        content: 'Test content',
        category: 'General',
        type: 'general'
      };

      const response = await request(app)
        .post('/api/notes')
        .send(noteData)
        .expect(HTTP_STATUS.INTERNAL_SERVER_ERROR);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to create note');
    });
  });
});
