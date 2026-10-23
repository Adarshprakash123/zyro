const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sessionsPurchased: { type: Number, required: true, default: 10 },
    sessionsUsed: { type: Number, required: true, default: 0 },
    status: { type: String, enum: ['active', 'exhausted', 'cancelled'], default: 'active' },
  },
  { timestamps: true }
);

packageSchema.virtual('sessionsRemaining').get(function sessionsRemaining() {
  return Math.max(0, this.sessionsPurchased - this.sessionsUsed);
});

packageSchema.set('toJSON', { virtuals: true });
packageSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Package', packageSchema);
