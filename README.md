# JD Notes Backend

A RESTful API backend for managing JD (John Doe) notes with categories, types, and tagging system. Built with Express.js and MongoDB.

## Features

- **CRUD Operations**: Create, read, update, and delete notes
- **Categorization**: Organize notes by categories (Sermons, Prayer, Bible Study, etc.)
- **Tagging System**: Add multiple tags to notes for better organization
- **Search Functionality**: Search notes by title, content, or tags
- **Pagination**: Efficient data loading with pagination support
- **Archive System**: Archive/unarchive notes without deleting them
- **Priority Levels**: Set priority levels (low, medium, high) for notes
- **MongoDB Integration**: Robust data persistence with MongoDB
- **Error Handling**: Comprehensive error handling and validation
- **CORS Support**: Ready for frontend integration

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Security**: Helmet.js for security headers
- **Logging**: Morgan for HTTP request logging
- **Development**: Nodemon for auto-restart

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd jd-notes-backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
   - Copy `.env.example` to `.env`: `cp .env.example .env`
   - Update `.env` with your actual MongoDB credentials
   - For local development, you can use the default PORT: `5000`

**Important**: 
- `.env` contains your real credentials and should never be committed to Git
- `.env.example` is a template showing what variables are needed

4. Start MongoDB service (if running locally):
```bash
# On Windows
net start MongoDB

# On macOS/Linux
sudo systemctl start mongod
```

## Usage

## Deployment

### Local Development
```bash
npm run dev  # Development with nodemon
npm start    # Production mode locally
```

### Vercel Deployment
This backend is configured for serverless deployment on Vercel.

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

**Quick Deploy:**
1. Push to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy automatically

**Production API Base URL:**
```
https://your-project.vercel.app
```

### Seed Database with Sample Data
```bash
npm run seed
```

## API Endpoints

### Health Check
- `GET /api/health` - Check if the API is running

### Notes Endpoints

#### Get All Notes
- `GET /api/notes`
- Query Parameters:
  - `category` - Filter by category
  - `type` - Filter by type
  - `tags` - Filter by tags (comma-separated)
  - `search` - Search in title, content, or tags
  - `page` - Page number (default: 1)
  - `limit` - Items per page (default: 10)
  - `sortBy` - Sort field (default: createdAt)
  - `sortOrder` - Sort order: asc/desc (default: desc)
  - `archived` - Show archived notes (default: false)

#### Get Single Note
- `GET /api/notes/:id` - Get note by ID

#### Create Note
- `POST /api/notes`
- Body:
```json
{
  "title": "Note Title",
  "content": "Note content...",
  "category": "Sermons",
  "type": "sermon",
  "tags": ["faith", "sermon"],
  "priority": "high"
}
```

#### Update Note
- `PUT /api/notes/:id`
- Body: Same as create note

#### Delete Note
- `DELETE /api/notes/:id`

#### Archive/Unarchive Notes
- `PATCH /api/notes/:id/archive` - Archive a note
- `PATCH /api/notes/:id/unarchive` - Unarchive a note

#### Get Categories and Tags
- `GET /api/notes/categories/list` - Get all unique categories
- `GET /api/notes/tags/list` - Get all unique tags

## Data Model

### Note Schema
```javascript
{
  title: String (required, max 200 chars),
  content: String (required),
  category: String (required, enum: ['Sermons', 'Prayer', 'Bible Study', 'General', 'Ministry', 'Personal']),
  type: String (required, enum: ['sermon', 'prayer', 'study', 'general', 'ministry', 'personal']),
  tags: [String] (lowercase),
  isArchived: Boolean (default: false),
  priority: String (enum: ['low', 'medium', 'high'], default: 'medium'),
  createdAt: Date (auto-generated),
  updatedAt: Date (auto-generated)
}
```

## Frontend Integration

The API is configured with CORS to allow requests from `http://localhost:3000` by default. Update the `FRONTEND_URL` environment variable to match your React app's URL.

### Example Frontend API Calls

```javascript
// Fetch all notes
const response = await fetch('http://localhost:5000/api/notes');
const data = await response.json();

// Create a new note
const newNote = {
  title: 'New Note',
  content: 'Note content...',
  category: 'General',
  type: 'general',
  tags: ['important']
};

const response = await fetch('http://localhost:5000/api/notes', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(newNote)
});
```

## Environment Variables

- `PORT` - Server port (default: 5000)
- `MONGODB_URI` - MongoDB connection string
- `NODE_ENV` - Environment mode (development/production)
- `FRONTEND_URL` - Frontend URL for CORS (default: http://localhost:3000)

## Error Handling

The API includes comprehensive error handling with appropriate HTTP status codes:

- `400` - Bad Request (validation errors, invalid IDs)
- `404` - Not Found (note doesn't exist)
- `500` - Internal Server Error

Error responses include descriptive messages and, in development mode, detailed error information.

## Development

### Project Structure
```
jd-notes-backend/
├── models/
│   └── Note.js          # Mongoose note model
├── routes/
│   └── notes.js         # Notes API routes
├── scripts/
│   └── seedData.js      # Database seeding script
├── .env                 # Environment variables
├── .gitignore          # Git ignore rules
├── package.json        # Dependencies and scripts
├── server.js           # Main server file
└── README.md           # This file
```

### Adding New Features

1. **New Routes**: Add to `routes/notes.js` or create new route files
2. **Model Changes**: Update `models/Note.js` and run migrations if needed
3. **Middleware**: Add custom middleware in `server.js`
4. **Validation**: Extend Mongoose schema validation

## License

ISC
