// src/routes/faculties.js
const express = require('express');
const router = express.Router();
const { query } = require('../db/pool');

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

module.exports = router;
