import '@xyflow/react/dist/style.css';

import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  type Node,
  type Edge,
} from '@xyflow/react';

import SkillNode from './SkillNode';
import type { SkillNodeState } from './SkillNode';
import { ROBOT_PARTS, PART_DEPENDENCIES, type RobotPartId } from '../../lib/robot-parts';
import { useProgressStore } from '../../stores/progress';

const nodeTypes = { skillNode: SkillNode };

const NODE_POSITIONS: Record<string, { x: number; y: number }> = {
  CHASSIS:                    { x: 400, y: 0 },
  BRAIN:                      { x: 400, y: 120 },
  EYES:                       { x: 200, y: 240 },
  METABOLISM:                 { x: 400, y: 240 },
  INSTINCT_CHIP:              { x: 600, y: 240 },
  RELATIONAL_REASONING_UNIT:  { x: 50,  y: 360 },
  GENERALIZATION_MODULE:      { x: 600, y: 360 },
  MOTOR_CORTEX:               { x: 200, y: 480 },
  VISUAL_CORTEX:              { x: 500, y: 480 },
  STABILITY_MODULE:           { x: 700, y: 480 },
  SAFETY_GOVERNOR:            { x: 200, y: 600 },
  LANGUAGE_PROCESSOR:         { x: 850, y: 240 },
  IMITATION_DRIVE:            { x: 850, y: 360 },
};

const LESSON_URLS: Record<string, string> = {
  CHASSIS: '/modules/01-foundations/01-intro-robotics',
  BRAIN: '/modules/01-foundations/02-what-is-nn',
  EYES: '/modules/01-foundations/03-intro-to-cnns',
  METABOLISM: '/modules/01-foundations/04-optimization',
};

function getPartState(
  partId: string,
  robotParts: Set<string>,
): SkillNodeState {
  if (robotParts.has(partId)) return 'completed';
  const deps = PART_DEPENDENCIES[partId] || [];
  const allDepsMet = deps.every((dep) => robotParts.has(dep));
  if (deps.length === 0 || allDepsMet) return 'available';
  return 'locked';
}

function BlueprintView() {
  const robotPartsArr = useProgressStore((s) => s.robotParts);
  const robotParts = useMemo(() => new Set(robotPartsArr ?? []), [robotPartsArr]);

  const nodes: Node[] = useMemo(() => {
    return (Object.keys(ROBOT_PARTS) as RobotPartId[]).map((partId) => {
      const part = ROBOT_PARTS[partId];
      const state = getPartState(partId, robotParts);
      const position = NODE_POSITIONS[partId] ?? { x: 0, y: 0 };
      const deps = PART_DEPENDENCIES[partId] || [];
      const requireNames = state === 'locked'
        ? deps.map((d) => ROBOT_PARTS[d as RobotPartId]?.name ?? d)
        : undefined;

      return {
        id: partId,
        type: 'skillNode',
        position,
        data: {
          partId,
          partName: part.name,
          icon: part.icon,
          color: part.color,
          state,
          isBonus: 'isBonus' in part && part.isBonus === true,
          lessonUrl: LESSON_URLS[partId],
          requires: requireNames,
        },
        draggable: false,
      };
    });
  }, [robotParts]);

  const edges: Edge[] = useMemo(() => {
    const result: Edge[] = [];
    for (const [target, sources] of Object.entries(PART_DEPENDENCIES)) {
      for (const source of sources) {
        result.push({
          id: `edge-${source}-${target}`,
          source,
          target,
          animated: true,
          style: { stroke: '#0095ff', strokeWidth: 2 },
        });
      }
    }
    return result;
  }, []);

  const onInit = useCallback((instance: { fitView: () => void }) => {
    instance.fitView();
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', minHeight: 600 }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onInit={onInit}
        fitView
        zoomOnScroll={false}
        panOnScroll
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#2a2a4a"
        />
      </ReactFlow>
    </div>
  );
}

export default BlueprintView;
