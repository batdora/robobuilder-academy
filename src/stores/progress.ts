import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { sm2 } from '../lib/sm2';

export interface ReviewCard {
  questionId: string;
  moduleId: string;
  nextReviewDate: string;
  interval: number;
  easeFactor: number;
  repetitions: number;
}

interface QuizAttempt {
  score: number;
  total: number;
  date: string;
}

interface ProgressStore {
  completedLessons: string[];
  currentLesson: string | null;
  robotParts: string[];
  activeParts: string[];
  robotName: string;
  totalXP: number;
  moduleXP: Record<string, number>;
  quizAttempts: Record<string, QuizAttempt>;
  bestScores: Record<string, number>;
  reviewQueue: ReviewCard[];
  studyStreak: number;
  lastStudyDate: string;
  completedChallenges: string[];
  challengeScores: Record<string, number>;

  completeLesson: (lessonId: string, robotPart: string, xp: number, moduleId: string) => void;
  submitQuiz: (quizId: string, score: number, total: number, incorrectIds: string[], moduleId: string) => void;
  toggleRobotPart: (part: string) => void;
  reviewCard: (questionId: string, quality: number) => void;
  setRobotName: (name: string) => void;
  isPartUnlocked: (part: string) => boolean;
  isLessonAvailable: (lessonId: string, requiresParts: string[]) => boolean;
  getDueReviewCards: () => ReviewCard[];
}

function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

function updateStreak(lastStudyDate: string, currentStreak: number): { studyStreak: number; lastStudyDate: string } {
  const today = getTodayISO();
  if (lastStudyDate === today) {
    return { studyStreak: currentStreak, lastStudyDate: today };
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayISO = yesterday.toISOString().split('T')[0];

  if (lastStudyDate === yesterdayISO) {
    return { studyStreak: currentStreak + 1, lastStudyDate: today };
  }

  return { studyStreak: 1, lastStudyDate: today };
}

export const useProgressStore = create<ProgressStore>()(
  persist(
    (set, get) => ({
      completedLessons: [],
      currentLesson: null,
      robotParts: [],
      activeParts: [],
      robotName: 'RoboBuilder',
      totalXP: 0,
      moduleXP: {},
      quizAttempts: {},
      bestScores: {},
      reviewQueue: [],
      studyStreak: 0,
      lastStudyDate: '',
      completedChallenges: [],
      challengeScores: {},

      completeLesson: (lessonId, robotPart, xp, moduleId) => {
        const state = get();
        if (state.completedLessons.includes(lessonId)) return;

        const streak = updateStreak(state.lastStudyDate, state.studyStreak);
        const hasRealPart = robotPart && robotPart !== '__NONE__' && robotPart.length > 0;
        const newParts = hasRealPart && !state.robotParts.includes(robotPart)
          ? [...state.robotParts, robotPart]
          : state.robotParts;
        const newActiveParts = hasRealPart && !state.activeParts.includes(robotPart)
          ? [...state.activeParts, robotPart]
          : state.activeParts;

        set({
          completedLessons: [...state.completedLessons, lessonId],
          currentLesson: lessonId,
          robotParts: newParts,
          activeParts: newActiveParts,
          totalXP: state.totalXP + xp,
          moduleXP: {
            ...state.moduleXP,
            [moduleId]: (state.moduleXP[moduleId] ?? 0) + xp,
          },
          ...streak,
        });
      },

      submitQuiz: (quizId, score, total, incorrectIds, moduleId) => {
        const state = get();
        const streak = updateStreak(state.lastStudyDate, state.studyStreak);
        const xp = score * 10;
        const currentBest = state.bestScores[quizId] ?? 0;

        const newReviewCards: ReviewCard[] = incorrectIds
          .filter((id) => !state.reviewQueue.some((c) => c.questionId === id))
          .map((id) => ({
            questionId: id,
            moduleId,
            nextReviewDate: new Date().toISOString(),
            interval: 1,
            easeFactor: 2.5,
            repetitions: 0,
          }));

        set({
          quizAttempts: {
            ...state.quizAttempts,
            [quizId]: { score, total, date: new Date().toISOString() },
          },
          bestScores: {
            ...state.bestScores,
            [quizId]: Math.max(currentBest, score),
          },
          totalXP: state.totalXP + xp,
          moduleXP: {
            ...state.moduleXP,
            [moduleId]: (state.moduleXP[moduleId] ?? 0) + xp,
          },
          reviewQueue: [...state.reviewQueue, ...newReviewCards],
          ...streak,
        });
      },

      toggleRobotPart: (part) => {
        const state = get();
        const isActive = state.activeParts.includes(part);
        set({
          activeParts: isActive
            ? state.activeParts.filter((p) => p !== part)
            : [...state.activeParts, part],
        });
      },

      reviewCard: (questionId, quality) => {
        const state = get();
        const streak = updateStreak(state.lastStudyDate, state.studyStreak);
        const cardIndex = state.reviewQueue.findIndex((c) => c.questionId === questionId);
        if (cardIndex === -1) return;

        const updatedCard = sm2(state.reviewQueue[cardIndex], quality);
        const newQueue = [...state.reviewQueue];
        newQueue[cardIndex] = updatedCard;

        set({
          reviewQueue: newQueue,
          totalXP: state.totalXP + (quality >= 3 ? 5 : 0),
          ...streak,
        });
      },

      setRobotName: (name) => set({ robotName: name }),

      isPartUnlocked: (part) => get().robotParts.includes(part),

      isLessonAvailable: (_lessonId, requiresParts) => {
        const state = get();
        return requiresParts.every((p) => state.robotParts.includes(p));
      },

      getDueReviewCards: () => {
        const now = new Date();
        return get().reviewQueue.filter((card) => new Date(card.nextReviewDate) <= now);
      },
    }),
    {
      name: 'robobuilder-progress',
    },
  ),
);
