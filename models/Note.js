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
    categoryCounts: []
  };
};

// Create and export the model
const Note = mongoose.model('Note', noteSchema);

module.exports = Note;
