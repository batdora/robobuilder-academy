import { useState } from 'react';
import { ROBOT_PARTS } from '../../lib/robot-parts';

interface Props {
  parts: string[];
  robotName: string;
  onNameChange?: (name: string) => void;
}

function getStage(partsCount: number): number {
  if (partsCount === 0) return 0;
  if (partsCount <= 3) return 1;
  if (partsCount <= 6) return 2;
  if (partsCount <= 9) return 3;
  if (partsCount <= 12) return 4;
  return 5;
}

const STAGE_LABELS = [
  'Empty Shell',
  'Basic Frame',
  'Learning Machine',
  'Smart Bot',
  'Advanced AI',
  'Master Robot',
];

export default function RobotDisplay({ parts, robotName, onNameChange }: Props) {
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState(robotName);
  const stage = getStage(parts.length);

  const has = (part: string) => parts.includes(part);

  const handleNameSave = () => {
    setEditing(false);
    if (onNameChange && nameInput.trim()) {
      onNameChange(nameInput.trim());
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Robot Name */}
      <div className="text-center">
        {editing ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
              className="bg-[#16213e] border-2 border-[#0095ff] text-[#00ff41] px-2 py-1 text-xs font-[family-name:var(--font-heading)] text-center w-40"
              maxLength={20}
              autoFocus
            />
            <button onClick={handleNameSave} className="text-[#00ff41] text-xs hover:text-white">OK</button>
          </div>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="font-[family-name:var(--font-heading)] text-[#00ff41] text-sm hover:text-white transition-colors"
            title="Click to rename"
          >
            {robotName} <span className="text-[#a0a0b0] text-[0.5rem]">[edit]</span>
          </button>
        )}
      </div>

      {/* Stage indicator */}
      <div className="text-[#ffd700] text-[0.6rem] font-[family-name:var(--font-heading)]">
        Stage {stage}: {STAGE_LABELS[stage]}
      </div>

      {/* ASCII Robot */}
      <div className="relative bg-[#0a0a1a] border-2 border-[#0f3460] rounded p-6 font-mono text-sm leading-6 select-none min-w-[280px]">
        <pre className="text-[#a0a0b0] text-center">
          {/* Antenna */}
          {has('LANGUAGE_PROCESSOR') && (
            <span className="text-[#b347d9]">{'      |||\n'}</span>
          )}

          {/* Head top */}
          {'  ┌─────────┐\n'}

          {/* Eyes row */}
          {'  │ '}
          {has('EYES') ? (
            <span className="text-[#00ff41]">{has('VISUAL_CORTEX') ? ' @   @ ' : ' o   o '}</span>
          ) : (
            '       '
          )}
          {'│\n'}

          {/* Brain row */}
          {'  │ '}
          {has('BRAIN') ? (
            <span className="text-[#ff6b9d]">{' ~~~~~ '}</span>
          ) : (
            '       '
          )}
          {'│\n'}

          {/* Mouth */}
          {'  │ '}
          {has('INSTINCT_CHIP') ? (
            <span className="text-[#0095ff]">{' ═════ '}</span>
          ) : (
            '  ───  '
          )}
          {'│\n'}

          {'  └────┬────┘\n'}

          {/* Neck */}
          {'       │\n'}

          {/* Body top */}
          {'  ┌────┴────┐\n'}

          {/* Body row 1 - metabolism */}
          {'  │ '}
          {has('METABOLISM') ? (
            <span className="text-[#ffd700]">{' [***] '}</span>
          ) : (
            '       '
          )}
          {'│\n'}

          {/* Body row 2 - generalization + stability */}
          {'  │'}
          {has('GENERALIZATION_MODULE') ? (
            <span className="text-[#b347d9]">{' G'}</span>
          ) : (
            '  '
          )}
          {'  '}
          {has('SAFETY_GOVERNOR') ? (
            <span className="text-[#ffd700]">{'S'}</span>
          ) : (
            ' '
          )}
          {'  '}
          {has('STABILITY_MODULE') ? (
            <span className="text-[#0095ff]">{'T'}</span>
          ) : (
            ' '
          )}
          {' │\n'}

          {'  └────┬────┘\n'}

          {/* Arms */}
          {has('MOTOR_CORTEX') ? (
            <span className="text-[#ff6b9d]">{'  ═╗   │   ╔═\n'}</span>
          ) : (
            '       │\n'
          )}

          {/* Legs */}
          {'     '}
          {has('IMITATION_DRIVE') ? (
            <span className="text-[#ff6b9d]">{'╔═╧═╗'}</span>
          ) : has('RELATIONAL_REASONING_UNIT') ? (
            <span className="text-[#0095ff]">{'┘   └'}</span>
          ) : (
            ' O O '
          )}
        </pre>

        {/* Part labels */}
        {parts.length > 0 && (
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {parts.map((partId) => {
              const part = ROBOT_PARTS[partId as keyof typeof ROBOT_PARTS];
              if (!part) return null;
              return (
                <span
                  key={partId}
                  className="text-[0.5rem] px-1 py-0.5 rounded"
                  style={{ color: part.color, borderColor: part.color, border: '1px solid' }}
                >
                  {part.icon} {part.name}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
