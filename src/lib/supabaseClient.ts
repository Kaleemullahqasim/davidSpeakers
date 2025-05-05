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
  console.log('Starting complete Supabase auth reset...');
  
  try {
    // First attempt to signOut to clear server-side state
    // This is important to do first to ensure the server session is terminated
    try {
      console.log('Attempting to sign out from Supabase...');
      await supabase.auth.signOut({ scope: 'global' });
      console.log('Supabase signOut completed');
    } catch (error) {
      // Don't let signOut errors stop the cleanup process
      console.error('Error during Supabase signOut:', error);
    }
    
    // Clear localStorage
    if (typeof window !== 'undefined') {
      console.log('Clearing localStorage tokens and auth state...');
      
      // Clear application-specific tokens
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      localStorage.removeItem('last-activity');
      
      // Clear all Supabase-related storage (use broader pattern matching)
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-') || 
            key.includes('supabase') || 
            key.includes('auth') ||
            key.includes('david-speakers-auth')) {
          console.log(`Removing localStorage key: ${key}`);
          localStorage.removeItem(key);
        }
      });
      
      // Clear cookies with more thorough approach
      console.log('Clearing auth-related cookies...');
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        if (name.startsWith('sb-') || name.includes('supabase') || name.includes('auth')) { 
          // Set Path=/ to ensure cookie is properly cleared regardless of path
          document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax; Secure;';
        }
      }
    }
    
    // Important: Create a small delay to ensure all cleanup processes have completed
    // This helps prevent race conditions with browser storage
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log('Authentication state reset complete.');
    return true;
  } catch (error) {
    console.error('Error during complete auth reset:', error);
    return false;
  }
};

// Add activity tracking to help with idle detection
export const updateUserActivity = () => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('last-activity', Date.now().toString());
  }
};