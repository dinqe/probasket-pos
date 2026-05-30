import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if credentials are set (so we can support offline localStorage fallbacks)
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase environment variables (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY) are not set. ProBasket will run in offline mode using localStorage.'
  );
}

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

/**
 * Dynamically applies worker passcode or admin password headers to the Supabase client.
 * This secures Row Level Security (RLS) queries performed by the anonymous client.
 */
export const setSupabaseAuthHeaders = (adminPassword, workerPasscode) => {
  if (!supabase) return;
  
  if (adminPassword) {
    supabase.rest.headers['x-admin-password'] = adminPassword;
  } else {
    delete supabase.rest.headers['x-admin-password'];
  }
  
  if (workerPasscode) {
    supabase.rest.headers['x-worker-passcode'] = workerPasscode;
  } else {
    delete supabase.rest.headers['x-worker-passcode'];
  }
};

export default supabase;
