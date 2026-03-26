import { useState, useEffect, useCallback } from 'react';
import { useProgressStore } from '../../stores/progress';
import type { ReviewCard as ReviewCardType } from '../../stores/progress';
import ReviewCard from './ReviewCard';
import StreakDisplay from './StreakDisplay';

// Map questionId to display data for the review card
// In a real app, this would look up from quiz JSON. For now we parse questionId.
import quiz01 from '../../content/quizzes/01-intro-robotics-quiz.json';
import quiz02 from '../../content/quizzes/02-rl-foundations-quiz.json';
import quiz03 from '../../content/quizzes/03-deep-q-learning-quiz.json';
import quiz04 from '../../content/quizzes/04-policy-optimization-quiz.json';

interface QuestionData {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

function getAllQuestions(): QuestionData[] {
  const q1 = 'questions' in quiz01 ? (quiz01 as { questions: QuestionData[] }).questions : (quiz01 as QuestionData[]);
  const q2 = Array.isArray(quiz02) ? (quiz02 as QuestionData[]) : (quiz02 as { questions: QuestionData[] }).questions;
  const q3 = 'questions' in quiz03 ? (quiz03 as { questions: QuestionData[] }).questions : (quiz03 as QuestionData[]);
  const q4 = 'questions' in quiz04 ? (quiz04 as { questions: QuestionData[] }).questions : (quiz04 as QuestionData[]);
  return [...q1, ...q2, ...q3, ...q4];
}

function findQuestion(questionId: string): QuestionData | undefined {
  return getAllQuestions().find((q) => q.id === questionId);
}

type GauntletState = 'loading' | 'empty' | 'review' | 'complete';

export default function GauntletMode() {
  const [state, setState] = useState<GauntletState>('loading');
  const [dueCards, setDueCards] = useState<ReviewCardType[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [sessionXP, setSessionXP] = useState(0);

  const store = useProgressStore();
  const { studyStreak, lastStudyDate, reviewQueue, reviewCard } = store;

  useEffect(() => {
    const due = store.getDueReviewCards();
    setDueCards(due);
    setState(due.length > 0 ? 'review' : 'empty');
  }, []);

  const handleFlip = useCallback(() => {
    setIsFlipped(true);
  }, []);

  const handleAssess = useCallback(
    (quality: number) => {
      const card = dueCards[currentIndex];
      if (!card) return;

      reviewCard(card.questionId, quality);
      const xpGain = quality >= 3 ? 5 : 0;
      setSessionXP((prev) => prev + xpGain);
      setReviewedCount((prev) => prev + 1);

      const nextIndex = currentIndex + 1;
      if (nextIndex >= dueCards.length) {
        setState('complete');
      } else {
        setCurrentIndex(nextIndex);
        setIsFlipped(false);
      }
    },
    [currentIndex, dueCards, reviewCard],
  );

  // Find the next review date (earliest in the entire queue)
  const getNextReviewDate = (): string | null => {
    if (reviewQueue.length === 0) return null;
    const sorted = [...reviewQueue].sort(
      (a, b) => new Date(a.nextReviewDate).getTime() - new Date(b.nextReviewDate).getTime(),
    );
    const next = sorted[0];
    const date = new Date(next.nextReviewDate);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // --- LOADING ---
  if (state === 'loading') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <p
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '0.75rem',
            color: '#0095ff',
          }}
          className="animate-pixel-pulse"
        >
          Loading review cards...
        </p>
      </div>
    );
  }

  // --- EMPTY ---
  if (state === 'empty') {
    const nextDate = getNextReviewDate();
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '1rem' }}>
        <div
          className="nes-container is-dark with-title"
          style={{ textAlign: 'center', padding: '2rem' }}
        >
          <p className="title" style={{ fontSize: '0.65rem' }}>
            Gauntlet Mode
          </p>

          <p
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.25rem',
              color: '#00ff41',
              marginBottom: '1.5rem',
            }}
          >
            All caught up!
          </p>

          <p style={{ fontSize: '0.85rem', color: '#a0a0b0', marginBottom: '2rem', lineHeight: 1.7 }}>
            No review cards are due right now. Great work staying on top of your studies!
          </p>

          {studyStreak > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <StreakDisplay streak={studyStreak} lastStudyDate={lastStudyDate} />
            </div>
          )}

          {nextDate && (
            <div
              style={{
                border: '2px solid #0095ff',
                padding: '1rem',
                marginBottom: '2rem',
              }}
            >
              <p
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '0.5rem',
                  color: '#a0a0b0',
                  margin: '0 0 0.25rem 0',
                }}
              >
                NEXT REVIEW
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '0.65rem',
                  color: '#0095ff',
                  margin: 0,
                }}
              >
                {nextDate}
              </p>
            </div>
          )}

          {reviewQueue.length === 0 && (
            <p style={{ fontSize: '0.8rem', color: '#a0a0b0', marginBottom: '1.5rem', lineHeight: 1.7 }}>
              Complete quizzes in the Blueprint to add cards to your review queue.
            </p>
          )}

          <a href="/">
            <button className="nes-btn is-primary">Back to Blueprint</button>
          </a>
        </div>
      </div>
    );
  }

  // --- REVIEW ---
  if (state === 'review') {
    const card = dueCards[currentIndex];
    const questionData = card ? findQuestion(card.questionId) : undefined;
    const remaining = dueCards.length - currentIndex;

    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '1rem' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '0.6rem',
              color: '#a0a0b0',
              margin: 0,
            }}
          >
            {remaining} card{remaining !== 1 ? 's' : ''} remaining
          </p>

          {studyStreak > 0 && (
            <p
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '0.55rem',
                color: '#ffd700',
                margin: 0,
              }}
            >
              {'\u{1F525}'} {studyStreak}
            </p>
          )}
        </div>

        {/* Card */}
        {questionData ? (
          <>
            <ReviewCard
              question={questionData.question}
              answer={questionData.options[questionData.correctIndex]}
              explanation={questionData.explanation}
              isFlipped={isFlipped}
              onFlip={handleFlip}
            />

            {/* Assessment buttons (shown after flip) */}
            {isFlipped && (
              <div style={{ marginTop: '1.5rem' }}>
                <p
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '0.5rem',
                    color: '#a0a0b0',
                    textAlign: 'center',
                    marginBottom: '1rem',
                  }}
                >
                  How well did you know this?
                </p>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '0.5rem',
                  }}
                >
                  <button
                    className="nes-btn is-error"
                    onClick={() => handleAssess(0)}
                    style={{ fontSize: '0.5rem', padding: '0.5rem 0.25rem' }}
                  >
                    Again
                  </button>
                  <button
                    className="nes-btn is-warning"
                    onClick={() => handleAssess(3)}
                    style={{ fontSize: '0.5rem', padding: '0.5rem 0.25rem' }}
                  >
                    Hard
                  </button>
                  <button
                    className="nes-btn is-primary"
                    onClick={() => handleAssess(4)}
                    style={{ fontSize: '0.5rem', padding: '0.5rem 0.25rem' }}
                  >
                    Good
                  </button>
                  <button
                    className="nes-btn is-success"
                    onClick={() => handleAssess(5)}
                    style={{ fontSize: '0.5rem', padding: '0.5rem 0.25rem' }}
                  >
                    Easy
                  </button>
                </div>
              </div>
            )}

            {/* Flip button (shown before flip) */}
            {!isFlipped && (
              <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                <button className="nes-btn is-primary" onClick={handleFlip}>
                  Flip Card
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="nes-container is-dark" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <p style={{ color: '#a0a0b0', fontSize: '0.8rem' }}>
              Question data not found for this card. Skipping...
            </p>
            <button
              className="nes-btn is-primary"
              onClick={() => handleAssess(4)}
              style={{ marginTop: '1rem' }}
            >
              Next Card
            </button>
          </div>
        )}
      </div>
    );
  }

  // --- COMPLETE ---
  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '1rem' }}>
      <div
        className="nes-container is-dark with-title"
        style={{ textAlign: 'center', padding: '2rem' }}
      >
        <p className="title" style={{ fontSize: '0.65rem' }}>
          Session Complete
        </p>

        <p
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '1.25rem',
            color: '#00ff41',
            marginBottom: '2rem',
          }}
        >
          Well done!
        </p>

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
              {reviewedCount}
            </p>
            <p
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '0.5rem',
                color: '#a0a0b0',
                margin: 0,
              }}
            >
              Cards Reviewed
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
              +{sessionXP}
            </p>
            <p
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '0.5rem',
                color: '#a0a0b0',
                margin: 0,
              }}
            >
              XP Earned
            </p>
          </div>
        </div>

        {studyStreak > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <StreakDisplay streak={studyStreak} lastStudyDate={lastStudyDate} />
          </div>
        )}

        <a href="/">
          <button className="nes-btn is-success">Continue</button>
        </a>
      </div>
    </div>
  );
}
