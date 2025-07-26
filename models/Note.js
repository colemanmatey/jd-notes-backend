'use strict';

const mongoose = require('mongoose');
const { 
  NOTE_CATEGORIES, 
  NOTE_TYPES, 
  PRIORITY_LEVELS, 
  VALIDATION 
} = require('../constants/api');

/**
 * Note Schema Definition
 */
const noteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    minlength: [VALIDATION.NOTE.TITLE_MIN_LENGTH, `Title must be at least ${VALIDATION.NOTE.TITLE_MIN_LENGTH} character`],
    maxlength: [VALIDATION.NOTE.TITLE_MAX_LENGTH, `Title cannot exceed ${VALIDATION.NOTE.TITLE_MAX_LENGTH} characters`],
    index: true // Add index for better search performance
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    trim: true,
    minlength: [VALIDATION.NOTE.CONTENT_MIN_LENGTH, 'Content cannot be empty']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    enum: {
      values: NOTE_CATEGORIES,
      message: `Category must be one of: ${NOTE_CATEGORIES.join(', ')}`
    },
    index: true
  },
  type: {
    type: String,
    required: [true, 'Type is required'],
    trim: true,
    lowercase: true,
    enum: {
      values: NOTE_TYPES,
      message: `Type must be one of: ${NOTE_TYPES.join(', ')}`
    },
    index: true
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
    maxlength: [VALIDATION.NOTE.TAG_MAX_LENGTH, `Tag cannot exceed ${VALIDATION.NOTE.TAG_MAX_LENGTH} characters`],
    validate: {
      validator: function() {
        return this.tags.length <= VALIDATION.NOTE.MAX_TAGS;
      },
      message: `Cannot have more than ${VALIDATION.NOTE.MAX_TAGS} tags`
    }
  }],
  isArchived: {
    type: Boolean,
    default: false,
    index: true
  },
  isFavorite: {
    type: Boolean,
    default: false,
    index: true
  },
  priority: {
    type: String,
    enum: {
      values: PRIORITY_LEVELS,
      message: `Priority must be one of: ${PRIORITY_LEVELS.join(', ')}`
    },
    default: 'medium',
    lowercase: true,
    index: true
  }
}, {
  timestamps: true,
  toJSON: { 
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  },
  toObject: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Compound indexes for better query performance
noteSchema.index({ category: 1, type: 1 });
noteSchema.index({ tags: 1 });
noteSchema.index({ createdAt: -1 });
noteSchema.index({ isArchived: 1, createdAt: -1 });
noteSchema.index({ priority: 1, createdAt: -1 });
noteSchema.index({ isFavorite: 1, createdAt: -1 });
noteSchema.index({ updatedAt: -1 });

// Text search index for title and content
noteSchema.index({ 
  title: 'text', 
  content: 'text' 
}, {
  weights: {
    title: 10,
    content: 5
  },
  name: 'note_text_index'
});

// Pre-save middleware for data validation and sanitization
noteSchema.pre('save', function(next) {
  // Remove duplicate tags
  if (this.tags && this.tags.length > 0) {
    this.tags = [...new Set(this.tags.filter(tag => tag && tag.trim()))];
  }
  
  next();
});

// Instance methods
noteSchema.methods.archive = function() {
  this.isArchived = true;
  return this.save();
};

noteSchema.methods.unarchive = function() {
  this.isArchived = false;
  return this.save();
};

noteSchema.methods.addTag = function(tag) {
  if (!tag || typeof tag !== 'string') {
    throw new Error('Tag must be a non-empty string');
  }
  
  const sanitizedTag = tag.toLowerCase().trim();
  
  if (sanitizedTag.length > VALIDATION.NOTE.TAG_MAX_LENGTH) {
    throw new Error(`Tag cannot exceed ${VALIDATION.NOTE.TAG_MAX_LENGTH} characters`);
  }
  
  if (!this.tags.includes(sanitizedTag)) {
    if (this.tags.length >= VALIDATION.NOTE.MAX_TAGS) {
      throw new Error(`Cannot have more than ${VALIDATION.NOTE.MAX_TAGS} tags`);
    }
    this.tags.push(sanitizedTag);
  }
  
  return this.save();
};

noteSchema.methods.removeTag = function(tag) {
  const sanitizedTag = tag.toLowerCase().trim();
  this.tags = this.tags.filter(t => t !== sanitizedTag);
  return this.save();
};

noteSchema.methods.toggleFavorite = function() {
  this.isFavorite = !this.isFavorite;
  return this.save();
};

noteSchema.methods.duplicate = async function() {
  const Note = this.constructor;
  const duplicateData = this.toObject();
  
  // Remove fields that should not be duplicated
  delete duplicateData._id;
  delete duplicateData.createdAt;
  delete duplicateData.updatedAt;
  
  // Modify title to indicate it's a copy
  duplicateData.title = `${duplicateData.title} (Copy)`;
  
  const duplicateNote = new Note(duplicateData);
  return await duplicateNote.save();
};

// Static methods
noteSchema.statics.findByCategory = function(category, includeArchived = false) {
  const filter = { category };
  if (!includeArchived) {
    filter.isArchived = false;
  }
  return this.find(filter).sort({ createdAt: -1 });
};

noteSchema.statics.findByType = function(type, includeArchived = false) {
  const filter = { type };
  if (!includeArchived) {
    filter.isArchived = false;
  }
  return this.find(filter).sort({ createdAt: -1 });
};

noteSchema.statics.findByPriority = function(priority, includeArchived = false) {
  const filter = { priority };
  if (!includeArchived) {
    filter.isArchived = false;
  }
  return this.find(filter).sort({ createdAt: -1 });
};

noteSchema.statics.searchNotes = function(searchTerm, includeArchived = false) {
  const filter = {
    $and: [
      includeArchived ? {} : { isArchived: false },
      {
        $or: [
          { title: { $regex: searchTerm, $options: 'i' } },
          { content: { $regex: searchTerm, $options: 'i' } },
          { tags: { $in: [new RegExp(searchTerm, 'i')] } }
        ]
      }
    ]
  };
  
  return this.find(filter).sort({ createdAt: -1 });
};

noteSchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalNotes: { $sum: 1 },
        archivedNotes: {
          $sum: { $cond: [{ $eq: ['$isArchived', true] }, 1, 0] }
        },
        activeNotes: {
          $sum: { $cond: [{ $eq: ['$isArchived', false] }, 1, 0] }
        },
        favoriteNotes: {
          $sum: { $cond: [{ $eq: ['$isFavorite', true] }, 1, 0] }
        },
        categoryCounts: {
          $push: {
            category: '$category',
            isArchived: '$isArchived'
          }
        }
      }
    }
  ]);
  
  return stats[0] || {
    totalNotes: 0,
    archivedNotes: 0,
    activeNotes: 0,
    favoriteNotes: 0,
    categoryCounts: []
  };
};

