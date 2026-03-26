import { useState } from 'react';
import type { Question } from './QuestionCard';

interface QuizResultsProps {
  score: number;
  total: number;
  xpEarned: number;
  incorrectQuestions: Question[];
  onBack: () => void;
}

function getScoreColor(score: number, total: number): string {
  const pct = (score / total) * 100;
  if (pct >= 80) return '#00ff41';
  if (pct >= 60) return '#ffd700';
  return '#ff0040';
}

export default function QuizResults({
  score,
  total,
  xpEarned,
  incorrectQuestions,
  onBack,
}: QuizResultsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const scoreColor = getScoreColor(score, total);
  const pct = Math.round((score / total) * 100);

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      {/* Score display */}
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
          QUEST COMPLETE
        </p>

        <p
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '2.5rem',
            color: scoreColor,
            margin: '0.5rem 0',
            lineHeight: 1.2,
          }}
        >
          {score}/{total}
        </p>

        <p
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '0.65rem',
            color: '#a0a0b0',
            marginTop: '0.5rem',
          }}
        >
          {pct}% correct
        </p>

        {/* XP earned */}
        <div
          style={{
            marginTop: '1.5rem',
            display: 'inline-block',
          }}
        >
          <span
            className="animate-xp-pop"
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.25rem',
              color: '#ffd700',
              display: 'inline-block',
            }}
          >
            +{xpEarned} XP
          </span>
        </div>
      </div>

      {/* Incorrect questions review */}
      {incorrectQuestions.length > 0 && (
        <div
          className="nes-container is-dark with-title"
          style={{ padding: '1.5rem', marginBottom: '1.5rem' }}
        >
          <p className="title" style={{ fontSize: '0.65rem' }}>
            Review Mistakes
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {incorrectQuestions.map((q) => {
              const isExpanded = expandedId === q.id;
              return (
                <div
                  key={q.id}
                  style={{
                    border: '2px solid #a0a0b0',
                    padding: '0.75rem',
                    cursor: 'pointer',
                  }}
                  onClick={() => setExpandedId(isExpanded ? null : q.id)}
                >
                  <p
                    style={{
                      fontSize: '0.8rem',
                      color: '#ffffff',
                      margin: 0,
                      lineHeight: 1.6,
                    }}
                  >
                    {isExpanded ? '[-] ' : '[+] '}
                    {q.question}
                  </p>

                  {isExpanded && (
                    <div style={{ marginTop: '0.75rem', paddingLeft: '1rem' }}>
                      <p
                        style={{
                          fontSize: '0.75rem',
                          color: '#00ff41',
                          margin: '0 0 0.5rem 0',
                        }}
                      >
                        Correct:{' '}
                        <span style={{ color: '#ffffff' }}>
                          {q.options[q.correctIndex]}
                        </span>
                      </p>
                      <p
                        style={{
                          fontSize: '0.75rem',
                          color: '#a0a0b0',
                          margin: 0,
                          lineHeight: 1.6,
                        }}
                      >
                        {q.explanation}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Back button */}
      <div style={{ textAlign: 'center' }}>
        <button className="nes-btn is-primary" onClick={onBack}>
          Back to Lesson
        </button>
      </div>
    </div>
  );
}
