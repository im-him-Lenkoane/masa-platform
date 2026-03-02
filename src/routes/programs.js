// src/routes/programs.js
const express = require('express');
const router = express.Router();
const { query } = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM programs WHERE is_active=true ORDER BY is_featured DESC, created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const { title, description, icon, status, start_date, end_date, is_featured } = req.body;
    const result = await query(
      `INSERT INTO programs (title, description, icon, status, start_date, end_date, is_featured, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [title, description, icon, status || 'ongoing', start_date, end_date, is_featured || false, req.session.userId]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { title, description, icon, status, start_date, end_date, is_featured, is_active } = req.body;
    const result = await query(
      `UPDATE programs SET title=$1,description=$2,icon=$3,status=$4,start_date=$5,end_date=$6,is_featured=$7,is_active=$8 WHERE id=$9 RETURNING *`,
      [title, description, icon, status, start_date, end_date, is_featured, is_active, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await query('UPDATE programs SET is_active=false WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
