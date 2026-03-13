// src/routes/grades.js
const express = require('express');
const router = express.Router();
const { query } = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

// GET /api/grades
router.get('/', async (req, res) => {
  try {
    const result = await query(`
      SELECT g.id, g.name, g.display_name, g.description, g.sort_order,
             COUNT(s.id) AS subject_count
      FROM grades g
      LEFT JOIN subjects s ON s.grade_id = g.id AND s.is_active = true
      WHERE g.is_active = true
      GROUP BY g.id ORDER BY g.sort_order
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/grades
router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, display_name, description, sort_order } = req.body;
    if (!name || !display_name) {
      return res.status(400).json({ error: 'name and display_name are required.' });
    }
    const result = await query(
      `INSERT INTO grades (name, display_name, description, sort_order)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, display_name, description || null, sort_order || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Grade already exists.' });
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/grades/:id
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { name, display_name, description, sort_order } = req.body;
    const result = await query(
      `UPDATE grades SET name=$1, display_name=$2, description=$3, sort_order=$4
       WHERE id=$5 AND is_active=true RETURNING *`,
      [name, display_name, description || null, sort_order || 0, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Grade not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/grades/:id (soft delete)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await query('UPDATE grades SET is_active=false WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
