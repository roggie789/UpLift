import { supabase } from '@/lib/supabase';

export interface Profile {
  id: string;
  display_name: string;
  level: number;
  total_xp: number;
}

export async function getProfile(): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, level, total_xp')
    .single();
  if (error) throw error;
  return data;
}
