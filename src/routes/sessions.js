// src/routes/sessions.js
'use strict';
const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcrypt');
const pool    = require('../db/pool');
const { requireAuth, requireAdmin } = require('../middleware/auth');

function generateClassId() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  const mixed   = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#@*-';
  const rand    = (s) => s[Math.floor(Math.random() * s.length)];
  let mid = '';
  for (let i = 0; i < 12; i++) mid += rand(mixed);
  return rand(letters) + mid + rand(letters);
}

function generateJitsiRoom(title) {
  const safe = title.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().substring(0, 20);
  const rand = Math.random().toString(36).substring(2, 8);
  return 'masa-' + safe + '-' + rand;
}

function isRegistrationOpen(session) {
  const now   = new Date();
  const start = new Date(session.scheduled_start);
  const hours = (session.max_participants || 100) > 20 ? 48 : 24;
  return now < new Date(start.getTime() - hours * 3600000);
}

// GET all sessions
router.get('/', async (req, res) => {
  try {
    const { status, upcoming } = req.query;
    let q = `SELECT s.*, e.title AS event_title, u.full_name AS host_name,
      subj.name AS subject_name,
      (SELECT COUNT(*) FROM session_participants sp WHERE sp.session_id=s.id
       AND sp.payment_status IN ('verified','free')) AS confirmed_count
      FROM sessions s
      LEFT JOIN events e ON s.event_id=e.id
      LEFT JOIN users u ON s.created_by=u.id
      LEFT JOIN subjects subj ON s.subject_id=subj.id
      WHERE s.status != 'cancelled'`;
    const p = [];
    if (status)   { p.push(status); q += ` AND s.status=$${p.length}`; }
    if (upcoming) { p.push(new Date().toISOString()); q += ` AND s.scheduled_start>$${p.length}`; }
    q += ' ORDER BY s.scheduled_start ASC';
    const r = await pool.query(q, p);
    res.json(r.rows.map(s => ({
      ...s, password_hash: undefined,
      registration_open: isRegistrationOpen(s),
      spots_left: Math.max(0, (s.max_participants||100) - parseInt(s.confirmed_count||0)),
    })));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// GET single session
router.get('/:id', async (req, res) => {
  try {
    const r = await pool.query(`SELECT s.*, e.title AS event_title, u.full_name AS host_name,
      subj.name AS subject_name,
      (SELECT COUNT(*) FROM session_participants sp WHERE sp.session_id=s.id
       AND sp.payment_status IN ('verified','free')) AS confirmed_count
      FROM sessions s LEFT JOIN events e ON s.event_id=e.id
      LEFT JOIN users u ON s.created_by=u.id
      LEFT JOIN subjects subj ON s.subject_id=subj.id
      WHERE s.id=$1`, [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Session not found.' });
    const s = r.rows[0];
    delete s.password_hash;
    s.registration_open = isRegistrationOpen(s);
    s.spots_left = Math.max(0, (s.max_participants||100) - parseInt(s.confirmed_count||0));
    res.json(s);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// CREATE session
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { event_id, title, description, session_type, access_type, is_locked, password,
      scheduled_start, scheduled_end, max_participants, price_rands, subject_id,
      bank_name, bank_account_name, bank_account_no, bank_branch_code, bank_reference_prefix } = req.body;
    if (!title || !scheduled_start) return res.status(400).json({ error: 'Title and start time required.' });
    let ph = null;
    if (is_locked && password) ph = await bcrypt.hash(password, 10);
    const jitsi = generateJitsiRoom(title);
    const r = await pool.query(`INSERT INTO sessions
      (event_id,title,description,session_type,access_type,is_locked,password_hash,
       scheduled_start,scheduled_end,max_participants,price_rands,subject_id,
       bank_name,bank_account_name,bank_account_no,bank_branch_code,bank_reference_prefix,
       jitsi_room_name,created_by)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19) RETURNING *`,
      [event_id||null,title,description||null,session_type||'online',access_type||'free_open',
       is_locked||false,ph,scheduled_start,scheduled_end||null,max_participants||100,
       price_rands||0,subject_id||null,bank_name||null,bank_account_name||null,
       bank_account_no||null,bank_branch_code||null,bank_reference_prefix||null,
       jitsi,req.session.userId]);
    const s = r.rows[0]; delete s.password_hash;
    res.status(201).json(s);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// UPDATE session
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { title, description, session_type, access_type, is_locked, password,
      scheduled_start, scheduled_end, max_participants, price_rands, subject_id, status,
      bank_name, bank_account_name, bank_account_no, bank_branch_code, bank_reference_prefix } = req.body;
    let ph = null;
    if (is_locked && password) ph = await bcrypt.hash(password, 10);
    let q = `UPDATE sessions SET title=$1,description=$2,session_type=$3,access_type=$4,
      is_locked=$5,scheduled_start=$6,scheduled_end=$7,max_participants=$8,price_rands=$9,
      subject_id=$10,status=$11,bank_name=$12,bank_account_name=$13,bank_account_no=$14,
      bank_branch_code=$15,bank_reference_prefix=$16,updated_at=NOW()`;
    const vals = [title,description,session_type,access_type,is_locked,scheduled_start,
      scheduled_end,max_participants,price_rands,subject_id,status,
      bank_name,bank_account_name,bank_account_no,bank_branch_code,bank_reference_prefix];
    if (ph) { vals.push(ph); q += `,password_hash=$${vals.length}`; }
    vals.push(req.params.id);
    q += ` WHERE id=$${vals.length} RETURNING *`;
    const r = await pool.query(q, vals);
    if (!r.rows.length) return res.status(404).json({ error: 'Session not found.' });
    const s = r.rows[0]; delete s.password_hash;
    res.json(s);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// START session
router.put('/:id/start', requireAuth, requireAdmin, async (req, res) => {
  try {
    const r = await pool.query(
      `UPDATE sessions SET status='live',actual_start=NOW(),updated_at=NOW() WHERE id=$1 RETURNING *`,
      [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Session not found.' });
    res.json(r.rows[0]);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// END session + clear personal info
router.put('/:id/end', requireAuth, requireAdmin, async (req, res) => {
  try {
    const r = await pool.query(
      `UPDATE sessions SET status='ended',actual_end=NOW(),updated_at=NOW() WHERE id=$1 RETURNING *`,
      [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Session not found.' });
    await pool.query(`UPDATE session_participants
      SET full_name='[removed]',id_number='[removed]',email='[removed]',
          info_cleared=true,info_cleared_at=NOW() WHERE session_id=$1`, [req.params.id]);
    res.json({ ...r.rows[0], info_cleared: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// DELETE (cancel) session
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    await pool.query(`UPDATE sessions SET status='cancelled' WHERE id=$1`, [req.params.id]);
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// REGISTER for session (public)
router.post('/:id/register', async (req, res) => {
  try {
    const { full_name, id_number, email } = req.body;
    if (!full_name || !id_number) return res.status(400).json({ error: 'Full name and ID number required.' });
    const sr = await pool.query('SELECT * FROM sessions WHERE id=$1', [req.params.id]);
    if (!sr.rows.length) return res.status(404).json({ error: 'Session not found.' });
    const session = sr.rows[0];
    if (session.status === 'cancelled') return res.status(400).json({ error: 'Session cancelled.' });
    if (session.status === 'ended')     return res.status(400).json({ error: 'Session has ended.' });
    if (!isRegistrationOpen(session))   return res.status(400).json({ error: 'Registration deadline has passed.' });
    const cr = await pool.query(
      `SELECT COUNT(*) FROM session_participants WHERE session_id=$1 AND payment_status IN ('verified','free')`,
      [session.id]);
    if (parseInt(cr.rows[0].count) >= session.max_participants)
      return res.status(400).json({ error: 'Session is fully booked.' });
    const dup = await pool.query(
      `SELECT id FROM session_participants WHERE session_id=$1 AND id_number=$2 AND info_cleared=false`,
      [session.id, id_number]);
    if (dup.rows.length) return res.status(400).json({ error: 'Already registered for this session.' });
    let classId, attempts = 0;
    do {
      classId = generateClassId();
      const ex = await pool.query('SELECT id FROM session_participants WHERE class_id=$1', [classId]);
      if (!ex.rows.length) break;
    } while (++attempts < 10);
    const ps = session.access_type === 'paid' ? 'pending' : 'free';
    const pr = await pool.query(`INSERT INTO session_participants
      (session_id,full_name,id_number,email,class_id,payment_status)
      VALUES($1,$2,$3,$4,$5,$6) RETURNING id,class_id,payment_status,registered_at`,
      [session.id,full_name,id_number,email||null,classId,ps]);
    const participant = pr.rows[0];
    let paymentInstructions = null;
    if (session.access_type === 'paid') {
      paymentInstructions = {
        bank_name:      session.bank_name,
        account_name:   session.bank_account_name,
        account_no:     session.bank_account_no,
        branch_code:    session.bank_branch_code,
        amount:         session.price_rands,
        reference:      `${full_name.replace(/\s/g,'_')}_${id_number}_${classId}`,
        deadline_hours: session.max_participants > 20 ? 48 : 24,
      };
    }
    res.status(201).json({
      success: true,
      class_id: participant.class_id,
      payment_status: participant.payment_status,
      payment_instructions: paymentInstructions,
      session_title: session.title,
      scheduled_start: session.scheduled_start,
      message: session.access_type === 'paid'
        ? 'Registration successful! Complete your EFT payment. Your Class ID is your reference and session password.'
        : 'Registration successful! Your Class ID is your session password.',
    });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// VERIFY ENTRY (public)
router.post('/:id/verify-entry', async (req, res) => {
  try {
    const { class_id } = req.body;
    if (!class_id) return res.status(400).json({ error: 'Class ID required.' });
    const sr = await pool.query('SELECT * FROM sessions WHERE id=$1', [req.params.id]);
    if (!sr.rows.length) return res.status(404).json({ error: 'Session not found.' });
    const session = sr.rows[0];
    if (session.access_type === 'free_open' && !session.is_locked)
      return res.json({ admitted: true, display_name: 'Guest', jitsi_room: session.jitsi_room_name });
    if (session.access_type === 'free_locked') {
      const match = await bcrypt.compare(class_id, session.password_hash || '');
      if (!match) return res.status(401).json({ error: 'Incorrect password.' });
      return res.json({ admitted: true, display_name: 'Student', jitsi_room: session.jitsi_room_name });
    }
    const pr = await pool.query(
      `SELECT * FROM session_participants WHERE session_id=$1 AND class_id=$2 AND info_cleared=false`,
      [session.id, class_id]);
    if (!pr.rows.length) return res.status(401).json({ error: 'Class ID not found. Please register first.' });
    const p = pr.rows[0];
    if (p.payment_status === 'pending')  return res.status(403).json({ error: 'Payment not yet verified.', payment_status: 'pending' });
    if (p.payment_status === 'rejected') return res.status(403).json({ error: 'Payment rejected. Contact admin.', payment_status: 'rejected' });
    await pool.query('UPDATE session_participants SET admitted_at=NOW() WHERE id=$1', [p.id]);
    res.json({ admitted: true, display_name: p.full_name, jitsi_room: session.jitsi_room_name });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ADMIN: get participants
router.get('/:id/participants', requireAuth, requireAdmin, async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT id,full_name,id_number,email,class_id,payment_status,payment_reference,
       registered_at,admitted_at,info_cleared FROM session_participants
       WHERE session_id=$1 ORDER BY registered_at DESC`, [req.params.id]);
    res.json(r.rows);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ADMIN: verify payment
router.put('/:id/participants/:pid/verify', requireAuth, requireAdmin, async (req, res) => {
  try {
    const r = await pool.query(
      `UPDATE session_participants SET payment_status='verified',payment_reference=$1
       WHERE id=$2 AND session_id=$3 RETURNING *`,
      [req.body.payment_reference||null, req.params.pid, req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Not found.' });
    res.json(r.rows[0]);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ADMIN: reject payment
router.put('/:id/participants/:pid/reject', requireAuth, requireAdmin, async (req, res) => {
  try {
    const r = await pool.query(
      `UPDATE session_participants SET payment_status='rejected' WHERE id=$1 AND session_id=$2 RETURNING *`,
      [req.params.pid, req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Not found.' });
    res.json(r.rows[0]);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ADMIN: admit face-to-face
router.post('/:id/admit', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { class_id } = req.body;
    if (!class_id) return res.status(400).json({ error: 'Class ID required.' });
    const r = await pool.query(
      `SELECT * FROM session_participants WHERE session_id=$1 AND class_id=$2 AND info_cleared=false`,
      [req.params.id, class_id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Class ID not found.' });
    const p = r.rows[0];
    if (p.payment_status === 'pending') return res.status(403).json({ error: 'Payment not verified.', participant: p });
    await pool.query('UPDATE session_participants SET admitted_at=NOW() WHERE id=$1', [p.id]);
    res.json({ admitted: true, participant: { full_name: p.full_name, payment_status: p.payment_status, class_id: p.class_id } });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// CHAT: get messages
router.get('/:id/chat', async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT id,sender_name,message,is_admin,created_at FROM session_chat
       WHERE session_id=$1 ORDER BY created_at ASC LIMIT 200`, [req.params.id]);
    res.json(r.rows);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// CHAT: post message
router.post('/:id/chat', async (req, res) => {
  try {
    const { sender_name, message, is_admin } = req.body;
    if (!sender_name || !message) return res.status(400).json({ error: 'Name and message required.' });
    if (message.length > 1000) return res.status(400).json({ error: 'Message too long.' });
    const r = await pool.query(
      `INSERT INTO session_chat(session_id,sender_name,message,is_admin) VALUES($1,$2,$3,$4) RETURNING *`,
      [req.params.id, sender_name, message, is_admin||false]);
    res.status(201).json(r.rows[0]);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
