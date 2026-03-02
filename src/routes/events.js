// src/routes/events.js
'use strict';
const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcrypt');
const pool    = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

function generateJitsiRoom(title) {
  const safe = title.replace(/[^a-zA-Z0-9]/g,'').toLowerCase().substring(0,20);
  return 'masa-' + safe + '-' + Math.random().toString(36).substring(2,8);
}

// GET all events
router.get('/', async (req, res) => {
  try {
    const r = await pool.query(`SELECT * FROM events WHERE is_active=true ORDER BY event_date ASC`);
    res.json(r.rows);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// CREATE event — auto-creates session for online/hybrid
router.post('/', requireAuth, async (req, res) => {
  try {
    const {
      title, description, event_date, end_date, location, event_type, is_featured,
      auto_create_session,
      // session options (if auto_create_session=true)
      session_access_type, session_is_locked, session_password,
      session_max_participants, session_price_rands,
      bank_name, bank_account_name, bank_account_no, bank_branch_code,
    } = req.body;

    if (!title || !event_date) return res.status(400).json({ error: 'Title and date required.' });

    const er = await pool.query(
      `INSERT INTO events (title,description,event_date,end_date,location,event_type,is_featured,created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [title,description||null,event_date,end_date||null,location||null,
       event_type||'in-person',is_featured||false,req.session.userId]
    );
    const event = er.rows[0];

    // Auto-create session for online/hybrid events
    if (auto_create_session !== false && ['online','hybrid'].includes(event.event_type)) {
      try {
        let ph = null;
        if (session_is_locked && session_password) ph = await bcrypt.hash(session_password, 10);
        const jitsi = generateJitsiRoom(title);
        const sr = await pool.query(`
          INSERT INTO sessions (event_id,title,description,session_type,access_type,
            is_locked,password_hash,scheduled_start,scheduled_end,max_participants,
            price_rands,jitsi_room_name,bank_name,bank_account_name,bank_account_no,
            bank_branch_code,created_by)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING id`,
          [event.id,title,description||null,event_type,session_access_type||'free_open',
           session_is_locked||false,ph,event_date,end_date||null,
           session_max_participants||100,session_price_rands||0,jitsi,
           bank_name||null,bank_account_name||null,bank_account_no||null,
           bank_branch_code||null,req.session.userId]);
        event.auto_session_id = sr.rows[0].id;
      } catch(se) { console.error('Auto-session creation failed:', se.message); }
    }

    res.status(201).json(event);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// UPDATE event
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { title, description, event_date, end_date, location, event_type, is_featured, is_active } = req.body;
    const r = await pool.query(
      `UPDATE events SET title=$1,description=$2,event_date=$3,end_date=$4,
       location=$5,event_type=$6,is_featured=$7,is_active=$8 WHERE id=$9 RETURNING *`,
      [title,description,event_date,end_date||null,location,event_type,is_featured,is_active||true,req.params.id]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'Event not found.' });
    res.json(r.rows[0]);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// DELETE event
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await pool.query('UPDATE events SET is_active=false WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
