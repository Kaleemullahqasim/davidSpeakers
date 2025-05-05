import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase URL or Anonymous Key in environment variables.');
}

// Determine the site URL for proper auth redirects
const getSiteUrl = () => {
  if (typeof window === 'undefined') {
    // Server-side: prioritize different env vars for production vs local
    if (process.env.NODE_ENV === 'production') {
      // For production, use actual deployment URL with fallback to origin
      return process.env.NEXT_PUBLIC_SITE_URL || 'https://david-speakers.vercel.app';
    } else {
      // For local development, use local URL
      return process.env.NEXTAUTH_URL || 'http://localhost:3000';
    }
  }
  
  // Client-side: use the current origin (this is correct)
  return window.location.origin;
};

// Create a single instance of the Supabase client with proper auth options
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'david-speakers-auth-token', // Custom storage key for better isolation
    flowType: 'pkce'
    // Removed invalid siteUrl property
  },
  global: {
    // Set site URL at the global level instead
    headers: {
      'X-Site-URL': getSiteUrl()
    }
  }
});

// Function to completely reset Supabase auth state
export const resetSupabaseAuth = async () => {
  // Clear localStorage
  if (typeof window !== 'undefined') {
    // Clear Supabase-specific storage
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('sb-')) {
        localStorage.removeItem(key);
      }
    });
    
    // Clear cookies
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i];
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      if (name.startsWith('sb-')) { 
        document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      }
    }
  }
  
  // Force signOut to clear server-side state
  try {
    await supabase.auth.signOut({ scope: 'global' });
  } catch (error) {
    console.error('Error during complete auth reset:', error);
  }
};

// Add activity tracking to help with idle detection
export const updateUserActivity = () => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('last-activity', Date.now().toString());
  }
};