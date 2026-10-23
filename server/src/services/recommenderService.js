/**
 * Rules-based personalized workout recommender.
 * Uses fitness profile + recent session history. No external LLM required.
 */

const LEVEL_MULTIPLIER = {
  beginner: 1,
  intermediate: 1.25,
  advanced: 1.5,
};

const GOAL_FOCUS = {
  weight_loss: ['cardio', 'circuit', 'core'],
  muscle_gain: ['strength', 'compound lifts', 'hypertrophy'],
  flexibility: ['mobility', 'yoga flow', 'stretching'],
  endurance: ['cardio', 'intervals', 'steady-state'],
  general: ['full body', 'functional', 'core'],
};

function recommendWorkout(profile, recentSessions = []) {
  const level = profile?.level || 'beginner';
  const goals = profile?.goals?.length ? profile.goals : ['general'];
  const preferences = profile?.preferences || [];
  const primaryGoal = goals[0];
  const focusAreas = GOAL_FOCUS[primaryGoal] || GOAL_FOCUS.general;

  const recentExercises = recentSessions.flatMap((s) => s.exercises || []);
  const avoidRepeat = new Set(recentExercises.slice(-6));

  const baseBlocks = [
    { name: 'Warm-up', minutes: 8, activities: ['Light jog / march', 'Dynamic stretches', 'Arm circles'] },
    {
      name: 'Main strength',
      minutes: Math.round(25 * LEVEL_MULTIPLIER[level]),
      activities: pickActivities(focusAreas, preferences, avoidRepeat, level),
    },
    {
      name: 'Conditioning',
      minutes: 12,
      activities: pickConditioning(primaryGoal, level),
    },
    { name: 'Cool-down', minutes: 8, activities: ['Static stretch', 'Breathing', 'Mobility'] },
  ];

  const rationale = [
    `Level: ${level}`,
    `Primary goal: ${primaryGoal}`,
    preferences.length ? `Preferences: ${preferences.join(', ')}` : 'No specific preferences',
    recentSessions.length
      ? `Adjusted using ${recentSessions.length} prior session(s); avoided repeating last exercises where possible`
      : 'No prior sessions — starter plan',
  ];

  return {
    title: `${capitalize(primaryGoal)} · ${capitalize(level)} · 60 min`,
    durationMinutes: 60,
    blocks: baseBlocks,
    suggestedNext: suggestNext(primaryGoal, level, recentSessions),
    rationale,
    engine: 'rules-based-v1',
  };
}

function pickActivities(focusAreas, preferences, avoidRepeat, level) {
  const pool = [
    'Bodyweight squats',
    'Push-ups',
    'Dumbbell rows',
    'Lunges',
    'Plank',
    'Glute bridges',
    'Shoulder press',
    'Dead bugs',
    'Kettlebell swings',
    'Resistance band pull-aparts',
    ...focusAreas.map((f) => `${capitalize(f)} drill`),
    ...preferences.map((p) => `${capitalize(p)} focus set`),
  ];

  const filtered = pool.filter((a) => !avoidRepeat.has(a));
  const count = level === 'beginner' ? 4 : level === 'intermediate' ? 5 : 6;
  return (filtered.length ? filtered : pool).slice(0, count);
}

function pickConditioning(goal, level) {
  if (goal === 'weight_loss' || goal === 'endurance') {
    return level === 'beginner'
      ? ['Walk intervals 1:1', 'Jumping jacks']
      : ['HIIT 30/30', 'Burpees (modified OK)', 'Mountain climbers'];
  }
  if (goal === 'muscle_gain') return ['Farmer carries', 'Sled push / heavy bag walk'];
  return ['Circuit: squat–push–plank', 'Jump rope or high knees'];
}

function suggestNext(goal, level, recentSessions) {
  const nextLevel =
    level === 'beginner' && recentSessions.length >= 3
      ? 'Progress to intermediate volume next week'
      : `Stay on ${level} progression; add 1 set if RPE < 7`;
  return `Next focus: ${goal.replace('_', ' ')}. ${nextLevel}.`;
}

function capitalize(s) {
  return String(s || '')
    .replace(/_/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase());
}

module.exports = { recommendWorkout };
