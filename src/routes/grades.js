// src/routes/grades.js
const express = require('express');
const router = express.Router();
const { query } = require('../db/pool');

// GET /api/grades - all active grades with subject counts
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

module.exports = router;
