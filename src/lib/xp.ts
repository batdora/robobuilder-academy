export function calculateLevel(totalXP: number): {
  level: number;
  currentXP: number;
  nextLevelXP: number;
} {
  let level = 0;
  let xpRemaining = totalXP;

  while (xpRemaining >= (level + 1) * 200) {
    level += 1;
    xpRemaining -= level * 200;
  }

  return {
    level,
    currentXP: xpRemaining,
    nextLevelXP: (level + 1) * 200,
  };
}

export const LEVEL_TITLES = [
  'Tin Can',
  'Apprentice Bot',
  'Circuit Builder',
  'Neural Navigator',
  'Robo Engineer',
  'AI Architect',
  'Robot Master',
];
