/**
 * VisionSystem - For robots WITH HasEyes.
 * Scans surrounding cells and returns visible entities.
 * Range is 3x3 by default, 5x5 if HasVisualCortex is present.
 */
import { query, hasComponent } from 'bitecs';
import type { World } from 'bitecs';
import { IsRobot, HasEyes, HasVisualCortex, GridPosition, VisibleEntities } from '../components';
import type { GridWorld } from '../../environments/GridWorld';

export interface VisibleEntity {
  entityType: 'wall' | 'goal' | 'trap' | 'empty';
  relativeCol: number;
  relativeRow: number;
  entityId?: number;
}

export interface VisionResult {
  entity: number;
  visible: VisibleEntity[];
  range: number;
}

/**
 * Run the vision system. Returns what the robot can "see".
 */
export function visionSystem(
  world: World,
  grid: GridWorld,
  _deltaTime: number,
): VisionResult | null {
  const robots = query(world, [IsRobot, HasEyes, GridPosition]);

  for (const eid of robots) {
    const col = GridPosition.col[eid];
    const row = GridPosition.row[eid];

    // Determine vision range
    const hasAdvancedVision = hasComponent(world, eid, HasVisualCortex);
    const range = hasAdvancedVision ? 2 : 1; // 5x5 vs 3x3

    const visible: VisibleEntity[] = [];

    for (let dr = -range; dr <= range; dr++) {
      for (let dc = -range; dc <= range; dc++) {
        if (dr === 0 && dc === 0) continue; // skip self

        const checkCol = col + dc;
        const checkRow = row + dr;

        // Out of bounds treated as wall
        if (checkCol < 0 || checkCol >= grid.width || checkRow < 0 || checkRow >= grid.height) {
          visible.push({ entityType: 'wall', relativeCol: dc, relativeRow: dr });
          continue;
        }

        const cell = grid.cells[checkRow][checkCol];
        visible.push({
          entityType: cell.type === 'empty' ? 'empty' : cell.type,
          relativeCol: dc,
          relativeRow: dr,
          entityId: cell.entityId,
        });
      }
    }

    // Update visible count
    VisibleEntities.count[eid] = visible.length;

    return { entity: eid, visible, range };
  }

  return null;
}
