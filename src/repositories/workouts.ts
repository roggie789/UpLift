import { supabase } from '@/lib/supabase';
import type { ActiveExercise } from '@/stores/activeWorkout';
import type { ExerciseBests } from '@/features/gamification/engine';

export interface WorkoutPrep {
  /** All-time bests per exercise id, for PR detection */
  bests: Record<string, ExerciseBests>;
  /** Most recent session's sets per exercise id, for input placeholders */
  lastSession: Record<string, { weightKg: number; reps: number }[]>;
}

/**
 * Fetches PR bests and last-session sets for a list of exercises in one RPC —
 * called once when a workout starts.
 */
export async function getWorkoutPrep(exerciseIds: string[]): Promise<WorkoutPrep> {
  if (exerciseIds.length === 0) return { bests: {}, lastSession: {} };

  const { data, error } = await supabase.rpc('get_workout_prep', {
    p_exercise_ids: exerciseIds,
  });
  if (error) throw error;

  const prep: WorkoutPrep = { bests: {}, lastSession: {} };
  for (const row of data as {
    exercise_id: string;
    max_weight_kg: number;
    max_reps: number;
    last_sets: { weight_kg: number; reps: number }[];
  }[]) {
    prep.bests[row.exercise_id] = { maxWeightKg: row.max_weight_kg, maxReps: row.max_reps };
    prep.lastSession[row.exercise_id] = row.last_sets.map((s) => ({
      weightKg: s.weight_kg,
      reps: s.reps,
    }));
  }
  return prep;
}

/**
 * Writes the entire finished workout (session + exercises + sets + XP events)
 * in ONE batched RPC call — the single API write for a whole gym session.
 */
export async function finishWorkout(input: {
  templateId: string | null;
  startedAt: string;
  exercises: ActiveExercise[];
  totalXp: number;
}): Promise<{ sessionId: string }> {
  const { data, error } = await supabase.rpc('finish_workout', {
    p_template_id: input.templateId,
    p_started_at: input.startedAt,
    p_total_xp: input.totalXp,
    p_exercises: input.exercises.map((e, i) => ({
      exercise_id: e.exerciseId,
      order_index: i,
      sets: e.sets.map((s) => ({
        set_number: s.setNumber,
        weight_kg: s.weightKg,
        reps: s.reps,
        rpe: s.rpe ?? null,
        completed_at: s.completedAt,
      })),
    })),
  });
  if (error) throw error;
  return { sessionId: data as string };
}

export interface SessionSummary {
  id: string;
  started_at: string;
  finished_at: string;
  total_xp: number;
}

export async function listSessions(limit = 30): Promise<SessionSummary[]> {
  const { data, error } = await supabase
    .from('workout_sessions')
    .select('id, started_at, finished_at, total_xp')
    .order('started_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}
