const express = require('express');
const Booking = require('../models/Booking');
const PricingConfig = require('../models/PricingConfig');
const TrainerProfile = require('../models/TrainerProfile');
const { authRequired, requireRoles } = require('../middleware/auth');
const { getPricingConfig } = require('../services/pricingService');

const router = express.Router();
router.use(authRequired, requireRoles('admin'));

router.get('/bookings', async (req, res, next) => {
  try {
    const bookings = await Booking.find()
      .sort({ startAt: -1 })
      .populate('customerId', 'name email societyZone')
      .populate('trainerId', 'name email')
      .limit(100);
    return res.json({ bookings });
  } catch (err) {
    return next(err);
  }
});

router.get('/pricing', async (req, res, next) => {
  try {
    const config = await getPricingConfig();
    return res.json({ config });
  } catch (err) {
    return next(err);
  }
});

router.put('/pricing', async (req, res, next) => {
  try {
    const config = await PricingConfig.findOneAndUpdate(
      { key: 'default' },
      {
        $set: {
          normalPrice: req.body.normalPrice ?? 399,
          peakPrice: req.body.peakPrice ?? 499,
          societyCommissionRate: req.body.societyCommissionRate ?? 0.1,
          peakHours: req.body.peakHours ?? [17, 18, 19, 20],
          peakDays: req.body.peakDays ?? [0, 6],
        },
      },
      { upsert: true, new: true }
    );
    return res.json({ config });
  } catch (err) {
    return next(err);
  }
});

router.get('/trainers', async (req, res, next) => {
  try {
    const trainers = await TrainerProfile.find().populate('userId', 'name email societyZone location');
    return res.json({ trainers });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
