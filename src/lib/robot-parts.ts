export const ROBOT_PARTS = {
  CHASSIS: { name: 'Chassis', module: '01-foundations', color: '#888', icon: '🤖' },
  BRAIN: { name: 'Brain', module: '01-foundations', color: '#ff6b9d', icon: '🧠' },
  EYES: { name: 'Eyes', module: '01-foundations', color: '#00ff41', icon: '👁️' },
  METABOLISM: { name: 'Metabolism', module: '01-foundations', color: '#ffd700', icon: '⚡' },
  INSTINCT_CHIP: { name: 'Instinct Chip', module: '02-rl-foundations', color: '#0095ff', icon: '🎲' },
  GENERALIZATION_MODULE: { name: 'Generalization', module: '03-deep-q-learning', color: '#b347d9', icon: '🌐' },
  VISUAL_CORTEX: { name: 'Visual Cortex', module: '03-deep-q-learning', color: '#00ff41', icon: '🔬' },
  STABILITY_MODULE: { name: 'Stability', module: '03-deep-q-learning', color: '#0095ff', icon: '⚖️' },
  MOTOR_CORTEX: { name: 'Motor Cortex', module: '04-policy-optimization', color: '#ff6b9d', icon: '🦾' },
  SAFETY_GOVERNOR: { name: 'Safety Governor', module: '04-policy-optimization', color: '#ffd700', icon: '🛡️' },
  LANGUAGE_PROCESSOR: { name: 'Language Processor', module: '05-advanced-architectures', color: '#b347d9', icon: '💬', isBonus: true },
  RELATIONAL_REASONING_UNIT: { name: 'Relational Reasoning', module: '05-advanced-architectures', color: '#0095ff', icon: '🔗', isBonus: true },
  IMITATION_DRIVE: { name: 'Imitation Drive', module: '06-robot-learning', color: '#ff6b9d', icon: '🪞', isBonus: true },
} as const;

export type RobotPartId = keyof typeof ROBOT_PARTS;

export const PART_DEPENDENCIES: Record<string, string[]> = {
  CHASSIS: [],
  BRAIN: ['CHASSIS'],
  EYES: ['BRAIN'],
  METABOLISM: ['BRAIN'],
  INSTINCT_CHIP: ['BRAIN'],
  GENERALIZATION_MODULE: ['INSTINCT_CHIP'],
  VISUAL_CORTEX: ['EYES', 'GENERALIZATION_MODULE'],
  STABILITY_MODULE: ['GENERALIZATION_MODULE'],
  MOTOR_CORTEX: ['EYES'],
  SAFETY_GOVERNOR: ['MOTOR_CORTEX'],
  LANGUAGE_PROCESSOR: [],
  RELATIONAL_REASONING_UNIT: ['EYES'],
  IMITATION_DRIVE: ['LANGUAGE_PROCESSOR'],
};

export const JOURNAL_ENTRIES: Record<string, string> = {
  CHASSIS: "SYSTEM BOOT. No modules detected. Status: Empty. Purpose: Unknown.",
  BRAIN: "LOG: INPUT. OUTPUT. I perceive a pattern. If input is 1, output should be... 1? This is... logical.",
  EYES: "LOG: I can see. The world is made of pixels. Some pixels are walls. Some are... something else. I do not know what to do with this information.",
  INSTINCT_CHIP: "LOG: Tried moving right. Bad. Value: -1. Tried moving up. Good. Value: +1. Will try moving up more.",
  VISUAL_CORTEX: "LOG: The pixels form patterns. That pattern means 'good.' I move toward good pixels. It works. I do not know why.",
  STABILITY_MODULE: "LOG: My previous Q-estimates were... optimistic. Embarrassingly so. The new module provides a second opinion. I am more cautious now. Better.",
  MOTOR_CORTEX: "LOG: I no longer hop. I glide. The world is not a grid\u2014it is continuous. My movements are smooth, like oil.",
  SAFETY_GOVERNOR: "LOG: My movements feel certain. Stable. The probability of catastrophic error has been clipped. I am confident in my trajectory.",
  LANGUAGE_PROCESSOR: "LOG: 'Get the red ball.' I understand these symbols now. Each token carries meaning. The attention mechanism helps me focus on what matters.",
  IMITATION_DRIVE: "LOG: I watched the demonstration. I can reproduce it. Not perfectly, but the distribution captures the essence. I learn by watching.",
};
