// src/routes/sponsors.js
const express = require('express');
const router = express.Router();
const { query } = require('../db/pool');
const { requireAuth } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');

router.get('/', async (req, res) => {
  try {
    const result = await query(
      'SELECT id, name, logo_path, website_url, tier, sort_order FROM sponsors WHERE is_active=true ORDER BY sort_order, tier'
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST with logo file upload
router.post('/', requireAuth, upload.single('logo'), handleUploadError, async (req, res) => {
  try {
    const { name, website_url, tier, sort_order } = req.body;
    const logo_path = req.file ? '/' + req.file.path.replace(/\\/g, '/') : null;
    const result = await query(
      `INSERT INTO sponsors (name, logo_path, website_url, tier, sort_order, created_by)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [name, logo_path, website_url, tier || 'standard', sort_order || 0, req.session.userId]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', requireAuth, upload.single('logo'), handleUploadError, async (req, res) => {
  try {
    const { name, website_url, tier, sort_order, is_active } = req.body;
    const logo_path = req.file ? '/' + req.file.path.replace(/\\/g, '/') : undefined;
    const result = await query(
      `UPDATE sponsors SET name=$1, website_url=$2, tier=$3, sort_order=$4, is_active=$5
       ${logo_path ? ', logo_path=$6' : ''} WHERE id=${logo_path ? '$7' : '$6'} RETURNING *`,
      logo_path
        ? [name, website_url, tier, sort_order, is_active, logo_path, req.params.id]
        : [name, website_url, tier, sort_order, is_active, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await query('UPDATE sponsors SET is_active=false WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
