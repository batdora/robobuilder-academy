import { useState, useCallback, useMemo } from 'react';
import type { Question } from '../quiz/QuestionCard';
import ExamTimer from './ExamTimer';
import ExamResults from './ExamResults';

// Import all quiz data from modules 1-4
import quiz01 from '../../content/quizzes/01-intro-robotics-quiz.json';
import quiz02 from '../../content/quizzes/02-rl-foundations-quiz.json';
import quiz03 from '../../content/quizzes/03-deep-q-learning-quiz.json';
import quiz04 from '../../content/quizzes/04-policy-optimization-quiz.json';
import finalExamPool from '../../content/quizzes/final-exam.json';

type ExamQuestion = Question & { moduleId: string };

function extractQuestions(quiz: unknown, moduleId: string): ExamQuestion[] {
  let raw: Question[];
  if (Array.isArray(quiz)) {
    raw = quiz as Question[];
  } else if (typeof quiz === 'object' && quiz !== null && 'questions' in quiz) {
    raw = (quiz as { questions: Question[] }).questions;
  } else {
    raw = [];
  }
  return raw.map((q) => ({ ...q, moduleId }));
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function buildExamQuestions(): ExamQuestion[] {
  // First, include all final exam questions (integrative, cross-module)
  const finalQs = extractQuestions(finalExamPool, '').map((q) => {
    // Parse moduleId from question id prefix (e.g., "final-m1-q01" -> "01-foundations")
    const match = q.id.match(/final-m(\d)/);
    if (match) {
      const moduleNum = match[1];
      const moduleMap: Record<string, string> = {
        '1': '01-foundations',
        '2': '02-rl-foundations',
        '3': '03-deep-q-learning',
        '4': '04-policy-optimization',
      };
      return { ...q, moduleId: moduleMap[moduleNum] ?? q.moduleId };
    }
    return q;
  });

  // Also load per-module quiz questions as supplementary
  const m1 = extractQuestions(quiz01, '01-foundations');
  const m2 = extractQuestions(quiz02, '02-rl-foundations');
  const m3 = extractQuestions(quiz03, '03-deep-q-learning');
  const m4 = extractQuestions(quiz04, '04-policy-optimization');

  // Combine: all final exam questions + random selection from module quizzes to reach 45-50
  const allFinal = shuffleArray(finalQs);
  const target = 45;

  if (allFinal.length >= target) {
    return allFinal.slice(0, target);
  }

  // Fill remaining from module quizzes (evenly)
  const remaining = target - allFinal.length;
  const perModule = Math.ceil(remaining / 4);
  const supplementary = [
    ...shuffleArray(m1).slice(0, perModule),
    ...shuffleArray(m2).slice(0, perModule),
    ...shuffleArray(m3).slice(0, perModule),
    ...shuffleArray(m4).slice(0, perModule),
  ];

  const usedIds = new Set(allFinal.map((q) => q.id));
  const filtered = supplementary.filter((q) => !usedIds.has(q.id));

  return shuffleArray([...allFinal, ...filtered]).slice(0, target);
}

type ExamState = 'intro' | 'exam' | 'results';

const EXAM_TIME_SECONDS = 90 * 60; // 90 minutes

export default function PracticeExam() {
  const [state, setState] = useState<ExamState>('intro');
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [startTime, setStartTime] = useState(0);
  const [timeTaken, setTimeTaken] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);

  const currentQ = questions[currentIndex] ?? null;

  const unansweredCount = useMemo(
    () => questions.filter((q) => answers[q.id] === undefined).length,
    [questions, answers],
  );

  const handleBegin = useCallback(() => {
    const qs = buildExamQuestions();
    setQuestions(qs);
    setCurrentIndex(0);
    setAnswers({});
    setFlagged(new Set());
    setStartTime(Date.now());
    setState('exam');
  }, []);

  const handleAnswer = useCallback(
    (selectedIndex: number) => {
      if (!currentQ) return;
      setAnswers((prev) => ({ ...prev, [currentQ.id]: selectedIndex }));
    },
    [currentQ],
  );

  const handleFlag = useCallback(() => {
    if (!currentQ) return;
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(currentQ.id)) {
        next.delete(currentQ.id);
      } else {
        next.add(currentQ.id);
      }
      return next;
    });
  }, [currentQ]);

  const handleSubmit = useCallback(() => {
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    setTimeTaken(elapsed);
    setState('results');
  }, [startTime]);

  const handleTimeUp = useCallback(() => {
    const elapsed = EXAM_TIME_SECONDS;
    setTimeTaken(elapsed);
    setState('results');
  }, []);

  // --- INTRO ---
  if (state === 'intro') {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem 1rem' }}>
        <div
          className="nes-container is-dark with-title"
          style={{ textAlign: 'center', padding: '2rem' }}
        >
          <p className="title" style={{ fontSize: '0.65rem' }}>
            Final Exam
          </p>

          <h2
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1rem',
              color: '#ff0040',
              marginBottom: '2rem',
            }}
          >
            PRACTICE FINAL EXAM
          </h2>

          <div style={{ marginBottom: '2rem', textAlign: 'left' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <span style={{ color: '#0095ff', fontFamily: 'var(--font-heading)', fontSize: '0.5rem', minWidth: '1.5rem' }}>
                  &gt;
                </span>
                <p style={{ fontSize: '0.8rem', color: '#ffffff', margin: 0, lineHeight: 1.7 }}>
                  40-50 questions from Modules 1-4 (Main Quest only)
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <span style={{ color: '#0095ff', fontFamily: 'var(--font-heading)', fontSize: '0.5rem', minWidth: '1.5rem' }}>
                  &gt;
                </span>
                <p style={{ fontSize: '0.8rem', color: '#ffffff', margin: 0, lineHeight: 1.7 }}>
                  Time limit: 90 minutes
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <span style={{ color: '#0095ff', fontFamily: 'var(--font-heading)', fontSize: '0.5rem', minWidth: '1.5rem' }}>
                  &gt;
                </span>
                <p style={{ fontSize: '0.8rem', color: '#ffffff', margin: 0, lineHeight: 1.7 }}>
                  Flag questions for review before submitting
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <span style={{ color: '#0095ff', fontFamily: 'var(--font-heading)', fontSize: '0.5rem', minWidth: '1.5rem' }}>
                  &gt;
                </span>
                <p style={{ fontSize: '0.8rem', color: '#ffffff', margin: 0, lineHeight: 1.7 }}>
                  Auto-submits when time runs out
                </p>
              </div>
            </div>
          </div>

          <div
            style={{
              border: '2px solid #ffd700',
              padding: '1rem',
              marginBottom: '2rem',
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '0.5rem',
                color: '#ffd700',
                margin: 0,
                lineHeight: 1.8,
              }}
            >
              WARNING: This simulates real exam conditions. The timer starts immediately.
            </p>
          </div>

          <button className="nes-btn is-error" onClick={handleBegin}>
            Begin Exam
          </button>
        </div>
      </div>
    );
  }

  // --- RESULTS ---
  if (state === 'results') {
    return <ExamResults questions={questions} answers={answers} timeTaken={timeTaken} />;
  }

  // --- EXAM ---
  return (
    <div style={{ display: 'flex', gap: '1rem', maxWidth: '900px', margin: '0 auto', padding: '1rem' }}>
      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Timer bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
            padding: '0.5rem 1rem',
            backgroundColor: '#16213e',
            border: '2px solid #0095ff',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '0.55rem',
              color: '#a0a0b0',
              margin: 0,
            }}
          >
            Q {currentIndex + 1}/{questions.length}
          </p>
          <ExamTimer totalSeconds={EXAM_TIME_SECONDS} onTimeUp={handleTimeUp} />
        </div>

        {/* Question */}
        {currentQ && (
          <div className="nes-container is-dark" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
            {/* Bloom badge */}
            {currentQ.bloomLevel && (
              <div style={{ marginBottom: '1rem' }}>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '2px 10px',
                    fontSize: '0.55rem',
                    fontFamily: 'var(--font-heading)',
                    color: '#1a1a2e',
                    backgroundColor:
                      currentQ.bloomLevel === 'analyze'
                        ? '#b347d9'
                        : currentQ.bloomLevel === 'apply'
                          ? '#ffd700'
                          : currentQ.bloomLevel === 'understand'
                            ? '#00ff41'
                            : '#0095ff',
                  }}
                >
                  {currentQ.bloomLevel.charAt(0).toUpperCase() + currentQ.bloomLevel.slice(1)}
                </span>
              </div>
            )}

            <p style={{ color: '#ffffff', fontSize: '0.9rem', lineHeight: 1.8, marginBottom: '1.5rem' }}>
              {currentQ.question}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {currentQ.options.map((option, idx) => {
                const isSelected = answers[currentQ.id] === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(idx)}
                    style={{
                      textAlign: 'left',
                      padding: '0.75rem 1rem',
                      fontSize: '0.7rem',
                      fontFamily: 'var(--font-body)',
                      color: '#ffffff',
                      backgroundColor: isSelected ? '#0f3460' : 'transparent',
                      border: isSelected ? '4px solid #0095ff' : '4px solid #a0a0b0',
                      cursor: 'pointer',
                      transition: 'border-color 0.15s, background-color 0.15s',
                      width: '100%',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-heading)',
                        color: isSelected ? '#0095ff' : '#a0a0b0',
                        marginRight: '0.75rem',
                        fontSize: '0.6rem',
                      }}
                    >
                      {String.fromCharCode(65 + idx)}.
                    </span>
                    {option}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Navigation + Flag */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className="nes-btn"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              style={{ fontSize: '0.5rem', opacity: currentIndex === 0 ? 0.4 : 1 }}
            >
              Previous
            </button>
            <button
              className="nes-btn is-primary"
              disabled={currentIndex >= questions.length - 1}
              onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
              style={{ fontSize: '0.5rem', opacity: currentIndex >= questions.length - 1 ? 0.4 : 1 }}
            >
              Next
            </button>
          </div>

          <button
            className={`nes-btn ${currentQ && flagged.has(currentQ.id) ? 'is-warning' : ''}`}
            onClick={handleFlag}
            style={{ fontSize: '0.5rem' }}
          >
            {currentQ && flagged.has(currentQ.id) ? 'Flagged' : 'Flag'}
          </button>

          <button
            className="nes-btn is-error"
            onClick={() => setShowConfirm(true)}
            style={{ fontSize: '0.5rem' }}
          >
            Submit Exam
          </button>
        </div>

        {/* Confirm dialog */}
        {showConfirm && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 100,
            }}
          >
            <div
              className="nes-container is-dark"
              style={{ maxWidth: '400px', textAlign: 'center', padding: '2rem' }}
            >
              <p
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '0.75rem',
                  color: '#ffd700',
                  marginBottom: '1rem',
                }}
              >
                Submit Exam?
              </p>
              {unansweredCount > 0 && (
                <p style={{ fontSize: '0.8rem', color: '#ff0040', marginBottom: '1rem' }}>
                  {unansweredCount} question{unansweredCount !== 1 ? 's' : ''} unanswered!
                </p>
              )}
              <p style={{ fontSize: '0.75rem', color: '#a0a0b0', marginBottom: '1.5rem' }}>
                Are you sure you want to submit?
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                <button
                  className="nes-btn"
                  onClick={() => setShowConfirm(false)}
                  style={{ fontSize: '0.5rem' }}
                >
                  Go Back
                </button>
                <button
                  className="nes-btn is-error"
                  onClick={handleSubmit}
                  style={{ fontSize: '0.5rem' }}
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Question navigation sidebar */}
      <div
        style={{
          width: '180px',
          flexShrink: 0,
        }}
      >
        <div
          className="nes-container is-dark"
          style={{ padding: '0.75rem', position: 'sticky', top: '4.5rem' }}
        >
          <p
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '0.45rem',
              color: '#a0a0b0',
              marginBottom: '0.5rem',
              textAlign: 'center',
            }}
          >
            QUESTIONS
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '4px',
            }}
          >
            {questions.map((q, idx) => {
              const isAnswered = answers[q.id] !== undefined;
              const isFlagged = flagged.has(q.id);
              const isCurrent = idx === currentIndex;

              let bgColor = '#1a1a2e'; // unanswered
              if (isFlagged) bgColor = '#ffd700';
              else if (isAnswered) bgColor = '#0095ff';

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(idx)}
                  style={{
                    width: '28px',
                    height: '28px',
                    backgroundColor: bgColor,
                    color: isFlagged ? '#1a1a2e' : '#ffffff',
                    border: isCurrent ? '2px solid #00ff41' : '1px solid #a0a0b0',
                    fontFamily: 'var(--font-heading)',
                    fontSize: '0.35rem',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '10px', height: '10px', backgroundColor: '#1a1a2e', border: '1px solid #a0a0b0' }} />
              <span style={{ fontSize: '0.35rem', fontFamily: 'var(--font-heading)', color: '#a0a0b0' }}>
                Unanswered
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '10px', height: '10px', backgroundColor: '#0095ff' }} />
              <span style={{ fontSize: '0.35rem', fontFamily: 'var(--font-heading)', color: '#a0a0b0' }}>
                Answered
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '10px', height: '10px', backgroundColor: '#ffd700' }} />
              <span style={{ fontSize: '0.35rem', fontFamily: 'var(--font-heading)', color: '#a0a0b0' }}>
                Flagged
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
