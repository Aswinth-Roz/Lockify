import express from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { connectDB } from './src/config/db.js';
import authRoutes from './src/routes/authRoutes.js';
import noteRoutes from './src/routes/noteRoutes.js';

dotenv.config();

const app = express();

// --- Security & utils middleware ---
app.use(helmet());
app.use(express.json({ limit: '1mb' }));

// CORS
const allowed = (process.env.CORS_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({
  origin: function(origin, cb) {
    if (!origin) return cb(null, true);
    if (allowed.length === 0 || allowed.includes(origin)) {
      return cb(null, true);
    }
    return cb(new Error('CORS not allowed for origin: ' + origin));
  },
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));

app.use(morgan('dev'));

// Rate limit auth endpoints
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api/auth', authLimiter);

// --- Routes ---
app.get('/api/health', (req, res) => res.json({ ok: true, message: 'Lockify API up' }));
app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);

// Legacy compatibility for your current frontend handlers:
app.post('/api/register', (req, res, next) => { req.url = '/signup'; next(); }, authRoutes);
app.post('/api/login', (req, res, next) => { req.url = '/login'; next(); }, authRoutes);

// --- Error handler ---
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});

// --- Start ---
const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
}).catch((e) => {
  console.error('Failed to connect DB', e);
  process.exit(1);
});
