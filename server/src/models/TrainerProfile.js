const mongoose = require('mongoose');

const availabilitySlotSchema = new mongoose.Schema(
  {
    dayOfWeek: { type: Number, min: 0, max: 6, required: true },
    start: { type: String, required: true }, // "HH:mm"
    end: { type: String, required: true },
  },
  { _id: false }
);

const trainerProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    zones: [{ type: String, required: true }],
    availabilitySlots: [availabilitySlotSchema],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TrainerProfile', trainerProfileSchema);
