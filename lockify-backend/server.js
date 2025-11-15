// ============================
// 🚀 LOCKIFY SERVER.JS (FINAL LOCAL + LAN VERSION)
// ============================

import express from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
import os from "os";

import { connectDB } from "./src/config/db.js";
import authRoutes from "./src/routes/authRoutes.js";
import noteRoutes from "./src/routes/noteRoutes.js";

// --- ENVIRONMENT SETUP ---
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// --- SECURITY + JSON ---
app.use(helmet());
app.use(express.json({ limit: "1mb" }));

// --- CORS (allow LAN + localhost during dev) ---
app.use(
  cors({
    origin: "*", // ✅ open for testing on local network
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// --- LOGGER ---
app.use(morgan("dev"));

// --- RATE LIMITER ---
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per window
});
app.use("/api/auth", authLimiter);

// --- ROUTES ---
app.get("/api/health", (req, res) =>
  res.json({ ok: true, message: "Lockify API running ✅" })
);
app.use("/api/auth", authRoutes);
app.use("/api/notes", noteRoutes);

// --- STATIC FRONTEND (optional: serves your frontend folder if bundled) ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "../lockify-frontend")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../lockify-frontend", "index.html"));
});

// --- START SERVER ---
connectDB()
  .then(() => {
    // detect local network IP
    const networkInterfaces = os.networkInterfaces();
    const localIp =
      Object.values(networkInterfaces)
        .flat()
        .find((iface) => iface.family === "IPv4" && !iface.internal)?.address ||
      "localhost";

    // start express server
    app.listen(PORT, "0.0.0.0", () => {
      console.log("=========================================");
      console.log("✅ MongoDB connected");
      console.log(`🚀 Lockify running locally at: http://localhost:${PORT}`);
      console.log(`🌐 LAN access available at: http://${localIp}:${PORT}`);
      console.log("=========================================");
    });
  })
  .catch((err) => {
    console.error("❌ Failed to connect MongoDB:", err);
    process.exit(1);
  });
