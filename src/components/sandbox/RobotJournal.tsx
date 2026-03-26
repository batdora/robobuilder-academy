/**
 * RobotJournal - Scrollable log panel showing the robot's "thoughts".
 * Styled as a retro terminal with green text on dark background.
 */
import { useEffect, useRef } from 'react';

export interface JournalEntry {
  timestamp: number;
  message: string;
  type: 'action' | 'reward' | 'collision' | 'learning' | 'system';
}

interface RobotJournalProps {
  entries: JournalEntry[];
  maxEntries?: number;
}

const TYPE_COLORS: Record<string, string> = {
  action: '#00ff41',
  reward: '#ffd700',
  collision: '#ff0040',
  learning: '#0095ff',
  system: '#b347d9',
};

const TYPE_PREFIX: Record<string, string> = {
  action: '[ACT]',
  reward: '[RWD]',
  collision: '[HIT]',
  learning: '[LRN]',
  system: '[SYS]',
};

export default function RobotJournal({ entries, maxEntries = 100 }: RobotJournalProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new entries
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries.length]);

  const displayEntries = entries.slice(-maxEntries);

  return (
    <div
      style={{
        background: '#0a0a14',
        border: '2px solid #00ff41',
        borderRadius: '4px',
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '0.5rem',
        lineHeight: '1.6',
        padding: '8px',
        height: '200px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        style={{
          color: '#00ff41',
          borderBottom: '1px solid #00ff4133',
          paddingBottom: '4px',
          marginBottom: '4px',
          fontSize: '0.55rem',
        }}
      >
        {'>'} ROBOT JOURNAL v1.0
      </div>

      {/* Scrollable log */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          scrollbarWidth: 'thin',
          scrollbarColor: '#00ff41 #0a0a14',
        }}
      >
        {displayEntries.length === 0 && (
          <div style={{ color: '#00ff4166' }}>
            Waiting for robot activity...
          </div>
        )}

        {displayEntries.map((entry, i) => (
          <div
            key={i}
            style={{
              color: TYPE_COLORS[entry.type] ?? '#00ff41',
              marginBottom: '2px',
              wordBreak: 'break-word',
            }}
          >
            <span style={{ opacity: 0.5 }}>
              {String(Math.floor(entry.timestamp)).padStart(5, '0')}
            </span>{' '}
            <span style={{ opacity: 0.8 }}>
              {TYPE_PREFIX[entry.type] ?? '[???]'}
            </span>{' '}
            {entry.message}
          </div>
        ))}

        {/* Blinking cursor */}
        <span
          style={{
            color: '#00ff41',
            animation: 'blink 1s step-end infinite',
          }}
        >
          _
        </span>
      </div>

      <style>{`
        @keyframes blink {
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
