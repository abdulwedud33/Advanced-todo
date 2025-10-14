import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import passport from "passport";
import session from "express-session";
import MongoStore from "connect-mongo";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import dotenv from "dotenv";
import User from "./models/User.js";
import Task from "./models/Task.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

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

app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL || "https://advanced-todo-sable.vercel.app",
      process.env.CLIENT_URL || "http://localhost:3000"
    ],
    methods: ["GET", "POST", "PATCH", "DELETE"],
    credentials: true,
  })
);

app.use(express.static("public"));

// Session configuration with MongoDB store
app.set("trust proxy", 1);
app.use(
  session({
    store: MongoStore.create({
      mongoUrl: mongoUri,
      touchAfter: 24 * 3600, // lazy session update
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      sameSite: "none",
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.set("view engine", "ejs");

// Passport Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user exists
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          return done(null, user);
        } else {
          // Create new user
          user = new User({
            googleId: profile.id,
            email: profile.emails?.[0]?.value || null,
            name: profile.displayName || null,
          });
          await user.save();
          return done(null, user);
        }
      } catch (err) {
        return done(err);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    if (!req.user) {
      req.logout();
      const frontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || "http://localhost:3000";
      return req.accepts("json")
        ? res.status(403).json({ error: "Invalid session" })
        : res.redirect(`${frontendUrl}/signIn`);
    }
    return next();
  }

  const frontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || "http://localhost:3000";
  return req.accepts("json")
    ? res.status(401).json({ error: "Login required" })
    : res.redirect(`${frontendUrl}/signIn`);
};

// Routes
app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    failureRedirect: "/signIn",
    accessType: "offline",
    prompt: "select_account"
  })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/signIn" }),
  (req, res) => {
    const frontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || "http://localhost:3000";
    res.redirect(`${frontendUrl}/` || "http://localhost:3000");
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
      const frontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || "http://localhost:3000";
      res.redirect(`${frontendUrl}/signIn`);
    });
  });
});

app.get("/signIn", (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || "http://localhost:3000";
  if (req.isAuthenticated()) {
    return res.redirect(`${frontendUrl}/`);
  }
  res.redirect(`${frontendUrl}/signIn`);
});

// Get all incomplete tasks for the authenticated user
app.get("/", ensureAuthenticated, async (req, res) => {
  try {
    const tasks = await Task.find({ 
      userId: req.user._id, 
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

// Check authentication status
app.get("/auth/status", (req, res) => {
  if (req.isAuthenticated() && req.user) {
    res.json({ 
      authenticated: true, 
      user: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email
      }
    });
  } else {
    res.json({ authenticated: false });
  }
});

// Get user information
app.get("/user", ensureAuthenticated, async (req, res) => {
  console.log("Session:", req.session);
  console.log("User:", req.user);
  console.log("isAuthenticated:", req.isAuthenticated?.());
  try {
    const user = await User.findById(req.user._id);
    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Error fetching user" });
  }
});

// Add a new task
app.post("/add", ensureAuthenticated, async (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: "Title and content are required" });
  }
  try {
    const task = new Task({
      title,
      content,
      userId: req.user._id,
    });
    await task.save();
    res.status(201).json({ message: "Task added successfully", task });
  } catch (error) {
    console.error("Error adding task:", error);
    res.status(500).json({ error: "Error adding task" });
  }
});

// Get completed tasks
app.get("/completed", ensureAuthenticated, async (req, res) => {
  try {
    const tasks = await Task.find({ 
      isCompleted: true, 
      userId: req.user._id 
    }).sort({ updatedAt: -1 });
    res.json(tasks);
  } catch (error) {
    console.error("Error fetching completed tasks:", error);
    res.status(500).json({ error: "Error fetching completed tasks" });
  }
});

// Mark task as completed
app.patch("/done", ensureAuthenticated, async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: "ID is required" });

  try {
    const task = await Task.findOneAndUpdate(
      { _id: id, userId: req.user._id },
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
app.delete("/completed/delete", ensureAuthenticated, async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: "ID is required" });

  try {
    const task = await Task.findOneAndDelete({ 
      _id: id, 
      userId: req.user._id 
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
app.patch("/edit", ensureAuthenticated, async (req, res) => {
  const { id, title, content } = req.body;
  if (!id || !title || !content) {
    return res.status(400).json({ error: "ID, title, and content are required" });
  }
  try {
    const task = await Task.findOneAndUpdate(
      { _id: id, userId: req.user._id },
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