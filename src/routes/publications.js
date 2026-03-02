// src/routes/publications.js
const express = require('express');
const router = express.Router();
const { query } = require('../db/pool');
const { requireAuth } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');

router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM publications WHERE is_active=true ORDER BY published_date DESC, created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', requireAuth, upload.single('file'), handleUploadError, async (req, res) => {
  try {
    const { title, description, pub_type, external_url, published_date } = req.body;
    const file_path = req.file ? '/' + req.file.path.replace(/\\/g, '/') : null;
    const result = await query(
      `INSERT INTO publications (title, description, pub_type, file_path, external_url, published_date, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [title, description, pub_type || 'report', file_path, external_url, published_date, req.session.userId]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { title, description, pub_type, external_url, published_date, is_active } = req.body;
    const result = await query(
      `UPDATE publications SET title=$1,description=$2,pub_type=$3,external_url=$4,published_date=$5,is_active=$6 WHERE id=$7 RETURNING *`,
      [title, description, pub_type, external_url, published_date, is_active, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await query('UPDATE publications SET is_active=false WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
