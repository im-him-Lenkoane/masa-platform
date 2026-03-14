// ================================================
// M@SA PLATFORM - MAIN SERVER
// src/server.js
// ================================================

require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const rateLimit = require('express-rate-limit');
const pgSession = require('connect-pg-simple')(session);
const { pool } = require('./db/pool');

const app = express();
app.set('trust proxy', 1); // Trust first proxy for secure cookies
const PORT = process.env.PORT || 3000;

// ── Security middleware ──────────────────────────
app.use(helmet({
  contentSecurityPolicy: false
    }));

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? 'https://masa.org.za'
    : 'http://localhost:3000',
  credentials: true
}));

// ── Rate limiting ────────────────────────────────
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { error: 'Too many requests, please try again later.' }
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  message: { error: 'AI rate limit reached. Please wait a moment.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts. Please wait.' }
});

app.use('/api/', generalLimiter);
app.use('/api/ai/', aiLimiter);
app.use('/api/auth/', authLimiter);

// ── Body parsing ─────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Session ──────────────────────────────────────
app.use(session({
  store: new pgSession({
    pool,
    tableName: 'user_sessions',
    createTableIfMissing: true,
  }),
  secret: process.env.SESSION_SECRET || 'dev-secret-change-this',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 8 * 60 * 60 * 1000 // 8 hours
  }
}));

// ── Static files ─────────────────────────────────
app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── API Routes ───────────────────────────────────
app.use('/api/auth',         require('./routes/auth'));
app.use('/api/grades',       require('./routes/grades'));
app.use('/api/subjects',     require('./routes/subjects'));
app.use('/api/faculties',    require('./routes/faculties'));
app.use('/api/topics',       require('./routes/topics'));
app.use('/api/resources',    require('./routes/resources'));
app.use('/api/quizzes',      require('./routes/quizzes'));
app.use('/api/ai',           require('./routes/ai'));
app.use('/api/events',       require('./routes/events'));
app.use('/api/sponsors',     require('./routes/sponsors'));
app.use('/api/programs',     require('./routes/programs'));
app.use('/api/publications', require('./routes/publications'));
app.use('/api/comments',     require('./routes/comments'));
app.use('/api/admin',        require('./routes/admin'));
app.use('/api/email',        require('./routes/email'));
app.use('/api/sessions',     require('./routes/sessions'));
app.use('/api/team', require('./routes/team'));

// ── Catch-all: serve index.html for SPA routing ──
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// ── Global error handler ─────────────────────────
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Something went wrong. Please try again.'
      : err.message
  });
});

// ── Start server ─────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('  ███╗   ███╗ █████╗ ███████╗ █████╗ ');
  console.log('  ████╗ ████║██╔══██╗██╔════╝██╔══██╗');
  console.log('  ██╔████╔██║███████║███████╗███████║');
  console.log('  ██║╚██╔╝██║██╔══██║╚════██║██╔══██║');
  console.log('  ██║ ╚═╝ ██║██║  ██║███████║██║  ██║');
  console.log('  ╚═╝     ╚═╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝');
  console.log('');
  console.log(`  Messelaar @ STEM Academy NPC`);
  console.log(`  Server running at http://localhost:${PORT}`);
  console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('');
});

module.exports = app;
