import { createClient } from '@supabase/supabase-js';

export const isSupabaseConfigured = (): boolean => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_KEY;
  return !!(
    url &&
    url !== '' &&
    !url.includes('your-supabase-project') &&
    key &&
    key !== '' &&
    !key.includes('your-supabase-anon-key')
  );
};

export const getSupabaseClient = () => {
  if (!isSupabaseConfigured()) return null;
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);
};
