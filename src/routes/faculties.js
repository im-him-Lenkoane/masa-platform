// src/routes/faculties.js
const express = require('express');
const router = express.Router();
const { query } = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

// GET /api/faculties
router.get('/', async (req, res) => {
  try {
    const result = await query(`
      SELECT f.*, COUNT(fs.subject_id) AS subject_count
      FROM faculties f
      LEFT JOIN faculty_subjects fs ON fs.faculty_id = f.id
      WHERE f.is_active = true
      GROUP BY f.id ORDER BY f.sort_order
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/faculties/:slug/subjects
router.get('/:slug/subjects', async (req, res) => {
  try {
    const result = await query(`
      SELECT s.id, s.name, s.slug, s.icon, s.description,
             COUNT(t.id) AS topic_count
      FROM subjects s
      JOIN faculty_subjects fs ON fs.subject_id = s.id
      JOIN faculties f ON f.id = fs.faculty_id
      LEFT JOIN topics t ON t.subject_id = s.id AND t.is_active = true
      WHERE f.slug = $1 AND s.is_active = true
      GROUP BY s.id ORDER BY s.name
    `, [req.params.slug]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/faculties
router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, slug, icon, description, sort_order } = req.body;
    if (!name) return res.status(400).json({ error: 'Faculty name is required.' });
    // Auto-generate slug if not provided
    const finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const result = await query(
      `INSERT INTO faculties (name, slug, icon, description, sort_order)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, finalSlug, icon || null, description || null, sort_order || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Faculty with that name/slug already exists.' });
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/faculties/:id
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { name, slug, icon, description, sort_order } = req.body;
    const result = await query(
      `UPDATE faculties SET name=$1, slug=$2, icon=$3, description=$4, sort_order=$5
       WHERE id=$6 AND is_active=true RETURNING *`,
      [name, slug, icon || null, description || null, sort_order || 0, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Faculty not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/faculties/:id (soft delete)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await query('UPDATE faculties SET is_active=false WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

// POST /api/faculties/:id/subjects — link a subject to a faculty
router.post('/:id/subjects', requireAuth, async (req, res) => {
  try {
    const { subject_id } = req.body;
    if (!subject_id) return res.status(400).json({ error: 'subject_id required.' });
    await query(
      `INSERT INTO faculty_subjects (faculty_id, subject_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [req.params.id, subject_id]
    );
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
