require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const TrainerProfile = require('./models/TrainerProfile');
const PricingConfig = require('./models/PricingConfig');
const Package = require('./models/Package');
const FitnessProfile = require('./models/FitnessProfile');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/zuryo';

// Full-day windows so instant/scheduled demos work at any hour.
const WEEKDAY_AVAILABILITY = [0, 1, 2, 3, 4, 5, 6].map((day) => ({
  dayOfWeek: day,
  start: '00:00',
  end: '23:59',
}));

async function seed() {
  await mongoose.connect(MONGODB_URI);
  await Promise.all([
    User.deleteMany({}),
    TrainerProfile.deleteMany({}),
    PricingConfig.deleteMany({}),
    Package.deleteMany({}),
    FitnessProfile.deleteMany({}),
  ]);

  const passwordHash = await bcrypt.hash('password123', 10);

  const [customer, customer2, trainer1, trainer2, admin] = await User.create([
    {
      email: 'customer@zuryo.demo',
      passwordHash,
      name: 'Asha Customer',
      role: 'customer',
      societyZone: 'green-park',
      location: { lat: 28.5562, lng: 77.2066 },
    },
    {
      email: 'customer2@zuryo.demo',
      passwordHash,
      name: 'Rahul Customer',
      role: 'customer',
      societyZone: 'green-park',
      location: { lat: 28.557, lng: 77.208 },
    },
    {
      email: 'trainer@zuryo.demo',
      passwordHash,
      name: 'Vikram Trainer',
      role: 'trainer',
      societyZone: 'green-park',
      location: { lat: 28.5568, lng: 77.207 },
    },
    {
      email: 'trainer2@zuryo.demo',
      passwordHash,
      name: 'Neha Trainer',
      role: 'trainer',
      societyZone: 'green-park',
      location: { lat: 28.559, lng: 77.21 },
    },
    {
      email: 'admin@zuryo.demo',
      passwordHash,
      name: 'Ops Admin',
      role: 'admin',
      societyZone: 'green-park',
      location: { lat: 28.556, lng: 77.206 },
    },
  ]);

  await TrainerProfile.create([
    {
      userId: trainer1._id,
      zones: ['green-park'],
      availabilitySlots: WEEKDAY_AVAILABILITY,
      isActive: true,
    },
    {
      userId: trainer2._id,
      zones: ['green-park', 'saket'],
      availabilitySlots: WEEKDAY_AVAILABILITY,
      isActive: true,
    },
  ]);

  await PricingConfig.create({
    key: 'default',
    normalPrice: 399,
    peakPrice: 499,
    societyCommissionRate: 0.1,
    peakHours: [17, 18, 19, 20],
    peakDays: [0, 6],
  });

  await Package.create([
    { customerId: customer._id, sessionsPurchased: 10, sessionsUsed: 0, status: 'active' },
    { customerId: customer2._id, sessionsPurchased: 5, sessionsUsed: 1, status: 'active' },
  ]);

  await FitnessProfile.create({
    customerId: customer._id,
    age: 28,
    weight: 62,
    goals: ['weight_loss', 'endurance'],
    level: 'beginner',
    preferences: ['home workout', 'low impact'],
  });

  // eslint-disable-next-line no-console
  console.log('Seed complete. Demo logins (password: password123):');
  // eslint-disable-next-line no-console
  console.log('  customer@zuryo.demo / trainer@zuryo.demo / admin@zuryo.demo');
  await mongoose.disconnect();
}

seed().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
