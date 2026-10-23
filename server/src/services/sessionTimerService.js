const Session = require('../models/Session');
const Booking = require('../models/Booking');
const Notification = require('../models/Notification');

const SESSION_MINUTES = 60;
const WARN_AT_MINUTES = 55;

function deriveStatus(session, now = new Date()) {
  if (!session.startedAt) {
    return { status: session.status || 'scheduled', elapsedMinutes: 0, remainingMinutes: SESSION_MINUTES };
  }
  if (session.status === 'completed' || session.completedAt) {
    return { status: 'completed', elapsedMinutes: SESSION_MINUTES, remainingMinutes: 0 };
  }

  const elapsedMs = now.getTime() - new Date(session.startedAt).getTime();
  const elapsedMinutes = Math.max(0, elapsedMs / 60000);
  const remainingMinutes = Math.max(0, SESSION_MINUTES - elapsedMinutes);

  if (elapsedMinutes >= SESSION_MINUTES) {
    return { status: 'completed', elapsedMinutes: SESSION_MINUTES, remainingMinutes: 0 };
  }
  if (elapsedMinutes >= WARN_AT_MINUTES) {
    return { status: 'warning', elapsedMinutes, remainingMinutes };
  }
  return { status: 'active', elapsedMinutes, remainingMinutes };
}

/** Reconcile session against authoritative server clock (handles refresh / clock skew). */
async function reconcileSession(sessionId, now = new Date()) {
  const session = await Session.findById(sessionId);
  if (!session) return null;

  const derived = deriveStatus(session, now);
  let dirty = false;

  if (derived.status === 'warning' && session.status !== 'warning' && session.status !== 'completed') {
    session.status = 'warning';
    if (!session.warnedAt) {
      session.warnedAt = now;
      await Notification.create({
        userId: session.trainerId,
        type: 'session_warning',
        message: '5 minutes remaining in the session.',
        bookingId: session.bookingId,
      });
      await Notification.create({
        userId: session.customerId,
        type: 'session_warning',
        message: 'Your session ends in 5 minutes.',
        bookingId: session.bookingId,
      });
    }
    dirty = true;
  }

  if (derived.status === 'completed' && session.status !== 'completed') {
    session.status = 'completed';
    session.completedAt = session.completedAt || now;
    dirty = true;
    await Booking.findByIdAndUpdate(session.bookingId, { status: 'completed' });
    await Notification.create({
      userId: session.trainerId,
      type: 'session_complete',
      message: 'Session completed (60 minutes).',
      bookingId: session.bookingId,
    });
    await Notification.create({
      userId: session.customerId,
      type: 'session_complete',
      message: 'Your workout session is complete.',
      bookingId: session.bookingId,
    });
  }

  if (dirty) await session.save();
  return { session, ...derived };
}

async function startSession(bookingId, trainerId) {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    const err = new Error('Booking not found');
    err.status = 404;
    throw err;
  }
  if (String(booking.trainerId) !== String(trainerId)) {
    const err = new Error('Not assigned to this trainer');
    err.status = 403;
    throw err;
  }
  if (!['confirmed', 'assigned'].includes(booking.status)) {
    const err = new Error(`Cannot start session from status ${booking.status}`);
    err.status = 400;
    throw err;
  }

  let session = await Session.findOne({ bookingId });
  if (session?.startedAt) {
    return reconcileSession(session._id);
  }

  const now = new Date();
  if (!session) {
    session = await Session.create({
      bookingId,
      customerId: booking.customerId,
      trainerId: booking.trainerId,
      startedAt: now,
      status: 'active',
    });
  } else {
    session.startedAt = now;
    session.status = 'active';
    await session.save();
  }

  booking.status = 'in_progress';
  await booking.save();

  return reconcileSession(session._id, now);
}

module.exports = {
  SESSION_MINUTES,
  WARN_AT_MINUTES,
  deriveStatus,
  reconcileSession,
  startSession,
};
