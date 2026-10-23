const express = require('express');
const TrainerProfile = require('../models/TrainerProfile');
const { authRequired, requireRoles } = require('../middleware/auth');

const router = express.Router();
router.use(authRequired, requireRoles('trainer'));

router.get('/availability', async (req, res, next) => {
  try {
    const profile = await TrainerProfile.findOne({ userId: req.user.id });
    return res.json({ profile });
  } catch (err) {
    return next(err);
  }
});

router.put('/availability', async (req, res, next) => {
  try {
    const profile = await TrainerProfile.findOneAndUpdate(
      { userId: req.user.id },
      {
        $set: {
          availabilitySlots: req.body.availabilitySlots || [],
          zones: req.body.zones,
          isActive: req.body.isActive !== undefined ? req.body.isActive : true,
        },
      },
      { new: true }
    );
    if (!profile) return res.status(404).json({ error: 'Trainer profile not found' });
    return res.json({ profile });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
