const express = require('express');
const cors = require('cors');
const { errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const bookingRoutes = require('./routes/bookings');
const sessionRoutes = require('./routes/sessions');
const packageRoutes = require('./routes/packages');
const fitnessRoutes = require('./routes/fitness');
const notificationRoutes = require('./routes/notifications');
const adminRoutes = require('./routes/admin');
const trainerRoutes = require('./routes/trainers');

function createApp() {
  const app = express();
  app.use(
    cors({
      origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
      credentials: true,
    })
  );
  app.use(express.json());

  app.get('/health', (req, res) => res.json({ ok: true, service: 'zuryo-api' }));

  app.use('/auth', authRoutes);
  app.use('/bookings', bookingRoutes);
  app.use('/sessions', sessionRoutes);
  app.use('/packages', packageRoutes);
  app.use('/fitness', fitnessRoutes);
  app.use('/notifications', notificationRoutes);
  app.use('/admin', adminRoutes);
  app.use('/trainers', trainerRoutes);

  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
