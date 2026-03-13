// src/routes/topics.js
const express = require('express');
const router = express.Router();
const { query } = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

// GET /api/topics/all (admin only - returns all topics with subject info)
router.get('/all', requireAuth, async (req, res) => {
  try {
    const result = await query(`
      SELECT t.id, t.title, t.description, t.sort_order, t.subject_id,
             s.name AS subject_name, s.path_type, g.display_name AS grade_name,
             COUNT(r.id) AS resource_count
      FROM topics t
      JOIN subjects s ON s.id = t.subject_id
      LEFT JOIN grades g ON g.id = s.grade_id
      LEFT JOIN resources r ON r.topic_id = t.id AND r.is_active = true
      WHERE t.is_active = true
      GROUP BY t.id, s.name, s.path_type, g.display_name
      ORDER BY s.name, t.sort_order
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/topics?subject_id=xxx
router.get('/', async (req, res) => {
  try {
    const { subject_id } = req.query;
    if (!subject_id) return res.status(400).json({ error: 'subject_id required' });
    const result = await query(
      `SELECT t.*, COUNT(r.id) AS resource_count
       FROM topics t LEFT JOIN resources r ON r.topic_id = t.id AND r.is_active = true
       WHERE t.subject_id = $1 AND t.is_active = true
       GROUP BY t.id ORDER BY t.sort_order`,
      [subject_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/topics/:id/resources
router.get('/:id/resources', async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM resources WHERE topic_id = $1 AND is_active = true ORDER BY sort_order`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/topics (admin only)
router.post('/', requireAuth, async (req, res) => {
  try {
    const { subject_id, title, description, sort_order } = req.body;
    const result = await query(
      `INSERT INTO topics (subject_id, title, description, sort_order)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [subject_id, title, description, sort_order || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/topics/:id (admin only)
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { title, description, sort_order, is_active } = req.body;
    const result = await query(
      `UPDATE topics SET title=$1, description=$2, sort_order=$3, is_active=$4
       WHERE id=$5 RETURNING *`,
      [title, description, sort_order, is_active, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/topics/:id (admin only)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await query('UPDATE topics SET is_active=false WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
