import { useState } from 'react';
import type { Question } from '../quiz/QuestionCard';

interface ModuleScore {
  moduleId: string;
  moduleName: string;
  correct: number;
  total: number;
  percent: number;
}

interface ExamResultsProps {
  questions: Question[];
  answers: Record<string, number>;
  timeTaken: number;
}

const moduleNames: Record<string, string> = {
  '01-foundations': 'ML & NN Foundations',
  '02-rl-foundations': 'RL Foundations',
  '03-deep-q-learning': 'Deep Q-Learning',
  '04-policy-optimization': 'Policy Optimization',
};

const moduleFirstLesson: Record<string, string> = {
  '01-foundations': '/modules/01-foundations/01-intro-robotics',
  '02-rl-foundations': '/modules/02-rl-foundations/01-mdp',
  '03-deep-q-learning': '/modules/03-deep-q-learning/01-function-approximation',
  '04-policy-optimization': '/modules/04-policy-optimization/01-policy-based-methods',
};

function getLetterGrade(pct: number): string {
  if (pct >= 90) return 'A';
  if (pct >= 80) return 'B';
  if (pct >= 70) return 'C';
  if (pct >= 60) return 'D';
  return 'F';
}

function getGradeColor(pct: number): string {
  if (pct >= 80) return '#00ff41';
  if (pct >= 60) return '#ffd700';
  return '#ff0040';
}

