import { describe, it, expect } from 'vitest';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pricing = require('../src/services/pricingService');

const config = {
  normalPrice: 399,
  peakPrice: 499,
  societyCommissionRate: 0.1,
  peakHours: [17, 18, 19, 20],
  peakDays: [0, 6],
};

describe('pricing', () => {
  it('calculates normal slot with 10% commission', () => {
    // Wednesday 10:00
    const d = new Date('2026-10-14T10:00:00');
    expect(pricing.isPeakSlot(d, config)).toBe(false);
    const b = pricing.calculatePriceBreakdown(d, config);
    expect(b.sessionPrice).toBe(399);
    expect(b.commission).toBe(39.9);
    expect(b.total).toBe(438.9);
  });

  it('calculates peak slot with 10% commission', () => {
    const d = new Date('2026-10-14T18:00:00');
    expect(pricing.isPeakSlot(d, config)).toBe(true);
    const b = pricing.calculatePriceBreakdown(d, config);
    expect(b.sessionPrice).toBe(499);
    expect(b.commission).toBe(49.9);
    expect(b.total).toBe(548.9);
  });

  it('treats weekends as peak', () => {
    const sunday = new Date('2026-10-18T11:00:00');
    expect(pricing.isPeakSlot(sunday, config)).toBe(true);
  });
});
