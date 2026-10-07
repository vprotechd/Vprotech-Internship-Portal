// server.js

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";

import authRoutes from "./routes/authRoutes.js";
import blogRoutes from "./routes/blogRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import teamRoutes from "./routes/teamRoutes.js";
import { parseFormData } from "./middleware/parseFormData.js"; 
import jobRoutes from './routes/jobRoutes.js';
import applicationRoutes from './routes/applicationRoutes.js';
import offerRoutes from "./routes/offerRoutes.js";
import internshipRoutes from "./routes/internshipRoutes.js";
import testRoutes from "./routes/testRoutes.js";
import questionRoutes from "./routes/questionRoutes.js";
import testAttemptRoutes from "./routes/testAttemptRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;


app.use(
  "/uploads",
  express.static(
    path.join(process.cwd(), "uploads")
  )
);

// Middleware
app.use(cors({
  origin: [
  "http://localhost:5173",
  "https://vprotech-digital.onrender.com",
  "https://vprotech-internship-portal-1.onrender.com"
],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use(parseFormData); 

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/team", teamRoutes); 
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use("/api/offers", offerRoutes);
app.use("/api/internship", internshipRoutes);
app.use("/api/tests", testRoutes);
app.use("/api", questionRoutes);
app.use("/api/test-attempts", testAttemptRoutes);

// Test route
app.get("/api/test", (req, res) => {
  res.json({ success: true, message: "✅ Server is working!" });
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "OK", 
    message: "Server is running",
    database: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected"
  });
});

// Error handling
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    success: false,
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
});

// Start server
const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📡 Test: http://localhost:${PORT}/api/test`);
      console.log(`🔐 Auth: http://localhost:${PORT}/api/auth`);
      console.log(`📝 Blogs: http://localhost:${PORT}/api/blogs`);
    });
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  }
};

startServer();

export default app;