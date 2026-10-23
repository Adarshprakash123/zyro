const Booking = require('../models/Booking');
const TrainerProfile = require('../models/TrainerProfile');
const User = require('../models/User');
const { haversineKm } = require('../utils/geo');
const { isWithinAvailability } = require('../utils/time');

const ACTIVE_STATUSES = ['confirmed', 'assigned', 'in_progress', 'pending_payment'];

async function findOverlappingBooking(trainerId, startAt, endAt, session = null) {
  const query = Booking.findOne({
    trainerId,
    status: { $in: ACTIVE_STATUSES },
    startAt: { $lt: endAt },
    endAt: { $gt: startAt },
  });
  if (session) query.session(session);
  return query;
}

async function countTrainerDayBookings(trainerId, startAt) {
  const dayStart = new Date(startAt);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);
  return Booking.countDocuments({
    trainerId,
    status: { $in: ACTIVE_STATUSES.concat(['completed']) },
    startAt: { $gte: dayStart, $lt: dayEnd },
  });
}

/**
 * Assign eligible trainer: preferred if available, else nearest in zone, tie-break fewest bookings.
 */
async function assignTrainer({
  societyZone,
  customerLocation,
  startAt,
  endAt,
  preferredTrainerId = null,
  session = null,
}) {
  const profiles = await TrainerProfile.find({
    isActive: true,
    zones: societyZone,
  }).session(session || null);

  if (!profiles.length) return null;

  const trainerUsers = await User.find({
    _id: { $in: profiles.map((p) => p.userId) },
    role: 'trainer',
  }).session(session || null);

  const userById = new Map(trainerUsers.map((u) => [String(u._id), u]));
  const eligible = [];

  for (const profile of profiles) {
    const user = userById.get(String(profile.userId));
    if (!user) continue;
    if (!isWithinAvailability(new Date(startAt), profile.availabilitySlots)) continue;

    const overlap = await findOverlappingBooking(profile.userId, startAt, endAt, session);
    if (overlap) continue;

    const dayCount = await countTrainerDayBookings(profile.userId, startAt);
    const distance = haversineKm(customerLocation, user.location);
    eligible.push({
      trainerId: profile.userId,
      distance,
      dayCount,
      preferred: preferredTrainerId && String(preferredTrainerId) === String(profile.userId),
    });
  }

  if (!eligible.length) return null;

  const preferred = eligible.find((e) => e.preferred);
  if (preferred) return preferred.trainerId;

  eligible.sort((a, b) => {
    if (a.distance !== b.distance) return a.distance - b.distance;
    return a.dayCount - b.dayCount;
  });

  return eligible[0].trainerId;
}

async function listAvailableSlots({ societyZone, from, to, customerLocation }) {
  const slots = [];
  const cursor = new Date(from);
  cursor.setMinutes(0, 0, 0);
  if (cursor.getMinutes() !== 0 && cursor.getMinutes() !== 30) {
    cursor.setMinutes(cursor.getMinutes() < 30 ? 30 : 60, 0, 0);
  }

  const end = new Date(to);
  while (cursor < end) {
    const startAt = new Date(cursor);
    const endAt = new Date(startAt.getTime() + 60 * 60 * 1000);
    if (startAt >= new Date()) {
      const trainerId = await assignTrainer({
        societyZone,
        customerLocation,
        startAt,
        endAt,
      });
      if (trainerId) {
        slots.push({ startAt, endAt, available: true });
      }
    }
    cursor.setMinutes(cursor.getMinutes() + 30);
  }
  return slots;
}

module.exports = {
  ACTIVE_STATUSES,
  findOverlappingBooking,
  assignTrainer,
  listAvailableSlots,
};
