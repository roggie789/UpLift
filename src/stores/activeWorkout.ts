import { create } from 'zustand';
import { detectPrs, xpForSet, type ExerciseBests, type PrResult } from '@/features/gamification/engine';

export interface LoggedSet {
  setNumber: number;
  weightKg: number;
  reps: number;
  rpe?: number;
  xp: number;
  prs: PrResult[];
  completedAt: string;
}

export interface ActiveExercise {
  exerciseId: string;
  name: string;
  targetSets: number;
  targetReps: number;
  /** Last session's values, shown as input placeholders */
  lastSession?: { weightKg: number; reps: number }[];
  sets: LoggedSet[];
}

interface ActiveWorkoutState {
  startedAt: string | null;
  templateId: string | null;
  exercises: ActiveExercise[];
  /** Known bests per exercise, loaded when the workout starts (for PR detection) */
  bests: Record<string, ExerciseBests>;
  totalXp: number;

  start: (opts: { templateId: string | null; exercises: ActiveExercise[]; bests: Record<string, ExerciseBests> }) => void;
  /** Adds an exercise mid-workout (freestyle mode). No-op if already present. */
  addExercise: (exercise: ActiveExercise, bests?: ExerciseBests) => void;
  logSet: (exerciseId: string, set: { weightKg: number; reps: number; rpe?: number }) => LoggedSet | null;
  reset: () => void;
}

/**
 * The in-progress workout lives entirely in this store.
 * Logging a set makes ZERO API calls — the whole session is written to
 * Supabase in one batched RPC when the user finishes (see finishWorkout repository).
 */
export const useActiveWorkout = create<ActiveWorkoutState>((set, get) => ({
  startedAt: null,
  templateId: null,
  exercises: [],
  bests: {},
  totalXp: 0,

  start: ({ templateId, exercises, bests }) =>
    set({ startedAt: new Date().toISOString(), templateId, exercises, bests, totalXp: 0 }),

  addExercise: (exercise, bests) => {
    const state = get();
    if (state.exercises.some((e) => e.exerciseId === exercise.exerciseId)) return;
    set({
      exercises: [...state.exercises, exercise],
      bests: bests ? { ...state.bests, [exercise.exerciseId]: bests } : state.bests,
    });
  },

  logSet: (exerciseId, input) => {
    const state = get();
    const exercise = state.exercises.find((e) => e.exerciseId === exerciseId);
    if (!exercise || !state.startedAt) return null;

    const prs = detectPrs(input, state.bests[exerciseId]);
    const xp = xpForSet(input, prs.length);
    const logged: LoggedSet = {
      setNumber: exercise.sets.length + 1,
      weightKg: input.weightKg,
      reps: input.reps,
      rpe: input.rpe,
      xp,
      prs,
      completedAt: new Date().toISOString(),
    };

    set({
      exercises: state.exercises.map((e) =>
        e.exerciseId === exerciseId ? { ...e, sets: [...e.sets, logged] } : e,
      ),
      bests: {
        ...state.bests,
        [exerciseId]: {
          maxWeightKg: Math.max(state.bests[exerciseId]?.maxWeightKg ?? 0, input.weightKg),
          maxReps: Math.max(state.bests[exerciseId]?.maxReps ?? 0, input.reps),
        },
      },
      totalXp: state.totalXp + xp,
    });
    return logged;
  },

  reset: () => set({ startedAt: null, templateId: null, exercises: [], bests: {}, totalXp: 0 }),
}));
