import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "./models/User.js";
import Task from "./models/Task.js";

// JWT utility functions
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      name: user.name,
    },
    process.env.JWT_SECRET || 'your_jwt_secret',
    { expiresIn: '7d' }
  );
};

const verifyToken = (token) => {
  try {
    if (!token) {
      console.log('No token provided');
      return null;
    }
    
    // Remove 'Bearer ' prefix if present
    const tokenValue = token.startsWith('Bearer ') ? token.split(' ')[1] : token;
    
    // Verify the token
    const decoded = jwt.verify(tokenValue, process.env.JWT_SECRET || 'your_jwt_secret');
    
    // Add additional verification if needed
    if (!decoded || !decoded.id) {
      console.log('Invalid token payload:', decoded);
      return null;
    }
    
    return decoded;
  } catch (err) {
    console.error('Token verification error:', err.message);
    return null;
  }
};

const authenticateJWT = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      console.log('No authorization header found');
      return res.status(401).json({ error: 'No authorization token provided' });
    }
    
    // Log the received auth header (without the token for security)
    console.log('Auth header received, length:', authHeader.length);
    
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    
    if (!token) {
      console.log('No token found in authorization header');
      return res.status(401).json({ error: 'No token provided' });
    }
    
    console.log('Verifying token...');
    const user = verifyToken(token);
    
    if (!user) {
      console.log('Token verification failed');
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    
    console.log('User authenticated:', { id: user.id, email: user.email });
    req.user = user;
    return next();
    
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ 
      error: 'Authentication failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Configure CORS
const allowedOrigins = [
  'http://localhost:3000',
  'https://advanced-todo-sable.vercel.app',
  'https://advanced-todo-lz04.onrender.com',
  'https://advanced-todo-lz04.onrender.com/'
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Allow-Credentials',
    'Cache-Control',
    'Pragma'
  ],
  exposedHeaders: ['set-cookie', 'access-control-allow-credentials', 'Content-Range', 'X-Content-Range'],
  optionsSuccessStatus: 200, // Some legacy browsers choke on 204
  preflightContinue: false,
  maxAge: 600
};

// Apply CORS middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Body parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Initialize Passport
app.use(passport.initialize());

// Connect to MongoDB using your existing environment variables
const mongoUri = process.env.MONGODB_URI;
mongoose.connect(mongoUri)
.then(() => {
  console.log("Connected to MongoDB successfully");
})
.catch((err) => {
  console.error("MongoDB connection error:", err);
});

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

app.use(express.static("public"));

// Initialize Passport without session support
app.use(passport.initialize());

// Simple user serialization/deserialization for Passport
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// Simple request logging middleware
app.use((req, res, next) => {
  console.log(`\n--- ${new Date().toISOString()} ---`);
  console.log(`${req.method} ${req.path}`);
  console.log('Headers:', {
    origin: req.headers.origin,
    'user-agent': req.headers['user-agent']
  });
  next();
});

app.set("view engine", "ejs");
app.set("trust proxy", 1);

// Passport Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/auth/google/callback",
      passReqToCallback: true
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        // Check if user exists
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          // Create new user
          user = new User({
            googleId: profile.id,
            email: profile.emails?.[0]?.value || null,
            name: profile.displayName || null,
          });
          await user.save();
        }
        
        return done(null, user);
      } catch (err) {
        console.error('Error in Google OAuth callback:', err);
        return done(err);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  console.log("Serializing user:", user);
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    console.log("Deserializing user with id:", id, "type:", typeof id);
    const user = await User.findById(id);
    console.log("Deserialized user:", user);
    if (user) {
      done(null, user);
    } else {
      console.log("User not found in database, clearing session");
      done(null, false);
    }
  } catch (err) {
    console.error("Deserialization error:", err);
    done(err);
  }
});

const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    if (!req.user) {
      req.logout();
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      return req.accepts("json")
        ? res.status(403).json({ error: "Invalid session" })
        : res.redirect(`${frontendUrl}/signIn`);
    }
    return next();
  }

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  return req.accepts("json")
    ? res.status(401).json({ error: "Login required" })
    : res.redirect(`${frontendUrl}/signIn`);
};

// Auth Routes
app.get(
  "/auth/google",
  (req, res, next) => {
    console.log("OAuth request received, redirecting to Google");
    next();
  },
  passport.authenticate("google", {
    scope: ["profile", "email"],
    accessType: "offline",
    prompt: "select_account"
  })
);

