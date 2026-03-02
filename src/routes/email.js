// src/routes/email.js
// Handles all email functionality:
// - Contact form
// - Admin notifications
// - Newsletter

'use strict';

const express = require('express');
const router  = express.Router();
const pool    = require('../db/pool');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// ── EMAIL SENDER HELPER ───────────────────────────────────────────────────────
async function sendEmail({ to, subject, html, text }) {
  const apiKey   = process.env.BREVO_API_KEY;
  const fromEmail = process.env.BREVO_FROM_EMAIL || 'noreply@masa.org.za';
  const fromName  = process.env.BREVO_FROM_NAME  || 'M@SA Platform';

  if (!apiKey) {
    console.warn('BREVO_API_KEY not set — email not sent');
    return { skipped: true };
  }

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify({
      sender: { name: fromName, email: fromEmail },
      to: Array.isArray(to) ? to : [{ email: to }],
      subject,
      htmlContent: html,
      textContent: text,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error('Brevo error: ' + err);
  }

  return await response.json();
}

// ── EMAIL TEMPLATES ───────────────────────────────────────────────────────────
function baseTemplate(content) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; background: #0a1628; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #0f2040; border-radius: 12px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #0f2040, #1a3a6b); padding: 32px; text-align: center; border-bottom: 2px solid #f5c842; }
    .logo { font-size: 2rem; font-weight: 900; color: #f5c842; letter-spacing: 0.05em; }
    .logo-sub { font-size: 0.75rem; color: #a0b4c8; margin-top: 4px; }
    .body { padding: 32px; color: #c8d8e8; line-height: 1.7; }
    .body h2 { color: #4fc3f7; margin-top: 0; }
    .highlight { background: #1a3a6b; border-left: 3px solid #4fc3f7; padding: 16px; border-radius: 0 8px 8px 0; margin: 16px 0; }
    .btn { display: inline-block; background: #f5c842; color: #0a1628; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 16px; }
    .footer { padding: 20px 32px; text-align: center; font-size: 0.75rem; color: #5a7a9a; border-top: 1px solid rgba(79,195,247,0.1); }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">M@SA</div>
      <div class="logo-sub">Messelaar @ STEM Academy NPC</div>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      masa.org.za &nbsp;·&nbsp; Free STEM Education for South Africa<br>
      This email was sent by the M@SA platform.
    </div>
  </div>
</body>
</html>`;
}

function contactNotificationTemplate(data) {
  return baseTemplate(`
    <h2>📬 New Contact Form Message</h2>
    <div class="highlight">
      <strong>From:</strong> ${data.name}<br>
      <strong>Email:</strong> ${data.email}<br>
      <strong>Subject:</strong> ${data.subject || 'General Enquiry'}<br>
    </div>
    <p><strong>Message:</strong></p>
    <p style="background:#0a1628;padding:16px;border-radius:8px">${data.message}</p>
    <a href="mailto:${data.email}" class="btn">Reply to ${data.name}</a>
  `);
}

function contactAutoReplyTemplate(name) {
  return baseTemplate(`
    <h2>Thank you, ${name}! 👋</h2>
    <p>We've received your message and will get back to you as soon as possible.</p>
    <div class="highlight">
      <strong>What happens next:</strong><br>
      Our team reviews all messages and typically responds within 1-2 business days.
    </div>
    <p>In the meantime, feel free to explore our free STEM resources:</p>
    <a href="https://masa.org.za/learner.html" class="btn">Explore Subjects →</a>
  `);
}

function commentNotificationTemplate(data) {
  return baseTemplate(`
    <h2>💬 New Comment Posted</h2>
    <div class="highlight">
      <strong>Author:</strong> ${data.author_name}<br>
      <strong>Resource:</strong> ${data.resource_title}<br>
      <strong>Subject:</strong> ${data.subject_name}<br>
    </div>
    <p><strong>Comment:</strong></p>
    <p style="background:#0a1628;padding:16px;border-radius:8px">${data.content}</p>
    <a href="https://masa.org.za/admin.html" class="btn">Review in Admin Panel →</a>
  `);
}

function newsletterTemplate(data) {
  return baseTemplate(`
    <h2>${data.subject}</h2>
    ${data.body}
    <hr style="border-color:rgba(79,195,247,0.2);margin:24px 0">
    <p style="font-size:0.8rem;color:#5a7a9a">
      You're receiving this because you subscribed to M@SA updates.<br>
      <a href="https://masa.org.za/unsubscribe?email={{email}}" style="color:#4fc3f7">Unsubscribe</a>
    </p>
  `);
}

// ── ROUTES ────────────────────────────────────────────────────────────────────

// POST /api/email/contact
// Public — anyone can submit contact form
router.post('/contact', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email and message are required.' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email address.' });
    }

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@masa.org.za';

    // Send notification to admin
    await sendEmail({
      to: adminEmail,
      subject: `[M@SA Contact] ${subject || 'New message from ' + name}`,
      html: contactNotificationTemplate({ name, email, subject, message }),
      text: `New contact from ${name} (${email}): ${message}`,
    });

    // Send auto-reply to sender
    await sendEmail({
      to: email,
      subject: 'We received your message — M@SA',
      html: contactAutoReplyTemplate(name),
      text: `Hi ${name}, thank you for contacting M@SA. We will get back to you soon.`,
    });

    // Save to database
    await pool.query(
      `INSERT INTO contact_submissions (name, email, subject, message)
       VALUES ($1, $2, $3, $4)`,
      [name, email, subject || '', message]
    );

    res.json({ success: true, message: 'Message sent successfully!' });

  } catch (err) {
    console.error('Contact form error:', err);
    // Don't fail silently — but don't expose internal errors
    res.status(500).json({ error: 'Failed to send message. Please try again.' });
  }
});

// POST /api/email/notify-comment
// Internal — called when a new comment is posted
router.post('/notify-comment', async (req, res) => {
  try {
    const { author_name, content, resource_title, subject_name } = req.body;
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@masa.org.za';

    await sendEmail({
      to: adminEmail,
      subject: `[M@SA] New comment by ${author_name}`,
      html: commentNotificationTemplate({ author_name, content, resource_title, subject_name }),
      text: `New comment by ${author_name} on ${resource_title}: ${content}`,
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Comment notification error:', err);
    res.json({ success: false }); // Non-critical, don't block comment posting
  }
});

// POST /api/email/subscribe
// Public — subscribe to newsletter
router.post('/subscribe', async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email) return res.status(400).json({ error: 'Email required.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email address.' });
    }

    // Save subscriber
    await pool.query(
      `INSERT INTO newsletter_subscribers (email, name)
       VALUES ($1, $2)
       ON CONFLICT (email) DO UPDATE SET is_active = true, name = $2`,
      [email, name || '']
    );

    // Send welcome email
    await sendEmail({
      to: email,
      subject: 'Welcome to M@SA Updates! 🎓',
      html: baseTemplate(`
        <h2>Welcome to M@SA! 🎓</h2>
        <p>Hi${name ? ' ' + name : ''},</p>
        <p>You're now subscribed to updates from <strong>Messelaar @ STEM Academy NPC</strong>.</p>
        <div class="highlight">
          You'll be the first to know about:<br><br>
          📚 New study resources and videos<br>
          📅 Upcoming events and workshops<br>
          🚀 New programs and opportunities<br>
          🎯 Study tips and exam preparation
        </div>
        <a href="https://masa.org.za" class="btn">Start Learning →</a>
      `),
      text: `Welcome to M@SA! You are now subscribed to our newsletter.`,
    });

    res.json({ success: true, message: 'Subscribed successfully!' });

  } catch (err) {
    console.error('Subscribe error:', err);
    res.status(500).json({ error: 'Failed to subscribe. Please try again.' });
  }
});

// GET /api/email/unsubscribe
// Public — unsubscribe link in emails
router.get('/unsubscribe', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: 'Email required.' });

    await pool.query(
      `UPDATE newsletter_subscribers SET is_active = false WHERE email = $1`,
      [email]
    );

    res.send(`
      <html><body style="font-family:Arial;text-align:center;padding:60px;background:#0a1628;color:#c8d8e8">
        <h2 style="color:#4fc3f7">Unsubscribed</h2>
        <p>You have been removed from the M@SA mailing list.</p>
        <a href="https://masa.org.za" style="color:#f5c842">Return to masa.org.za</a>
      </body></html>
    `);
  } catch (err) {
    res.status(500).send('Error processing unsubscribe request.');
  }
});

// POST /api/email/newsletter — Admin only
// Send newsletter to all active subscribers
router.post('/newsletter', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { subject, body } = req.body;
    if (!subject || !body) {
      return res.status(400).json({ error: 'Subject and body required.' });
    }

    // Get all active subscribers
    const result = await pool.query(
      `SELECT email, name FROM newsletter_subscribers WHERE is_active = true`
    );

    if (!result.rows.length) {
      return res.json({ success: true, sent: 0, message: 'No active subscribers.' });
    }

    // Send in batches of 50 to respect rate limits
    const subscribers = result.rows;
    const batchSize   = 50;
    let sent          = 0;

    for (let i = 0; i < subscribers.length; i += batchSize) {
      const batch = subscribers.slice(i, i + batchSize);
      const toList = batch.map(s => ({ email: s.email, name: s.name || '' }));

      await sendEmail({
        to: toList,
        subject,
        html: newsletterTemplate({ subject, body }),
        text: body.replace(/<[^>]*>/g, ''), // Strip HTML for text version
      });

      sent += batch.length;

      // Small delay between batches
      if (i + batchSize < subscribers.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Log the newsletter send
    await pool.query(
      `INSERT INTO newsletter_sends (subject, body, recipient_count, sent_by)
       VALUES ($1, $2, $3, $4)`,
      [subject, body, sent, req.session.userId]
    );

    res.json({ success: true, sent, message: `Newsletter sent to ${sent} subscribers!` });

  } catch (err) {
    console.error('Newsletter error:', err);
    res.status(500).json({ error: 'Failed to send newsletter: ' + err.message });
  }
});

// GET /api/email/subscribers — Admin only
router.get('/subscribers', requireAuth, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, email, name, is_active, created_at
       FROM newsletter_subscribers
       ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/email/contact-submissions — Admin only
router.get('/contact-submissions', requireAuth, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM contact_submissions ORDER BY created_at DESC LIMIT 100`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
