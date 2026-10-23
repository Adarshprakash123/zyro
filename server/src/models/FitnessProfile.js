const mongoose = require('mongoose');

const fitnessProfileSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    age: { type: Number, required: true },
    weight: { type: Number, required: true },
    goals: [{ type: String }],
    level: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
    preferences: [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('FitnessProfile', fitnessProfileSchema);
