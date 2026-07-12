import { supabase } from '@/lib/supabase';

export interface Exercise {
  id: string;
  name: string;
  muscle_group: string;
  equipment: string;
}

export async function listExercises(): Promise<Exercise[]> {
  const { data, error } = await supabase
    .from('exercises')
    .select('id, name, muscle_group, equipment')
    .order('name');
  if (error) throw error;
  return data;
}
