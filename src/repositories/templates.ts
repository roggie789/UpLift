import { supabase } from '@/lib/supabase';

/**
 * All Supabase access goes through repositories — screens never import
 * the client directly. Narrow selects only, never select('*') on lists.
 */

export interface TemplateSummary {
  id: string;
  name: string;
  icon: string;
  position: number;
}

export async function listTemplates(): Promise<TemplateSummary[]> {
  const { data, error } = await supabase
    .from('workout_templates')
    .select('id, name, icon, position')
    .order('position');
  if (error) throw error;
  return data;
}

export interface TemplateDetail extends TemplateSummary {
  exercises: {
    id: string;
    exercise_id: string;
    order_index: number;
    default_sets: number;
    target_reps: number;
    exercise: { name: string };
  }[];
}

export async function getTemplate(id: string): Promise<TemplateDetail> {
  const { data, error } = await supabase
    .from('workout_templates')
    .select(
      'id, name, icon, position, exercises:template_exercises(id, exercise_id, order_index, default_sets, target_reps, exercise:exercises(name))',
    )
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as unknown as TemplateDetail;
}

export async function createTemplate(input: {
  name: string;
  icon: string;
  exercises: { exerciseId: string; defaultSets: number; targetReps: number }[];
}): Promise<string> {
  const { data, error } = await supabase.rpc('create_template', {
    p_name: input.name,
    p_icon: input.icon,
    p_exercises: input.exercises.map((e, i) => ({
      exercise_id: e.exerciseId,
      order_index: i,
      default_sets: e.defaultSets,
      target_reps: e.targetReps,
    })),
  });
  if (error) throw error;
  return data as string;
}
