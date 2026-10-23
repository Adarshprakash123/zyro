const Package = require('../models/Package');
const IdempotencyKey = require('../models/IdempotencyKey');

async function getActivePackage(customerId) {
  return Package.findOne({ customerId, status: 'active' });
}

async function deductSession({ customerId, idempotencyKey, purpose = 'booking_confirm' }) {
  if (idempotencyKey) {
    const existing = await IdempotencyKey.findOne({ key: idempotencyKey });
    if (existing) {
      return { alreadyProcessed: true, result: existing.resultRef };
    }
  }

  const pkg = await getActivePackage(customerId);
  if (!pkg) {
    const err = new Error('No active package found');
    err.status = 400;
    throw err;
  }
  if (pkg.sessionsUsed >= pkg.sessionsPurchased) {
    pkg.status = 'exhausted';
    await pkg.save();
    const err = new Error('No sessions remaining in package');
    err.status = 400;
    throw err;
  }

  pkg.sessionsUsed += 1;
  if (pkg.sessionsUsed >= pkg.sessionsPurchased) pkg.status = 'exhausted';
  await pkg.save();

  const result = {
    packageId: pkg._id,
    sessionsUsed: pkg.sessionsUsed,
    sessionsRemaining: pkg.sessionsPurchased - pkg.sessionsUsed,
  };

  if (idempotencyKey) {
    await IdempotencyKey.create({
      key: idempotencyKey,
      purpose,
      userId: customerId,
      resultRef: result,
    });
  }

  return { alreadyProcessed: false, result, package: pkg };
}

async function restoreSession(customerId) {
  const pkg = await Package.findOne({ customerId }).sort({ createdAt: -1 });
  if (!pkg || pkg.sessionsUsed <= 0) return null;
  pkg.sessionsUsed -= 1;
  if (pkg.status === 'exhausted') pkg.status = 'active';
  await pkg.save();
  return pkg;
}

module.exports = { getActivePackage, deductSession, restoreSession };
