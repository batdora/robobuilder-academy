/**
 * Challenge definitions for boss battle sandbox scenarios.
 * Each challenge maps to a module and tests specific robot capabilities.
 */

export interface Challenge {
  id: string;
  name: string;
  module: string;
  description: string;
  requiredParts: string[];
  layout: string;
  victoryCondition: {
    type: 'reach-goal' | 'no-traps' | 'time-limit' | 'spill-limit' | 'commands' | 'trajectory';
    value: number;
  };
  timeLimit?: number; // seconds
}

export const CHALLENGES: Challenge[] = [
  {
    id: 'blind-maze',
    name: 'The Blind Maze',
    module: 'module-1',
    description:
      'Navigate a maze with no sensors. The robot must stumble through using only random movement. Teaches why intelligence needs perception.',
    requiredParts: [],
    layout: [
      'WWWWWWWWWW',
      'W........W',
      'W.WWWWWW.W',
      'W.W....W.W',
      'W.W.WW.W.W',
      'W.W.WG.W.W',
      'W.W.WWWW.W',
      'W.W......W',
      'W.WWWWWW.W',
      'WR.......W',
      'WWWWWWWWWW',
    ].join('\n'),
    victoryCondition: { type: 'reach-goal', value: 1 },
    timeLimit: 120,
  },

  {
    id: 'first-sight',
    name: 'First Sight',
    module: 'module-1',
    description:
      'Now with Eyes installed, the robot can see nearby cells. Watch how vision transforms random wandering into purposeful exploration.',
    requiredParts: ['EYES'],
    layout: [
      '..........',
      '..WWWW....',
      '..W..W....',
      '..W..W....',
      '..........',
      '....W.....',
      '.R..W..G..',
      '....W.....',
      '..........',
      '..........',
    ].join('\n'),
    victoryCondition: { type: 'reach-goal', value: 1 },
    timeLimit: 60,
  },

  {
    id: 'overestimation-trap',
    name: 'The Overestimation Trap',
    module: 'module-2',
    description:
      'A grid full of traps near high-reward paths. Standard Q-learning overestimates values and falls into traps. Toggle the Stability Module to see Double Q-learning avoid overestimation.',
    requiredParts: ['INSTINCT_CHIP', 'STABILITY_MODULE'],
    layout: [
      '..........',
      '....T.....',
      '..T...T...',
      '..........',
      '.T..T..T..',
      '....G.....',
      '.T..T..T..',
      '..........',
      '..T...T...',
      '.R........',
    ].join('\n'),
    victoryCondition: { type: 'no-traps', value: 3 },
    timeLimit: 90,
  },

  {
    id: 'jerky-robot',
    name: 'The Jerky Robot',
    module: 'module-3',
    description:
      'Navigate through a narrow corridor. Without Motor Cortex, the robot teleports between cells. With it, smooth continuous movement makes precision navigation possible.',
    requiredParts: ['MOTOR_CORTEX', 'INSTINCT_CHIP'],
    layout: [
      'WWWWWWWWWW',
      'W........W',
      'WWWW..WWWW',
      '...........',
      'WWWW..WWWW',
      'W........W',
      'WWWW..WWWW',
      '...........',
      'WWWW..WWWW',
      'WR......GW',
      'WWWWWWWWWW',
    ].join('\n'),
    victoryCondition: { type: 'reach-goal', value: 1 },
    timeLimit: 60,
  },

  {
    id: 'smooth-operator',
    name: 'Smooth Operator',
    module: 'module-4',
    description:
      'A delicate environment where large policy changes cause catastrophic failure. The Safety Governor clips updates to keep the robot stable. Compare PPO vs unconstrained policy.',
    requiredParts: ['MOTOR_CORTEX', 'SAFETY_GOVERNOR', 'INSTINCT_CHIP'],
    layout: [
      '..........',
      '.TTTTTTTT.',
      '.T......T.',
      '.T.WWWW.T.',
      '.T.W..W.T.',
      '.T.W.GW.T.',
      '.T.WWWW.T.',
      '.T......T.',
      '.TTTTTTTT.',
      '.R........',
    ].join('\n'),
    victoryCondition: { type: 'spill-limit', value: 2 },
    timeLimit: 90,
  },

  {
    id: 'interpreter',
    name: 'The Interpreter',
    module: 'module-5',
    description:
      'The robot receives text commands describing where to go. With the Language Processor, it can parse instructions and plan a path to the goal.',
    requiredParts: ['LANGUAGE_PROCESSOR', 'BRAIN', 'EYES'],
    layout: [
      '..........',
      '..W...W...',
      '..W.G.W...',
      '..W...W...',
      '..........',
      '..........',
      '.R........',
      '..........',
      '..........',
      '..........',
    ].join('\n'),
    victoryCondition: { type: 'commands', value: 5 },
    timeLimit: 60,
  },

  {
    id: 'object-sorter',
    name: 'Object Sorter',
    module: 'module-5',
    description:
      'Multiple objects scattered on the grid. The robot must identify relationships between objects and sort them into correct positions using Relational Reasoning.',
    requiredParts: ['RELATIONAL_REASONING', 'EYES', 'BRAIN'],
    layout: [
      '..........',
      '...G.G....',
      '..........',
      '..........',
      '..T...T...',
      '..........',
      '..........',
      '.R........',
      '..........',
      '..........',
    ].join('\n'),
    victoryCondition: { type: 'reach-goal', value: 2 },
    timeLimit: 90,
  },

  {
    id: 'copy-cat',
    name: 'Copy Cat',
    module: 'module-6',
    description:
      'A ghost trajectory shows the optimal path. The robot must imitate it as closely as possible. With Imitation Drive, it learns from demonstration rather than trial and error.',
    requiredParts: ['IMITATION_DRIVE', 'EYES', 'BRAIN'],
    layout: [
      'WWWWWWWWWW',
      'W........W',
      'W.WWWW.W.W',
      'W.W....W.W',
      'W.W.WWWW.W',
      'W.W......W',
      'W.WWWWWW.W',
      'W........W',
      'W.R....G.W',
      'WWWWWWWWWW',
    ].join('\n'),
    victoryCondition: { type: 'trajectory', value: 80 },
    timeLimit: 60,
  },
];

export function getChallengeById(id: string): Challenge | undefined {
  return CHALLENGES.find((c) => c.id === id);
}

export function getChallengesForModule(moduleId: string): Challenge[] {
  return CHALLENGES.filter((c) => c.module === moduleId);
}
