import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://twlrmcjxatgningmuiwz.supabase.co';
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_XExhrVpovi-AyiBIkBrwlA_t4OEklf0';

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error('Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY.');
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
