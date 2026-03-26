import { Handle, Position, type NodeProps } from '@xyflow/react';
import NodeTooltip from './NodeTooltip';

export type SkillNodeState = 'locked' | 'available' | 'in_progress' | 'completed';

export interface SkillNodeData {
  partId: string;
  partName: string;
  icon: string;
  color: string;
  state: SkillNodeState;
  isBonus: boolean;
  lessonUrl?: string;
  requires?: string[];
  [key: string]: unknown;
}

function SkillNode({ data }: NodeProps) {
  const {
    partName,
    icon,
    color,
    state,
    isBonus,
    lessonUrl,
    requires,
  } = data as SkillNodeData;

  const isLocked = state === 'locked';
  const isAvailable = state === 'available';
  const isInProgress = state === 'in_progress';
  const isCompleted = state === 'completed';

  // Background color based on state
  let bgColor = '#444';
  if (isCompleted) bgColor = color;
  else if (isAvailable) bgColor = '#1a1a2e';
  else if (isInProgress) bgColor = '#1a1a2e';

  // Border style
  let borderColor = '#555';
  if (isAvailable) borderColor = '#00ff41';
  else if (isInProgress) borderColor = color;
  else if (isCompleted) borderColor = color;
  if (isBonus) borderColor = '#b347d9';

  // Clip-path for bonus hexagonal shape
  const clipPath = isBonus
    ? 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)'
    : undefined;

  const nodeStyle: React.CSSProperties = {
    width: 120,
    height: 80,
    backgroundColor: bgColor,
    border: `3px solid ${borderColor}`,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    opacity: isLocked ? 0.5 : 1,
    cursor: lessonUrl ? 'pointer' : 'default',
    imageRendering: 'pixelated',
    position: 'relative',
    transition: 'box-shadow 0.3s ease',
    ...(clipPath ? { clipPath, width: 140, height: 100 } : {}),
  };

  const nameStyle: React.CSSProperties = {
    fontFamily: '"Press Start 2P", cursive',
    fontSize: '0.45rem',
    color: isCompleted ? '#1a1a2e' : '#ffffff',
    textAlign: 'center',
    lineHeight: 1.4,
    maxWidth: '100%',
    overflow: 'hidden',
    padding: '0 4px',
  };

  const iconStyle: React.CSSProperties = {
    fontSize: '1.25rem',
    lineHeight: 1,
  };

  const handleClick = () => {
    if (lessonUrl) {
      window.location.href = lessonUrl;
    }
  };

  // Status indicator overlay
  const renderStatusIndicator = () => {
    if (isLocked) {
      return <span style={{ fontSize: '1rem' }}>&#x1F512;</span>;
    }
    if (isCompleted) {
      return (
        <span
          style={{
            position: 'absolute',
            top: 4,
            right: 4,
            fontSize: '0.7rem',
            color: '#1a1a2e',
          }}
        >
          &#x2714;
        </span>
      );
    }
    if (isInProgress) {
      return (
        <div
          style={{
            position: 'absolute',
            bottom: 4,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '60%',
            height: 4,
            backgroundColor: '#333',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: '50%',
              height: '100%',
              backgroundColor: color,
            }}
          />
        </div>
      );
    }
    return null;
  };

  const nodeContent = (
    <div
      className={isAvailable ? 'animate-pixel-glow' : undefined}
      style={nodeStyle}
      onClick={handleClick}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: '#0095ff', width: 8, height: 8, border: 'none' }}
      />

      {isLocked ? (
        renderStatusIndicator()
      ) : (
        <>
          <span style={iconStyle}>{icon}</span>
          <span style={nameStyle}>{partName}</span>
          {renderStatusIndicator()}
        </>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#0095ff', width: 8, height: 8, border: 'none' }}
      />
    </div>
  );

  // Wrap locked nodes with tooltip showing requirements
  if (isLocked && requires && requires.length > 0) {
    return (
      <NodeTooltip content={`Requires: ${requires.join(', ')}`}>
        {nodeContent}
      </NodeTooltip>
    );
  }

  return nodeContent;
}

export default SkillNode;
