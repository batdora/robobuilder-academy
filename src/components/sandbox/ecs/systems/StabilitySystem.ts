/**
 * StabilitySystem - For robots WITH HasStabilityModule.
 * Implements Double Q-learning: maintains two Q-value estimators.
 * Uses min of both for action selection to reduce overestimation.
 */
import { query } from 'bitecs';
import type { World } from 'bitecs';
import { IsRobot, HasStabilityModule, HasInstinctChip, GridPosition } from '../components';
import type { GridWorld } from '../../environments/GridWorld';
import type { Action } from './WanderSystem';

const ACTIONS: Action[] = ['up', 'down', 'left', 'right'];
const ACTION_DELTAS: Record<Action, [number, number]> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
  stay: [0, 0],
};

const ALPHA = 0.1;
const GAMMA = 0.99;
const EPSILON = 0.1;

export interface DoubleQStore {
  q1: Record<string, Record<Action, number>>;
  q2: Record<string, Record<Action, number>>;
}

export interface StabilityResult {
  entity: number;
  action: Action;
  moved: boolean;
  newCol: number;
  newRow: number;
  reward: number;
  stateKey: string;
  q1Values: Record<Action, number>;
  q2Values: Record<Action, number>;
}

function stateKey(col: number, row: number): string {
  return `${col},${row}`;
}

function getQ(table: Record<string, Record<Action, number>>, key: string): Record<Action, number> {
  if (!table[key]) {
    table[key] = { up: 0, down: 0, left: 0, right: 0, stay: 0 };
  }
  return table[key];
}

/**
 * Run the double Q-learning stability system.
 */
export function stabilitySystem(
  world: World,
  grid: GridWorld,
  _deltaTime: number,
  store: DoubleQStore,
): StabilityResult | null {
  const robots = query(world, [IsRobot, HasStabilityModule, HasInstinctChip, GridPosition]);

  for (const eid of robots) {
    const col = GridPosition.col[eid];
    const row = GridPosition.row[eid];
    const sk = stateKey(col, row);

    const q1 = getQ(store.q1, sk);
    const q2 = getQ(store.q2, sk);

    // Use min of Q1 and Q2 for action selection (conservative)
    let action: Action;
    if (Math.random() < EPSILON) {
      action = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
    } else {
      let bestAction: Action = 'up';
      let bestValue = -Infinity;
      for (const a of ACTIONS) {
        const minQ = Math.min(q1[a], q2[a]);
        if (minQ > bestValue) {
          bestValue = minQ;
          bestAction = a;
        }
      }
      action = bestAction;
    }

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

    // Double Q-learning update: randomly update Q1 or Q2
    const newSk = stateKey(finalCol, finalRow);
    if (Math.random() < 0.5) {
      // Update Q1 using Q2 for evaluation
      const q1Next = getQ(store.q1, newSk);
      const q2Next = getQ(store.q2, newSk);
      const bestNextAction = ACTIONS.reduce((best, a) =>
        q1Next[a] > q1Next[best] ? a : best, 'up' as Action);
      q1[action] += ALPHA * (reward + GAMMA * q2Next[bestNextAction] - q1[action]);
    } else {
      // Update Q2 using Q1 for evaluation
      const q1Next = getQ(store.q1, newSk);
      const q2Next = getQ(store.q2, newSk);
      const bestNextAction = ACTIONS.reduce((best, a) =>
        q2Next[a] > q2Next[best] ? a : best, 'up' as Action);
      q2[action] += ALPHA * (reward + GAMMA * q1Next[bestNextAction] - q2[action]);
    }

    return {
      entity: eid,
      action,
      moved,
      newCol: finalCol,
      newRow: finalRow,
      reward,
      stateKey: sk,
      q1Values: { ...q1 },
      q2Values: { ...q2 },
    };
  }

  return null;
}

export function createDoubleQStore(): DoubleQStore {
  return { q1: {}, q2: {} };
}
