interface StreakDisplayProps {
  streak: number;
  lastStudyDate: string;
}

function getStreakEmoji(streak: number): string {
  if (streak >= 8) return '\u{1F525}\u{1F525}\u{1F525}';
  if (streak >= 4) return '\u{1F525}\u{1F525}';
  return '\u{1F525}';
}

function getStreakColor(streak: number): string {
  if (streak >= 8) return '#ff0040';
  if (streak >= 4) return '#ff6600';
  return '#ffd700';
}

export default function StreakDisplay({ streak, lastStudyDate }: StreakDisplayProps) {
  const emoji = getStreakEmoji(streak);
  const color = getStreakColor(streak);

  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ fontSize: '1.5rem', margin: '0 0 0.25rem 0' }}>
        {emoji}
      </p>
      <p
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '0.75rem',
          color,
          margin: '0 0 0.25rem 0',
        }}
      >
        {streak} day streak!
      </p>
      {lastStudyDate && (
        <p
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '0.5rem',
            color: '#a0a0b0',
            margin: 0,
          }}
        >
          Last study: {lastStudyDate}
        </p>
      )}
    </div>
  );
}
