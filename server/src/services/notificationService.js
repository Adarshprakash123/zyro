const Notification = require('../models/Notification');

async function notify(userId, type, message, bookingId = null) {
  return Notification.create({ userId, type, message, bookingId });
}

async function notifyBookingAssigned(booking) {
  if (!booking.trainerId) return;
  await notify(
    booking.trainerId,
    'assigned',
    `New ${booking.mode} session assigned at ${new Date(booking.startAt).toISOString()}`,
    booking._id
  );
  await notify(
    booking.customerId,
    'assigned',
    `Trainer assigned for your session at ${new Date(booking.startAt).toISOString()}`,
    booking._id
  );
}

async function notifyBookingCancelled(booking) {
  const targets = [booking.customerId, booking.trainerId].filter(Boolean);
  await Promise.all(
    targets.map((userId) =>
      notify(userId, 'cancelled', 'A booking was cancelled.', booking._id)
    )
  );
}

async function notifyBookingRescheduled(booking) {
  const targets = [booking.customerId, booking.trainerId].filter(Boolean);
  await Promise.all(
    targets.map((userId) =>
      notify(
        userId,
        'rescheduled',
        `Booking rescheduled to ${new Date(booking.startAt).toISOString()}`,
        booking._id
      )
    )
  );
}

module.exports = {
  notify,
  notifyBookingAssigned,
  notifyBookingCancelled,
  notifyBookingRescheduled,
};
