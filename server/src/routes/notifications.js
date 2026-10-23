const express = require('express');
const Notification = require('../models/Notification');
const { authRequired } = require('../middleware/auth');

const router = express.Router();
router.use(authRequired);

router.get('/', async (req, res, next) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);
    return res.json({ notifications });
  } catch (err) {
    return next(err);
  }
});

router.post('/:id/read', async (req, res, next) => {
  try {
    const n = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { read: true },
      { new: true }
    );
    if (!n) return res.status(404).json({ error: 'Not found' });
    return res.json({ notification: n });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