app.get(
  "/auth/google/callback",
  (req, res, next) => {
    console.log("OAuth callback reached, processing...");
    next();
  },
  passport.authenticate("google", { session: false, failureRedirect: "/login?error=auth_failed" }),
  (req, res) => {
    try {
      const user = req.user;
      console.log("OAuth successful for user:", user.email);
      
      // Generate JWT token
      const token = generateToken(user);
      
      // Get frontend URL from environment or use default
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const redirectUrl = new URL(`${frontendUrl}/api/auth/callback`);
      
      // Add token to URL
      redirectUrl.searchParams.set('token', token);
      
      // Set secure cookie with the JWT token
      res.cookie('auth_token', token, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        domain: process.env.NODE_ENV === 'production' ? '.vercel.app' : undefined,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });
      
      // Redirect to frontend with token
      console.log("Redirecting to:", redirectUrl.toString());
      res.redirect(redirectUrl.toString());
    } catch (error) {
      console.error("Error in OAuth callback:", error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/signIn?error=server_error`);
    }
  }
);
 

app.get("/signOut", (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).send("Logout failed");
    }

    req.session.destroy((err) => {
      if (err) {
        console.error("Session destruction error:", err);
        return res.status(500).send("Could not destroy session");
      }

      res.clearCookie("connect.sid");
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      res.redirect(`${frontendUrl}/signIn`);
    });
  });
});

app.get("/signIn", (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  if (req.isAuthenticated()) {
    return res.redirect(`${frontendUrl}/`);
  }
  res.redirect(`${frontendUrl}/signIn`);
});

// Get all incomplete tasks for the authenticated user
app.get("/", authenticateJWT, async (req, res) => {
  try {
    const tasks = await Task.find({ 
      userId: req.user.id, 
      isCompleted: false 
    }).sort({ createdAt: -1 });
    
    if (tasks.length === 0) {
      return res.status(404).json({ message: "No tasks found" });
    }
    res.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ error: "Error fetching tasks" });
  }
});

// Test session endpoint
app.get("/test-session", (req, res) => {
  console.log("Test session - Session ID:", req.sessionID);
  console.log("Test session - Session:", req.session);
  console.log("Test session - User:", req.user);
  console.log("Test session - Is authenticated:", req.isAuthenticated());
  
  res.json({
    sessionId: req.sessionID,
    hasSession: !!req.session,
    isAuthenticated: req.isAuthenticated(),
    user: req.user || null
  });
});

// Auth status endpoint (JWT version)
app.get("/auth/status", authenticateJWT, async (req, res) => {
  try {
    // If we get here, the JWT is valid
    // Fetch the latest user data from the database
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ 
      isAuthenticated: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Error in /auth/status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout endpoint
app.post("/auth/logout", (req, res) => {
  // Since we're using JWT, logout is handled client-side by removing the token
  res.json({ success: true, message: "Logged out successfully" });
});

// Token refresh endpoint (optional)
app.post("/auth/refresh", (req, res) => {
  const refreshToken = req.body.refreshToken;
});

// Get user information
app.get("/user", authenticateJWT, async (req, res) => {
  console.log("Session:", req.session);
  console.log("User:", req.user);
  console.log("isAuthenticated:", req.isAuthenticated?.());
  try {
    const user = await User.findById(req.user.id);
    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Error fetching user" });
  }
});

// Add a new task
app.post("/add", authenticateJWT, async (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: "Title and content are required" });
  }
  try {
    const task = new Task({
      title,
      content,
      userId: req.user.id, // Using req.user.id from JWT
    });
    await task.save();
    res.status(201).json({ message: "Task added successfully", task });
  } catch (error) {
    console.error("Error adding task:", error);
    res.status(500).json({ error: "Error adding task" });
  }
});

// Get completed tasks
app.get("/completed", authenticateJWT, async (req, res) => {
  try {
    const tasks = await Task.find({ 
      isCompleted: true, 
      userId: req.user.id // Using req.user.id from JWT
    }).sort({ updatedAt: -1 });
    res.json(tasks);
  } catch (error) {
    console.error("Error fetching completed tasks:", error);
    res.status(500).json({ error: "Error fetching completed tasks" });
  }
});

// Mark task as completed
app.patch("/done", authenticateJWT, async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: "ID is required" });

  try {
    const task = await Task.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      { isCompleted: true },
      { new: true }
    );
    
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }
    res.status(200).json({ message: "Task marked as completed" });
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ error: "Error updating task" });
  }
});

// Delete completed task
app.delete("/completed/delete", authenticateJWT, async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: "ID is required" });

  try {
    const task = await Task.findOneAndDelete({ 
      _id: id, 
      userId: req.user.id 
    });
    
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }
    res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ error: "Error deleting task" });
  }
});

// Edit task
app.patch("/edit", authenticateJWT, async (req, res) => {
  const { id, title, content } = req.body;
  if (!id || !title || !content) {
    return res.status(400).json({ error: "ID, title, and content are required" });
  }
  try {
    const task = await Task.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      { title, content },
      { new: true }
    );
    
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }
    res.status(200).json({ message: "Task updated successfully" });
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});