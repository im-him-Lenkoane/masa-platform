// ================================================
// M@SA PLATFORM - DATABASE CONNECTION POOL
// src/db/pool.js
// ================================================

const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME     || 'masa_db',
  user:     process.env.DB_USER     || 'masa_user',
  password: process.env.DB_PASSWORD || '',
  max: 20,                    // max connections in pool
  idleTimeoutMillis: 30000,   // close idle connections after 30s
  connectionTimeoutMillis: 2000,
});

pool.on('connect', () => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('  ✓ Database connected');
  }
});

pool.on('error', (err) => {
  console.error('  ✗ Database pool error:', err.message);
});

// Helper: run a query with optional values
const query = (text, params) => pool.query(text, params);

// Helper: get a client for transactions
const getClient = () => pool.connect();

module.exports = { pool, query, getClient };
