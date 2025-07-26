'use strict';

const express = require('express');
const router = express.Router();

const Note = require('../models/Note');
const { HTTP_STATUS, API_MESSAGES } = require('../constants/api');
const {
  getPaginationParams,
  getSortParams,
  getFilterParams,
  createApiResponse,
  createErrorResponse,
  validateNoteData,
  isValidObjectId
} = require('../utils/helpers');

/**
 * @route   GET /api/notes
 * @desc    Get all notes with optional filtering, pagination, and search
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    // Extract and validate query parameters
    const { page, limit, skip } = getPaginationParams(req.query);
    const sort = getSortParams(req.query.sortBy, req.query.sortOrder);
    const filter = getFilterParams(req.query);

    // Execute query with pagination
    const [notes, total] = await Promise.all([
      Note.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Note.countDocuments(filter)
    ]);

    // Prepare pagination metadata
    const pagination = {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalNotes: total,
      notesPerPage: limit,
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1
    };

    const responseData = {
      notes,
      pagination
    };

    return res.status(HTTP_STATUS.OK).json(
      createApiResponse(responseData, API_MESSAGES.NOTES_FETCHED)
    );
  } catch (error) {
    console.error('Error fetching notes:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      createErrorResponse('Failed to fetch notes', HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message)
    );
  }
});

/**
 * @route   GET /api/notes/:id
 * @desc    Get a specific note by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!isValidObjectId(id)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        createErrorResponse('Invalid note ID format', HTTP_STATUS.BAD_REQUEST)
      );
    }

    const note = await Note.findById(id).lean();
    
    if (!note) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        createErrorResponse(API_MESSAGES.NOTE_NOT_FOUND, HTTP_STATUS.NOT_FOUND)
      );
    }

    return res.status(HTTP_STATUS.OK).json(
      createApiResponse(note, 'Note retrieved successfully')
    );
  } catch (error) {
    console.error('Error fetching note:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      createErrorResponse('Failed to fetch note', HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message)
    );
  }
});

/**
 * @route   POST /api/notes
 * @desc    Create a new note
 * @access  Public
 */
router.post('/', async (req, res) => {
  try {
    // Validate and sanitize input data
    const validatedData = validateNoteData(req.body);
    
    // Create new note
    const note = new Note(validatedData);
    const savedNote = await note.save();

    return res.status(HTTP_STATUS.CREATED).json(
      createApiResponse(savedNote.toJSON(), API_MESSAGES.NOTE_CREATED)
    );
  } catch (error) {
    console.error('Error creating note:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        createErrorResponse(API_MESSAGES.VALIDATION_ERROR, HTTP_STATUS.BAD_REQUEST, validationErrors)
      );
    }

    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      createErrorResponse('Failed to create note', HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message)
    );
  }
});

/**
 * @route   PUT /api/notes/:id
 * @desc    Update an existing note
 * @access  Public
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!isValidObjectId(id)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        createErrorResponse('Invalid note ID format', HTTP_STATUS.BAD_REQUEST)
      );
    }

    // Validate and sanitize input data
    const validatedData = validateNoteData(req.body);
    
    const updatedNote = await Note.findByIdAndUpdate(
      id,
      validatedData,
      { 
        new: true, // Return the updated document
        runValidators: true, // Run schema validations
        lean: false // Return mongoose document for toJSON transform
      }
    );

    if (!updatedNote) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        createErrorResponse(API_MESSAGES.NOTE_NOT_FOUND, HTTP_STATUS.NOT_FOUND)
      );
    }

    return res.status(HTTP_STATUS.OK).json(
      createApiResponse(updatedNote.toJSON(), API_MESSAGES.NOTE_UPDATED)
    );
  } catch (error) {
    console.error('Error updating note:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        createErrorResponse(API_MESSAGES.VALIDATION_ERROR, HTTP_STATUS.BAD_REQUEST, validationErrors)
      );
    }

    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      createErrorResponse('Failed to update note', HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message)
    );
  }
});

/**
 * @route   DELETE /api/notes/:id
 * @desc    Delete a note
 * @access  Public
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!isValidObjectId(id)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        createErrorResponse('Invalid note ID format', HTTP_STATUS.BAD_REQUEST)
      );
    }

    const deletedNote = await Note.findByIdAndDelete(id).lean();

    if (!deletedNote) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        createErrorResponse(API_MESSAGES.NOTE_NOT_FOUND, HTTP_STATUS.NOT_FOUND)
      );
    }

    return res.status(HTTP_STATUS.OK).json(
      createApiResponse(deletedNote, API_MESSAGES.NOTE_DELETED)
    );
  } catch (error) {
    console.error('Error deleting note:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      createErrorResponse('Failed to delete note', HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message)
    );
  }
});

/**
 * @route   PATCH /api/notes/:id/archive
 * @desc    Archive a note
 * @access  Public
 */
