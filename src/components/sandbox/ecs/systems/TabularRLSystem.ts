/**
 * TabularRLSystem - For robots WITH HasInstinctChip.
 * Maintains a Q-table (state -> action -> value).
 * Uses epsilon-greedy policy. Alpha=0.1, gamma=0.99.
 */
import { query, hasComponent } from 'bitecs';
import type { World } from 'bitecs';
import { IsRobot, HasInstinctChip, HasStabilityModule, GridPosition } from '../components';
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

export interface QTableStore {
  values: Record<string, Record<Action, number>>;
}

export interface TabularRLResult {
  entity: number;
  action: Action;
  moved: boolean;
  newCol: number;
  newRow: number;
  reward: number;
  stateKey: string;
  qValues: Record<Action, number>;
}

function stateKey(col: number, row: number): string {
  return `${col},${row}`;
}

function getQValues(table: QTableStore, key: string): Record<Action, number> {
  if (!table.values[key]) {
    table.values[key] = { up: 0, down: 0, left: 0, right: 0, stay: 0 };
  }
  return table.values[key];
}

function epsilonGreedy(qValues: Record<Action, number>, epsilon: number): Action {
  if (Math.random() < epsilon) {
    return ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
  }
  let bestAction: Action = 'up';
  let bestValue = -Infinity;
  for (const a of ACTIONS) {
    if (qValues[a] > bestValue) {
      bestValue = qValues[a];
      bestAction = a;
    }
  }
  return bestAction;
}

/**
 * Run the tabular RL system. Returns decision info.
 * Skips robots that have HasStabilityModule (those use double Q-learning).
 */
export function tabularRLSystem(
  world: World,
  grid: GridWorld,
  _deltaTime: number,
  qTable: QTableStore,
): TabularRLResult | null {
  const robots = query(world, [IsRobot, HasInstinctChip, GridPosition]);

  for (const eid of robots) {
    // If the robot has stability module, defer to StabilitySystem
    if (hasComponent(world, eid, HasStabilityModule)) continue;

    const col = GridPosition.col[eid];
    const row = GridPosition.row[eid];
    const sk = stateKey(col, row);
    const qValues = getQValues(qTable, sk);

    // Select action
    const action = epsilonGreedy(qValues, EPSILON);
    const [dc, dr] = ACTION_DELTAS[action];
    const newCol = col + dc;
    const newRow = row + dr;

    // Check validity
    let moved = false;
    let reward = -0.1; // small step penalty
    let finalCol = col;
    let finalRow = row;

    if (
      newCol >= 0 && newCol < grid.width &&
      newRow >= 0 && newRow < grid.height &&
      grid.cells[newRow][newCol].type !== 'wall'
    ) {
      // Move
      grid.cells[row][col] = { ...grid.cells[row][col], type: 'empty', entityId: undefined };

      const destCell = grid.cells[newRow][newCol];
      if (destCell.type === 'goal') {
        reward = 10;
      } else if (destCell.type === 'trap') {
        reward = -5;
      }

      grid.cells[newRow][newCol] = { ...destCell, entityId: eid };
      GridPosition.col[eid] = newCol;
      GridPosition.row[eid] = newRow;
      finalCol = newCol;
      finalRow = newRow;
      moved = true;
    } else {
      reward = -1; // wall bump penalty
    }

    // Q-learning update: Q(s,a) += alpha * (r + gamma * max_a' Q(s',a') - Q(s,a))
    const newSk = stateKey(finalCol, finalRow);
    const newQValues = getQValues(qTable, newSk);
    const maxNextQ = Math.max(...ACTIONS.map((a) => newQValues[a]));
    qValues[action] += ALPHA * (reward + GAMMA * maxNextQ - qValues[action]);

    return {
      entity: eid,
      action,
      moved,
      newCol: finalCol,
      newRow: finalRow,
      reward,
      stateKey: sk,
      qValues: { ...qValues },
    };
  }

  return null;
}

export function createQTable(): QTableStore {
  return { values: {} };
}
