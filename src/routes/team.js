const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { requireAdmin } = require('../middleware/auth');

// GET all team members
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM team_members WHERE is_active=true ORDER BY category, sort_order'
    );
    res.json(result.rows);
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single member
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM team_members WHERE id=$1', [req.params.id]
    );
    res.json(result.rows[0]);
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

// POST add member
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { full_name, role, category, bio, email, photo_url, linkedin_url, twitter_url, sort_order } = req.body;
    const result = await pool.query(
      `INSERT INTO team_members 
       (full_name, role, category, bio, email, photo_url, linkedin_url, twitter_url, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [full_name, role, category||'builder', bio, email, photo_url, linkedin_url, twitter_url, sort_order||0]
    );
    res.json(result.rows[0]);
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE member
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM team_members WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;