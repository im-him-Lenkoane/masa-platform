const express = require('express');
const router = express.Router();
const { query } = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

// GET all placeholder types
router.get('/types', async (req, res) => {
  try {
    const result = await query('SELECT * FROM placeholder_types ORDER BY sort_order');
    res.json(result.rows);
  } catch(err) { res.status(500).json({ error: err.message }); }
});

// POST create custom placeholder type
router.post('/types', requireAuth, async (req, res) => {
  try {
    const { name, icon, sort_order } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });
    const result = await query(
      'INSERT INTO placeholder_types (name, icon, sort_order, is_default) VALUES ($1,$2,$3,false) RETURNING *',
      [name, icon||'📄', sort_order||99]
    );
    res.json(result.rows[0]);
  } catch(err) { res.status(500).json({ error: err.message }); }
});

// DELETE placeholder type
router.delete('/types/:id', requireAuth, async (req, res) => {
  try {
    await query('DELETE FROM placeholder_types WHERE id=$1 AND is_default=false', [req.params.id]);
    res.json({ success: true });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

// GET topic placeholders
router.get('/topic/:topicId', async (req, res) => {
  try {
    const result = await query(`
      SELECT pt.*, 
        COALESCE(tp.is_enabled, true) as is_enabled
      FROM placeholder_types pt
      LEFT JOIN topic_placeholders tp 
        ON tp.placeholder_type_id=pt.id 
        AND tp.topic_id=$1
      ORDER BY pt.sort_order
    `, [req.params.topicId]);
    res.json(result.rows);
  } catch(err) { res.status(500).json({ error: err.message }); }
});

// POST toggle topic placeholder
router.post('/topic/:topicId/toggle', requireAuth, async (req, res) => {
  try {
    const { placeholder_type_id, is_enabled } = req.body;
    await query(`
      INSERT INTO topic_placeholders (topic_id, placeholder_type_id, is_enabled)
      VALUES ($1,$2,$3)
      ON CONFLICT (topic_id, placeholder_type_id) 
      DO UPDATE SET is_enabled=$3
    `, [req.params.topicId, placeholder_type_id, is_enabled]);
    res.json({ success: true });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

// GET subject placeholders
router.get('/subject/:subjectId', async (req, res) => {
  try {
    const result = await query(`
      SELECT pt.*, 
        COALESCE(sp.is_enabled, true) as is_enabled
      FROM placeholder_types pt
      LEFT JOIN subject_placeholders sp 
        ON sp.placeholder_type_id=pt.id 
        AND sp.subject_id=$1
      ORDER BY pt.sort_order
    `, [req.params.subjectId]);
    res.json(result.rows);
  } catch(err) { res.status(500).json({ error: err.message }); }
});

// POST toggle subject placeholder
router.post('/subject/:subjectId/toggle', requireAuth, async (req, res) => {
  try {
    const { placeholder_type_id, is_enabled } = req.body;
    await query(`
      INSERT INTO subject_placeholders (subject_id, placeholder_type_id, is_enabled)
      VALUES ($1,$2,$3)
      ON CONFLICT (subject_id, placeholder_type_id) 
      DO UPDATE SET is_enabled=$3
    `, [req.params.subjectId, placeholder_type_id, is_enabled]);
    res.json({ success: true });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;