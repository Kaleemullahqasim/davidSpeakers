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
    detectSessionInUrl: true, // Important for redirects
    storageKey: 'david-speakers-auth-token', // Custom storage key
    flowType: 'pkce'
  },
  // Remove global headers, not needed here
});

// Function to completely reset Supabase auth state
export const resetSupabaseAuth = async () => {
  console.log('[resetSupabaseAuth] Starting complete Supabase auth reset...');
  
  try {
    // 1. Attempt to sign out from Supabase first (with timeout)
    // This helps clear server-side session state if possible
    try {
      console.log('[resetSupabaseAuth] Attempting supabase.auth.signOut()...');
      const signOutPromise = supabase.auth.signOut({ scope: 'global' });
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Supabase signOut timed out during reset')), 5000) // 5s timeout
      );
      
      await Promise.race([signOutPromise, timeoutPromise]);
      console.log('[resetSupabaseAuth] supabase.auth.signOut() completed or timed out.');
    } catch (error) {
      console.warn('[resetSupabaseAuth] Error during supabase.auth.signOut() (ignoring):', error);
      // Don't let signOut errors stop the cleanup, but log them.
    }

    // 2. Clear all relevant browser storage
    if (typeof window !== 'undefined') {
      console.log('[resetSupabaseAuth] Clearing localStorage and sessionStorage...');
      
      // Clear application-specific tokens
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      localStorage.removeItem('last-activity');
      
      // Clear all Supabase-related localStorage items more broadly
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('sb-') || key.includes('supabase') || key.includes('auth'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => {
        console.log(`[resetSupabaseAuth] Removing localStorage key: ${key}`);
        localStorage.removeItem(key);
      });

      // Clear Supabase-related cookies
      console.log('[resetSupabaseAuth] Clearing auth-related cookies...');
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        // Target common Supabase cookie names or patterns
        if (name.startsWith('sb-') || name.includes('supabase') || name.includes('auth')) { 
          console.log(`[resetSupabaseAuth] Clearing cookie: ${name}`);
          // Clear cookie by setting expiry date to the past, ensuring Path=/
          document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax; Secure;';
          // Also try clearing without domain, path, secure just in case
          document.cookie = name + '=; Expires=Thu, 01 Jan 1970 00:00:01 GMT;'; 
        }
      }
    }
    
    // 3. Short delay to allow browser storage operations to settle
    console.log('[resetSupabaseAuth] Waiting briefly for storage operations...');
    await new Promise(resolve => setTimeout(resolve, 150)); // Slightly longer delay
    
    console.log('[resetSupabaseAuth] Authentication state reset complete.');
    return true;
  } catch (error) {
    console.error('[resetSupabaseAuth] Critical error during auth reset:', error);
    // Return false on critical errors, though cleanup might be partial
    return false; 
  }
};

// Add activity tracking to help with idle detection
export const updateUserActivity = () => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('last-activity', Date.now().toString());
  }
};