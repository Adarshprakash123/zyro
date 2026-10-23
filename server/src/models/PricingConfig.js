const mongoose = require('mongoose');

const pricingConfigSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'default', unique: true },
    normalPrice: { type: Number, default: 399 },
    peakPrice: { type: Number, default: 499 },
    societyCommissionRate: { type: Number, default: 0.1 },
    // Peak if hour locally is in peakHours OR dayOfWeek in peakDays (0=Sun)
    peakHours: { type: [Number], default: [17, 18, 19, 20] },
    peakDays: { type: [Number], default: [0, 6] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PricingConfig', pricingConfigSchema);
