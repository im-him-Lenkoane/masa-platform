// src/routes/resources.js
const express = require('express');
const router = express.Router();
const { query } = require('../db/pool');
const { requireAuth } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');
const path = require('path');
const fs = require('fs');

// Helper: extract YouTube video ID from URL
function extractYouTubeId(url) {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

// GET /api/resources/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await query('SELECT * FROM resources WHERE id=$1 AND is_active=true', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Resource not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/resources/video (admin) - add YouTube video link
router.post('/video', requireAuth, async (req, res) => {
  try {
    const { topic_id, title, description, youtube_url, transcript, sort_order } = req.body;
    if (!topic_id || !title || !youtube_url) {
      return res.status(400).json({ error: 'topic_id, title and youtube_url are required.' });
    }
    const youtube_id = extractYouTubeId(youtube_url);
    if (!youtube_id) {
      return res.status(400).json({ error: 'Invalid YouTube URL.' });
    }
    const result = await query(
      `INSERT INTO resources (topic_id, type, title, description, youtube_url, youtube_id, transcript, sort_order, uploaded_by)
       VALUES ($1, 'video', $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [topic_id, title, description, youtube_url, youtube_id, transcript, sort_order || 0, req.session.userId]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/resources/file (admin) - upload PDF, slides, images
router.post('/file', requireAuth, upload.single('file'), handleUploadError, async (req, res) => {
  try {
    const { topic_id, type, title, description, sort_order } = req.body;
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
    if (!topic_id || !title || !type) {
      return res.status(400).json({ error: 'topic_id, title and type are required.' });
    }
    const validTypes = ['pdf', 'slides', 'image', 'practice_questions', 'exam_prep'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid resource type.' });
    }
    const filePath = '/' + req.file.path.replace(/\\/g, '/');
    const result = await query(
      `INSERT INTO resources (topic_id, type, title, description, file_path, file_size_kb, sort_order, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [topic_id, type, title, description, filePath, Math.round(req.file.size / 1024), sort_order || 0, req.session.userId]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/resources/notes (admin) - inline text notes
router.post('/notes', requireAuth, async (req, res) => {
  try {
    const { topic_id, title, description, content, sort_order } = req.body;
    if (!topic_id || !title || !content) {
      return res.status(400).json({ error: 'topic_id, title and content are required.' });
    }
    const result = await query(
      `INSERT INTO resources (topic_id, type, title, description, content, sort_order, uploaded_by)
       VALUES ($1, 'notes', $2, $3, $4, $5, $6) RETURNING *`,
      [topic_id, title, description, content, sort_order || 0, req.session.userId]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/resources/:id (admin)
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { title, description, transcript, content, sort_order, is_active } = req.body;
    const result = await query(
      `UPDATE resources SET title=$1, description=$2, transcript=$3, content=$4, sort_order=$5, is_active=$6
       WHERE id=$7 RETURNING *`,
      [title, description, transcript, content, sort_order, is_active, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/resources/:id (admin)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const res2 = await query('SELECT file_path FROM resources WHERE id=$1', [req.params.id]);
    if (res2.rows[0]?.file_path) {
      const fp = path.join(__dirname, '../../', res2.rows[0].file_path);
      if (fs.existsSync(fp)) fs.unlinkSync(fp);
    }
    await query('UPDATE resources SET is_active=false WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
