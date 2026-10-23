const express = require('express');
const Session = require('../models/Session');
const { authRequired, requireRoles } = require('../middleware/auth');
const { startSession, reconcileSession } = require('../services/sessionTimerService');

const router = express.Router();
router.use(authRequired);

router.post('/:bookingId/start', requireRoles('trainer'), async (req, res, next) => {
  try {
    const result = await startSession(req.params.bookingId, req.user.id);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
});

router.get('/by-booking/:bookingId', async (req, res, next) => {
  try {
    const session = await Session.findOne({ bookingId: req.params.bookingId });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    const result = await reconcileSession(session._id);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
});

router.get('/:id/status', async (req, res, next) => {
  try {
    const result = await reconcileSession(req.params.id);
    if (!result) return res.status(404).json({ error: 'Session not found' });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
});

router.patch('/:id', requireRoles('trainer', 'customer'), async (req, res, next) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    if (req.user.role === 'trainer' && String(session.trainerId) !== String(req.user.id)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    if (req.user.role === 'customer' && String(session.customerId) !== String(req.user.id)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (req.user.role === 'trainer') {
      if (req.body.exercises) session.exercises = req.body.exercises;
      if (req.body.trainerNotes !== undefined) session.trainerNotes = req.body.trainerNotes;
      if (req.body.suggestedNext !== undefined) session.suggestedNext = req.body.suggestedNext;
    }
    if (req.user.role === 'customer' && req.body.customerFeedback !== undefined) {
      session.customerFeedback = req.body.customerFeedback;
    }
    await session.save();
    return res.json({ session });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
