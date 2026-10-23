const express = require('express');
const { authRequired, requireRoles } = require('../middleware/auth');
const { getActivePackage } = require('../services/packageService');
const Package = require('../models/Package');

const router = express.Router();
router.use(authRequired);

router.get('/me', requireRoles('customer'), async (req, res, next) => {
  try {
    const pkg = await getActivePackage(req.user.id);
    if (!pkg) {
      const latest = await Package.findOne({ customerId: req.user.id }).sort({ createdAt: -1 });
      return res.json({
        package: latest
          ? {
              ...latest.toObject(),
              sessionsRemaining: Math.max(0, latest.sessionsPurchased - latest.sessionsUsed),
            }
          : null,
      });
    }
    return res.json({
      package: {
        ...pkg.toObject(),
        sessionsRemaining: Math.max(0, pkg.sessionsPurchased - pkg.sessionsUsed),
      },
    });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
