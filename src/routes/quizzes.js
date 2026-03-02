// src/routes/quizzes.js
const express = require('express');
const router = express.Router();
const { query } = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

// GET /api/quizzes?topic_id=xxx
router.get('/', async (req, res) => {
  try {
    const { topic_id } = req.query;
    if (!topic_id) return res.status(400).json({ error: 'topic_id required' });
    const result = await query(
      'SELECT id, title, description, time_limit_minutes, pass_mark_percent FROM quizzes WHERE topic_id=$1 AND is_active=true',
      [topic_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/quizzes/:id/questions (students get questions WITHOUT correct answers)
router.get('/:id/questions', async (req, res) => {
  try {
    const questions = await query(
      `SELECT id, type, question_text, image_url, sort_order
       FROM quiz_questions WHERE quiz_id=$1 ORDER BY sort_order`,
      [req.params.id]
    );
    // Get options without revealing is_correct
    const questionsWithOptions = await Promise.all(questions.rows.map(async (q) => {
      const options = await query(
        `SELECT id, option_text, match_pair, sort_order
         FROM quiz_options WHERE question_id=$1 ORDER BY sort_order`,
        [q.id]
      );
      return { ...q, options: options.rows };
    }));
    res.json(questionsWithOptions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/quizzes/:id/submit (students submit answers, get score)
router.post('/:id/submit', async (req, res) => {
  try {
    const { answers } = req.body; // { questionId: optionId, ... }
    const questions = await query(
      'SELECT id FROM quiz_questions WHERE quiz_id=$1',
      [req.params.id]
    );
    const quiz = await query(
      'SELECT pass_mark_percent FROM quizzes WHERE id=$1',
      [req.params.id]
    );

    let correct = 0;
    const results = [];

    for (const q of questions.rows) {
      const submittedId = answers[q.id];
      const correctOption = await query(
        'SELECT id, option_text FROM quiz_options WHERE question_id=$1 AND is_correct=true',
        [q.id]
      );
      const isCorrect = correctOption.rows[0]?.id === submittedId;
      if (isCorrect) correct++;
      results.push({
        questionId: q.id,
        correct: isCorrect,
        correctOptionId: correctOption.rows[0]?.id,
        correctOptionText: correctOption.rows[0]?.option_text,
      });
    }

    const total = questions.rows.length;
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
    const passed = percentage >= (quiz.rows[0]?.pass_mark_percent || 50);

    res.json({ correct, total, percentage, passed, results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/quizzes (admin - create quiz)
router.post('/', requireAuth, async (req, res) => {
  try {
    const { topic_id, title, description, time_limit_minutes, pass_mark_percent } = req.body;
    const result = await query(
      `INSERT INTO quizzes (topic_id, title, description, time_limit_minutes, pass_mark_percent, created_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [topic_id, title, description, time_limit_minutes, pass_mark_percent || 50, req.session.userId]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/quizzes/:id/questions (admin - add question)
router.post('/:id/questions', requireAuth, async (req, res) => {
  try {
    const { type, question_text, image_url, sort_order, options } = req.body;
    const validTypes = ['multiple_choice', 'true_false', 'matching'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid question type.' });
    }
    const qRes = await query(
      `INSERT INTO quiz_questions (quiz_id, type, question_text, image_url, sort_order)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.params.id, type, question_text, image_url, sort_order || 0]
    );
    const questionId = qRes.rows[0].id;

    // Insert options
    if (options && Array.isArray(options)) {
      for (let i = 0; i < options.length; i++) {
        const o = options[i];
        await query(
          `INSERT INTO quiz_options (question_id, option_text, is_correct, match_pair, sort_order)
           VALUES ($1, $2, $3, $4, $5)`,
          [questionId, o.option_text, o.is_correct || false, o.match_pair || null, i]
        );
      }
    }

    // For true/false: auto-create True/False options if not provided
    if (type === 'true_false' && (!options || options.length === 0)) {
      await query(
        `INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES ($1,'True',$2,0),($1,'False',$3,1)`,
        [questionId, req.body.correct_answer === 'true', req.body.correct_answer === 'false']
      );
    }

    res.status(201).json(qRes.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/quizzes/:id (admin)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await query('UPDATE quizzes SET is_active=false WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
