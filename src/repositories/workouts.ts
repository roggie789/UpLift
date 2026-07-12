import { supabase } from '@/lib/supabase';
import type { ActiveExercise } from '@/stores/activeWorkout';

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
