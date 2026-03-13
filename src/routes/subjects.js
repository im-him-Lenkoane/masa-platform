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
             g.display_name AS grade_display_name,
             COUNT(t.id) AS topic_count
      FROM subjects s
      LEFT JOIN grades g ON g.id = s.grade_id
      LEFT JOIN topics t ON t.subject_id = s.id AND t.is_active = true
      WHERE s.is_active = true
    `;
    const params = [];
    if (grade_id) { params.push(grade_id); sql += ` AND s.grade_id = $${params.length}`; }
    if (path_type) { params.push(path_type); sql += ` AND s.path_type = $${params.length}`; }
    sql += ' GROUP BY s.id, g.display_name ORDER BY s.sort_order, s.name';

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

// POST /api/subjects (admin only)
router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, slug, icon, description, path_type, grade_id, sort_order, caps_aligned, ai_context } = req.body;
    if (!name || !path_type) {
      return res.status(400).json({ error: 'name and path_type are required.' });
    }
    if (!['school', 'tertiary'].includes(path_type)) {
      return res.status(400).json({ error: 'path_type must be school or tertiary.' });
    }
    const finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const result = await query(
      `INSERT INTO subjects (name, slug, icon, description, path_type, grade_id, sort_order, caps_aligned, ai_context)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [name, finalSlug, icon||null, description||null, path_type, grade_id||null, sort_order||0, caps_aligned!==false, ai_context||null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Subject with that name/slug already exists.' });
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/subjects/:id (admin only)
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { name, slug, icon, description, path_type, grade_id, sort_order, caps_aligned, ai_context, is_active } = req.body;
    const result = await query(
      `UPDATE subjects SET name=$1, slug=$2, icon=$3, description=$4, path_type=$5,
       grade_id=$6, sort_order=$7, caps_aligned=$8, ai_context=$9, is_active=$10
       WHERE id=$11 RETURNING *`,
      [name, slug, icon||null, description||null, path_type, grade_id||null,
       sort_order||0, caps_aligned!==false, ai_context||null, is_active!==false, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Subject not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/subjects/:id (soft delete, admin only)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await query('UPDATE subjects SET is_active=false WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
