const PricingConfig = require('../models/PricingConfig');

async function getPricingConfig() {
  let config = await PricingConfig.findOne({ key: 'default' });
  if (!config) {
    config = await PricingConfig.create({});
  }
  return config;
}

function isPeakSlot(date, config) {
  const hour = date.getHours();
  const day = date.getDay();
  const peakHours = config.peakHours || [];
  const peakDays = config.peakDays || [];
  return peakHours.includes(hour) || peakDays.includes(day);
}

function calculatePriceBreakdown(startAt, config) {
  const peak = isPeakSlot(new Date(startAt), config);
  const sessionPrice = peak ? config.peakPrice : config.normalPrice;
  const commissionRate = config.societyCommissionRate;
  const commission = Math.round(sessionPrice * commissionRate * 100) / 100;
  const total = Math.round((sessionPrice + commission) * 100) / 100;
  return {
    sessionPrice,
    isPeak: peak,
    commissionRate,
    commission,
    total,
  };
}

module.exports = { getPricingConfig, isPeakSlot, calculatePriceBreakdown };
