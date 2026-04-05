/**
 * Supabase client — stubbed for now.
 * Replace SUPABASE_URL and SUPABASE_ANON_KEY with real values when ready.
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://placeholder.supabase.co';
const SUPABASE_ANON_KEY = 'placeholder-key';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
