import { useMemo } from 'react';
import { useProgressStore } from '../../stores/progress';
import { calculateLevel, LEVEL_TITLES } from '../../lib/xp';
import RobotDisplay from './RobotDisplay';
import ModuleRadar from './ModuleRadar';
import StudyCalendar from './StudyCalendar';

const MODULE_IDS = [
  '01-foundations',
  '02-rl-foundations',
  '03-deep-q-learning',
  '04-policy-optimization',
  '05-advanced-architectures',
  '06-robot-learning',
] as const;

const MODULE_NAMES: Record<string, string> = {
  '01-foundations': 'Foundations',
  '02-rl-foundations': 'RL Foundations',
  '03-deep-q-learning': 'Deep Q-Learning',
  '04-policy-optimization': 'Policy Optimization',
  '05-advanced-architectures': 'Advanced Architectures',
  '06-robot-learning': 'Robot Learning',
};

const MODULE_LESSON_COUNT: Record<string, number> = {
  '01-foundations': 4,
  '02-rl-foundations': 5,
  '03-deep-q-learning': 10,
  '04-policy-optimization': 9,
  '05-advanced-architectures': 10,
  '06-robot-learning': 6,
};

const TOTAL_LESSONS = Object.values(MODULE_LESSON_COUNT).reduce((a, b) => a + b, 0);

