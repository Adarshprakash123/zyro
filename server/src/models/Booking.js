const mongoose = require('mongoose');

const priceBreakdownSchema = new mongoose.Schema(
  {
    sessionPrice: { type: Number, required: true },
    isPeak: { type: Boolean, required: true },
    commissionRate: { type: Number, required: true },
    commission: { type: Number, required: true },
    total: { type: Number, required: true },
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    trainerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    preferredTrainerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    mode: { type: String, enum: ['instant', 'scheduled'], required: true },
    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },
    societyZone: { type: String, required: true },
    status: {
      type: String,
      enum: [
        'pending_payment',
        'confirmed',
        'assigned',
        'in_progress',
        'completed',
        'cancelled',
        'no_trainer',
        'rescheduled',
      ],
      default: 'pending_payment',
    },
    priceBreakdown: { type: priceBreakdownSchema, required: true },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid', 'refunded_credit'],
      default: 'unpaid',
    },
    packageDeducted: { type: Boolean, default: false },
    cancelReason: { type: String, default: null },
    rescheduledFrom: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },
  },
  { timestamps: true }
);

bookingSchema.index({ trainerId: 1, startAt: 1, endAt: 1 });
bookingSchema.index({ customerId: 1, startAt: -1 });
bookingSchema.index({ status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
