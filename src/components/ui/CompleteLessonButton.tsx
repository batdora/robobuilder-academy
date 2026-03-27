import { useState, useEffect, useCallback } from 'react';
import { useProgressStore } from '../../stores/progress';
import { ROBOT_PARTS } from '../../lib/robot-parts';
import { JOURNAL_ENTRIES } from '../../lib/robot-parts';
import PixelButton from './PixelButton';

interface CompleteLessonButtonProps {
  lessonId: string;
  robotPart: string;
  xpReward: number;
  moduleId: string;
  nextLessonUrl?: string;
  nextLessonTitle?: string;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  dx: number;
  dy: number;
}

const BURST_COLORS = ['#00ff41', '#0095ff', '#ffd700', '#ff0040', '#b347d9'];

export default function CompleteLessonButton({
  lessonId,
  robotPart,
  xpReward,
  moduleId,
  nextLessonUrl,
  nextLessonTitle,
}: CompleteLessonButtonProps) {
  const completeLesson = useProgressStore((s) => s.completeLesson);
  const completedLessons = useProgressStore((s) => s.completedLessons);
  const isAlreadyComplete = completedLessons.includes(lessonId);

  const [stage, setStage] = useState<'idle' | 'celebrating' | 'journal' | 'done'>(
    isAlreadyComplete ? 'done' : 'idle'
  );
  const [particles, setParticles] = useState<Particle[]>([]);

  const hasRobotPart = robotPart && robotPart.length > 0;
  const partInfo = hasRobotPart ? ROBOT_PARTS[robotPart as keyof typeof ROBOT_PARTS] : null;
  const journalEntry = hasRobotPart ? JOURNAL_ENTRIES[robotPart] : null;

  const spawnParticles = useCallback(() => {
    const newParticles: Particle[] = Array.from({ length: 24 }, (_, i) => {
      const angle = (Math.PI * 2 * i) / 24;
      const speed = 2 + Math.random() * 3;
      return {
        id: i,
        x: 0,
        y: 0,
        color: BURST_COLORS[i % BURST_COLORS.length],
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed,
      };
    });
    setParticles(newParticles);
  }, []);

  useEffect(() => {
    if (particles.length === 0) return;
    const interval = setInterval(() => {
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.dx,
            y: p.y + p.dy,
            dy: p.dy + 0.1,
          }))
          .filter((p) => Math.abs(p.y) < 120)
      );
    }, 30);
    return () => clearInterval(interval);
  }, [particles.length]);

  const handleComplete = () => {
    completeLesson(lessonId, robotPart || '__NONE__', xpReward, moduleId);
    setStage('celebrating');
    spawnParticles();
    // Skip journal if no robot part to show
    setTimeout(() => setStage(journalEntry ? 'journal' : 'done'), 1800);
  };

  if (stage === 'idle') {
    return (
      <PixelButton variant="success" size="lg" onClick={handleComplete}>
        Complete Lesson (+{xpReward} XP)
      </PixelButton>
    );
  }

  if (stage === 'celebrating') {
    return (
      <div className="relative flex flex-col items-center gap-4 py-8">
        <div className="relative">
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute w-2 h-2"
              style={{
                left: `calc(50% + ${p.x}px)`,
                top: `calc(50% + ${p.y}px)`,
                backgroundColor: p.color,
                imageRendering: 'pixelated',
              }}
            />
          ))}
          <div className="text-4xl animate-bounce">{partInfo?.icon ?? '✅'}</div>
        </div>
        <p className="font-[family-name:var(--font-heading)] text-[#ffd700] text-sm animate-pixel-pulse">
          +{xpReward} XP
        </p>
        {partInfo && (
          <p className="font-[family-name:var(--font-heading)] text-[#00ff41] text-xs">
            {partInfo.name} Installed!
          </p>
        )}
      </div>
    );
  }

  if (stage === 'journal' && journalEntry) {
    return (
      <div className="flex flex-col items-center gap-6 py-4 max-w-lg mx-auto">
        <div className="nes-container is-dark with-title w-full">
          <p className="title" style={{ fontSize: '0.5rem' }}>
            Robot's Journal
          </p>
          <p className="text-sm text-[#a0a0b0] italic leading-relaxed">
            "{journalEntry}"
          </p>
        </div>
        <PixelButton
          variant="primary"
          size="md"
          onClick={() => setStage('done')}
        >
          Continue
        </PixelButton>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <p className="font-[family-name:var(--font-heading)] text-[#00ff41] text-xs">
        Lesson Complete
      </p>
      <div className="flex gap-3 flex-wrap justify-center">
        {nextLessonUrl && (
          <a
            href={nextLessonUrl}
            className="nes-btn is-success font-[family-name:var(--font-heading)]"
            style={{ fontSize: '0.55rem' }}
          >
            Next: {nextLessonTitle || 'Next Lesson'} →
          </a>
        )}
        <a
          href="/"
          className="nes-btn is-primary font-[family-name:var(--font-heading)]"
          style={{ fontSize: '0.55rem' }}
        >
          Blueprint
        </a>
      </div>
    </div>
  );
}
