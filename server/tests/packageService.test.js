import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createRequire } from 'module';
import mongoose from 'mongoose';

const require = createRequire(import.meta.url);
const Package = require('../src/models/Package');
const IdempotencyKey = require('../src/models/IdempotencyKey');
const { deductSession, restoreSession } = require('../src/services/packageService');

const URI = process.env.MONGODB_URI_TEST || 'mongodb://127.0.0.1:27017/zuryo_test';

describe('package deduction idempotency', () => {
  beforeAll(async () => {
    await mongoose.connect(URI);
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    await Package.deleteMany({});
    await IdempotencyKey.deleteMany({});
  });

  it('does not double-deduct with the same idempotency key', async () => {
    const customerId = new mongoose.Types.ObjectId();
    await Package.create({
      customerId,
      sessionsPurchased: 5,
      sessionsUsed: 0,
      status: 'active',
    });

    const first = await deductSession({
      customerId,
      idempotencyKey: 'key-1',
    });
    const second = await deductSession({
      customerId,
      idempotencyKey: 'key-1',
    });

    expect(first.alreadyProcessed).toBe(false);
    expect(second.alreadyProcessed).toBe(true);
    const pkg = await Package.findOne({ customerId });
    expect(pkg.sessionsUsed).toBe(1);
  });

  it('restores a session on cancel credit', async () => {
    const customerId = new mongoose.Types.ObjectId();
    await Package.create({
      customerId,
      sessionsPurchased: 5,
      sessionsUsed: 2,
      status: 'active',
    });
    await restoreSession(customerId);
    const pkg = await Package.findOne({ customerId });
    expect(pkg.sessionsUsed).toBe(1);
  });
});
