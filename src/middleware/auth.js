// ================================================
// M@SA PLATFORM - AUTH MIDDLEWARE
// src/middleware/auth.js
// ================================================

// Require admin to be logged in
function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  next();
}

// Require super admin or admin role
function requireAdmin(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  if (!['super_admin', 'admin'].includes(req.session.userRole)) {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  next();
}

// Require super admin only
function requireSuperAdmin(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  if (req.session.userRole !== 'super_admin') {
    return res.status(403).json({ error: 'Super admin access required.' });
  }
  next();
}

// Check if request IP is blocked
const { query } = require('../db/pool');

async function checkBlockedIP(req, res, next) {
  try {
    const ip = req.ip || req.connection.remoteAddress;
    const result = await query(
      'SELECT id FROM blocked_ips WHERE ip_address = $1',
      [ip]
    );
    if (result.rows.length > 0) {
      return res.status(403).json({ error: 'Access denied.' });
    }
    next();
  } catch (err) {
    next(); // Don't block on DB error
  }
}

module.exports = { requireAuth, requireAdmin, requireSuperAdmin, checkBlockedIP };
