/**
 * PPOSystem - For robots WITH HasSafetyGovernor.
 * Clips policy updates within a trust region.
 * Wraps ContinuousMovement with safety constraints.
 */
import { query } from 'bitecs';
import type { World } from 'bitecs';
import { IsRobot, HasSafetyGovernor, HasMotorCortex, Position, Velocity, GridPosition } from '../components';
import type { GridWorld } from '../../environments/GridWorld';
import type { Action } from './WanderSystem';

const CLIP_EPSILON = 0.2;
const ACCELERATION = 200;
const FRICTION = 0.92;
const MAX_SPEED = 120; // lower than raw continuous for safety
const TRUST_RADIUS = 64; // pixels - max displacement per step

export interface PPOPolicyState {
  /** Action probabilities [up, down, left, right] */
  policy: number[];
  /** Previous policy for clipping */
  oldPolicy: number[];
  /** Value estimate */
  valueEstimate: number;
  /** Accumulated advantage */
  advantage: number;
}

export interface PPOResult {
  entity: number;
  action: Action;
  x: number;
  y: number;
  dx: number;
  dy: number;
  policy: number[];
  trustRadius: number;
  clipped: boolean;
}

const ACTIONS: Action[] = ['up', 'down', 'left', 'right'];

function softmax(logits: number[]): number[] {
  const maxLogit = Math.max(...logits);
  const exps = logits.map((l) => Math.exp(l - maxLogit));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

function sampleAction(probs: number[]): number {
  const r = Math.random();
  let cumulative = 0;
  for (let i = 0; i < probs.length; i++) {
    cumulative += probs[i];
    if (r < cumulative) return i;
  }
  return probs.length - 1;
}

/**
 * Run the PPO-constrained movement system.
 */
export function ppoSystem(
  world: World,
  grid: GridWorld,
  deltaTime: number,
  ppoState: PPOPolicyState,
  reward: number,
  cellSize: number = 32,
): PPOResult | null {
  const robots = query(world, [IsRobot, HasSafetyGovernor, HasMotorCortex, Position, Velocity, GridPosition]);

  for (const eid of robots) {
    const dt = deltaTime / 1000;

    // Compute advantage
    const advantage = reward - ppoState.valueEstimate;
    ppoState.advantage = advantage;

    // Update value estimate (simple moving average)
    ppoState.valueEstimate += 0.01 * (reward - ppoState.valueEstimate);

    // Policy gradient with clipping
    const newLogits = ppoState.policy.map((p, i) => {
      const grad = advantage * (i === ACTIONS.indexOf(
        ACTIONS[ppoState.policy.indexOf(Math.max(...ppoState.policy))]
      ) ? 1 : -0.1);
      return Math.log(Math.max(p, 0.01)) + 0.01 * grad;
    });

    const newPolicy = softmax(newLogits);

    // PPO clipping: ensure ratio stays within [1-epsilon, 1+epsilon]
    let clipped = false;
    const clippedPolicy = newPolicy.map((p, i) => {
      const oldP = Math.max(ppoState.oldPolicy[i], 0.01);
      const ratio = p / oldP;
      if (ratio > 1 + CLIP_EPSILON) {
        clipped = true;
        return oldP * (1 + CLIP_EPSILON);
      }
      if (ratio < 1 - CLIP_EPSILON) {
        clipped = true;
        return oldP * (1 - CLIP_EPSILON);
      }
      return p;
    });

    // Renormalize
    const sum = clippedPolicy.reduce((a, b) => a + b, 0);
    const finalPolicy = clippedPolicy.map((p) => p / sum);

    // Store for next iteration
    ppoState.oldPolicy = [...ppoState.policy];
    ppoState.policy = finalPolicy;

    // Sample action from policy
    const actionIdx = sampleAction(finalPolicy);
    const action = ACTIONS[actionIdx];

    // Apply continuous movement with safety constraints
    let dx = Velocity.dx[eid];
    let dy = Velocity.dy[eid];

    switch (action) {
      case 'up': dy -= ACCELERATION * dt; break;
      case 'down': dy += ACCELERATION * dt; break;
      case 'left': dx -= ACCELERATION * dt; break;
      case 'right': dx += ACCELERATION * dt; break;
    }

    // Clamp speed (lower limit for safety)
    const speed = Math.sqrt(dx * dx + dy * dy);
    if (speed > MAX_SPEED) {
      dx = (dx / speed) * MAX_SPEED;
      dy = (dy / speed) * MAX_SPEED;
    }

    dx *= FRICTION;
    dy *= FRICTION;

    let x = Position.x[eid] + dx * dt;
    let y = Position.y[eid] + dy * dt;

    // Trust region constraint: limit displacement
    const dispX = x - Position.x[eid];
    const dispY = y - Position.y[eid];
    const disp = Math.sqrt(dispX * dispX + dispY * dispY);
    if (disp > TRUST_RADIUS * dt) {
      const scale = (TRUST_RADIUS * dt) / disp;
      x = Position.x[eid] + dispX * scale;
      y = Position.y[eid] + dispY * scale;
    }

    // Bounds
    x = Math.max(0, Math.min((grid.width - 1) * cellSize, x));
    y = Math.max(0, Math.min((grid.height - 1) * cellSize, y));

    // Wall collision
    const targetCol = Math.round(x / cellSize);
    const targetRow = Math.round(y / cellSize);
    if (
      targetCol >= 0 && targetCol < grid.width &&
      targetRow >= 0 && targetRow < grid.height &&
      grid.cells[targetRow][targetCol].type === 'wall'
    ) {
      x = Position.x[eid];
      y = Position.y[eid];
      dx *= -0.3;
      dy *= -0.3;
    }

    // Update components
    Position.x[eid] = x;
    Position.y[eid] = y;
    Velocity.dx[eid] = dx;
    Velocity.dy[eid] = dy;

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

    return {
      entity: eid,
      action,
      x, y, dx, dy,
      policy: finalPolicy,
      trustRadius: TRUST_RADIUS,
      clipped,
    };
  }

  return null;
}

export function createPPOState(): PPOPolicyState {
  return {
    policy: [0.25, 0.25, 0.25, 0.25],
    oldPolicy: [0.25, 0.25, 0.25, 0.25],
    valueEstimate: 0,
    advantage: 0,
  };
}
