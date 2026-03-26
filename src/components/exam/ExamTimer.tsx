import { useState, useEffect, useRef } from 'react';

interface ExamTimerProps {
  totalSeconds: number;
  onTimeUp: () => void;
  isPaused?: boolean;
}

export default function ExamTimer({ totalSeconds, onTimeUp, isPaused = false }: ExamTimerProps) {
  const [remaining, setRemaining] = useState(totalSeconds);
  const onTimeUpRef = useRef(onTimeUp);
  onTimeUpRef.current = onTimeUp;

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onTimeUpRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const isLow = remaining < 600;
  const isCritical = remaining < 120;

  return (
    <div
      style={{
        fontFamily: 'var(--font-heading)',
        fontSize: '1rem',
        color: isCritical ? '#ff0040' : isLow ? '#ff0040' : '#ffffff',
        textAlign: 'center',
        animation: isLow ? 'pixel-pulse 1s ease-in-out infinite' : 'none',
      }}
    >
      {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
    </div>
  );
}
