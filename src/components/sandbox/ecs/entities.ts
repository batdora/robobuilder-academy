/**
 * Entity factory functions for the sandbox ECS world.
 */
import { addEntity, addComponent } from 'bitecs';
import type { World, EntityId } from 'bitecs';
import {
  Position, GridPosition, Sprite, Velocity,
  IsRobot, IsWall, IsGoal, IsTrap,
  Health, VisibleEntities, QTable,
  PART_COMPONENT_MAP,
} from './components';

/**
 * Create a robot entity with capability components based on active parts.
 */
export function createRobot(
  world: World,
  col: number,
  row: number,
  parts: string[],
  cellSize: number = 32,
): EntityId {
  const eid = addEntity(world);

  addComponent(world, eid, Position);
  Position.x[eid] = col * cellSize;
  Position.y[eid] = row * cellSize;

  addComponent(world, eid, GridPosition);
  GridPosition.col[eid] = col;
  GridPosition.row[eid] = row;

  addComponent(world, eid, Velocity);
  Velocity.dx[eid] = 0;
  Velocity.dy[eid] = 0;

  addComponent(world, eid, Sprite);
  Sprite.spriteId[eid] = 0; // robot

  addComponent(world, eid, IsRobot);

  addComponent(world, eid, Health);
  Health.value[eid] = 100;

  addComponent(world, eid, VisibleEntities);
  VisibleEntities.count[eid] = 0;

  addComponent(world, eid, QTable);
  QTable.tableId[eid] = 0;

  // Add capability components from parts list
  for (const part of parts) {
    const comp = PART_COMPONENT_MAP[part];
    if (comp) {
      addComponent(world, eid, comp);
    }
  }

  return eid;
}

/**
 * Create a wall entity at the given grid position.
 */
export function createWall(
  world: World,
  col: number,
  row: number,
  cellSize: number = 32,
): EntityId {
  const eid = addEntity(world);

  addComponent(world, eid, Position);
  Position.x[eid] = col * cellSize;
  Position.y[eid] = row * cellSize;

  addComponent(world, eid, GridPosition);
  GridPosition.col[eid] = col;
  GridPosition.row[eid] = row;

  addComponent(world, eid, Sprite);
  Sprite.spriteId[eid] = 1; // wall

  addComponent(world, eid, IsWall);

  return eid;
}

/**
 * Create a goal entity at the given grid position.
 */
export function createGoal(
  world: World,
  col: number,
  row: number,
  cellSize: number = 32,
): EntityId {
  const eid = addEntity(world);

  addComponent(world, eid, Position);
  Position.x[eid] = col * cellSize;
  Position.y[eid] = row * cellSize;

  addComponent(world, eid, GridPosition);
  GridPosition.col[eid] = col;
  GridPosition.row[eid] = row;

  addComponent(world, eid, Sprite);
  Sprite.spriteId[eid] = 2; // goal

  addComponent(world, eid, IsGoal);

  return eid;
}

/**
 * Create a trap entity at the given grid position.
 */
export function createTrap(
  world: World,
  col: number,
  row: number,
  cellSize: number = 32,
): EntityId {
  const eid = addEntity(world);

  addComponent(world, eid, Position);
  Position.x[eid] = col * cellSize;
  Position.y[eid] = row * cellSize;

  addComponent(world, eid, GridPosition);
  GridPosition.col[eid] = col;
  GridPosition.row[eid] = row;

  addComponent(world, eid, Sprite);
  Sprite.spriteId[eid] = 3; // trap

  addComponent(world, eid, IsTrap);

  return eid;
}
