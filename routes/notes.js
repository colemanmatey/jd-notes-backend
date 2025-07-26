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
 * @route   GET /api/notes/favorites
 * @desc    Get all favorite notes
 * @access  Public
 */
router.get('/favorites', async (req, res) => {
  try {
    const includeArchived = req.query.includeArchived === 'true';
    const notes = await Note.getFavorites(includeArchived);
    
    return res.status(HTTP_STATUS.OK).json(
      createApiResponse(notes, 'Favorite notes retrieved successfully')
    );
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      createErrorResponse('Failed to fetch favorite notes', HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message)
    );
  }
});

/**
 * @route   GET /api/notes/recent
 * @desc    Get recently modified notes
 * @access  Public
 */
router.get('/recent', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const includeArchived = req.query.includeArchived === 'true';
    
    const notes = await Note.getRecentlyModified(days, includeArchived);
    
    return res.status(HTTP_STATUS.OK).json(
      createApiResponse(notes, `Recent notes from last ${days} days retrieved successfully`)
    );
  } catch (error) {
    console.error('Error fetching recent notes:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      createErrorResponse('Failed to fetch recent notes', HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message)
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

/**
 * @route   GET /api/notes/export
 * @desc    Export notes in JSON format
 * @access  Public
 */
router.get('/export', async (req, res) => {
  try {
    const includeArchived = req.query.includeArchived === 'true';
    const format = req.query.format || 'json';
    
    const filter = includeArchived ? {} : { isArchived: false };
    const notes = await Note.find(filter).sort({ createdAt: -1 }).lean();
    
    const exportData = {
      exportDate: new Date().toISOString(),
      totalNotes: notes.length,
      includeArchived,
      notes
    };
    
    if (format === 'csv') {
      // Simple CSV export
      const csv = [
        'ID,Title,Content,Category,Type,Tags,Priority,Is Archived,Is Favorite,Created At,Updated At',
        ...notes.map(note => [
          note._id,
          `"${note.title.replace(/"/g, '""')}"`,
          `"${note.content.replace(/"/g, '""')}"`,
          note.category,
          note.type,
          `"${note.tags.join(', ')}"`,
          note.priority,
          note.isArchived,
          note.isFavorite,
          note.createdAt,
          note.updatedAt
        ].join(','))
      ].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="notes-export.csv"');
      return res.send(csv);
    }
    
    // JSON export (default)
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="notes-export.json"');
    return res.json(exportData);
    
  } catch (error) {
    console.error('Error exporting notes:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      createErrorResponse('Failed to export notes', HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message)
    );
  }
});

/**
 * @route   POST /api/notes/search/advanced
 * @desc    Advanced search with multiple filters
 * @access  Public
 */
router.post('/search/advanced', async (req, res) => {
  try {
    const searchParams = req.body;
    const notes = await Note.advancedSearch(searchParams);
    
    return res.status(HTTP_STATUS.OK).json(
      createApiResponse(notes, 'Advanced search completed successfully')
    );
  } catch (error) {
    console.error('Error in advanced search:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      createErrorResponse('Failed to perform advanced search', HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message)
    );
  }
});

/**
 * @route   POST /api/notes/bulk/archive
 * @desc    Archive multiple notes
 * @access  Public
 */
router.post('/bulk/archive', async (req, res) => {
  try {
    const { noteIds } = req.body;
    
    if (!Array.isArray(noteIds) || noteIds.length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        createErrorResponse('Note IDs array is required', HTTP_STATUS.BAD_REQUEST)
      );
    }
    
    // Validate all ObjectIds
    const invalidIds = noteIds.filter(id => !isValidObjectId(id));
    if (invalidIds.length > 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        createErrorResponse('Invalid note ID format(s) detected', HTTP_STATUS.BAD_REQUEST)
      );
    }
    
    const result = await Note.bulkArchive(noteIds);
    
    return res.status(HTTP_STATUS.OK).json(
      createApiResponse(
        { modifiedCount: result.modifiedCount, requestedCount: noteIds.length },
        `${result.modifiedCount} notes archived successfully`
      )
    );
  } catch (error) {
    console.error('Error in bulk archive:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      createErrorResponse('Failed to archive notes', HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message)
    );
  }
});

/**
 * @route   POST /api/notes/bulk/unarchive
 * @desc    Unarchive multiple notes
 * @access  Public
 */
router.post('/bulk/unarchive', async (req, res) => {
  try {
    const { noteIds } = req.body;
    
    if (!Array.isArray(noteIds) || noteIds.length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        createErrorResponse('Note IDs array is required', HTTP_STATUS.BAD_REQUEST)
      );
    }
    
    // Validate all ObjectIds
    const invalidIds = noteIds.filter(id => !isValidObjectId(id));
    if (invalidIds.length > 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        createErrorResponse('Invalid note ID format(s) detected', HTTP_STATUS.BAD_REQUEST)
      );
    }
    
    const result = await Note.bulkUnarchive(noteIds);
    
    return res.status(HTTP_STATUS.OK).json(
      createApiResponse(
        { modifiedCount: result.modifiedCount, requestedCount: noteIds.length },
        `${result.modifiedCount} notes unarchived successfully`
      )
    );
  } catch (error) {
    console.error('Error in bulk unarchive:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      createErrorResponse('Failed to unarchive notes', HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message)
    );
  }
});

