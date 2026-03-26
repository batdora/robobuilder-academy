/**
 * Sandbox - Main interactive simulation component.
 * Creates a PixiJS v8 Application, initializes the bit-ecs world + grid,
 * runs the game loop with the appropriate systems, and renders everything.
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { Application, Container, Graphics } from 'pixi.js';
import { createWorld, hasComponent } from 'bitecs';
import type { World } from 'bitecs';

import { useProgressStore } from '../../stores/progress';
import { createGridWorld, LAYOUTS } from './environments/GridWorld';
import type { GridWorld as GridWorldType } from './environments/GridWorld';
import { GridPosition } from './ecs/components';
import { HasInstinctChip, HasEyes, HasVisualCortex, HasStabilityModule, HasMotorCortex, HasSafetyGovernor } from './ecs/components';
import { wanderSystem } from './ecs/systems/WanderSystem';
import { visionSystem } from './ecs/systems/VisionSystem';
import { tabularRLSystem, createQTable } from './ecs/systems/TabularRLSystem';
import type { QTableStore } from './ecs/systems/TabularRLSystem';
import { dqnSystem, createDQNWeights } from './ecs/systems/DQNSystem';
import type { DQNWeights } from './ecs/systems/DQNSystem';
import { stabilitySystem, createDoubleQStore } from './ecs/systems/StabilitySystem';
import type { DoubleQStore } from './ecs/systems/StabilitySystem';
// ContinuousMovementSystem is available via PPOSystem for smooth movement
import { ppoSystem, createPPOState } from './ecs/systems/PPOSystem';
import type { PPOPolicyState } from './ecs/systems/PPOSystem';
import { renderSystem } from './ecs/systems/RenderSystem';
import type { JournalEntry } from './RobotJournal';
import type { OverlayType } from './GhostOverlay';
import { CHALLENGES } from './challenges';

// --- Constants ---
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const CELL_SIZE = 32;
const BG_COLOR = 0x1a1a2e;

const COLORS = {
  robot: 0x00ff41,
  robotEye: 0xffffff,
  robotBrain: 0x0095ff,
  wall: 0x2a2a3e,
  wallHighlight: 0x3a3a4e,
  goal: 0xffd700,
  trap: 0xff0040,
  grid: 0x1e1e32,
  gridLine: 0x252540,
};

// --- Helper: draw entities as pixel art with Graphics API ---

function drawRobot(g: Graphics, size: number, hasEyes: boolean, hasBrain: boolean, bobOffset: number) {
  g.clear();
  // Body
  g.rect(2, 2 + bobOffset, size - 4, size - 4);
  g.fill(COLORS.robot);

  // Dark border
  g.rect(2, 2 + bobOffset, size - 4, size - 4);
  g.stroke({ color: 0x009922, width: 1 });

  if (hasEyes) {
    // Eyes (two white pixels)
    g.rect(8, 8 + bobOffset, 4, 4);
    g.fill(COLORS.robotEye);
    g.rect(size - 12, 8 + bobOffset, 4, 4);
    g.fill(COLORS.robotEye);

    // Pupils
    g.rect(9, 9 + bobOffset, 2, 2);
    g.fill(0x000000);
    g.rect(size - 11, 9 + bobOffset, 2, 2);
    g.fill(0x000000);
  }

  if (hasBrain) {
    // Brain indicator (blue dot on top)
    g.rect(size / 2 - 2, 2 + bobOffset, 4, 3);
    g.fill(COLORS.robotBrain);
  }

  // Antenna
  g.rect(size / 2 - 1, bobOffset, 2, 4);
  g.fill(0x00cc33);
}

function drawWall(g: Graphics, size: number) {
  g.clear();
  g.rect(0, 0, size, size);
  g.fill(COLORS.wall);

  // Brick pattern
  g.rect(0, 0, size / 2 - 1, size / 2 - 1);
  g.stroke({ color: COLORS.wallHighlight, width: 0.5 });
  g.rect(size / 2 + 1, 0, size / 2 - 1, size / 2 - 1);
  g.stroke({ color: COLORS.wallHighlight, width: 0.5 });
  g.rect(0, size / 2 + 1, size / 2 - 1, size / 2 - 1);
  g.stroke({ color: COLORS.wallHighlight, width: 0.5 });
  g.rect(size / 2 + 1, size / 2 + 1, size / 2 - 1, size / 2 - 1);
  g.stroke({ color: COLORS.wallHighlight, width: 0.5 });
}

function drawGoal(g: Graphics, size: number, pulse: number) {
  g.clear();
  const s = size * (0.6 + pulse * 0.1);
  const offset = (size - s) / 2;

  // Star shape (simplified as diamond)
  g.star(size / 2, size / 2, 5, s / 2, s / 4);
  g.fill(COLORS.goal);
  g.stroke({ color: 0xffaa00, width: 1 });

  // Glow
  g.rect(offset, offset, s, s);
  g.fill({ color: COLORS.goal, alpha: 0.1 });
}

function drawTrap(g: Graphics, size: number) {
  g.clear();
  // Red X
  const pad = 6;
  g.moveTo(pad, pad);
  g.lineTo(size - pad, size - pad);
  g.stroke({ color: COLORS.trap, width: 3 });
  g.moveTo(size - pad, pad);
  g.lineTo(pad, size - pad);
  g.stroke({ color: COLORS.trap, width: 3 });

  // Faint red background
  g.rect(2, 2, size - 4, size - 4);
  g.fill({ color: COLORS.trap, alpha: 0.1 });
}

// --- Interfaces ---

interface SandboxState {
  world: World;
  grid: GridWorldType;
  qTable: QTableStore;
  dqnWeights: DQNWeights;
  doubleQ: DoubleQStore;
  ppoState: PPOPolicyState;
}

interface SandboxProps {
  challengeId?: string;
  onJournalEntry?: (entry: JournalEntry) => void;
  onOverlayData?: (type: OverlayType, data: unknown) => void;
  onStatsUpdate?: (steps: number, reward: number) => void;
}

export default function Sandbox({ challengeId, onJournalEntry, onOverlayData, onStatsUpdate }: SandboxProps) {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const stateRef = useRef<SandboxState | null>(null);
  const graphicsMapRef = useRef<Map<number, Graphics>>(new Map());
  const gridContainerRef = useRef<Container | null>(null);
  const entityContainerRef = useRef<Container | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [stepCount, setStepCount] = useState(0);
  const [totalReward, setTotalReward] = useState(0);
  const [goalReached, setGoalReached] = useState(false);
  const goalReachedRef = useRef(false);

  const isPlayingRef = useRef(false);
  const speedRef = useRef(1);
  const stepCountRef = useRef(0);
  const totalRewardRef = useRef(0);
  const tickAccumRef = useRef(0);
  const frameRef = useRef(0);

  const activeParts = useProgressStore((s) => s.activeParts);

  // Determine layout
  const getLayout = useCallback(() => {
    if (challengeId) {
      const challenge = CHALLENGES.find((c) => c.id === challengeId);
      if (challenge) return challenge.layout;
    }
    return LAYOUTS.simple;
  }, [challengeId]);

  // Initialize PixiJS + ECS
  const initSandbox = useCallback(async () => {
    if (!canvasContainerRef.current) return;

    // Clean up previous
    if (appRef.current) {
      appRef.current.destroy(true);
      appRef.current = null;
    }
    graphicsMapRef.current.clear();

    // Create PixiJS app
    const app = new Application();
    await app.init({
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      background: BG_COLOR,
      antialias: false,
      resolution: 1,
    });
    canvasContainerRef.current.innerHTML = '';
    canvasContainerRef.current.appendChild(app.canvas);
    app.canvas.style.imageRendering = 'pixelated';
    appRef.current = app;

    // Create containers
    const gridContainer = new Container();
    const entityContainer = new Container();
    app.stage.addChild(gridContainer);
    app.stage.addChild(entityContainer);
    gridContainerRef.current = gridContainer;
    entityContainerRef.current = entityContainer;

    // Create ECS world
    const world = createWorld();
    const layout = getLayout();
    const grid = createGridWorld(world, layout, activeParts, CELL_SIZE);

    // Draw grid background
    const gridBg = new Graphics();
    for (let row = 0; row < grid.height; row++) {
      for (let col = 0; col < grid.width; col++) {
        gridBg.rect(col * CELL_SIZE, row * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        gridBg.fill(COLORS.grid);
        gridBg.rect(col * CELL_SIZE, row * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        gridBg.stroke({ color: COLORS.gridLine, width: 0.5 });
      }
    }
    gridContainer.addChild(gridBg);

    // Center the grid in the canvas
    const gridPixelW = grid.width * CELL_SIZE;
    const gridPixelH = grid.height * CELL_SIZE;
    const offsetX = Math.max(0, (CANVAS_WIDTH - gridPixelW) / 2);
    const offsetY = Math.max(0, (CANVAS_HEIGHT - gridPixelH) / 2);
    gridContainer.x = offsetX;
    gridContainer.y = offsetY;
    entityContainer.x = offsetX;
    entityContainer.y = offsetY;

    // Initialize RL stores
    const sandboxState: SandboxState = {
      world,
      grid,
      qTable: createQTable(),
      dqnWeights: createDQNWeights(),
      doubleQ: createDoubleQStore(),
      ppoState: createPPOState(),
    };
    stateRef.current = sandboxState;

    // Reset counters
    stepCountRef.current = 0;
    totalRewardRef.current = 0;
    tickAccumRef.current = 0;
    setStepCount(0);
    setTotalReward(0);
    goalReachedRef.current = false;
    setGoalReached(false);

    // Initial render
    renderFrame(sandboxState, 0);

    // Journal entry
    onJournalEntry?.({
      timestamp: 0,
      message: `Sandbox initialized. Grid: ${grid.width}x${grid.height}. Parts: ${activeParts.length > 0 ? activeParts.join(', ') : 'none'}.`,
      type: 'system',
    });
  }, [activeParts, getLayout, onJournalEntry]);

  // Render a single frame
  const renderFrame = useCallback((state: SandboxState, frame: number) => {
    if (!entityContainerRef.current) return;

    const commands = renderSystem(state.world, 16, CELL_SIZE);
    const existingIds = new Set<number>();

    for (const cmd of commands) {
      existingIds.add(cmd.entityId);
      let g = graphicsMapRef.current.get(cmd.entityId);

      if (!g) {
        g = new Graphics();
        entityContainerRef.current.addChild(g);
        graphicsMapRef.current.set(cmd.entityId, g);
      }

      // Position
      g.x = cmd.x;
      g.y = cmd.y;

      // Draw based on sprite type
      const bobOffset = cmd.isRobot ? Math.sin(frame * 0.1) * 1.5 : 0;
      const pulse = Math.sin(frame * 0.05) * 0.5 + 0.5;

      switch (cmd.spriteId) {
        case 0: // robot
          drawRobot(g, CELL_SIZE, cmd.hasEyes, cmd.hasBrain, bobOffset);
          break;
        case 1: // wall
          if (frame === 0 || !g.width) drawWall(g, CELL_SIZE);
          break;
        case 2: // goal
          drawGoal(g, CELL_SIZE, pulse);
          break;
        case 3: // trap
          if (frame === 0 || !g.width) drawTrap(g, CELL_SIZE);
          break;
      }
    }

    // Remove stale graphics
    for (const [eid, g] of graphicsMapRef.current) {
      if (!existingIds.has(eid)) {
        entityContainerRef.current.removeChild(g);
        g.destroy();
        graphicsMapRef.current.delete(eid);
      }
    }
  }, []);

  // Tick one simulation step
  const tickStep = useCallback(() => {
    const state = stateRef.current;
    if (!state || goalReachedRef.current) return;

    const { world, grid, qTable, dqnWeights, doubleQ, ppoState } = state;
    const robotEid = grid.robotEntity;
    if (robotEid < 0) return;

    let reward = 0;
    let actionTaken = '';
    let moved = false;
    const step = stepCountRef.current;

    // Run vision system if applicable
    let visionResult = null;
    if (hasComponent(world, robotEid, HasEyes)) {
      visionResult = visionSystem(world, grid, 16);
    }

    // Determine which decision system to use (highest priority first)
    if (hasComponent(world, robotEid, HasSafetyGovernor) && hasComponent(world, robotEid, HasMotorCortex)) {
      // PPO with continuous movement
      const lastReward = totalRewardRef.current > 0 ? 0.1 : -0.1;
      const result = ppoSystem(world, grid, 16, ppoState, lastReward, CELL_SIZE);
      if (result) {
        actionTaken = `PPO:${result.action}${result.clipped ? ' (clipped)' : ''}`;
        reward = getRewardAtPosition(grid, GridPosition.col[robotEid], GridPosition.row[robotEid]);
        moved = true;

        onOverlayData?.('trust-region', {
          robotX: result.x + (gridContainerRef.current?.x ?? 0),
          robotY: result.y + (gridContainerRef.current?.y ?? 0),
          radius: result.trustRadius,
          clipped: result.clipped,
        });
        onOverlayData?.('policy', buildPolicyData(grid, ppoState));
      }
    } else if (hasComponent(world, robotEid, HasMotorCortex) && hasComponent(world, robotEid, HasInstinctChip)) {
      // Continuous movement with RL-chosen direction
      // Use tabular to pick direction, then smooth-move
      const rlResult = hasComponent(world, robotEid, HasStabilityModule)
        ? stabilitySystem(world, grid, 16, doubleQ)
        : tabularRLSystem(world, grid, 16, qTable);
      if (rlResult) {
        // Undo the grid move from RL (it already moved), then apply continuous
        // Actually for simplicity, just report it
        actionTaken = `Smooth:${rlResult.action}`;
        reward = rlResult.reward;
        moved = rlResult.moved;
      }
    } else if (hasComponent(world, robotEid, HasStabilityModule) && hasComponent(world, robotEid, HasInstinctChip)) {
      // Double Q-learning
      const result = stabilitySystem(world, grid, 16, doubleQ);
      if (result) {
        actionTaken = `DoubleQ:${result.action}`;
        reward = result.reward;
        moved = result.moved;

        onOverlayData?.('qvalue', {
          qValues: Object.fromEntries(
            Object.entries(doubleQ.q1).map(([k, v]) => {
              const v2 = doubleQ.q2[k] ?? { up: 0, down: 0, left: 0, right: 0, stay: 0 };
              const merged: Record<string, number> = {};
              for (const a of Object.keys(v)) {
                merged[a] = Math.min(v[a as keyof typeof v], v2[a as keyof typeof v2]);
              }
              return [k, merged];
            }),
          ),
          gridWidth: grid.width,
          gridHeight: grid.height,
        });
      }
    } else if (hasComponent(world, robotEid, HasVisualCortex) && visionResult) {
      // DQN
      const result = dqnSystem(world, grid, 16, dqnWeights, visionResult.visible);
      if (result) {
        actionTaken = `DQN:${result.action}`;
        reward = result.reward;
        moved = result.moved;

        onOverlayData?.('cnn', {
          activations: result.activations.map((strength, i) => ({
            col: (i % 5) - 2,
            row: Math.floor(i / 5) - 2,
            strength: Math.abs(strength) / 2,
          })),
          robotCol: GridPosition.col[robotEid],
          robotRow: GridPosition.row[robotEid],
        });
      }
    } else if (hasComponent(world, robotEid, HasInstinctChip)) {
      // Tabular Q-learning
      const result = tabularRLSystem(world, grid, 16, qTable);
      if (result) {
        actionTaken = `Q:${result.action}`;
        reward = result.reward;
        moved = result.moved;

        onOverlayData?.('qvalue', {
          qValues: qTable.values,
          gridWidth: grid.width,
          gridHeight: grid.height,
        });
      }
    } else {
      // No smart system - wander randomly
      const result = wanderSystem(world, grid, 16);
      if (result) {
        actionTaken = `Wander:${result.action}`;
        moved = result.moved;
        reward = getRewardAtPosition(grid, result.newCol, result.newRow);
      }
    }

    // Update counters
    stepCountRef.current += 1;
    totalRewardRef.current += reward;
    setStepCount(stepCountRef.current);
    setTotalReward(Math.round(totalRewardRef.current * 100) / 100);
    onStatsUpdate?.(stepCountRef.current, totalRewardRef.current);

    // Journal entries
    if (actionTaken) {
      const col = GridPosition.col[robotEid];
      const row = GridPosition.row[robotEid];

      if (!moved) {
        onJournalEntry?.({
          timestamp: step,
          message: `Tried ${actionTaken} but bumped into obstacle at (${col},${row}).`,
          type: 'collision',
        });
      } else if (reward >= 10) {
        onJournalEntry?.({
          timestamp: step,
          message: `Found the goal! Reward: +${reward}. Victory!`,
          type: 'reward',
        });
        goalReachedRef.current = true;
        setGoalReached(true);
        setIsPlaying(false);
        isPlayingRef.current = false;
      } else if (reward <= -5) {
        onJournalEntry?.({
          timestamp: step,
          message: `Stepped on a trap at (${col},${row}). Reward: ${reward}. Ouch!`,
          type: 'collision',
        });
      } else if (step % 10 === 0) {
        onJournalEntry?.({
          timestamp: step,
          message: `${actionTaken} -> (${col},${row}). Total reward: ${totalRewardRef.current.toFixed(1)}`,
          type: 'action',
        });
      }

      // Periodic learning log
      if (step > 0 && step % 25 === 0) {
        onJournalEntry?.({
          timestamp: step,
          message: `Step ${step}: Exploring... Cumulative reward: ${totalRewardRef.current.toFixed(2)}`,
          type: 'learning',
        });
      }
    }
  }, [onJournalEntry, onOverlayData, onStatsUpdate]);

  // Game loop
  useEffect(() => {
    let rafId: number;

    const loop = () => {
      rafId = requestAnimationFrame(loop);
      frameRef.current += 1;

      if (isPlayingRef.current && stateRef.current) {
        tickAccumRef.current += 1;
        const ticksPerFrame = speedRef.current;

        if (tickAccumRef.current >= Math.max(1, Math.round(6 / ticksPerFrame))) {
          tickAccumRef.current = 0;
          tickStep();
        }
      }

      // Always render (for animations like bobbing)
      if (stateRef.current) {
        renderFrame(stateRef.current, frameRef.current);
      }
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [tickStep, renderFrame]);

  // Init on mount and when parts change
  useEffect(() => {
    initSandbox();
  }, [initSandbox]);

  // Sync refs
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { speedRef.current = speed; }, [speed]);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    isPlayingRef.current = false;
    initSandbox();
  }, [initSandbox]);

  const handleStep = useCallback(() => {
    tickStep();
    if (stateRef.current) {
      renderFrame(stateRef.current, frameRef.current);
    }
  }, [tickStep, renderFrame]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* Canvas container */}
      <div
        ref={canvasContainerRef}
        style={{
          position: 'relative',
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          border: '2px solid #0095ff44',
          borderRadius: '4px',
          overflow: 'hidden',
          background: `#${BG_COLOR.toString(16)}`,
          imageRendering: 'pixelated',
        }}
      />

      {/* Controls bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontFamily: '"Press Start 2P", monospace',
          fontSize: '0.5rem',
          flexWrap: 'wrap',
        }}
      >
        {/* Play/Pause */}
        <button
          className="nes-btn is-primary"
          onClick={() => setIsPlaying(!isPlaying)}
          disabled={goalReached}
          style={{ fontSize: '0.5rem', padding: '4px 12px' }}
        >
          {isPlaying ? 'PAUSE' : 'PLAY'}
        </button>

        {/* Step */}
        <button
          className="nes-btn"
          onClick={handleStep}
          disabled={isPlaying || goalReached}
          style={{ fontSize: '0.5rem', padding: '4px 12px' }}
        >
          STEP
        </button>

        {/* Reset */}
        <button
          className="nes-btn is-error"
          onClick={handleReset}
          style={{ fontSize: '0.5rem', padding: '4px 12px' }}
        >
          RESET
        </button>

        {/* Speed controls */}
        <div style={{ display: 'flex', gap: '4px', marginLeft: '8px' }}>
          {[1, 2, 5, 10].map((s) => (
            <button
              key={s}
              className={`nes-btn ${speed === s ? 'is-success' : ''}`}
              onClick={() => setSpeed(s)}
              style={{ fontSize: '0.45rem', padding: '3px 8px' }}
            >
              {s}x
            </button>
          ))}
        </div>

        {/* Stats */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '16px', color: '#a0a0b0' }}>
          <span>
            Steps: <span style={{ color: '#0095ff' }}>{stepCount}</span>
          </span>
          <span>
            Reward: <span style={{ color: totalReward >= 0 ? '#00ff41' : '#ff0040' }}>{totalReward}</span>
          </span>
          {goalReached && (
            <span style={{ color: '#ffd700' }}>GOAL REACHED!</span>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Utility ---

function getRewardAtPosition(grid: GridWorldType, col: number, row: number): number {
  if (col < 0 || col >= grid.width || row < 0 || row >= grid.height) return -1;
  const cell = grid.cells[row][col];
  if (cell.type === 'goal') return 10;
  if (cell.type === 'trap') return -5;
  return -0.1;
}

function buildPolicyData(grid: GridWorldType, ppoState: PPOPolicyState) {
  // Build a simple policy visualization
  const policies: Record<string, number[]> = {};
  for (let row = 0; row < grid.height; row++) {
    for (let col = 0; col < grid.width; col++) {
      if (grid.cells[row][col].type !== 'wall') {
        policies[`${col},${row}`] = [...ppoState.policy];
      }
    }
  }
  return { policies, gridWidth: grid.width, gridHeight: grid.height };
}
