import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Log configuration (without exposing the full key)
console.log('Supabase Configuration:', {
  url: supabaseUrl,
  keyProvided: !!supabaseAnonKey,
  keyLength: supabaseAnonKey?.length || 0
});

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables!');
}

// Create client with timeout handling for better stability
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Set up a utility function to handle timeouts in fetch operations
export async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 30000) {
  const controller = new AbortController();
  const { signal } = controller;
  
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}