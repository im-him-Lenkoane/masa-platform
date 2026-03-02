// src/routes/admin.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { query } = require('../db/pool');
const { requireAuth, requireAdmin, requireSuperAdmin } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');

// GET /api/admin/dashboard - stats overview
router.get('/dashboard', requireAuth, async (req, res) => {
  try {
    const [subjects, topics, resources, events, sponsors, programs] = await Promise.all([
      query('SELECT COUNT(*) FROM subjects WHERE is_active=true'),
      query('SELECT COUNT(*) FROM topics WHERE is_active=true'),
      query('SELECT COUNT(*) FROM resources WHERE is_active=true'),
      query('SELECT COUNT(*) FROM events WHERE is_active=true'),
      query('SELECT COUNT(*) FROM sponsors WHERE is_active=true'),
      query('SELECT COUNT(*) FROM programs WHERE is_active=true'),
    ]);
    res.json({
      subjects:  parseInt(subjects.rows[0].count),
      topics:    parseInt(topics.rows[0].count),
      resources: parseInt(resources.rows[0].count),
      events:    parseInt(events.rows[0].count),
      sponsors:  parseInt(sponsors.rows[0].count),
      programs:  parseInt(programs.rows[0].count),
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET site settings
router.get('/settings', requireAuth, async (req, res) => {
  try {
    const result = await query('SELECT key, value FROM site_settings');
    const settings = {};
    result.rows.forEach(r => settings[r.key] = r.value);
    res.json(settings);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT update site setting
router.put('/settings/:key', requireAdmin, async (req, res) => {
  try {
    const { value } = req.body;
    await query(
      `INSERT INTO site_settings (key, value, updated_by) VALUES ($1,$2,$3)
       ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value, updated_by=EXCLUDED.updated_by, updated_at=NOW()`,
      [req.params.key, value, req.session.userId]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST upload site logo
router.post('/settings/logo', requireAdmin, upload.single('logo'), handleUploadError, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
    const logoPath = '/' + req.file.path.replace(/\\/g, '/');
    await query(
      `INSERT INTO site_settings (key, value, updated_by) VALUES ('site_logo',$1,$2)
       ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value, updated_at=NOW()`,
      [logoPath, req.session.userId]
    );
    res.json({ success: true, logo_path: logoPath });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET all admin users (super admin only)
router.get('/users', requireSuperAdmin, async (req, res) => {
  try {
    const result = await query(
      'SELECT id, email, full_name, role, is_active, created_at, last_login FROM users ORDER BY created_at'
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST create admin user (super admin)
router.post('/users', requireSuperAdmin, async (req, res) => {
  try {
    const { email, password, full_name, role } = req.body;
    if (!email || !password || !full_name) {
      return res.status(400).json({ error: 'email, password, full_name required.' });
    }
    const hash = await bcrypt.hash(password, 12);
    const result = await query(
      `INSERT INTO users (email, password_hash, full_name, role)
       VALUES ($1,$2,$3,$4) RETURNING id, email, full_name, role`,
      [email.toLowerCase(), hash, full_name, role || 'content_developer']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Email already exists.' });
    res.status(500).json({ error: err.message });
  }
});

// PUT toggle user active state (super admin)
router.put('/users/:id/toggle', requireSuperAdmin, async (req, res) => {
  try {
    const result = await query(
      'UPDATE users SET is_active = NOT is_active WHERE id=$1 RETURNING id, is_active',
      [req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
