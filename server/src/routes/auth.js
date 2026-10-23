const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

router.post(
  '/login',
  body('email').isEmail(),
  body('password').isString().notEmpty(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation failed', details: errors.array() });
      }
      const { email, password } = req.body;
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) return res.status(401).json({ error: 'Invalid credentials' });
      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

      const token = jwt.sign(
        { id: user._id, role: user.role, email: user.email, name: user.name },
        process.env.JWT_SECRET || 'dev-secret',
        { expiresIn: '7d' }
      );

      return res.json({
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          societyZone: user.societyZone,
          location: user.location,
        },
      });
    } catch (err) {
      return next(err);
    }
  }
);

router.get('/me', authRequired, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ user });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
