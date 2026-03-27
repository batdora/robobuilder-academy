/**
 * CurriculumList — Shows all modules and their lessons with completion status.
 * Provides direct navigation to any lesson.
 */
import { useProgressStore } from '../../stores/progress';

interface Lesson {
  id: string;
  lessonId: string;
  title: string;
  moduleId: string;
  order: number;
  robotPart?: string;
  xpReward: number;
}

interface CurriculumListProps {
  lessons: Lesson[];
}

const MODULE_NAMES: Record<string, string> = {
  '01-foundations': 'Foundations',
  '02-rl-foundations': 'RL Foundations',
  '03-deep-q-learning': 'Deep Q-Learning',
  '04-policy-optimization': 'Policy Optimization',
  '05-advanced-architectures': 'Advanced Architectures',
  '06-robot-learning': 'Robot Learning',
};

const MODULE_COLORS: Record<string, string> = {
  '01-foundations': '#888',
  '02-rl-foundations': '#0095ff',
  '03-deep-q-learning': '#b347d9',
  '04-policy-optimization': '#ff6b9d',
  '05-advanced-architectures': '#ffd700',
  '06-robot-learning': '#00ff41',
};

export default function CurriculumList({ lessons }: CurriculumListProps) {
  const completedLessons = useProgressStore((s) => s.completedLessons);

  // Group by module
  const modules: Record<string, Lesson[]> = {};
  for (const lesson of lessons) {
    if (!modules[lesson.moduleId]) modules[lesson.moduleId] = [];
    modules[lesson.moduleId].push(lesson);
  }
  // Sort lessons within each module
  for (const mod of Object.keys(modules)) {
    modules[mod].sort((a, b) => a.order - b.order);
  }

  const sortedModuleIds = Object.keys(modules).sort();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h2
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '0.75rem',
          color: '#0095ff',
          margin: 0,
        }}
      >
        CURRICULUM
      </h2>

      {sortedModuleIds.map((moduleId) => {
        const moduleLessons = modules[moduleId];
        const completedCount = moduleLessons.filter((l) =>
          completedLessons.includes(l.lessonId)
        ).length;
        const totalCount = moduleLessons.length;
        const pct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
        const color = MODULE_COLORS[moduleId] || '#0095ff';

        return (
          <div
            key={moduleId}
            style={{
              background: '#16213e',
              border: `2px solid ${color}33`,
              borderRadius: '4px',
              padding: '12px',
            }}
          >
            {/* Module header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '0.55rem',
                  color,
                }}
              >
                {MODULE_NAMES[moduleId] || moduleId}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '0.45rem',
                  color: '#a0a0b0',
                }}
              >
                {completedCount}/{totalCount}
              </span>
            </div>

            {/* Progress bar */}
            <div
              style={{
                height: '4px',
                background: '#0f3460',
                borderRadius: '2px',
                marginBottom: '10px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${pct}%`,
                  background: color,
                  transition: 'width 0.3s',
                }}
              />
            </div>

            {/* Lesson list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {moduleLessons.map((lesson, i) => {
                const isComplete = completedLessons.includes(lesson.lessonId);
                return (
                  <a
                    key={lesson.lessonId}
                    href={`/modules/${lesson.id}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '5px 8px',
                      borderRadius: '2px',
                      textDecoration: 'none',
                      fontSize: '0.7rem',
                      fontFamily: 'var(--font-body)',
                      color: isComplete ? '#00ff41' : '#e0e0e8',
                      background: isComplete ? 'rgba(0,255,65,0.05)' : 'transparent',
                      transition: 'background 0.15s',
                    }}
                    onMouseOver={(e) => {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(0,149,255,0.1)';
                    }}
                    onMouseOut={(e) => {
                      (e.currentTarget as HTMLElement).style.background = isComplete
                        ? 'rgba(0,255,65,0.05)'
                        : 'transparent';
                    }}
                  >
                    <span
                      style={{
                        width: '16px',
                        height: '16px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.55rem',
                        flexShrink: 0,
                        color: isComplete ? '#00ff41' : '#a0a0b066',
                      }}
                    >
                      {isComplete ? '✓' : `${i + 1}`}
                    </span>
                    <span>{lesson.title}</span>
                    {lesson.robotPart && (
                      <span
                        style={{
                          marginLeft: 'auto',
                          fontSize: '0.55rem',
                          color: '#ffd700',
                          flexShrink: 0,
                        }}
                      >
                        🔧
                      </span>
                    )}
                  </a>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
