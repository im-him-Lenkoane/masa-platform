const express = require('express');
const router = express.Router();
const { query } = require('../db/pool');
const { requireAuth } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');

// Upload icon for any entity
router.post('/icon', requireAuth, upload.single('image'), handleUploadError, async (req, res) => {
  try {
    const { entity_type, entity_id } = req.body;
    if (!req.file) return res.status(400).json({ error: 'No image uploaded.' });
    
    const validTypes = ['subject', 'faculty', 'grade', 'program', 'team_member'];
    if (!validTypes.includes(entity_type)) {
      return res.status(400).json({ error: 'Invalid entity type.' });
    }

    const tableMap = {
      subject: 'subjects',
      faculty: 'faculties', 
      grade: 'grades',
      program: 'programs',
      team_member: 'team_members'
    };

    const filePath = '/uploads/' + req.file.filename;
    const table = tableMap[entity_type];
    const field = entity_type === 'team_member' ? 'photo_url' : 'icon_url';

    await query(
      `UPDATE ${table} SET ${field}=$1 WHERE id=$2`,
      [filePath, entity_id]
    );

    res.json({ success: true, url: filePath });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload banner for any entity
router.post('/banner', requireAuth, upload.single('image'), handleUploadError, async (req, res) => {
  try {
    const { entity_type, entity_id } = req.body;
    if (!req.file) return res.status(400).json({ error: 'No image uploaded.' });

    const validTypes = ['subject', 'faculty', 'grade'];
    if (!validTypes.includes(entity_type)) {
      return res.status(400).json({ error: 'Invalid entity type.' });
    }

    const tableMap = {
      subject: 'subjects',
      faculty: 'faculties',
      grade: 'grades'
    };

    const filePath = '/uploads/' + req.file.filename;
    const table = tableMap[entity_type];

    await query(
      `UPDATE ${table} SET banner_url=$1 WHERE id=$2`,
      [filePath, entity_id]
    );

    res.json({ success: true, url: filePath });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;