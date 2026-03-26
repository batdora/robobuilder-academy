/**
 * RenderSystem - Reads all entities with Position/GridPosition + Sprite
 * and returns render commands for PixiJS.
 */
import { query, hasComponent } from 'bitecs';
import type { World } from 'bitecs';
import {
  Position, GridPosition, Sprite, IsRobot, HasMotorCortex,
  HasEyes, HasVisualCortex, HasBrain,
} from '../components';

export interface RenderCommand {
  entityId: number;
  x: number;
  y: number;
  spriteId: number; // 0=robot, 1=wall, 2=goal, 3=trap, 4=object
  isRobot: boolean;
  hasEyes: boolean;
  hasVisualCortex: boolean;
  hasBrain: boolean;
}

/**
 * Collect all renderable entities and produce render commands.
 * For entities with HasMotorCortex, use pixel Position.
 * For others, derive position from GridPosition * cellSize.
 */
export function renderSystem(
  world: World,
  _deltaTime: number,
  cellSize: number = 32,
): RenderCommand[] {
  const entities = query(world, [GridPosition, Sprite]);
  const commands: RenderCommand[] = [];

  for (const eid of entities) {
    const useSmooth = hasComponent(world, eid, HasMotorCortex) && hasComponent(world, eid, Position);
    const x = useSmooth ? Position.x[eid] : GridPosition.col[eid] * cellSize;
    const y = useSmooth ? Position.y[eid] : GridPosition.row[eid] * cellSize;

    commands.push({
      entityId: eid,
      x,
      y,
      spriteId: Sprite.spriteId[eid],
      isRobot: hasComponent(world, eid, IsRobot),
      hasEyes: hasComponent(world, eid, HasEyes),
      hasVisualCortex: hasComponent(world, eid, HasVisualCortex),
      hasBrain: hasComponent(world, eid, HasBrain),
    });
  }

  return commands;
}
