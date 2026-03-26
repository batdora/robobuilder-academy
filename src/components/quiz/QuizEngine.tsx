import { useState, useCallback } from 'react';
import QuestionCard from './QuestionCard';
import QuizResults from './QuizResults';
import DragDropOrder from './DragDropOrder';
import SliderTuner from './SliderTuner';
import FillEquation from './FillEquation';
import DiagramLabel from './DiagramLabel';
import type { Question } from './QuestionCard';

export type { Question };

/* ------------------------------------------------------------------ */
/*  Extended question types for the quiz engine                        */
/* ------------------------------------------------------------------ */

interface DragDropQuestion {
  id: string;
  type: 'drag-drop';
  question: string;
  items: string[];
  correctOrder: string[];
  explanation: string;
  bloomLevel?: 'remember' | 'understand' | 'apply' | 'analyze';
}

interface SliderQuestion {
  id: string;
  type: 'slider';
  question: string;
  paramName: string;
  min: number;
  max: number;
  step: number;
  correctRange: [number, number];
  description: string;
  effectDescription: string;
  explanation: string;
  bloomLevel?: 'remember' | 'understand' | 'apply' | 'analyze';
}

interface FillEquationQuestion {
  id: string;
  type: 'fill-equation';
  question: string;
  equation: string;
  blanks: { id: string; correctAnswer: string; options: string[] }[];
  explanation: string;
  bloomLevel?: 'remember' | 'understand' | 'apply' | 'analyze';
}

interface DiagramLabelQuestion {
  id: string;
  type: 'diagram-label';
  question: string;
  description: string;
  imageSrc?: string;
  labels: {
    id: string;
    x: number;
    y: number;
    correctAnswer: string;
    options: string[];
  }[];
  explanation: string;
  bloomLevel?: 'remember' | 'understand' | 'apply' | 'analyze';
}

export type AnyQuestion =
  | Question
  | DragDropQuestion
  | SliderQuestion
  | FillEquationQuestion
  | DiagramLabelQuestion;

export interface QuizProps {
  quizId: string;
  moduleId: string;
  title: string;
  questions: AnyQuestion[];
  xpReward: number;
  onBack?: () => void;
}

type Phase = 'intro' | 'question' | 'feedback' | 'results';

interface AnswerRecord {
  questionId: string;
  correct: boolean;
  selectedIndex?: number;
}

