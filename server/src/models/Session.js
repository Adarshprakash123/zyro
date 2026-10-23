const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    trainerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    startedAt: { type: Date, default: null },
    warnedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ['scheduled', 'active', 'warning', 'completed'],
      default: 'scheduled',
    },
    exercises: [{ type: String }],
    durationMinutes: { type: Number, default: 60 },
    trainerNotes: { type: String, default: '' },
    customerFeedback: { type: String, default: '' },
    suggestedNext: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Session', sessionSchema);