// Bulk operations
noteSchema.statics.bulkArchive = function(noteIds) {
  return this.updateMany(
    { _id: { $in: noteIds } },
    { $set: { isArchived: true } }
  );
};

noteSchema.statics.bulkUnarchive = function(noteIds) {
  return this.updateMany(
    { _id: { $in: noteIds } },
    { $set: { isArchived: false } }
  );
};

noteSchema.statics.bulkDelete = function(noteIds) {
  return this.deleteMany({ _id: { $in: noteIds } });
};

noteSchema.statics.bulkAddTag = function(noteIds, tag) {
  const sanitizedTag = tag.toLowerCase().trim();
  return this.updateMany(
    { _id: { $in: noteIds } },
    { $addToSet: { tags: sanitizedTag } }
  );
};

noteSchema.statics.bulkRemoveTag = function(noteIds, tag) {
  const sanitizedTag = tag.toLowerCase().trim();
  return this.updateMany(
    { _id: { $in: noteIds } },
    { $pull: { tags: sanitizedTag } }
  );
};

noteSchema.statics.getRecentlyModified = function(days = 7, includeArchived = false) {
  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - days);
  
  const filter = {
    updatedAt: { $gte: sinceDate }
  };
  
  if (!includeArchived) {
    filter.isArchived = false;
  }
  
  return this.find(filter).sort({ updatedAt: -1 });
};

noteSchema.statics.getFavorites = function(includeArchived = false) {
  const filter = { isFavorite: true };
  if (!includeArchived) {
    filter.isArchived = false;
  }
  return this.find(filter).sort({ updatedAt: -1 });
};

noteSchema.statics.advancedSearch = function(searchParams) {
  const { 
    text, 
    category, 
    type, 
    priority, 
    tags, 
    isArchived, 
    isFavorite,
    dateFrom,
    dateTo
  } = searchParams;
  
  const filter = {};
  const andConditions = [];
  
  // Text search
  if (text && text.trim()) {
    andConditions.push({
      $or: [
        { title: { $regex: text, $options: 'i' } },
        { content: { $regex: text, $options: 'i' } },
        { tags: { $in: [new RegExp(text, 'i')] } }
      ]
    });
  }
  
  // Category filter
  if (category) {
    filter.category = category;
  }
  
  // Type filter
  if (type) {
    filter.type = type;
  }
  
  // Priority filter
  if (priority) {
    filter.priority = priority;
  }
  
  // Tags filter (all provided tags must be present)
  if (tags && tags.length > 0) {
    filter.tags = { $all: tags };
  }
  
  // Archive status
  if (typeof isArchived === 'boolean') {
    filter.isArchived = isArchived;
  }
  
  // Favorite status
  if (typeof isFavorite === 'boolean') {
    filter.isFavorite = isFavorite;
  }
  
  // Date range
  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) {
      filter.createdAt.$gte = new Date(dateFrom);
    }
    if (dateTo) {
      filter.createdAt.$lte = new Date(dateTo);
    }
  }
  
  // Combine all conditions
  if (andConditions.length > 0) {
    filter.$and = andConditions;
  }
  
  return this.find(filter).sort({ updatedAt: -1 });
};

// Create and export the model
const Note = mongoose.model('Note', noteSchema);

module.exports = Note;
