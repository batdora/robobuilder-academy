import { useState, useCallback, useEffect } from 'react';
import QuestionCard from './QuestionCard';
import DragDropOrder from './DragDropOrder';
import SliderTuner from './SliderTuner';
import FillEquation from './FillEquation';
import DiagramLabel from './DiagramLabel';
import type { Question as MCQuestion } from './QuestionCard';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
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

export type BossQuestion =
  | MCQuestion
  | DragDropQuestion
  | SliderQuestion
  | FillEquationQuestion
  | DiagramLabelQuestion;

export interface Phase {
  name: string;
  questions: BossQuestion[];
  requiredScore: number;
}

export interface BossBattleProps {
  bossName: string;
  bossEmoji: string;
  moduleId: string;
  phases: Phase[];
  xpReward: number;
  onBack?: () => void;
}

type BattleState =
  | 'intro'
  | 'phase1'
  | 'phase1-result'
  | 'phase2'
  | 'phase2-result'
  | 'phase3'
  | 'phase3-result'
  | 'victory'
  | 'defeat';

const PHASE_STATES: BattleState[] = [
  'phase1',
  'phase1-result',
  'phase2',
  'phase2-result',
  'phase3',
  'phase3-result',
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function BossBattle({
  bossName,
  bossEmoji,
  moduleId,
  phases,
  xpReward,
  onBack,
}: BossBattleProps) {
  const [state, setState] = useState<BattleState>('intro');
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [phaseScore, setPhaseScore] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastCorrect, setLastCorrect] = useState(false);
  const [lastExplanation, setLastExplanation] = useState('');
  const [shakeScreen, setShakeScreen] = useState(false);
  const [flashColor, setFlashColor] = useState<string | null>(null);
  const [confetti, setConfetti] = useState(false);
  const [defeatedPhase, setDefeatedPhase] = useState('');

  const totalQuestions = phases.reduce((s, p) => s + p.questions.length, 0);
  const totalAnswered = phases
    .slice(0, currentPhaseIndex)
    .reduce((s, p) => s + p.questions.length, 0) + currentQIndex + (showFeedback ? 1 : 0);

  // Boss HP percentage
  const bossHpPct = Math.max(0, 100 - (totalScore / totalQuestions) * 100);

  const currentPhase = phases[currentPhaseIndex];
  const currentQuestion = currentPhase?.questions[currentQIndex];

  // Screen shake effect
  useEffect(() => {
    if (shakeScreen) {
      const t = setTimeout(() => setShakeScreen(false), 400);
      return () => clearTimeout(t);
    }
  }, [shakeScreen]);

  // Flash effect
  useEffect(() => {
    if (flashColor) {
      const t = setTimeout(() => setFlashColor(null), 300);
      return () => clearTimeout(t);
    }
  }, [flashColor]);

  const triggerCorrect = useCallback(() => {
    setFlashColor('#00ff41');
    setShakeScreen(true);
  }, []);

  const triggerIncorrect = useCallback(() => {
    setFlashColor('#ff0040');
  }, []);

  /* ---- Answer handlers for each question type ---- */

  const processAnswer = useCallback(
    (correct: boolean, explanation: string) => {
      setLastCorrect(correct);
      setLastExplanation(explanation);
      if (correct) {
        setPhaseScore((s) => s + 1);
        setTotalScore((s) => s + 1);
        triggerCorrect();
      } else {
        triggerIncorrect();
      }
      setShowFeedback(true);
    },
    [triggerCorrect, triggerIncorrect],
  );

  const handleMCAnswer = useCallback(
    (selectedIndex: number) => {
      if (!currentQuestion || (currentQuestion.type !== 'multiple-choice' && currentQuestion.type !== 'true-false'))
        return;
      const q = currentQuestion as MCQuestion;
      const correct = selectedIndex === q.correctIndex;
      processAnswer(correct, q.explanation);
    },
    [currentQuestion, processAnswer],
  );

  const handleDragDropSubmit = useCallback(
    (ordered: string[]) => {
      if (!currentQuestion || currentQuestion.type !== 'drag-drop') return;
      const q = currentQuestion as DragDropQuestion;
      const correct = JSON.stringify(ordered) === JSON.stringify(q.correctOrder);
      processAnswer(correct, q.explanation);
    },
    [currentQuestion, processAnswer],
  );

  const handleSliderSubmit = useCallback(
    (value: number) => {
      if (!currentQuestion || currentQuestion.type !== 'slider') return;
      const q = currentQuestion as SliderQuestion;
      const correct = value >= q.correctRange[0] && value <= q.correctRange[1];
      processAnswer(correct, q.explanation);
    },
    [currentQuestion, processAnswer],
  );

  const handleFillEquationSubmit = useCallback(
    (answers: Record<string, string>) => {
      if (!currentQuestion || currentQuestion.type !== 'fill-equation') return;
      const q = currentQuestion as FillEquationQuestion;
      const allCorrect = q.blanks.every((b) => answers[b.id] === b.correctAnswer);
      processAnswer(allCorrect, q.explanation);
    },
    [currentQuestion, processAnswer],
  );

  const handleDiagramSubmit = useCallback(
    (answers: Record<string, string>) => {
      if (!currentQuestion || currentQuestion.type !== 'diagram-label') return;
      const q = currentQuestion as DiagramLabelQuestion;
      const allCorrect = q.labels.every((l) => answers[l.id] === l.correctAnswer);
      processAnswer(allCorrect, q.explanation);
    },
    [currentQuestion, processAnswer],
  );

  /* ---- Navigation ---- */

  const handleNextQuestion = useCallback(() => {
    setShowFeedback(false);
    const nextQ = currentQIndex + 1;

    if (nextQ >= currentPhase.questions.length) {
      // Phase complete -- check score
      const phaseIdx = currentPhaseIndex;
      const stateKey = `phase${phaseIdx + 1}-result` as BattleState;
      setState(stateKey);
    } else {
      setCurrentQIndex(nextQ);
    }
  }, [currentQIndex, currentPhase, currentPhaseIndex]);

  const handleNextPhase = useCallback(() => {
    if (phaseScore < currentPhase.requiredScore) {
      // Defeat
      setDefeatedPhase(currentPhase.name);
      setState('defeat');
      return;
    }

    const nextPhase = currentPhaseIndex + 1;
    if (nextPhase >= phases.length) {
      // Victory!
      setConfetti(true);
      setState('victory');
    } else {
      setCurrentPhaseIndex(nextPhase);
      setCurrentQIndex(0);
      setPhaseScore(0);
      const stateKey = `phase${nextPhase + 1}` as BattleState;
      setState(stateKey);
    }
  }, [phaseScore, currentPhase, currentPhaseIndex, phases]);

  const handleBegin = useCallback(() => {
    setState('phase1');
    setCurrentPhaseIndex(0);
    setCurrentQIndex(0);
    setPhaseScore(0);
    setTotalScore(0);
  }, []);

  const handleRetry = useCallback(() => {
    setState('intro');
    setCurrentPhaseIndex(0);
    setCurrentQIndex(0);
    setPhaseScore(0);
    setTotalScore(0);
  }, []);

  /* ---- Render question by type ---- */

  const renderQuestion = () => {
    if (!currentQuestion) return null;

    switch (currentQuestion.type) {
      case 'multiple-choice':
      case 'true-false':
        return (
          <QuestionCard
            question={currentQuestion as MCQuestion}
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
              onSubmit={handleDiagramSubmit}
            />
          </div>
        );
      }
      default:
        return null;
    }
  };

  /* ---- Main render ---- */

  const isInPhase = state.startsWith('phase') && !state.endsWith('-result');
  const isPhaseResult = state.endsWith('-result');

  return (
    <div
      style={{
        maxWidth: '700px',
        margin: '0 auto',
        padding: '1rem',
        position: 'relative',
        transition: 'transform 0.1s',
        transform: shakeScreen ? 'translateX(4px)' : 'none',
      }}
    >
      {/* Flash overlay */}
      {flashColor && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: flashColor,
            opacity: 0.15,
            pointerEvents: 'none',
            zIndex: 999,
            transition: 'opacity 0.3s',
          }}
        />
      )}

      {/* ====================== INTRO ====================== */}
      {state === 'intro' && (
        <div
          className="nes-container is-dark"
          style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}
        >
          <p
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '0.7rem',
              color: '#ff0040',
              letterSpacing: '0.2em',
              marginBottom: '1.5rem',
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          >
            &#x2694; BOSS BATTLE &#x2694;
          </p>

          <div
            style={{
              fontSize: '4rem',
              marginBottom: '1rem',
              filter: 'drop-shadow(0 0 20px rgba(255, 0, 64, 0.5))',
            }}
          >
            {bossEmoji}
          </div>

          <h2
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.1rem',
              color: '#ffd700',
              marginBottom: '0.5rem',
              textShadow: '0 0 10px rgba(255, 215, 0, 0.5)',
            }}
          >
            {bossName}
          </h2>

          <p
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '0.55rem',
              color: '#a0a0b0',
              marginBottom: '2rem',
            }}
          >
            Module: {moduleId}
          </p>

          {/* Phase preview */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              marginBottom: '2rem',
              textAlign: 'left',
              padding: '0 1rem',
            }}
          >
            {phases.map((phase, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.5rem 0.75rem',
                  border: '2px solid #a0a0b0',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '0.5rem',
                    color: '#ffffff',
                  }}
                >
                  {phase.name}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '0.5rem',
                    color: '#0095ff',
                  }}
                >
                  {phase.questions.length} Q / Need {phase.requiredScore}
                </span>
              </div>
            ))}
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '1rem',
              marginBottom: '1rem',
            }}
          >
            <div>
              <p
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '1.25rem',
                  color: '#ffd700',
                  margin: '0 0 0.25rem 0',
                }}
              >
                {xpReward}
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '0.45rem',
                  color: '#a0a0b0',
                  margin: 0,
                }}
              >
                XP REWARD
              </p>
            </div>
          </div>

          <button className="nes-btn is-error" onClick={handleBegin}>
            Begin Battle
          </button>
        </div>
      )}

      {/* ====================== IN-PHASE (Questions) ====================== */}
      {isInPhase && currentQuestion && (
        <div>
          {/* Boss HP bar */}
          <div style={{ marginBottom: '1rem' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.25rem',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '0.55rem',
                  color: '#ff0040',
                }}
              >
                {bossEmoji} {bossName}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '0.5rem',
                  color: '#a0a0b0',
                }}
              >
                HP {Math.round(bossHpPct)}%
              </span>
            </div>
            <div
              style={{
                width: '100%',
                height: '16px',
                backgroundColor: '#1a1a2e',
                border: '3px solid #a0a0b0',
                position: 'relative',
              }}
            >
              <div
                style={{
                  width: `${bossHpPct}%`,
                  height: '100%',
                  backgroundColor:
                    bossHpPct > 50 ? '#ff0040' : bossHpPct > 25 ? '#ffd700' : '#00ff41',
                  transition: 'width 0.5s ease, background-color 0.3s',
                  imageRendering: 'pixelated',
                }}
              />
            </div>
          </div>

          {/* Phase indicator */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
              padding: '0.5rem 0.75rem',
              border: '2px solid #b347d9',
              backgroundColor: 'rgba(179, 71, 217, 0.1)',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '0.55rem',
                color: '#b347d9',
              }}
            >
              {currentPhase.name}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '0.5rem',
                color: '#a0a0b0',
              }}
            >
              Q{currentQIndex + 1}/{currentPhase.questions.length} | Score: {phaseScore}
            </span>
          </div>

          {/* Question or feedback */}
          {!showFeedback ? (
            renderQuestion()
          ) : (
            <div>
              <div
                className="nes-container is-dark"
                style={{ padding: '1.5rem', marginBottom: '1rem' }}
              >
                <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                  <p
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: '1rem',
                      color: lastCorrect ? '#00ff41' : '#ff0040',
                      margin: 0,
                    }}
                  >
                    {lastCorrect ? 'CRITICAL HIT!' : 'MISS!'}
                  </p>
                  <p
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: '0.5rem',
                      color: '#a0a0b0',
                      marginTop: '0.5rem',
                    }}
                  >
                    {lastCorrect
                      ? `${bossName} takes damage!`
                      : `${bossName} retaliates!`}
                  </p>
                </div>

                <div
                  style={{
                    borderLeft: '4px solid #0095ff',
                    paddingLeft: '1rem',
                    marginTop: '1rem',
                  }}
                >
                  <p
                    style={{
                      fontSize: '0.8rem',
                      color: '#ffffff',
                      lineHeight: 1.7,
                      margin: 0,
                    }}
                  >
                    {lastExplanation}
                  </p>
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <button className="nes-btn is-primary" onClick={handleNextQuestion}>
                  {currentQIndex + 1 >= currentPhase.questions.length
                    ? 'Phase Results'
                    : 'Next Attack'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ====================== PHASE RESULT ====================== */}
      {isPhaseResult && (
        <div
          className="nes-container is-dark"
          style={{ textAlign: 'center', padding: '2rem' }}
        >
          <p
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '0.7rem',
              color: '#b347d9',
              marginBottom: '1.5rem',
            }}
          >
            {currentPhase.name} COMPLETE
          </p>

          <p
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '2rem',
              color:
                phaseScore >= currentPhase.requiredScore ? '#00ff41' : '#ff0040',
              marginBottom: '0.5rem',
            }}
          >
            {phaseScore}/{currentPhase.questions.length}
          </p>

          <p
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '0.55rem',
              color: '#a0a0b0',
              marginBottom: '1.5rem',
            }}
          >
            Required: {currentPhase.requiredScore}
          </p>

          {phaseScore >= currentPhase.requiredScore ? (
            <div>
              <p
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '0.65rem',
                  color: '#00ff41',
                  marginBottom: '1.5rem',
                }}
              >
                PHASE CLEARED!
              </p>
              <button className="nes-btn is-success" onClick={handleNextPhase}>
                {currentPhaseIndex + 1 >= phases.length
                  ? 'Claim Victory'
                  : 'Next Phase'}
              </button>
            </div>
          ) : (
            <div>
              <p
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '0.6rem',
                  color: '#ff0040',
                  marginBottom: '1rem',
                }}
              >
                PHASE FAILED
              </p>
              <div
                style={{
                  border: '2px solid #ffd700',
                  padding: '1rem',
                  marginBottom: '1.5rem',
                  textAlign: 'left',
                }}
              >
                <p
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '0.55rem',
                    color: '#ffd700',
                    marginBottom: '0.5rem',
                  }}
                >
                  DIAGNOSTIC:
                </p>
                <p
                  style={{
                    fontSize: '0.75rem',
                    color: '#ffffff',
                    lineHeight: 1.7,
                  }}
                >
                  Review the material for this module before attempting again.
                  Focus on the concepts tested in {currentPhase.name}.
                </p>
              </div>
              <button className="nes-btn is-warning" onClick={handleNextPhase}>
                Continue
              </button>
            </div>
          )}
        </div>
      )}

      {/* ====================== VICTORY ====================== */}
      {state === 'victory' && (
        <div
          className="nes-container is-dark"
          style={{ textAlign: 'center', padding: '2.5rem 1.5rem', position: 'relative', overflow: 'hidden' }}
        >
          {/* Confetti particles */}
          {confetti && (
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
              {Array.from({ length: 30 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: `${Math.random() * 100}%`,
                    top: '-10px',
                    width: '8px',
                    height: '8px',
                    backgroundColor: ['#ffd700', '#00ff41', '#0095ff', '#ff0040', '#b347d9'][
                      i % 5
                    ],
                    animation: `confetti-fall ${1.5 + Math.random() * 2}s ease-in forwards`,
                    animationDelay: `${Math.random() * 0.5}s`,
                    imageRendering: 'pixelated',
                  }}
                />
              ))}
              <style>{`
                @keyframes confetti-fall {
                  0% { transform: translateY(0) rotate(0deg); opacity: 1; }
                  100% { transform: translateY(600px) rotate(720deg); opacity: 0; }
                }
              `}</style>
            </div>
          )}

          <p
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.2rem',
              color: '#ffd700',
              marginBottom: '1rem',
              textShadow: '0 0 20px rgba(255, 215, 0, 0.6)',
              animation: 'pulse 1s ease-in-out infinite',
            }}
          >
            VICTORY!
          </p>

          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
            {bossEmoji}
          </div>

          <p
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '0.7rem',
              color: '#00ff41',
              marginBottom: '0.5rem',
            }}
          >
            {bossName} DEFEATED!
          </p>

          <p
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '0.55rem',
              color: '#a0a0b0',
              marginBottom: '2rem',
            }}
          >
            Final Score: {totalScore}/{totalQuestions}
          </p>

          {/* XP reward */}
          <div
            style={{
              marginBottom: '2rem',
              padding: '1rem',
              border: '3px solid #ffd700',
              display: 'inline-block',
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '1.5rem',
                color: '#ffd700',
                margin: 0,
                animation: 'pulse 1s ease-in-out infinite',
              }}
            >
              +{xpReward} XP
            </p>
          </div>

          {/* Robot part unlock */}
          <div
            style={{
              padding: '1rem',
              border: '2px solid #b347d9',
              backgroundColor: 'rgba(179, 71, 217, 0.1)',
              marginBottom: '2rem',
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '0.55rem',
                color: '#b347d9',
                marginBottom: '0.5rem',
              }}
            >
              ROBOT PART UNLOCKED!
            </p>
            <p
              style={{
                fontSize: '2rem',
                margin: 0,
              }}
            >
              &#x1F916;
            </p>
            <p
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '0.5rem',
                color: '#a0a0b0',
                marginTop: '0.5rem',
              }}
            >
              New component acquired from defeating {bossName}
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            {onBack && (
              <button className="nes-btn is-primary" onClick={onBack}>
                Return
              </button>
            )}
          </div>

          <style>{`
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.7; }
            }
          `}</style>
        </div>
      )}

      {/* ====================== DEFEAT ====================== */}
      {state === 'defeat' && (
        <div
          className="nes-container is-dark"
          style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}
        >
          <p
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1rem',
              color: '#ff0040',
              marginBottom: '1.5rem',
            }}
          >
            DEFEATED
          </p>

          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
            {bossEmoji}
          </div>

          <p
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '0.65rem',
              color: '#a0a0b0',
              marginBottom: '1.5rem',
            }}
          >
            {bossName} still stands...
          </p>

          {/* Diagnostic */}
          <div
            style={{
              border: '2px solid #ffd700',
              padding: '1rem',
              marginBottom: '2rem',
              textAlign: 'left',
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '0.6rem',
                color: '#ffd700',
                marginBottom: '0.5rem',
              }}
            >
              SYSTEM DIAGNOSTIC:
            </p>
            <p
              style={{
                fontSize: '0.75rem',
                color: '#ffffff',
                lineHeight: 1.7,
                marginBottom: '0.5rem',
              }}
            >
              Failed at: {defeatedPhase}
            </p>
            <p
              style={{
                fontSize: '0.75rem',
                color: '#ffffff',
                lineHeight: 1.7,
              }}
            >
              Review the module lessons and practice quizzes before challenging
              this boss again.
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            <button className="nes-btn is-warning" onClick={handleRetry}>
              Retry Battle
            </button>
            {onBack && (
              <button className="nes-btn" onClick={onBack}>
                Back to Module
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
