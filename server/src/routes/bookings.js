const express = require('express');
const { body, validationResult } = require('express-validator');
const Booking = require('../models/Booking');
const User = require('../models/User');
const { authRequired, requireRoles, attachUser } = require('../middleware/auth');
const { listAvailableSlots } = require('../services/assignmentService');
const {
  createBooking,
  confirmPayment,
  cancelBooking,
  rescheduleBooking,
} = require('../services/bookingService');
const { getPricingConfig, calculatePriceBreakdown } = require('../services/pricingService');

const router = express.Router();

router.use(authRequired, attachUser);

router.get('/slots', requireRoles('customer', 'admin'), async (req, res, next) => {
  try {
    const from = req.query.from ? new Date(req.query.from) : new Date();
    const to = req.query.to
      ? new Date(req.query.to)
      : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const zone = req.query.zone || req.currentUser.societyZone;
    const slots = await listAvailableSlots({
      societyZone: zone,
      from,
      to,
      customerLocation: req.currentUser.location,
    });
    const config = await getPricingConfig();
    const withPrice = slots.map((s) => ({
      ...s,
      priceBreakdown: calculatePriceBreakdown(s.startAt, config),
    }));
    return res.json({ slots: withPrice });
  } catch (err) {
    return next(err);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const filter = {};
    if (req.user.role === 'customer') filter.customerId = req.user.id;
    if (req.user.role === 'trainer') filter.trainerId = req.user.id;
    const bookings = await Booking.find(filter)
      .sort({ startAt: -1 })
      .populate('customerId', 'name email societyZone')
      .populate('trainerId', 'name email')
      .populate('preferredTrainerId', 'name email');
    return res.json({ bookings });
  } catch (err) {
    return next(err);
  }
});

router.get('/trainers', requireRoles('customer', 'admin'), async (req, res, next) => {
  try {
    const zone = req.query.zone || req.currentUser.societyZone;
    const trainers = await User.find({ role: 'trainer', societyZone: zone }).select(
      'name email societyZone location'
    );
    return res.json({ trainers });
  } catch (err) {
    return next(err);
  }
});

router.post(
  '/',
  requireRoles('customer'),
  body('mode').isIn(['instant', 'scheduled']),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation failed', details: errors.array() });
      }
      const booking = await createBooking({
        customer: req.currentUser,
        mode: req.body.mode,
        startAtInput: req.body.startAt,
        preferredTrainerId: req.body.preferredTrainerId,
        idempotencyKey: req.headers['idempotency-key'],
      });
      return res.status(201).json({ booking });
    } catch (err) {
      if (err.status === 409 && err.booking) {
        return res.status(409).json({ error: err.message, booking: err.booking });
      }
      return next(err);
    }
  }
);

router.post('/:id/pay', requireRoles('customer'), async (req, res, next) => {
  try {
    const booking = await confirmPayment(
      req.params.id,
      req.user.id,
      req.headers['idempotency-key']
    );
    return res.json({ booking, message: 'Sandbox payment successful' });
  } catch (err) {
    return next(err);
  }
});

router.post('/:id/cancel', async (req, res, next) => {
  try {
    const booking = await cancelBooking(req.params.id, req.user);
    return res.json({ booking });
  } catch (err) {
    return next(err);
  }
});

router.patch('/:id/reschedule', requireRoles('customer'), async (req, res, next) => {
  try {
    if (!req.body.startAt) {
      return res.status(400).json({ error: 'startAt is required' });
    }
    const booking = await rescheduleBooking(req.params.id, req.user.id, req.body.startAt);
    return res.json({ booking });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
