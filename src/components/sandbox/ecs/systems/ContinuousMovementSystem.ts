/**
 * ContinuousMovementSystem - For robots WITH HasMotorCortex.
 * Instead of grid-hopping, applies smooth velocity with
 * acceleration/deceleration using simple physics.
 */
import { query, hasComponent } from 'bitecs';
import type { World } from 'bitecs';
import { IsRobot, HasMotorCortex, HasSafetyGovernor, Position, Velocity, GridPosition } from '../components';
import type { GridWorld } from '../../environments/GridWorld';
import type { Action } from './WanderSystem';

const ACCELERATION = 200; // pixels per second^2
const FRICTION = 0.9;
const MAX_SPEED = 160; // pixels per second

export interface ContinuousMovementResult {
  entity: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  targetAction: Action;
}

/**
 * Apply an acceleration impulse toward a target direction, then apply
 * physics (velocity integration + friction). Updates Position smoothly.
 */
export function continuousMovementSystem(
  world: World,
  grid: GridWorld,
  deltaTime: number,
  targetAction: Action,
  cellSize: number = 32,
): ContinuousMovementResult | null {
  const robots = query(world, [IsRobot, HasMotorCortex, Position, Velocity]);

  for (const eid of robots) {
    // If safety governor present, it wraps this system
    if (hasComponent(world, eid, HasSafetyGovernor)) continue;

    let dx = Velocity.dx[eid];
    let dy = Velocity.dy[eid];

    // Apply acceleration based on target action
    const dt = deltaTime / 1000; // convert ms to seconds
    switch (targetAction) {
      case 'up': dy -= ACCELERATION * dt; break;
      case 'down': dy += ACCELERATION * dt; break;
      case 'left': dx -= ACCELERATION * dt; break;
      case 'right': dx += ACCELERATION * dt; break;
    }

    // Clamp speed
    const speed = Math.sqrt(dx * dx + dy * dy);
    if (speed > MAX_SPEED) {
      dx = (dx / speed) * MAX_SPEED;
      dy = (dy / speed) * MAX_SPEED;
    }

    // Apply friction
    dx *= FRICTION;
    dy *= FRICTION;

    // Integrate position
    let x = Position.x[eid] + dx * dt;
    let y = Position.y[eid] + dy * dt;

    // Grid bounds clamping
    const minX = 0;
    const minY = 0;
    const maxX = (grid.width - 1) * cellSize;
    const maxY = (grid.height - 1) * cellSize;
    x = Math.max(minX, Math.min(maxX, x));
    y = Math.max(minY, Math.min(maxY, y));

    // Simple wall collision: check the grid cell we're moving into
    const targetCol = Math.round(x / cellSize);
    const targetRow = Math.round(y / cellSize);
    if (
      targetCol >= 0 && targetCol < grid.width &&
      targetRow >= 0 && targetRow < grid.height &&
      grid.cells[targetRow][targetCol].type === 'wall'
    ) {
      // Bounce back
      x = Position.x[eid];
      y = Position.y[eid];
      dx *= -0.5;
      dy *= -0.5;
    }

    // Update components
    Position.x[eid] = x;
    Position.y[eid] = y;
    Velocity.dx[eid] = dx;
    Velocity.dy[eid] = dy;

    // Update grid position to nearest cell
    const newCol = Math.round(x / cellSize);
    const newRow = Math.round(y / cellSize);
    const oldCol = GridPosition.col[eid];
    const oldRow = GridPosition.row[eid];
    if (newCol !== oldCol || newRow !== oldRow) {
      grid.cells[oldRow][oldCol] = { ...grid.cells[oldRow][oldCol], type: 'empty', entityId: undefined };
      if (newCol >= 0 && newCol < grid.width && newRow >= 0 && newRow < grid.height) {
        grid.cells[newRow][newCol] = { ...grid.cells[newRow][newCol], entityId: eid };
      }
      GridPosition.col[eid] = newCol;
      GridPosition.row[eid] = newRow;
    }

    return { entity: eid, x, y, dx, dy, targetAction };
  }

  return null;
}
