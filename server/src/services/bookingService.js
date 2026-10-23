const Booking = require('../models/Booking');
const Session = require('../models/Session');
const User = require('../models/User');
const { assignTrainer, findOverlappingBooking } = require('./assignmentService');
const { getPricingConfig, calculatePriceBreakdown } = require('./pricingService');
const { deductSession, restoreSession } = require('./packageService');
const {
  notifyBookingAssigned,
  notifyBookingCancelled,
  notifyBookingRescheduled,
} = require('./notificationService');

async function createBooking({
  customer,
  mode,
  startAtInput,
  preferredTrainerId,
}) {
  const now = new Date();
  let startAt;

  if (mode === 'instant') {
    startAt = new Date(now.getTime() + 15 * 60 * 1000);
  } else {
    if (!startAtInput) {
      const err = new Error('startAt is required for scheduled booking');
      err.status = 400;
      throw err;
    }
    startAt = new Date(startAtInput);
    if (Number.isNaN(startAt.getTime()) || startAt <= now) {
      const err = new Error('startAt must be a future time');
      err.status = 400;
      throw err;
    }
  }

  const endAt = new Date(startAt.getTime() + 60 * 60 * 1000);
  const config = await getPricingConfig();
  const priceBreakdown = calculatePriceBreakdown(startAt, config);

  const trainerId = await assignTrainer({
    societyZone: customer.societyZone,
    customerLocation: customer.location,
    startAt,
    endAt,
    preferredTrainerId,
  });

  if (!trainerId) {
    const booking = await Booking.create({
      customerId: customer._id,
      trainerId: null,
      preferredTrainerId: preferredTrainerId || null,
      mode,
      startAt,
      endAt,
      societyZone: customer.societyZone,
      status: 'no_trainer',
      priceBreakdown,
      paymentStatus: 'unpaid',
    });
    const err = new Error('No trainer available for the selected time and zone');
    err.status = 409;
    err.booking = booking;
    throw err;
  }

  // Atomic-ish overlap guard: re-check then insert. Unique compound index helps under load.
  const overlap = await findOverlappingBooking(trainerId, startAt, endAt);
  if (overlap) {
    const err = new Error('Trainer became unavailable (overlap)');
    err.status = 409;
    throw err;
  }

  return Booking.create({
    customerId: customer._id,
    trainerId,
    preferredTrainerId: preferredTrainerId || null,
    mode,
    startAt,
    endAt,
    societyZone: customer.societyZone,
    status: 'pending_payment',
    priceBreakdown,
    paymentStatus: 'unpaid',
  });
}

async function confirmPayment(bookingId, customerId, idempotencyKey) {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    const err = new Error('Booking not found');
    err.status = 404;
    throw err;
  }
  if (String(booking.customerId) !== String(customerId)) {
    const err = new Error('Forbidden');
    err.status = 403;
    throw err;
  }
  if (booking.status === 'no_trainer') {
    const err = new Error('Cannot pay — no trainer available');
    err.status = 400;
    throw err;
  }
  if (booking.paymentStatus === 'paid') {
    return booking;
  }

  await deductSession({
    customerId,
    idempotencyKey: idempotencyKey || `pay-${bookingId}`,
    purpose: 'booking_confirm',
  });

  booking.paymentStatus = 'paid';
  booking.packageDeducted = true;
  booking.status = 'assigned';
  await booking.save();

  const existingSession = await Session.findOne({ bookingId: booking._id });
  if (!existingSession) {
    await Session.create({
      bookingId: booking._id,
      customerId: booking.customerId,
      trainerId: booking.trainerId,
      status: 'scheduled',
    });
  }

  await notifyBookingAssigned(booking);
  return booking;
}

async function cancelBooking(bookingId, user) {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    const err = new Error('Booking not found');
    err.status = 404;
    throw err;
  }

  const isOwner = String(booking.customerId) === String(user.id);
  const isTrainer = booking.trainerId && String(booking.trainerId) === String(user.id);
  const isAdmin = user.role === 'admin';
  if (!isOwner && !isTrainer && !isAdmin) {
    const err = new Error('Forbidden');
    err.status = 403;
    throw err;
  }

  if (['cancelled', 'completed'].includes(booking.status)) {
    return booking;
  }

  booking.status = 'cancelled';
  if (booking.packageDeducted) {
    await restoreSession(booking.customerId);
    booking.packageDeducted = false;
    booking.paymentStatus = 'refunded_credit';
  }
  await booking.save();
  await notifyBookingCancelled(booking);
  return booking;
}

async function rescheduleBooking(bookingId, customerId, newStartAt) {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    const err = new Error('Booking not found');
    err.status = 404;
    throw err;
  }
  if (String(booking.customerId) !== String(customerId)) {
    const err = new Error('Forbidden');
    err.status = 403;
    throw err;
  }
  if (!['assigned', 'confirmed', 'pending_payment'].includes(booking.status)) {
    const err = new Error('Cannot reschedule this booking');
    err.status = 400;
    throw err;
  }

  const startAt = new Date(newStartAt);
  const endAt = new Date(startAt.getTime() + 60 * 60 * 1000);
  const customer = await User.findById(customerId);

  const trainerId = await assignTrainer({
    societyZone: customer.societyZone,
    customerLocation: customer.location,
    startAt,
    endAt,
    preferredTrainerId: booking.preferredTrainerId || booking.trainerId,
  });

  if (!trainerId) {
    const err = new Error('No trainer available for the new time');
    err.status = 409;
    throw err;
  }

  const config = await getPricingConfig();
  booking.startAt = startAt;
  booking.endAt = endAt;
  booking.trainerId = trainerId;
  booking.priceBreakdown = calculatePriceBreakdown(startAt, config);
  booking.status = booking.paymentStatus === 'paid' ? 'assigned' : 'pending_payment';
  await booking.save();
  await notifyBookingRescheduled(booking);
  return booking;
}

module.exports = {
  createBooking,
  confirmPayment,
  cancelBooking,
  rescheduleBooking,
};