/**
 * @route   POST /api/notes/bulk/add-tag
 * @desc    Add a tag to multiple notes
 * @access  Public
 */
router.post('/bulk/add-tag', async (req, res) => {
  try {
    const { noteIds, tag } = req.body;
    
    if (!Array.isArray(noteIds) || noteIds.length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        createErrorResponse('Note IDs array is required', HTTP_STATUS.BAD_REQUEST)
      );
    }
    
    if (!tag || typeof tag !== 'string' || tag.trim().length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        createErrorResponse('Tag is required and must be a non-empty string', HTTP_STATUS.BAD_REQUEST)
      );
    }
    
    // Validate all ObjectIds
    const invalidIds = noteIds.filter(id => !isValidObjectId(id));
    if (invalidIds.length > 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        createErrorResponse('Invalid note ID format(s) detected', HTTP_STATUS.BAD_REQUEST)
      );
    }
    
    const result = await Note.bulkAddTag(noteIds, tag);
    
    return res.status(HTTP_STATUS.OK).json(
      createApiResponse(
        { modifiedCount: result.modifiedCount, requestedCount: noteIds.length, tag: tag.toLowerCase().trim() },
        `Tag "${tag}" added to ${result.modifiedCount} notes successfully`
      )
    );
  } catch (error) {
    console.error('Error in bulk add tag:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      createErrorResponse('Failed to add tag to notes', HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message)
    );
  }
});

/**
 * @route   POST /api/notes/bulk/remove-tag
 * @desc    Remove a tag from multiple notes
 * @access  Public
 */
router.post('/bulk/remove-tag', async (req, res) => {
  try {
    const { noteIds, tag } = req.body;
    
    if (!Array.isArray(noteIds) || noteIds.length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        createErrorResponse('Note IDs array is required', HTTP_STATUS.BAD_REQUEST)
      );
    }
    
    if (!tag || typeof tag !== 'string' || tag.trim().length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        createErrorResponse('Tag is required and must be a non-empty string', HTTP_STATUS.BAD_REQUEST)
      );
    }
    
    // Validate all ObjectIds
    const invalidIds = noteIds.filter(id => !isValidObjectId(id));
    if (invalidIds.length > 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        createErrorResponse('Invalid note ID format(s) detected', HTTP_STATUS.BAD_REQUEST)
      );
    }
    
    const result = await Note.bulkRemoveTag(noteIds, tag);
    
    return res.status(HTTP_STATUS.OK).json(
      createApiResponse(
        { modifiedCount: result.modifiedCount, requestedCount: noteIds.length, tag: tag.toLowerCase().trim() },
        `Tag "${tag}" removed from ${result.modifiedCount} notes successfully`
      )
    );
  } catch (error) {
    console.error('Error in bulk remove tag:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      createErrorResponse('Failed to remove tag from notes', HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message)
    );
  }
});

/**
 * @route   POST /api/notes/:id/duplicate
 * @desc    Create a duplicate of an existing note
 * @access  Public
 */
router.post('/:id/duplicate', async (req, res) => {
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

    const duplicatedNote = await note.duplicate();
    
    return res.status(HTTP_STATUS.CREATED).json(
      createApiResponse(duplicatedNote.toJSON(), 'Note duplicated successfully')
    );
  } catch (error) {
    console.error('Error duplicating note:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      createErrorResponse('Failed to duplicate note', HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message)
    );
  }
});

/**
 * @route   DELETE /api/notes/bulk/delete
 * @desc    Delete multiple notes permanently
 * @access  Public
 */
router.delete('/bulk/delete', async (req, res) => {
  try {
    const { noteIds } = req.body;
    
    if (!Array.isArray(noteIds) || noteIds.length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        createErrorResponse('Note IDs array is required', HTTP_STATUS.BAD_REQUEST)
      );
    }
    
    // Validate all ObjectIds
    const invalidIds = noteIds.filter(id => !isValidObjectId(id));
    if (invalidIds.length > 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        createErrorResponse('Invalid note ID format(s) detected', HTTP_STATUS.BAD_REQUEST)
      );
    }
    
    const result = await Note.bulkDelete(noteIds);
    
    return res.status(HTTP_STATUS.OK).json(
      createApiResponse(
        { deletedCount: result.deletedCount, requestedCount: noteIds.length },
        `${result.deletedCount} notes deleted successfully`
      )
    );
  } catch (error) {
    console.error('Error in bulk delete:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      createErrorResponse('Failed to delete notes', HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message)
    );
  }
});

/**
 * @route   PATCH /api/notes/:id/favorite
 * @desc    Toggle favorite status of a note
 * @access  Public
 */
router.patch('/:id/favorite', async (req, res) => {
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

    const updatedNote = await note.toggleFavorite();
    
    const message = updatedNote.isFavorite 
      ? 'Note added to favorites' 
      : 'Note removed from favorites';
    
    return res.status(HTTP_STATUS.OK).json(
      createApiResponse(updatedNote.toJSON(), message)
    );
  } catch (error) {
    console.error('Error toggling favorite:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      createErrorResponse('Failed to toggle favorite', HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message)
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

module.exports = router;
