/**
 * DQNSystem - For robots WITH HasVisualCortex.
 * Simulates a "neural network" decision by computing weighted sums
 * of visible entity features. More sophisticated than tabular RL.
 * Uses a simple 2-layer MLP approximation.
 */
import { query, hasComponent } from 'bitecs';
import type { World } from 'bitecs';
import { IsRobot, HasVisualCortex, HasStabilityModule, GridPosition } from '../components';
import type { GridWorld } from '../../environments/GridWorld';
import type { Action } from './WanderSystem';
import type { VisibleEntity } from './VisionSystem';

const ACTIONS: Action[] = ['up', 'down', 'left', 'right'];
const ACTION_DELTAS: Record<Action, [number, number]> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
  stay: [0, 0],
};

const EPSILON = 0.05;
const LEARNING_RATE = 0.01;
const GAMMA = 0.99;

// Simple 2-layer MLP weights
export interface DQNWeights {
  // Input: 25 features (5x5 grid encoded) -> Hidden: 16 neurons -> Output: 4 actions
  w1: number[][]; // [25][16]
  b1: number[];   // [16]
  w2: number[][]; // [16][4]
  b2: number[];   // [4]
}

export interface DQNResult {
  entity: number;
  action: Action;
  moved: boolean;
  newCol: number;
  newRow: number;
  reward: number;
  qValues: number[];
  activations: number[]; // hidden layer activations for visualization
}

function relu(x: number): number {
  return Math.max(0, x);
}

function encodeVision(visible: VisibleEntity[], gridWidth: number, gridHeight: number, robotCol: number, robotRow: number): number[] {
  // Encode a 5x5 grid centered on robot into features
  // Each cell: 0=empty, 0.25=wall, 0.5=trap, 1.0=goal
  const features = new Array(25).fill(0);
  for (let dr = -2; dr <= 2; dr++) {
    for (let dc = -2; dc <= 2; dc++) {
      const idx = (dr + 2) * 5 + (dc + 2);
      const c = robotCol + dc;
      const r = robotRow + dr;
      if (c < 0 || c >= gridWidth || r < 0 || r >= gridHeight) {
        features[idx] = 0.25; // out of bounds = wall
      } else {
        const found = visible.find((v) => v.relativeCol === dc && v.relativeRow === dr);
        if (found) {
          switch (found.entityType) {
            case 'wall': features[idx] = 0.25; break;
            case 'trap': features[idx] = 0.5; break;
            case 'goal': features[idx] = 1.0; break;
            default: features[idx] = 0; break;
          }
        }
      }
    }
  }
  return features;
}

function forward(weights: DQNWeights, input: number[]): { qValues: number[]; hidden: number[] } {
  // Hidden layer
  const hidden = new Array(16).fill(0);
  for (let j = 0; j < 16; j++) {
    let sum = weights.b1[j];
    for (let i = 0; i < 25; i++) {
      sum += input[i] * weights.w1[i][j];
    }
    hidden[j] = relu(sum);
  }

  // Output layer
  const qValues = new Array(4).fill(0);
  for (let k = 0; k < 4; k++) {
    let sum = weights.b2[k];
    for (let j = 0; j < 16; j++) {
      sum += hidden[j] * weights.w2[j][k];
    }
    qValues[k] = sum;
  }

  return { qValues, hidden };
}

function backprop(weights: DQNWeights, input: number[], hidden: number[], targetAction: number, tdError: number): void {
  // Simple gradient descent on the selected action's output
  // Output layer gradient
  for (let j = 0; j < 16; j++) {
    weights.w2[j][targetAction] += LEARNING_RATE * tdError * hidden[j];
  }
  weights.b2[targetAction] += LEARNING_RATE * tdError;

  // Hidden layer gradient (through ReLU)
  for (let j = 0; j < 16; j++) {
    if (hidden[j] > 0) { // ReLU derivative
      const grad = tdError * weights.w2[j][targetAction];
      for (let i = 0; i < 25; i++) {
        weights.w1[i][j] += LEARNING_RATE * grad * input[i];
      }
      weights.b1[j] += LEARNING_RATE * grad;
    }
  }
}

export function createDQNWeights(): DQNWeights {
  const randW = () => (Math.random() - 0.5) * 0.2;
  return {
    w1: Array.from({ length: 25 }, () => Array.from({ length: 16 }, randW)),
    b1: Array.from({ length: 16 }, () => 0),
    w2: Array.from({ length: 16 }, () => Array.from({ length: 4 }, randW)),
    b2: Array.from({ length: 4 }, () => 0),
  };
}

/**
 * Run the DQN system. Returns decision info + hidden activations.
 */
export function dqnSystem(
  world: World,
  grid: GridWorld,
  _deltaTime: number,
  weights: DQNWeights,
  visibleEntities: VisibleEntity[],
): DQNResult | null {
  const robots = query(world, [IsRobot, HasVisualCortex, GridPosition]);

  for (const eid of robots) {
    // If stability module present, it wraps this
    if (hasComponent(world, eid, HasStabilityModule)) continue;

    const col = GridPosition.col[eid];
    const row = GridPosition.row[eid];

    // Encode vision into features
    const input = encodeVision(visibleEntities, grid.width, grid.height, col, row);
    const { qValues, hidden } = forward(weights, input);

    // Epsilon-greedy action selection
    let actionIdx: number;
    if (Math.random() < EPSILON) {
      actionIdx = Math.floor(Math.random() * 4);
    } else {
      actionIdx = qValues.indexOf(Math.max(...qValues));
    }
    const action = ACTIONS[actionIdx];
    const [dc, dr] = ACTION_DELTAS[action];
    const newCol = col + dc;
    const newRow = row + dr;

    let moved = false;
    let reward = -0.1;
    let finalCol = col;
    let finalRow = row;

    if (
      newCol >= 0 && newCol < grid.width &&
      newRow >= 0 && newRow < grid.height &&
      grid.cells[newRow][newCol].type !== 'wall'
    ) {
      grid.cells[row][col] = { ...grid.cells[row][col], type: 'empty', entityId: undefined };
      const destCell = grid.cells[newRow][newCol];
      if (destCell.type === 'goal') reward = 10;
      else if (destCell.type === 'trap') reward = -5;
      grid.cells[newRow][newCol] = { ...destCell, entityId: eid };
      GridPosition.col[eid] = newCol;
      GridPosition.row[eid] = newRow;
      finalCol = newCol;
      finalRow = newRow;
      moved = true;
    } else {
      reward = -1;
    }

    // TD update
    const nextInput = encodeVision(visibleEntities, grid.width, grid.height, finalCol, finalRow);
    const { qValues: nextQ } = forward(weights, nextInput);
    const maxNextQ = Math.max(...nextQ);
    const tdError = reward + GAMMA * maxNextQ - qValues[actionIdx];
    backprop(weights, input, hidden, actionIdx, tdError);

    return {
      entity: eid,
      action,
      moved,
      newCol: finalCol,
      newRow: finalRow,
      reward,
      qValues,
      activations: hidden,
    };
  }

  return null;
}
