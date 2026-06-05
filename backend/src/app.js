import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import mongoSanitize from "express-mongo-sanitize";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

import connectDB from "./config/db.js";
import { startWorker } from "./jobs/publish-post-worker.js";
import { errorHandler } from "./middleware/error.middleware.js";
import logger from "./utils/logger.js";

// Routes imports
import authRoutes from "./routes/auth.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import accountsRoutes from "./routes/accounts.routes.js";
import postsRoutes from "./routes/posts.routes.js";
import aiRoutes from "./routes/ai.routes.js";

// Load Environment variables
dotenv.config();

// Connect to Database
connectDB();

// Start Background Worker
startWorker();

const app = express();

// Security Middlewares
app.use(helmet());

// CORS configuration - allow requests from frontend local development and production
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:3000",
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow all local origins during development to avoid local mismatches
      if (process.env.NODE_ENV !== "production") {
        callback(null, true);
      } else if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again after 15 minutes",
});
app.use("/api", limiter);

import path from "path";

// Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// NoSQL Injection Prevention
app.use(mongoSanitize());

// Routes mapping
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/accounts", accountsRoutes);
app.use("/api/posts", postsRoutes);
app.use("/api/ai", aiRoutes);

// Base route for health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date() });
});

// Central Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    logger.info(`Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`);
  });
}

export default app;
