/**
 * GhostOverlay - Canvas overlay for "Ghost in the Machine" visualizations.
 * Renders Q-value heatmaps, CNN activations, policy arrows, and trust regions
 * on top of the main PixiJS canvas.
 */
import { useEffect, useRef } from 'react';

export type OverlayType = 'qvalue' | 'cnn' | 'policy' | 'trust-region';

interface QValueData {
  /** Map of "col,row" -> { up, down, left, right } Q-values */
  qValues: Record<string, Record<string, number>>;
  gridWidth: number;
  gridHeight: number;
}

interface CNNData {
  /** Activation strengths for cells in robot's visible area */
  activations: { col: number; row: number; strength: number }[];
  robotCol: number;
  robotRow: number;
}

interface PolicyData {
  /** Map of "col,row" -> [up, down, left, right] probabilities */
  policies: Record<string, number[]>;
  gridWidth: number;
  gridHeight: number;
}

interface TrustRegionData {
  robotX: number;
  robotY: number;
  radius: number;
  clipped: boolean;
}

interface GhostOverlayProps {
  type: OverlayType;
  data: QValueData | CNNData | PolicyData | TrustRegionData | null;
  gridSize: number;
  width: number;
  height: number;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

function valueToColor(value: number, min: number, max: number): string {
  const t = max === min ? 0.5 : (value - min) / (max - min);
  const r = Math.round(lerp(255, 0, t));
  const g = Math.round(lerp(0, 255, t));
  return `rgba(${r}, ${g}, 40, 0.35)`;
}

function drawQValueHeatmap(ctx: CanvasRenderingContext2D, data: QValueData, cellSize: number) {
  const entries = Object.entries(data.qValues);
  if (entries.length === 0) return;

  // Find min/max for normalization
  let allVals: number[] = [];
  for (const [, qv] of entries) {
    allVals.push(...Object.values(qv));
  }
  const min = Math.min(...allVals, 0);
  const max = Math.max(...allVals, 0.01);

  for (const [key, qv] of entries) {
    const [colStr, rowStr] = key.split(',');
    const col = parseInt(colStr);
    const row = parseInt(rowStr);
    const vals = Object.values(qv);
    const maxQ = Math.max(...vals);

    // Cell background color
    ctx.fillStyle = valueToColor(maxQ, min, max);
    ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);

    // Arrow for best action
    const actions = Object.keys(qv);
    const bestAction = actions[vals.indexOf(maxQ)];
    const cx = col * cellSize + cellSize / 2;
    const cy = row * cellSize + cellSize / 2;
    const arrowLen = cellSize * 0.3;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy);

    switch (bestAction) {
      case 'up': ctx.lineTo(cx, cy - arrowLen); break;
      case 'down': ctx.lineTo(cx, cy + arrowLen); break;
      case 'left': ctx.lineTo(cx - arrowLen, cy); break;
      case 'right': ctx.lineTo(cx + arrowLen, cy); break;
    }
    ctx.stroke();

    // Q-value text
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '6px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(maxQ.toFixed(1), cx, cy + cellSize * 0.4);
  }
}

function drawCNNActivation(ctx: CanvasRenderingContext2D, data: CNNData, cellSize: number) {
  for (const act of data.activations) {
    const col = data.robotCol + act.col;
    const row = data.robotRow + act.row;
    const strength = Math.max(0, Math.min(1, act.strength));

    ctx.fillStyle = `rgba(0, 149, 255, ${strength * 0.5})`;
    ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);

    // Activation number
    if (strength > 0.1) {
      ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + strength * 0.5})`;
      ctx.font = '7px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(
        strength.toFixed(2),
        col * cellSize + cellSize / 2,
        row * cellSize + cellSize / 2 + 3,
      );
    }
  }
}

function drawPolicyArrows(ctx: CanvasRenderingContext2D, data: PolicyData, cellSize: number) {
  const dirOffsets = [
    [0, -1],  // up
    [0, 1],   // down
    [-1, 0],  // left
    [1, 0],   // right
  ];

  for (const [key, probs] of Object.entries(data.policies)) {
    const [colStr, rowStr] = key.split(',');
    const col = parseInt(colStr);
    const row = parseInt(rowStr);
    const cx = col * cellSize + cellSize / 2;
    const cy = row * cellSize + cellSize / 2;
    const arrowLen = cellSize * 0.35;

    for (let i = 0; i < 4; i++) {
      const prob = probs[i];
      if (prob < 0.05) continue;

      const [dx, dy] = dirOffsets[i];
      ctx.strokeStyle = `rgba(179, 71, 217, ${prob})`;
      ctx.lineWidth = 1 + prob * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + dx * arrowLen, cy + dy * arrowLen);
      ctx.stroke();

      // Arrowhead
      const tipX = cx + dx * arrowLen;
      const tipY = cy + dy * arrowLen;
      ctx.fillStyle = `rgba(179, 71, 217, ${prob})`;
      ctx.beginPath();
      ctx.arc(tipX, tipY, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawTrustRegion(ctx: CanvasRenderingContext2D, data: TrustRegionData) {
  ctx.strokeStyle = data.clipped
    ? 'rgba(255, 0, 64, 0.6)'
    : 'rgba(0, 255, 65, 0.4)';
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.arc(data.robotX, data.robotY, data.radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Label
  ctx.fillStyle = data.clipped ? '#ff0040' : '#00ff41';
  ctx.font = '7px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(
    data.clipped ? 'CLIPPED' : 'TRUST REGION',
    data.robotX,
    data.robotY - data.radius - 6,
  );
}

export default function GhostOverlay({ type, data, gridSize, width, height }: GhostOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    switch (type) {
      case 'qvalue':
        drawQValueHeatmap(ctx, data as QValueData, gridSize);
        break;
      case 'cnn':
        drawCNNActivation(ctx, data as CNNData, gridSize);
        break;
      case 'policy':
        drawPolicyArrows(ctx, data as PolicyData, gridSize);
        break;
      case 'trust-region':
        drawTrustRegion(ctx, data as TrustRegionData);
        break;
    }
  }, [type, data, gridSize, width, height]);

  if (!data) return null;

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        imageRendering: 'pixelated',
      }}
    />
  );
}
