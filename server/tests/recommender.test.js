import { describe, it, expect } from 'vitest';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { recommendWorkout } = require('../src/services/recommenderService');

describe('recommender', () => {
  it('returns a structured 60-minute plan from profile', () => {
    const plan = recommendWorkout(
      {
        level: 'beginner',
        goals: ['weight_loss'],
        preferences: ['low impact'],
      },
      []
    );
    expect(plan.durationMinutes).toBe(60);
    expect(plan.blocks.length).toBeGreaterThan(2);
    expect(plan.engine).toBe('rules-based-v1');
    expect(plan.rationale.length).toBeGreaterThan(0);
  });

  it('avoids recent exercises when possible', () => {
    const plan = recommendWorkout(
      { level: 'intermediate', goals: ['muscle_gain'], preferences: [] },
      [{ exercises: ['Bodyweight squats', 'Push-ups'] }]
    );
    expect(plan.suggestedNext).toBeTruthy();
  });
});
