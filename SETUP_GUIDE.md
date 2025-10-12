# MongoDB Migration Setup Guide

Your todo app has been successfully migrated from PostgreSQL to MongoDB with Mongoose! Here's everything you need to do to get it running.

## 🗄️ Database Setup

### Option 1: Local MongoDB Installation

1. **Install MongoDB locally:**
   ```bash
   # Ubuntu/Debian
   sudo apt-get install mongodb
   
   # macOS with Homebrew
   brew install mongodb/brew/mongodb-community
   
   # Windows
   # Download from https://www.mongodb.com/try/download/community
   ```

2. **Start MongoDB service:**
   ```bash
   # Ubuntu/Debian
   sudo systemctl start mongodb
   sudo systemctl enable mongodb
   
   # macOS
   brew services start mongodb/brew/mongodb-community
   
   # Windows
   # Run MongoDB as a Windows service
   ```

### Option 2: MongoDB Atlas (Cloud - Recommended for Production)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a new cluster
4. Get your connection string (it will look like: `mongodb+srv://username:password@cluster.mongodb.net/todoapp`)

## 🔧 Environment Configuration

1. **Copy the environment template:**
   ```bash
   cd backend
   cp env.example .env
   ```

2. **Edit your `.env` file with the following variables:**
   ```env
   # Server Configuration
   PORT=3000
   NODE_ENV=development
   
   # MongoDB Configuration
   # For local MongoDB:
   MONGODB_URI=mongodb://localhost:27017/todoapp
   
   # For MongoDB Atlas (replace with your connection string):
   # MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/todoapp
   
   # Session Configuration
   SESSION_SECRET=your-super-secret-session-key-here-make-it-long-and-random
   
   # Google OAuth Configuration (keep your existing values)
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
   GOOGLE_USER_PROFILE_URL=https://www.googleapis.com/oauth2/v3/userinfo
   ```

## 📦 Install Dependencies

1. **Install new backend dependencies:**
   ```bash
   cd backend
   npm install
   ```

   This will install:
   - `mongoose` - MongoDB object modeling
   - `connect-mongo` - MongoDB session store

2. **Frontend dependencies are already correct** - no changes needed.

## 🚀 Running the Application

1. **Start the backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start the frontend (in a new terminal):**
   ```bash
   cd frontend
   npm run dev
   ```

## 🔄 Migration Notes

### What Changed:
- ✅ **Database**: PostgreSQL → MongoDB
- ✅ **ORM**: Raw SQL → Mongoose ODM
- ✅ **Session Store**: PostgreSQL → MongoDB
- ✅ **ID Format**: Integer → MongoDB ObjectId
- ✅ **Models**: SQL tables → Mongoose schemas

### New Features:
- ✅ **Automatic timestamps**: `createdAt` and `updatedAt` fields
- ✅ **Data validation**: Built into Mongoose schemas
- ✅ **Better error handling**: More descriptive error messages
- ✅ **Optimized queries**: Using Mongoose methods instead of raw SQL

### Database Schema:

**Users Collection:**
```javascript
{
  _id: ObjectId,
  googleId: String (unique),
  email: String (unique),
  name: String,
  createdAt: Date
}
```

**Tasks Collection:**
```javascript
{
  _id: ObjectId,
  title: String,
  content: String,
  isCompleted: Boolean,
  userId: ObjectId (references User),
  createdAt: Date,
  updatedAt: Date
}
```

## 🧪 Testing the Migration

1. **Start both servers** (backend and frontend)
2. **Sign in with Google** - this will create a new user in MongoDB
3. **Create a new todo** - this will test the task creation
4. **Mark a todo as completed** - this will test the update functionality
5. **Delete a completed todo** - this will test the delete functionality
6. **Edit a todo** - this will test the edit functionality

## 🐛 Troubleshooting

### Common Issues:

1. **"MongoDB connection error"**
   - Make sure MongoDB is running locally
   - Check your `MONGODB_URI` in `.env`
   - For Atlas, verify your connection string and network access

2. **"Cannot read property '_id' of undefined"**
   - This means the user session isn't working
   - Check your `SESSION_SECRET` is set
   - Make sure `connect-mongo` is properly configured

3. **CORS errors**
   - Verify your frontend URL in the CORS configuration
   - Make sure both servers are running on the correct ports

4. **Google OAuth not working**
   - Check your Google OAuth credentials
   - Make sure the callback URL is correct
   - Verify the redirect URLs in Google Console

### Reset Database (if needed):
```bash
# Connect to MongoDB shell
mongosh

# Switch to your database
use todoapp

# Drop collections to start fresh
db.users.drop()
db.tasks.drop()
```

## 📈 Performance Benefits

- **Faster queries**: MongoDB's document-based queries are optimized for your use case
- **Better scalability**: MongoDB scales horizontally more easily than PostgreSQL
- **Simplified schema**: No need for complex joins, everything is in documents
- **Built-in validation**: Mongoose provides schema validation out of the box

## 🔒 Security Notes

- Keep your `SESSION_SECRET` long and random
- Use environment variables for all sensitive data
- For production, use MongoDB Atlas with proper security settings
- Enable MongoDB authentication for production deployments

---

**Your app is now ready to run with MongoDB!** 🎉

The migration maintains all existing functionality while providing better performance and scalability. All your existing Google OAuth and frontend code continues to work without any changes.
