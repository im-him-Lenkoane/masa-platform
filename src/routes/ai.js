// ================================================
// M@SA PLATFORM - AI CHATBOT ROUTE
// src/routes/ai.js
// Uses Anthropic Claude API
// Context-locked per subject and grade/level
// ================================================

const express = require('express');
const router = express.Router();
const { query } = require('../db/pool');

// POST /api/ai/chat
router.post('/chat', async (req, res) => {
  try {
    const { message, subject_id, conversation_history = [] } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required.' });
    }
    if (!subject_id) {
      return res.status(400).json({ error: 'subject_id is required.' });
    }

    // Fetch subject + grade info for context locking
    const subjectResult = await query(
      `SELECT s.name, s.description, s.ai_context, s.path_type,
              g.display_name AS grade_name
       FROM subjects s LEFT JOIN grades g ON g.id = s.grade_id
       WHERE s.id = $1`,
      [subject_id]
    );

    if (subjectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Subject not found.' });
    }

    const subject = subjectResult.rows[0];

    // Build the system prompt — this is what locks the AI to the correct level
    const levelDescription = subject.path_type === 'tertiary'
      ? `You are tutoring a UNIVERSITY/TERTIARY level student studying ${subject.name}. 
         Respond at an appropriate university degree level. Use formal academic language, 
         mathematical notation where appropriate, and assume a strong high school foundation. 
         Reference university-standard concepts, theories, and methodologies.`
      : `You are tutoring a ${subject.grade_name} school learner studying ${subject.name} 
         in South Africa. Respond at a ${subject.grade_name} level — clear, encouraging, 
         and age-appropriate. Use the South African CAPS curriculum as your guide. 
         Avoid overly technical jargon and instead use relatable examples.`;

    const systemPrompt = `You are M@SA AI Tutor — an educational assistant for Messelaar @ STEM Academy NPC, 
a South African non-profit STEM education platform.

CRITICAL RULES:
1. You ONLY answer questions related to ${subject.name}.
2. ${levelDescription}
3. If asked about anything unrelated to ${subject.name} or general study skills, 
   politely redirect: "I'm specifically set up to help you with ${subject.name}. 
   For other subjects, please visit their subject page."
4. Never answer questions about harmful content, politics, or off-topic subjects.
5. Always be encouraging, patient, and supportive of learning.
6. When giving examples, use South African context where possible (Rands, SA places, local industries).
7. For mathematical subjects, show step-by-step working.
8. Keep responses focused and not excessively long — aim for clarity over comprehensiveness.

SUBJECT CONTEXT:
${subject.ai_context || `This is ${subject.name} at ${subject.grade_name || 'university'} level.`}

SUBJECT DESCRIPTION:
${subject.description || ''}`;

    // Build conversation for Claude API
    const messages = [];

    // Add conversation history (max last 10 exchanges to save tokens)
    const recentHistory = conversation_history.slice(-20);
    for (const msg of recentHistory) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    // Add current user message
    messages.push({ role: 'user', content: message.trim() });

    // Call Anthropic API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-6',
        max_tokens: 1024,
        system: systemPrompt,
        messages: messages,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error('Anthropic API error:', response.status, errBody);
      return res.status(502).json({ error: 'AI service temporarily unavailable. Please try again.' });
    }

    const data = await response.json();
    const aiMessage = data.content?.[0]?.text || 'I could not generate a response. Please try again.';

    res.json({
      message: aiMessage,
      subject: subject.name,
      level: subject.path_type === 'tertiary' ? 'university' : subject.grade_name,
    });

  } catch (err) {
    console.error('AI chat error:', err);
    res.status(500).json({ error: 'AI chat failed. Please try again.' });
  }
});

module.exports = router;