export default function ExamResults({ questions, answers, timeTaken }: ExamResultsProps) {
  const [expandedModule, setExpandedModule] = useState<string | null>(null);

  // Calculate scores
  const totalAnswered = Object.keys(answers).length;
  const totalCorrect = questions.filter(
    (q) => answers[q.id] !== undefined && answers[q.id] === q.correctIndex,
  ).length;
  const totalQuestions = questions.length;
  const overallPct = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  const letterGrade = getLetterGrade(overallPct);
  const gradeColor = getGradeColor(overallPct);

  // Per-module scores
  const moduleScores: ModuleScore[] = Object.entries(moduleNames).map(([moduleId, moduleName]) => {
    const moduleQs = questions.filter((q) => (q as Question & { moduleId?: string }).moduleId === moduleId);
    const correct = moduleQs.filter(
      (q) => answers[q.id] !== undefined && answers[q.id] === q.correctIndex,
    ).length;
    return {
      moduleId,
      moduleName,
      correct,
      total: moduleQs.length,
      percent: moduleQs.length > 0 ? Math.round((correct / moduleQs.length) * 100) : 0,
    };
  }).filter((m) => m.total > 0);

  const weakAreas = moduleScores.filter((m) => m.percent < 70);

  // Format time
  const minutes = Math.floor(timeTaken / 60);
  const seconds = timeTaken % 60;

  // XP reward
  const xpEarned = Math.round(totalCorrect * 15 + (overallPct >= 90 ? 100 : overallPct >= 70 ? 50 : 0));

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '1rem' }}>
      {/* Overall Score */}
      <div
        className="nes-container is-dark"
        style={{ textAlign: 'center', padding: '2rem', marginBottom: '1.5rem' }}
      >
        <p
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '0.75rem',
            color: '#a0a0b0',
            marginBottom: '1rem',
          }}
        >
          EXAM COMPLETE
        </p>

        <p
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '3rem',
            color: gradeColor,
            margin: '0.5rem 0',
            lineHeight: 1.2,
          }}
        >
          {letterGrade}
        </p>

        <p
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '1.25rem',
            color: gradeColor,
            margin: '0.5rem 0',
          }}
        >
          {totalCorrect}/{totalQuestions}
        </p>

        <p
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '0.65rem',
            color: '#a0a0b0',
            marginTop: '0.5rem',
          }}
        >
          {overallPct}% correct
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontFamily: 'var(--font-heading)', fontSize: '0.65rem', color: '#0095ff', margin: '0 0 0.25rem 0' }}>
              {minutes}m {seconds}s
            </p>
            <p style={{ fontFamily: 'var(--font-heading)', fontSize: '0.45rem', color: '#a0a0b0', margin: 0 }}>
              Time Taken
            </p>
          </div>
          <div>
            <p
              className="animate-xp-pop"
              style={{ fontFamily: 'var(--font-heading)', fontSize: '0.65rem', color: '#ffd700', margin: '0 0 0.25rem 0', display: 'inline-block' }}
            >
              +{xpEarned} XP
            </p>
            <p style={{ fontFamily: 'var(--font-heading)', fontSize: '0.45rem', color: '#a0a0b0', margin: 0 }}>
              Earned
            </p>
          </div>
        </div>
      </div>

      {/* Per-Module Score Breakdown */}
      <div
        className="nes-container is-dark with-title"
        style={{ padding: '1.5rem', marginBottom: '1.5rem' }}
      >
        <p className="title" style={{ fontSize: '0.65rem' }}>
          Module Breakdown
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {moduleScores.map((ms) => (
            <div key={ms.moduleId}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '0.5rem',
                    color: ms.percent < 70 ? '#ff0040' : '#ffffff',
                  }}
                >
                  {ms.moduleName}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '0.5rem',
                    color: getGradeColor(ms.percent),
                  }}
                >
                  {ms.correct}/{ms.total} ({ms.percent}%)
                </span>
              </div>
              <div
                style={{
                  width: '100%',
                  height: '16px',
                  backgroundColor: '#1a1a2e',
                  border: '2px solid #a0a0b0',
                }}
              >
                <div
                  style={{
                    width: `${ms.percent}%`,
                    height: '100%',
                    backgroundColor: getGradeColor(ms.percent),
                    transition: 'width 0.5s ease',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Radar chart using CSS pentagon */}
      {moduleScores.length >= 3 && (
        <div
          className="nes-container is-dark with-title"
          style={{ padding: '1.5rem', marginBottom: '1.5rem' }}
        >
          <p className="title" style={{ fontSize: '0.65rem' }}>
            Skill Radar
          </p>
          <div style={{ position: 'relative', width: '200px', height: '200px', margin: '0 auto' }}>
            {/* Background rings */}
            {[100, 75, 50, 25].map((ring) => (
              <div
                key={ring}
                style={{
                  position: 'absolute',
                  top: `${50 - ring / 2}%`,
                  left: `${50 - ring / 2}%`,
                  width: `${ring}%`,
                  height: `${ring}%`,
                  border: '1px solid rgba(160, 160, 176, 0.2)',
                  borderRadius: '50%',
                }}
              />
            ))}

            {/* Module score dots positioned around the circle */}
            {moduleScores.map((ms, i) => {
              const angle = (2 * Math.PI * i) / moduleScores.length - Math.PI / 2;
              const radius = (ms.percent / 100) * 80;
              const x = 50 + radius * Math.cos(angle);
              const y = 50 + radius * Math.sin(angle);
              return (
                <div
                  key={ms.moduleId}
                  style={{
                    position: 'absolute',
                    left: `${x}%`,
                    top: `${y}%`,
                    width: '8px',
                    height: '8px',
                    backgroundColor: getGradeColor(ms.percent),
                    transform: 'translate(-50%, -50%)',
                    zIndex: 1,
                  }}
                  title={`${ms.moduleName}: ${ms.percent}%`}
                />
              );
            })}

            {/* Module labels */}
            {moduleScores.map((ms, i) => {
              const angle = (2 * Math.PI * i) / moduleScores.length - Math.PI / 2;
              const x = 50 + 48 * Math.cos(angle);
              const y = 50 + 48 * Math.sin(angle);
              return (
                <p
                  key={`label-${ms.moduleId}`}
                  style={{
                    position: 'absolute',
                    left: `${x}%`,
                    top: `${y}%`,
                    transform: 'translate(-50%, -50%)',
                    fontFamily: 'var(--font-heading)',
                    fontSize: '0.35rem',
                    color: '#a0a0b0',
                    whiteSpace: 'nowrap',
                    margin: 0,
                  }}
                >
                  M{i + 1}
                </p>
              );
            })}
          </div>
        </div>
      )}

      {/* Weak Areas */}
      {weakAreas.length > 0 && (
        <div
          className="nes-container is-dark with-title"
          style={{ padding: '1.5rem', marginBottom: '1.5rem' }}
        >
          <p className="title" style={{ fontSize: '0.65rem', color: '#ff0040' }}>
            Weak Areas
          </p>
          <p style={{ fontSize: '0.75rem', color: '#a0a0b0', marginBottom: '1rem', lineHeight: 1.7 }}>
            These modules scored below 70%. Consider reviewing them:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {weakAreas.map((wa) => (
              <a
                key={wa.moduleId}
                href={moduleFirstLesson[wa.moduleId] ?? '/'}
                style={{ textDecoration: 'none' }}
              >
                <div
                  style={{
                    border: '2px solid #ff0040',
                    padding: '0.75rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ fontFamily: 'var(--font-heading)', fontSize: '0.55rem', color: '#ffffff' }}>
                    {wa.moduleName}
                  </span>
                  <span style={{ fontFamily: 'var(--font-heading)', fontSize: '0.55rem', color: '#ff0040' }}>
                    {wa.percent}% &rarr;
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Question Review */}
      <div
        className="nes-container is-dark with-title"
        style={{ padding: '1.5rem', marginBottom: '1.5rem' }}
      >
        <p className="title" style={{ fontSize: '0.65rem' }}>
          Question Review
        </p>

        {moduleScores.map((ms) => {
          const moduleQs = questions.filter(
            (q) => (q as Question & { moduleId?: string }).moduleId === ms.moduleId,
          );
          if (moduleQs.length === 0) return null;
          const isExpanded = expandedModule === ms.moduleId;

          return (
            <div key={ms.moduleId} style={{ marginBottom: '0.75rem' }}>
              <div
                onClick={() => setExpandedModule(isExpanded ? null : ms.moduleId)}
                style={{
                  border: '2px solid #a0a0b0',
                  padding: '0.75rem',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ fontFamily: 'var(--font-heading)', fontSize: '0.55rem', color: '#ffffff' }}>
                  {isExpanded ? '[-]' : '[+]'} {ms.moduleName}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '0.55rem',
                    color: getGradeColor(ms.percent),
                  }}
                >
                  {ms.correct}/{ms.total}
                </span>
              </div>

              {isExpanded && (
                <div style={{ paddingLeft: '1rem', paddingTop: '0.5rem' }}>
                  {moduleQs.map((q, idx) => {
                    const userAnswer = answers[q.id];
                    const isCorrect = userAnswer !== undefined && userAnswer === q.correctIndex;
                    const wasAnswered = userAnswer !== undefined;

                    return (
                      <div
                        key={q.id}
                        style={{
                          padding: '0.75rem 0',
                          borderBottom: idx < moduleQs.length - 1 ? '1px solid rgba(160,160,176,0.2)' : 'none',
                        }}
                      >
                        <p style={{ fontSize: '0.75rem', color: '#ffffff', margin: '0 0 0.5rem 0', lineHeight: 1.6 }}>
                          <span style={{ color: isCorrect ? '#00ff41' : '#ff0040', marginRight: '0.5rem' }}>
                            {isCorrect ? '[OK]' : wasAnswered ? '[X]' : '[--]'}
                          </span>
                          {q.question}
                        </p>
                        {!isCorrect && (
                          <p style={{ fontSize: '0.7rem', color: '#a0a0b0', margin: '0 0 0.25rem 0', paddingLeft: '1rem' }}>
                            Correct: <span style={{ color: '#00ff41' }}>{q.options[q.correctIndex]}</span>
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Back button */}
      <div style={{ textAlign: 'center', paddingBottom: '2rem' }}>
        <a href="/">
          <button className="nes-btn is-primary">Back to Blueprint</button>
        </a>
      </div>
    </div>
  );
}