router.patch('/:id/archive', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!isValidObjectId(id)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        createErrorResponse('Invalid note ID format', HTTP_STATUS.BAD_REQUEST)
      );
    }

    const note = await Note.findById(id);
    
    if (!note) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        createErrorResponse(API_MESSAGES.NOTE_NOT_FOUND, HTTP_STATUS.NOT_FOUND)
      );
    }

    const archivedNote = await note.archive();
    
    return res.status(HTTP_STATUS.OK).json(
      createApiResponse(archivedNote.toJSON(), API_MESSAGES.NOTE_ARCHIVED)
    );
  } catch (error) {
    console.error('Error archiving note:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      createErrorResponse('Failed to archive note', HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message)
    );
  }
});

/**
 * @route   PATCH /api/notes/:id/unarchive
 * @desc    Unarchive a note
 * @access  Public
 */
router.patch('/:id/unarchive', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!isValidObjectId(id)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        createErrorResponse('Invalid note ID format', HTTP_STATUS.BAD_REQUEST)
      );
    }

    const note = await Note.findById(id);
    
    if (!note) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        createErrorResponse(API_MESSAGES.NOTE_NOT_FOUND, HTTP_STATUS.NOT_FOUND)
      );
    }

    const unarchivedNote = await note.unarchive();
    
    return res.status(HTTP_STATUS.OK).json(
      createApiResponse(unarchivedNote.toJSON(), API_MESSAGES.NOTE_UNARCHIVED)
    );
  } catch (error) {
    console.error('Error unarchiving note:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      createErrorResponse('Failed to unarchive note', HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message)
    );
  }
});

/**
 * @route   GET /api/notes/stats/overview
 * @desc    Get notes statistics
 * @access  Public
 */
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await Note.getStats();
    
    return res.status(HTTP_STATUS.OK).json(
      createApiResponse(stats, 'Statistics retrieved successfully')
    );
  } catch (error) {
    console.error('Error fetching stats:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      createErrorResponse('Failed to fetch statistics', HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message)
    );
  }
});

/**
 * @route   GET /api/notes/categories/list
 * @desc    Get all unique categories
 * @access  Public
 */
router.get('/categories/list', async (req, res) => {
  try {
    const categories = await Note.distinct('category');
    
    return res.status(HTTP_STATUS.OK).json(
      createApiResponse(categories, 'Categories retrieved successfully')
    );
  } catch (error) {
    console.error('Error fetching categories:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      createErrorResponse('Failed to fetch categories', HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message)
    );
  }
});

/**
 * @route   GET /api/notes/tags/list
 * @desc    Get all unique tags
 * @access  Public
 */
router.get('/tags/list', async (req, res) => {
  try {
    const tags = await Note.distinct('tags');
    
    return res.status(HTTP_STATUS.OK).json(
      createApiResponse(tags, 'Tags retrieved successfully')
    );
  } catch (error) {
    console.error('Error fetching tags:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      createErrorResponse('Failed to fetch tags', HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message)
    );
  }
});

module.exports = router;
