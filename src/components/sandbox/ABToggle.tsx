/**
 * ABToggle - Side panel showing toggle switches for each installed robot part.
 * Uses NES.css checkbox styling. Toggling parts adds/removes ECS components.
 */
import { useProgressStore } from '../../stores/progress';
import { PART_LABELS } from './ecs/components';

interface ABToggleProps {
  onToggle?: (part: string, active: boolean) => void;
}

const PART_ICONS: Record<string, string> = {
  BRAIN: '(B)',
  EYES: '(E)',
  INSTINCT_CHIP: '(I)',
  GENERALIZATION: '(G)',
  VISUAL_CORTEX: '(V)',
  STABILITY_MODULE: '(S)',
  MOTOR_CORTEX: '(M)',
  SAFETY_GOVERNOR: '(P)',
  LANGUAGE_PROCESSOR: '(L)',
  RELATIONAL_REASONING: '(R)',
  IMITATION_DRIVE: '(D)',
};

export default function ABToggle({ onToggle }: ABToggleProps) {
  const robotParts = useProgressStore((s) => s.robotParts);
  const activeParts = useProgressStore((s) => s.activeParts);
  const toggleRobotPart = useProgressStore((s) => s.toggleRobotPart);

  const handleToggle = (part: string) => {
    const willBeActive = !activeParts.includes(part);
    toggleRobotPart(part);
    onToggle?.(part, willBeActive);
  };

  if (robotParts.length === 0) {
    return (
      <div
        style={{
          background: '#16213e',
          border: '2px solid #0095ff44',
          borderRadius: '4px',
          padding: '12px',
          fontFamily: '"Press Start 2P", monospace',
          fontSize: '0.5rem',
          color: '#a0a0b0',
        }}
      >
        <div style={{ color: '#0095ff', marginBottom: '8px', fontSize: '0.55rem' }}>
          ROBOT PARTS
        </div>
        <div style={{ color: '#a0a0b066' }}>
          No parts installed yet. Complete lessons to unlock robot capabilities.
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: '#16213e',
        border: '2px solid #0095ff44',
        borderRadius: '4px',
        padding: '12px',
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '0.5rem',
      }}
    >
      <div style={{ color: '#0095ff', marginBottom: '8px', fontSize: '0.55rem' }}>
        ROBOT PARTS
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {robotParts.map((part) => {
          const isActive = activeParts.includes(part);
          const label = PART_LABELS[part] ?? part;
          const icon = PART_ICONS[part] ?? '(?)';

          return (
            <label
              key={part}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                opacity: isActive ? 1 : 0.4,
                transition: 'opacity 0.2s',
                color: isActive ? '#00ff41' : '#a0a0b0',
              }}
            >
              <input
                type="checkbox"
                className="nes-checkbox is-dark"
                checked={isActive}
                onChange={() => handleToggle(part)}
                style={{ marginRight: '4px' }}
              />
              <span style={{ color: '#ffd700', minWidth: '24px' }}>{icon}</span>
              <span>{label}</span>
            </label>
          );
        })}
      </div>

      <div
        style={{
          marginTop: '12px',
          paddingTop: '8px',
          borderTop: '1px solid #0095ff22',
          color: '#a0a0b066',
          fontSize: '0.45rem',
        }}
      >
        Toggle parts to compare robot behavior with and without each capability.
      </div>
    </div>
  );
}
