const jwt = require('jsonwebtoken');
const User = require('../models/User');

function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    req.user = payload;
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    return next();
  };
}

async function attachUser(req, res, next) {
  try {
    if (!req.user?.id) return next();
    req.currentUser = await User.findById(req.user.id);
    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = { authRequired, requireRoles, attachUser };
