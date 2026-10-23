const express = require('express');
const { body, validationResult } = require('express-validator');
const FitnessProfile = require('../models/FitnessProfile');
const Session = require('../models/Session');
const { authRequired, requireRoles } = require('../middleware/auth');
const { recommendWorkout } = require('../services/recommenderService');

const router = express.Router();
router.use(authRequired);

router.get('/profile', requireRoles('customer'), async (req, res, next) => {
  try {
    const profile = await FitnessProfile.findOne({ customerId: req.user.id });
    return res.json({ profile });
  } catch (err) {
    return next(err);
  }
});

router.put(
  '/profile',
  requireRoles('customer'),
  body('age').isInt({ min: 12, max: 100 }),
  body('weight').isFloat({ min: 30, max: 300 }),
  body('level').optional().isIn(['beginner', 'intermediate', 'advanced']),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation failed', details: errors.array() });
      }
      const profile = await FitnessProfile.findOneAndUpdate(
        { customerId: req.user.id },
        {
          customerId: req.user.id,
          age: req.body.age,
          weight: req.body.weight,
          goals: req.body.goals || [],
          level: req.body.level || 'beginner',
          preferences: req.body.preferences || [],
        },
        { upsert: true, new: true }
      );
      return res.json({ profile });
    } catch (err) {
      return next(err);
    }
  }
);

router.get('/history', requireRoles('customer'), async (req, res, next) => {
  try {
    const sessions = await Session.find({ customerId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('bookingId')
      .populate('trainerId', 'name');
    return res.json({ sessions });
  } catch (err) {
    return next(err);
  }
});

router.post('/recommend', requireRoles('customer'), async (req, res, next) => {
  try {
    const profile = await FitnessProfile.findOne({ customerId: req.user.id });
    if (!profile) {
      return res.status(400).json({ error: 'Complete your fitness profile first' });
    }
    const recentSessions = await Session.find({ customerId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(5);
    const recommendation = recommendWorkout(profile, recentSessions);
    return res.json({ recommendation });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
