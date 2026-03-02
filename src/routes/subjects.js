// src/routes/subjects.js
const express = require('express');
const router = express.Router();
const { query } = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

// GET /api/subjects?grade_id=1  or  ?path_type=tertiary
router.get('/', async (req, res) => {
  try {
    const { grade_id, path_type } = req.query;
    let sql = `
      SELECT s.id, s.name, s.slug, s.icon, s.description,
             s.path_type, s.grade_id, s.sort_order,
             COUNT(t.id) AS topic_count
      FROM subjects s
      LEFT JOIN topics t ON t.subject_id = s.id AND t.is_active = true
      WHERE s.is_active = true
    `;
    const params = [];
    if (grade_id) { params.push(grade_id); sql += ` AND s.grade_id = $${params.length}`; }
    if (path_type) { params.push(path_type); sql += ` AND s.path_type = $${params.length}`; }
    sql += ' GROUP BY s.id ORDER BY s.sort_order, s.name';

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/subjects/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await query(
      `SELECT s.*, g.display_name AS grade_name
       FROM subjects s LEFT JOIN grades g ON g.id = s.grade_id
       WHERE s.id = $1 AND s.is_active = true`,
      [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Subject not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/subjects/:id/topics-with-resources
router.get('/:id/full', async (req, res) => {
  try {
    const topics = await query(
      `SELECT * FROM topics WHERE subject_id = $1 AND is_active = true ORDER BY sort_order`,
      [req.params.id]
    );
    const resources = await query(
      `SELECT r.* FROM resources r
       JOIN topics t ON t.id = r.topic_id
       WHERE t.subject_id = $1 AND r.is_active = true
       ORDER BY r.sort_order`,
      [req.params.id]
    );
    res.json({ topics: topics.rows, resources: resources.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
