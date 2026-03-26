/**
 * Grid World environment for the sandbox.
 */
import type { World } from 'bitecs';
import { createRobot, createWall, createGoal, createTrap } from '../ecs/entities';

export interface GridCell {
  type: 'empty' | 'wall' | 'goal' | 'trap';
  entityId?: number;
}

export interface GridWorld {
  width: number;
  height: number;
  cells: GridCell[][];
  robotEntity: number;
  goalEntity: number;
}

/**
 * Parse a string layout into a GridWorld, creating ECS entities.
 *
 * Layout chars: W=wall, G=goal, T=trap, R=robot start, .=empty
 */
export function createGridWorld(
  world: World,
  layout: string,
  parts: string[] = [],
  cellSize: number = 32,
): GridWorld {
  const lines = layout
    .trim()
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const height = lines.length;
  const width = Math.max(...lines.map((l) => l.length));

  const cells: GridCell[][] = [];
  let robotEntity = -1;
  let goalEntity = -1;

  for (let row = 0; row < height; row++) {
    cells[row] = [];
    for (let col = 0; col < width; col++) {
      const ch = col < lines[row].length ? lines[row][col] : '.';

      switch (ch) {
        case 'W': {
          const eid = createWall(world, col, row, cellSize);
          cells[row][col] = { type: 'wall', entityId: eid };
          break;
        }
        case 'G': {
          const eid = createGoal(world, col, row, cellSize);
          cells[row][col] = { type: 'goal', entityId: eid };
          goalEntity = eid;
          break;
        }
        case 'T': {
          const eid = createTrap(world, col, row, cellSize);
          cells[row][col] = { type: 'trap', entityId: eid };
          break;
        }
        case 'R': {
          const eid = createRobot(world, col, row, parts, cellSize);
          cells[row][col] = { type: 'empty', entityId: eid };
          robotEntity = eid;
          break;
        }
        default: {
          cells[row][col] = { type: 'empty' };
          break;
        }
      }
    }
  }

  return { width, height, cells, robotEntity, goalEntity };
}

/** Predefined grid layouts */
export const LAYOUTS: Record<string, string> = {
  simple: [
    '..........',
    '.W....W...',
    '.W..G.W...',
    '.W....W...',
    '..........',
    '....W.....',
    '.R..W..T..',
    '....W.....',
    '..........',
  ].join('\n'),

  maze: [
    'WWWWWWWWWWWW',
    'W..W.....W.W',
    'W..W.WWW.W.W',
    'W..W.W.....W',
    'W....W.WWWWW',
    'WWWW.W.....W',
    'W....WWWWW.W',
    'W.WW.......W',
    'W.W..WWWWW.W',
    'W.W..W...G.W',
    'W.R..W.....W',
    'WWWWWWWWWWWW',
  ].join('\n'),

  bridge: [
    '..........',
    'WWWW..WWWW',
    '....T.T...',
    '....T.T...',
    'WWWW..WWWW',
    '..R.......',
    'WWWW..WWWW',
    '....T.T...',
    '....T.T...',
    'WWWW..WWWW',
    '........G.',
    '..........',
  ].join('\n'),

  traps: [
    '..........',
    '..T..T..T.',
    '..........',
    '.T..T..T..',
    '...........',
    '...T..T..T',
    '..........',
    '.R........',
    '..T..T....',
    '........G.',
  ].join('\n'),

  open: [
    '..........',
    '..........',
    '..........',
    '..........',
    '..........',
    '..........',
    '.R........',
    '..........',
    '........G.',
    '..........',
  ].join('\n'),
};
