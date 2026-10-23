const mongoose = require('mongoose');

const idempotencyKeySchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    purpose: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    resultRef: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('IdempotencyKey', idempotencyKeySchema);
