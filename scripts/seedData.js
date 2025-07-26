'use strict';

const mongoose = require('mongoose');
require('dotenv').config();

const Note = require('../models/Note');
const { connectToDatabase, closeDatabase } = require('../config/database');

/**
 * Sample notes data for seeding
 */
const SAMPLE_NOTES = Object.freeze([
  {
    title: 'Sunday Service Sermon Notes',
    content: 'Main points for this Sunday\'s sermon on faith and perseverance. Key verses: Hebrews 11:1, Romans 5:3-4. Remember to emphasize the importance of trusting God during difficult times.',
    category: 'Sermons',
    type: 'sermon',
    tags: ['faith', 'perseverance', 'sunday', 'hebrews', 'romans'],
    priority: 'high'
  },
  {
    title: 'Prayer Request List',
    content: 'Weekly prayer requests from congregation members. Include requests for healing, guidance, and thanksgiving. Review and update before prayer meeting.',
    category: 'Prayer',
    type: 'prayer',
    tags: ['prayer', 'congregation', 'weekly', 'requests'],
    priority: 'medium'
  },
  {
    title: 'Bible Study - Romans 8',
    content: 'Study notes on Romans chapter 8, focusing on life in the Spirit. Key themes: freedom from condemnation, living by the Spirit, future glory. Discussion questions prepared.',
    category: 'Bible Study',
    type: 'study',
    tags: ['romans', 'spirit', 'study', 'freedom', 'glory'],
    priority: 'medium'
  },
  {
    title: 'Youth Ministry Planning',
    content: 'Ideas and plans for upcoming youth ministry events and activities. Summer camp preparations, weekly activities, and outreach programs. Budget considerations included.',
    category: 'Ministry',
    type: 'ministry',
    tags: ['youth', 'ministry', 'planning', 'events', 'outreach'],
    priority: 'high'
  },
  {
    title: 'Communion Preparation Notes',
    content: 'Guidelines and preparation checklist for monthly communion service. Include scripture readings, prayer points, and setup requirements.',
    category: 'Sermons',
    type: 'sermon',
    tags: ['communion', 'preparation', 'monthly', 'scripture'],
    priority: 'medium'
  },
  {
    title: 'Personal Reflection - Philippians 4:13',
    content: 'Personal thoughts and reflections on "I can do all things through Christ who strengthens me". How this verse applies to current challenges and ministry work.',
    category: 'Personal',
    type: 'personal',
    tags: ['philippians', 'strength', 'reflection', 'personal'],
    priority: 'low'
  },
  {
    title: 'Church Leadership Meeting Notes',
    content: 'Notes from the monthly leadership meeting. Discussion topics: budget review, upcoming events, community outreach initiatives, and staff updates.',
    category: 'Ministry',
    type: 'ministry',
    tags: ['leadership', 'meeting', 'budget', 'events'],
    priority: 'high'
  },
  {
    title: 'Easter Service Preparation',
    content: 'Comprehensive plan for Easter Sunday service. Special music, decorations, children\'s program, and resurrection message outline.',
    category: 'Sermons',
    type: 'sermon',
    tags: ['easter', 'resurrection', 'special', 'children'],
    priority: 'high'
  }
]);

/**
 * Seed the database with sample notes
 */
async function seedDatabase() {
  let connection = null;
  
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to database
    connection = await connectToDatabase();
    console.log('✅ Connected to MongoDB');

    // Clear existing notes
    const deleteResult = await Note.deleteMany({});
    console.log(`🗑️  Cleared ${deleteResult.deletedCount} existing notes`);

    // Insert sample notes
    const createdNotes = await Note.insertMany(SAMPLE_NOTES);
    console.log(`📝 Successfully seeded ${createdNotes.length} notes`);

    // Display created notes
    console.log('\n📋 Created notes:');
    createdNotes.forEach((note, index) => {
      console.log(`${index + 1}. ${note.title} (${note.category}) - Priority: ${note.priority}`);
    });

    // Display statistics
    const stats = await Note.getStats();
    console.log('\n📊 Database Statistics:');
    console.log(`- Total Notes: ${stats.totalNotes}`);
    console.log(`- Active Notes: ${stats.activeNotes}`);
    console.log(`- Archived Notes: ${stats.archivedNotes}`);

    console.log('\n✅ Database seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    
    if (error.name === 'ValidationError') {
      console.error('Validation errors:');
      Object.values(error.errors).forEach(err => {
        console.error(`- ${err.message}`);
      });
    }
    
    process.exit(1);
  } finally {
    // Close database connection
    if (connection) {
      await closeDatabase();
      console.log('🔌 Database connection closed');
    }
    
    process.exit(0);
  }
}

/**
 * Handle script interruption
 */
process.on('SIGINT', async () => {
  console.log('\n⚠️  Seeding interrupted by user');
  await closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⚠️  Seeding terminated');
  await closeDatabase();
  process.exit(0);
});

// Check if script is run directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase, SAMPLE_NOTES };
