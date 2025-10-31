// ============================
// 🚀 LOCKIFY SERVER.JS (FINAL)
// Ready for Vercel deployment
// ============================

import express from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";

import { connectDB } from "./src/config/db.js";
import authRoutes from "./src/routes/authRoutes.js";
import noteRoutes from "./src/routes/noteRoutes.js";

// --- Environment Setup ---
dotenv.config();
const app = express();

// --- Middleware ---
app.use(helmet());
app.use(express.json({ limit: "1mb" }));

// CORS Setup
app.use(cors());
app.use(morgan("dev"));

// Rate limiter for auth routes (basic protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100,
});
app.use("/api/auth", authLimiter);

// --- API Routes ---
app.get("/api/health", (req, res) => res.json({ ok: true, message: "Lockify API running" }));
app.use("/api/auth", authRoutes);
app.use("/api/notes", noteRoutes);

// --- FRONTEND SERVING (for Vercel) ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static frontend files
app.use(express.static(path.join(__dirname, "../lockify-frontend")));

// Handle all other routes -> return index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../lockify-frontend", "index.html"));
});

// --- START SERVER ---
const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ MongoDB connected`);
      console.log(`🚀 Lockify running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Failed to connect MongoDB:", err);
    process.exit(1);
  });
  