import { createClient } from '@supabase/supabase-js';
import { safeStorage } from './safeStorage';

// This public configuration points to the Fluxo Casal Supabase project.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://kwhbkkvoahxztzzscdnm.supabase.co';
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_ZCYWa_iO0T0VGjWQF4CBCA_rXzCjBjh';

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: safeStorage,
  },
});
