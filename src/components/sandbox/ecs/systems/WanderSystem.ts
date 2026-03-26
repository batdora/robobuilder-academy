/**
 * WanderSystem - Random walk for robots WITHOUT HasInstinctChip.
 * Each tick, picks a random direction and moves if the cell is not a wall.
 */
import { query, hasComponent } from 'bitecs';
import type { World } from 'bitecs';
import { IsRobot, HasInstinctChip, GridPosition } from '../components';
import type { GridWorld } from '../../environments/GridWorld';

export type Action = 'up' | 'down' | 'left' | 'right' | 'stay';

const DIRECTIONS: { action: Action; dc: number; dr: number }[] = [
  { action: 'up', dc: 0, dr: -1 },
  { action: 'down', dc: 0, dr: 1 },
  { action: 'left', dc: -1, dr: 0 },
  { action: 'right', dc: 1, dr: 0 },
];

export interface WanderResult {
  entity: number;
  action: Action;
  moved: boolean;
  newCol: number;
  newRow: number;
}

/**
 * Run the wander system. Returns info about the action taken.
 * Only applies to robots that do NOT have HasInstinctChip (or any higher-level decision system).
 */
export function wanderSystem(
  world: World,
  grid: GridWorld,
  _deltaTime: number,
): WanderResult | null {
  const robots = query(world, [IsRobot, GridPosition]);

  for (const eid of robots) {
    // Skip robots that have a smarter decision system
    if (hasComponent(world, eid, HasInstinctChip)) continue;

    const col = GridPosition.col[eid];
    const row = GridPosition.row[eid];

    // Pick a random direction
    const dir = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
    const newCol = col + dir.dc;
    const newRow = row + dir.dr;

    // Bounds check
    if (newCol < 0 || newCol >= grid.width || newRow < 0 || newRow >= grid.height) {
      return { entity: eid, action: dir.action, moved: false, newCol: col, newRow: row };
    }

    // Wall check
    if (grid.cells[newRow][newCol].type === 'wall') {
      return { entity: eid, action: dir.action, moved: false, newCol: col, newRow: row };
    }

    // Move
    grid.cells[row][col] = { ...grid.cells[row][col], type: 'empty', entityId: undefined };
    grid.cells[newRow][newCol] = { ...grid.cells[newRow][newCol], entityId: eid };

    GridPosition.col[eid] = newCol;
    GridPosition.row[eid] = newRow;

    return { entity: eid, action: dir.action, moved: true, newCol, newRow };
  }

  return null;
}
