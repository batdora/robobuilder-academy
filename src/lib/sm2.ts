import type { ReviewCard } from '../stores/progress';

export function sm2(card: ReviewCard, quality: number): ReviewCard {
  const clampedQuality = Math.max(0, Math.min(5, Math.round(quality)));

  let { interval, easeFactor, repetitions } = card;

  if (clampedQuality < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    easeFactor = easeFactor + (0.1 - (5 - clampedQuality) * (0.08 + (5 - clampedQuality) * 0.02));
    if (easeFactor < 1.3) easeFactor = 1.3;

    repetitions += 1;

    if (repetitions === 1) {
      interval = 1;
    } else if (repetitions === 2) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
  }

  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + interval);

  return {
    ...card,
    interval,
    easeFactor,
    repetitions,
    nextReviewDate: nextReviewDate.toISOString(),
  };
}
