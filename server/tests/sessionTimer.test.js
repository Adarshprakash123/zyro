import { describe, it, expect } from 'vitest';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { deriveStatus } = require('../src/services/sessionTimerService');

describe('session timer', () => {
  it('reports active before 55 minutes', () => {
    const startedAt = new Date('2026-10-18T10:00:00Z');
    const now = new Date('2026-10-18T10:30:00Z');
    const s = deriveStatus({ startedAt, status: 'active' }, now);
    expect(s.status).toBe('active');
    expect(s.elapsedMinutes).toBe(30);
  });

  it('warns at 55 minutes', () => {
    const startedAt = new Date('2026-10-18T10:00:00Z');
    const now = new Date('2026-10-18T10:56:00Z');
    const s = deriveStatus({ startedAt, status: 'active' }, now);
    expect(s.status).toBe('warning');
  });

  it('completes at 60 minutes', () => {
    const startedAt = new Date('2026-10-18T10:00:00Z');
    const now = new Date('2026-10-18T11:00:00Z');
    const s = deriveStatus({ startedAt, status: 'active' }, now);
    expect(s.status).toBe('completed');
    expect(s.remainingMinutes).toBe(0);
  });
});
