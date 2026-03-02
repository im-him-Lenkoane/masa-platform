// src/routes/comments.js
const express = require('express');
const router = express.Router();
const { query } = require('../db/pool');
const { requireAuth, checkBlockedIP } = require('../middleware/auth');

// GET comments for a resource
router.get('/', async (req, res) => {
  try {
    const { resource_id } = req.query;
    if (!resource_id) return res.status(400).json({ error: 'resource_id required' });
    const result = await query(
      `SELECT id, author_name, content, created_at FROM comments
       WHERE resource_id=$1 AND is_deleted=false AND is_blocked=false
       ORDER BY created_at ASC`,
      [resource_id]
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST a comment (open to all, IP-checked)
router.post('/', checkBlockedIP, async (req, res) => {
  try {
    const { resource_id, author_name, content } = req.body;
    if (!resource_id || !content?.trim()) {
      return res.status(400).json({ error: 'resource_id and content required.' });
    }
    if (content.length > 1000) {
      return res.status(400).json({ error: 'Comment too long (max 1000 chars).' });
    }
    const ip = req.ip || req.connection.remoteAddress;
    const result = await query(
      `INSERT INTO comments (resource_id, author_name, content, ip_address)
       VALUES ($1,$2,$3,$4) RETURNING id, author_name, content, created_at`,
      [resource_id, author_name?.trim() || 'Anonymous', content.trim(), ip]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE comment (admin)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await query('UPDATE comments SET is_deleted=true WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST block an IP (admin)
router.post('/block-ip', requireAuth, async (req, res) => {
  try {
    const { ip_address, reason } = req.body;
    await query(
      `INSERT INTO blocked_ips (ip_address, reason, blocked_by)
       VALUES ($1,$2,$3) ON CONFLICT (ip_address) DO NOTHING`,
      [ip_address, reason, req.session.userId]
    );
    // Also hide all comments from this IP
    await query('UPDATE comments SET is_blocked=true WHERE ip_address=$1', [ip_address]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET all comments for admin moderation
router.get('/admin/all', requireAuth, async (req, res) => {
  try {
    const result = await query(
      `SELECT c.*, r.title AS resource_title FROM comments c
       LEFT JOIN resources r ON r.id = c.resource_id
       WHERE c.is_deleted=false ORDER BY c.created_at DESC LIMIT 100`
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET blocked IPs (admin)
router.get('/admin/blocked-ips', requireAuth, async (req, res) => {
  try {
    const result = await query('SELECT * FROM blocked_ips ORDER BY blocked_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE unblock IP (admin)
router.delete('/block-ip/:id', requireAuth, async (req, res) => {
  try {
    const ip = await query('SELECT ip_address FROM blocked_ips WHERE id=$1', [req.params.id]);
    await query('DELETE FROM blocked_ips WHERE id=$1', [req.params.id]);
    if (ip.rows[0]) {
      await query('UPDATE comments SET is_blocked=false WHERE ip_address=$1', [ip.rows[0].ip_address]);
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
