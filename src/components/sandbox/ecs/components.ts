/**
 * ECS Components for RoboBuilder Sandbox
 *
 * bitecs v0.4 uses plain objects as component "tags" or SoA stores.
 * Components are registered automatically when first used with addComponent/query.
 */

// --- Spatial components (SoA stores) ---

/** World-space position for smooth rendering */
export const Position = { x: [] as number[], y: [] as number[] };

/** Velocity for continuous movement */
export const Velocity = { dx: [] as number[], dy: [] as number[] };

/** Grid-based position (col, row) */
export const GridPosition = { col: [] as number[], row: [] as number[] };

/** Sprite type: 0=robot, 1=wall, 2=goal, 3=trap, 4=object */
export const Sprite = { spriteId: [] as number[] };

// --- Tag components (empty objects used as markers) ---

export const IsRobot = {};
export const IsWall = {};
export const IsGoal = {};
export const IsTrap = {};

// --- Robot capability flags ---

export const HasBrain = {};
export const HasEyes = {};
export const HasInstinctChip = {};
export const HasGeneralization = {};
export const HasVisualCortex = {};
export const HasStabilityModule = {};
export const HasMotorCortex = {};
export const HasSafetyGovernor = {};
export const HasLanguageProcessor = {};
export const HasRelationalReasoning = {};
export const HasImitationDrive = {};

// --- Data containers ---

/** Reference to an external Q-table by ID */
export const QTable = { tableId: [] as number[] };

/** Count of entities visible to this entity */
export const VisibleEntities = { count: [] as number[] };

/** Health/energy of the entity */
export const Health = { value: [] as number[] };

// --- Part name to component mapping ---

export const PART_COMPONENT_MAP: Record<string, object> = {
  BRAIN: HasBrain,
  EYES: HasEyes,
  INSTINCT_CHIP: HasInstinctChip,
  GENERALIZATION: HasGeneralization,
  VISUAL_CORTEX: HasVisualCortex,
  STABILITY_MODULE: HasStabilityModule,
  MOTOR_CORTEX: HasMotorCortex,
  SAFETY_GOVERNOR: HasSafetyGovernor,
  LANGUAGE_PROCESSOR: HasLanguageProcessor,
  RELATIONAL_REASONING: HasRelationalReasoning,
  IMITATION_DRIVE: HasImitationDrive,
};

/** Human-readable labels for each part */
export const PART_LABELS: Record<string, string> = {
  BRAIN: 'Brain',
  EYES: 'Eyes',
  INSTINCT_CHIP: 'Instinct Chip',
  GENERALIZATION: 'Generalization',
  VISUAL_CORTEX: 'Visual Cortex',
  STABILITY_MODULE: 'Stability Module',
  MOTOR_CORTEX: 'Motor Cortex',
  SAFETY_GOVERNOR: 'Safety Governor',
  LANGUAGE_PROCESSOR: 'Language Processor',
  RELATIONAL_REASONING: 'Relational Reasoning',
  IMITATION_DRIVE: 'Imitation Drive',
};