export default function QuizEngine({
  quizId,
  moduleId,
  title,
  questions,
  xpReward,
  onBack,
}: QuizProps) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [lastCorrect, setLastCorrect] = useState(false);
  const [lastExplanation, setLastExplanation] = useState('');
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);

  const currentQuestion = questions[currentIndex];
  const total = questions.length;

  const score = answers.filter((a) => a.correct).length;
  // Only MC/TF questions have correctIndex for the review panel
  const incorrectMCQuestions = answers
    .filter((a) => !a.correct)
    .map((a) => {
      const q = questions.find((q) => q.id === a.questionId);
      if (q && (q.type === 'multiple-choice' || q.type === 'true-false')) return q as Question;
      return null;
    })
    .filter(Boolean) as Question[];

  // XP scales linearly with score
  const xpEarned = total > 0 ? Math.round((score / total) * xpReward) : 0;

  const handleStart = useCallback(() => {
    setPhase('question');
    setCurrentIndex(0);
    setAnswers([]);
    setLastCorrect(false);
    setLastExplanation('');
    setLastSelectedIndex(null);
  }, []);

  /* ---- Generic answer processor ---- */
  const recordAnswer = useCallback(
    (correct: boolean, explanation: string, selectedIndex?: number) => {
      setLastCorrect(correct);
      setLastExplanation(explanation);
      setLastSelectedIndex(selectedIndex ?? null);
      setAnswers((prev) => [
        ...prev,
        { questionId: currentQuestion.id, correct, selectedIndex },
      ]);
      setPhase('feedback');
    },
    [currentQuestion],
  );

  /* ---- Type-specific handlers ---- */
  const handleMCAnswer = useCallback(
    (selectedIndex: number) => {
      const q = currentQuestion as Question;
      const correct = selectedIndex === q.correctIndex;
      recordAnswer(correct, q.explanation, selectedIndex);
    },
    [currentQuestion, recordAnswer],
  );

  const handleDragDropSubmit = useCallback(
    (ordered: string[]) => {
      const q = currentQuestion as DragDropQuestion;
      const correct = JSON.stringify(ordered) === JSON.stringify(q.correctOrder);
      recordAnswer(correct, q.explanation);
    },
    [currentQuestion, recordAnswer],
  );

  const handleSliderSubmit = useCallback(
    (value: number) => {
      const q = currentQuestion as SliderQuestion;
      const correct = value >= q.correctRange[0] && value <= q.correctRange[1];
      recordAnswer(correct, q.explanation);
    },
    [currentQuestion, recordAnswer],
  );

  const handleFillEquationSubmit = useCallback(
    (ans: Record<string, string>) => {
      const q = currentQuestion as FillEquationQuestion;
      const correct = q.blanks.every((b) => ans[b.id] === b.correctAnswer);
      recordAnswer(correct, q.explanation);
    },
    [currentQuestion, recordAnswer],
  );

  const handleDiagramLabelSubmit = useCallback(
    (ans: Record<string, string>) => {
      const q = currentQuestion as DiagramLabelQuestion;
      const correct = q.labels.every((l) => ans[l.id] === l.correctAnswer);
      recordAnswer(correct, q.explanation);
    },
    [currentQuestion, recordAnswer],
  );

  const handleNext = useCallback(() => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= total) {
      setPhase('results');
    } else {
      setCurrentIndex(nextIndex);
      setLastCorrect(false);
      setLastExplanation('');
      setLastSelectedIndex(null);
      setPhase('question');
    }
  }, [currentIndex, total]);

  const handleBack = useCallback(() => {
    if (onBack) {
      onBack();
    }
  }, [onBack]);

  // --- Progress bar ---
  const progressPct =
    phase === 'intro'
      ? 0
      : phase === 'results'
        ? 100
        : Math.round(((currentIndex + (phase === 'feedback' ? 1 : 0)) / total) * 100);

  /* ---- Render question by type ---- */
  const renderQuestion = () => {
    if (!currentQuestion) return null;

    switch (currentQuestion.type) {
      case 'multiple-choice':
      case 'true-false':
        return (
          <QuestionCard
            question={currentQuestion as Question}
            onAnswer={handleMCAnswer}
          />
        );

      case 'drag-drop': {
        const q = currentQuestion as DragDropQuestion;
        return (
          <div>
            <p
              style={{
                fontSize: '0.85rem',
                color: '#ffffff',
                lineHeight: 1.7,
                marginBottom: '1rem',
              }}
            >
              {q.question}
            </p>
            <DragDropOrder items={q.items} onSubmit={handleDragDropSubmit} />
          </div>
        );
      }

      case 'slider': {
        const q = currentQuestion as SliderQuestion;
        return (
          <div>
            <p
              style={{
                fontSize: '0.85rem',
                color: '#ffffff',
                lineHeight: 1.7,
                marginBottom: '1rem',
              }}
            >
              {q.question}
            </p>
            <SliderTuner
              paramName={q.paramName}
              min={q.min}
              max={q.max}
              step={q.step}
              correctRange={q.correctRange}
              description={q.description}
              effectDescription={q.effectDescription}
              onSubmit={handleSliderSubmit}
            />
          </div>
        );
      }

      case 'fill-equation': {
        const q = currentQuestion as FillEquationQuestion;
        return (
          <div>
            <p
              style={{
                fontSize: '0.85rem',
                color: '#ffffff',
                lineHeight: 1.7,
                marginBottom: '1rem',
              }}
            >
              {q.question}
            </p>
            <FillEquation
              equation={q.equation}
              blanks={q.blanks}
              onSubmit={handleFillEquationSubmit}
            />
          </div>
        );
      }

      case 'diagram-label': {
        const q = currentQuestion as DiagramLabelQuestion;
        return (
          <div>
            <p
              style={{
                fontSize: '0.85rem',
                color: '#ffffff',
                lineHeight: 1.7,
                marginBottom: '1rem',
              }}
            >
              {q.question}
            </p>
            <DiagramLabel
              description={q.description}
              imageSrc={q.imageSrc}
              labels={q.labels}
              onSubmit={handleDiagramLabelSubmit}
            />
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '1rem' }}>
      {/* Progress bar (hidden on intro) */}
      {phase !== 'intro' && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '0.25rem',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '0.55rem',
                color: '#a0a0b0',
              }}
            >
              {phase === 'results'
                ? 'COMPLETE'
                : `QUESTION ${currentIndex + 1}/${total}`}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '0.55rem',
                color: '#a0a0b0',
              }}
            >
              {progressPct}%
            </span>
          </div>
          <progress
            className="nes-progress is-primary"
            value={progressPct}
            max={100}
            style={{ width: '100%' }}
          />
        </div>
      )}

      {/* INTRO */}
      {phase === 'intro' && (
        <div
          className="nes-container is-dark with-title"
          style={{ textAlign: 'center', padding: '2rem' }}
        >
          <p className="title" style={{ fontSize: '0.65rem' }}>
            Quiz
          </p>

          <h2
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1rem',
              color: '#00ff41',
              marginBottom: '1.5rem',
            }}
          >
            {title}
          </h2>

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '2rem',
              marginBottom: '2rem',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <p
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '1.5rem',
                  color: '#0095ff',
                  margin: '0 0 0.25rem 0',
                }}
              >
                {total}
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '0.5rem',
                  color: '#a0a0b0',
                  margin: 0,
                }}
              >
                Questions
              </p>
            </div>
            <div>
              <p
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '1.5rem',
                  color: '#ffd700',
                  margin: '0 0 0.25rem 0',
                }}
              >
                {xpReward}
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '0.5rem',
                  color: '#a0a0b0',
                  margin: 0,
                }}
              >
                XP Reward
              </p>
            </div>
          </div>

          <button className="nes-btn is-success" onClick={handleStart}>
            Start Quest
          </button>
        </div>
      )}

      {/* QUESTION (dispatches to correct component by type) */}
      {phase === 'question' && currentQuestion && renderQuestion()}

      {/* FEEDBACK */}
      {phase === 'feedback' && currentQuestion && (
        <div>
          <div
            className="nes-container is-dark"
            style={{ padding: '1.5rem', marginBottom: '1rem' }}
          >
            {/* Correct / Incorrect banner */}
            <div
              style={{
                textAlign: 'center',
                marginBottom: '1rem',
              }}
            >
              {lastCorrect ? (
                <p
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '1rem',
                    color: '#00ff41',
                    margin: 0,
                  }}
                >
                  Correct!
                </p>
              ) : (
                <p
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '1rem',
                    color: '#ff0040',
                    margin: 0,
                  }}
                >
                  Incorrect
                </p>
              )}
            </div>

            {/* Show selected vs correct for MC/TF only */}
            {(currentQuestion.type === 'multiple-choice' || currentQuestion.type === 'true-false') &&
              lastSelectedIndex !== null &&
              lastSelectedIndex !== (currentQuestion as Question).correctIndex && (
                <p style={{ fontSize: '0.8rem', color: '#a0a0b0', marginBottom: '0.5rem' }}>
                  Your answer:{' '}
                  <span style={{ color: '#ff0040' }}>
                    {(currentQuestion as Question).options[lastSelectedIndex]}
                  </span>
                </p>
              )}

            {(currentQuestion.type === 'multiple-choice' || currentQuestion.type === 'true-false') && (
              <p style={{ fontSize: '0.8rem', color: '#a0a0b0', marginBottom: '0.75rem' }}>
                Correct answer:{' '}
                <span style={{ color: '#00ff41' }}>
                  {(currentQuestion as Question).options[(currentQuestion as Question).correctIndex]}
                </span>
              </p>
            )}

            {/* Explanation */}
            <div
              style={{
                borderLeft: '4px solid #0095ff',
                paddingLeft: '1rem',
                marginTop: '1rem',
              }}
            >
              <p style={{ fontSize: '0.8rem', color: '#ffffff', lineHeight: 1.7, margin: 0 }}>
                {lastExplanation}
              </p>
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <button className="nes-btn is-primary" onClick={handleNext}>
              {currentIndex + 1 >= total ? 'See Results' : 'Next Question'}
            </button>
          </div>
        </div>
      )}

      {/* RESULTS */}
      {phase === 'results' && (
        <QuizResults
          score={score}
          total={total}
          xpEarned={xpEarned}
          incorrectQuestions={incorrectMCQuestions}
          onBack={handleBack}
        />
      )}
    </div>
  );
}