export default function ProgressDashboard() {
  const {
    totalXP,
    moduleXP,
    completedLessons,
    robotParts,
    robotName,
    setRobotName,
    studyStreak,
    bestScores,
    quizAttempts,
  } = useProgressStore();

  const { level } = calculateLevel(totalXP);
  const title = LEVEL_TITLES[Math.min(level, LEVEL_TITLES.length - 1)];

  // Build studyDates from quizAttempts dates (simplified - real app would track daily XP)
  const studyDates = useMemo(() => {
    const dates: Record<string, number> = {};
    Object.values(quizAttempts).forEach((attempt) => {
      const day = attempt.date.split('T')[0];
      dates[day] = (dates[day] ?? 0) + attempt.score * 10;
    });
    // Add today if there's a streak
    if (studyStreak > 0) {
      const today = new Date().toISOString().split('T')[0];
      if (!dates[today]) dates[today] = 10;
    }
    return dates;
  }, [quizAttempts, studyStreak]);

  // Average quiz score
  const quizScores = Object.values(quizAttempts);
  const avgQuizScore =
    quizScores.length > 0
      ? Math.round(
          (quizScores.reduce((sum, a) => sum + (a.score / a.total) * 100, 0) /
            quizScores.length),
        )
      : 0;

  // Weak areas: modules where best quiz score < 70%
  const weakAreas = useMemo(() => {
    const weak: { moduleId: string; score: number }[] = [];
    for (const moduleId of MODULE_IDS) {
      const moduleQuizzes = Object.entries(bestScores).filter(([key]) =>
        key.startsWith(moduleId),
      );
      if (moduleQuizzes.length === 0) continue;
      const avg =
        moduleQuizzes.reduce((sum, [, score]) => sum + score, 0) /
        moduleQuizzes.length;
      // Assuming quizzes have ~5 questions, normalize
      const quizEntries = moduleQuizzes.map(([key]) => quizAttempts[key]).filter(Boolean);
      if (quizEntries.length === 0) continue;
      const pct =
        quizEntries.reduce((sum, a) => sum + (a.score / a.total) * 100, 0) /
        quizEntries.length;
      if (pct < 70) {
        weak.push({ moduleId, score: Math.round(pct) });
      }
    }
    return weak;
  }, [bestScores, quizAttempts]);

  // Quiz scores per module for bar chart
  const moduleQuizScores = useMemo(() => {
    return MODULE_IDS.map((moduleId) => {
      const entries = Object.entries(quizAttempts).filter(([key]) =>
        key.startsWith(moduleId),
      );
      if (entries.length === 0) return { moduleId, pct: 0, hasData: false };
      const pct = Math.round(
        entries.reduce((sum, [, a]) => sum + (a.score / a.total) * 100, 0) /
          entries.length,
      );
      return { moduleId, pct, hasData: true };
    });
  }, [quizAttempts]);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <h1 className="text-[#00ff41] text-center">Progress Dashboard</h1>

      {/* Robot Full View */}
      <div className="nes-container is-dark with-title">
        <p className="title" style={{ backgroundColor: '#16213e', color: '#00ff41' }}>
          Your Robot
        </p>
        <RobotDisplay
          parts={robotParts}
          robotName={robotName}
          onNameChange={setRobotName}
        />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="Total XP" value={totalXP.toLocaleString()} color="#ffd700" large />
        <StatCard label="Level" value={`${level} - ${title}`} color="#0095ff" />
        <StatCard
          label="Lessons"
          value={`${completedLessons.length} / ${TOTAL_LESSONS}`}
          color="#00ff41"
        />
        <StatCard label="Streak" value={`${studyStreak} days`} color="#ff6b9d" />
        <StatCard label="Avg Quiz" value={`${avgQuizScore}%`} color="#b347d9" />
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Radar Chart */}
        <div className="nes-container is-dark with-title">
          <p className="title" style={{ backgroundColor: '#16213e', color: '#00ff41' }}>
            Module Mastery
          </p>
          <ModuleRadar moduleScores={moduleXP} />
        </div>

        {/* Study Calendar */}
        <div className="nes-container is-dark with-title">
          <p className="title" style={{ backgroundColor: '#16213e', color: '#00ff41' }}>
            Study Activity (30 days)
          </p>
          <StudyCalendar studyDates={studyDates} />
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Weak Areas */}
        <div className="nes-container is-dark with-title">
          <p className="title" style={{ backgroundColor: '#16213e', color: '#00ff41' }}>
            Weak Areas
          </p>
          {weakAreas.length === 0 ? (
            <p className="text-[#00ff41] text-xs font-[family-name:var(--font-heading)] text-center py-4">
              No weak areas detected! Keep it up!
            </p>
          ) : (
            <div className="space-y-2">
              {weakAreas.map(({ moduleId, score }) => (
                <a
                  key={moduleId}
                  href={`/modules/${moduleId}/01`}
                  className="flex items-center justify-between p-2 bg-[#1a1a2e] rounded hover:bg-[#0f3460] transition-colors"
                >
                  <span className="text-[#ff0040] text-xs font-[family-name:var(--font-heading)]">
                    {MODULE_NAMES[moduleId]}
                  </span>
                  <span className="text-[#a0a0b0] text-xs">{score}%</span>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Quiz Scores per Module */}
        <div className="nes-container is-dark with-title">
          <p className="title" style={{ backgroundColor: '#16213e', color: '#00ff41' }}>
            Quiz Scores
          </p>
          <div className="space-y-3">
            {moduleQuizScores.map(({ moduleId, pct, hasData }) => {
              const barColor =
                pct > 80 ? '#00ff41' : pct > 60 ? '#ffd700' : '#ff0040';
              return (
                <div key={moduleId}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[0.5rem] text-[#a0a0b0] font-[family-name:var(--font-heading)]">
                      {MODULE_NAMES[moduleId]}
                    </span>
                    <span
                      className="text-[0.5rem] font-[family-name:var(--font-heading)]"
                      style={{ color: hasData ? barColor : '#a0a0b0' }}
                    >
                      {hasData ? `${pct}%` : '--'}
                    </span>
                  </div>
                  <div className="w-full h-3 bg-[#1a1a2e] rounded overflow-hidden">
                    <div
                      className="h-full rounded transition-all duration-500"
                      style={{
                        width: `${hasData ? pct : 0}%`,
                        backgroundColor: barColor,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
  large,
}: {
  label: string;
  value: string;
  color: string;
  large?: boolean;
}) {
  return (
    <div className="bg-[#16213e] border-2 border-[#0f3460] rounded p-3 text-center">
      <div
        className={`font-[family-name:var(--font-heading)] ${large ? 'text-sm' : 'text-[0.55rem]'}`}
        style={{ color }}
      >
        {value}
      </div>
      <div className="text-[#a0a0b0] text-[0.45rem] font-[family-name:var(--font-heading)] mt-1">
        {label}
      </div>
    </div>
  );
}
