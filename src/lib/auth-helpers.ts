import { supabase, resetSupabaseAuth } from './supabaseClient'; // Import the singleton instance

// Check if we're in the browser environment
const isBrowser = typeof window !== 'undefined';

// Constants
const AUTH_OPERATION_TIMEOUT = 15000; // 15 seconds timeout for auth operations

// Track if a token refresh is currently in progress to prevent multiple simultaneous attempts
let isRefreshingToken = false;
// Similarly track logout operations
let isLoggingOut = false;

export async function getAuthToken(): Promise<string | null> {
  try {
    if (!supabase) {
      console.error('Supabase client not available (server-side render)');
      return null;
    }
    
    // Create a timeout promise
    const sessionPromise = supabase.auth.getSession();
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Get auth token timed out')), AUTH_OPERATION_TIMEOUT);
    });
    
    // Race the promises
    const { data, error } = await Promise.race([
      sessionPromise,
      timeoutPromise.then(() => ({ data: null, error: new Error('Get auth token timed out') }))
    ]) as any;
    
    if (error) {
      console.error('Error getting auth session:', error);
      return null;
    }
    
    if (!data?.session?.access_token) {
      console.log('No active session found');
      return null;
    }
    
    return data.session.access_token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

/**
 * Get the last activity timestamp from localStorage
 */
export function getLastActivity(): number | null {
  if (!isBrowser) return null;
  const lastActivity = localStorage.getItem('last-activity');
  return lastActivity ? parseInt(lastActivity, 10) : null;
}

/**
 * Update the last activity timestamp
 */
export function updateLastActivity(): void {
  if (isBrowser) {
    localStorage.setItem('last-activity', Date.now().toString());
  }
}

/**
 * Refreshes the authentication token
 */
export async function refreshToken(): Promise<string | null> {
  // Add idle detection with more graceful handling
  const lastActivity = getLastActivity();
  const now = Date.now();
  const IDLE_THRESHOLD = 10 * 60 * 1000; // 10 minutes
  
  // For production idle periods: use a more graceful approach
  if (process.env.NODE_ENV === 'production' && 
      lastActivity && 
      (now - lastActivity > IDLE_THRESHOLD)) {
    console.log(`Long idle period detected (${Math.round((now - lastActivity)/1000/60)} minutes), attempting graceful refresh`);
    
    try {
      // Try a normal refresh first instead of aggressive reset
      const { data } = await supabase.auth.refreshSession();
      
      // Only if refresh completely fails, then clean up local tokens
      if (!data?.session) {
        console.log('No session after refresh attempt during idle period');
        if (isBrowser) {
          localStorage.removeItem('token');
          sessionStorage.removeItem('token');
          // Return null to trigger re-login instead of aggressive reset
          return null;
        }
      } else if (data?.session?.access_token) {
        // Update stored tokens
        if (isBrowser) {
          localStorage.setItem('token', data.session.access_token);
          sessionStorage.setItem('token', data.session.access_token);
          // Also update last activity timestamp
          updateLastActivity();
        }
        console.log('Session successfully refreshed after idle period');
        return data.session.access_token;
      }
    } catch (error) {
      console.error('Error during idle refresh:', error);
      // Continue to normal refresh flow instead of failing
    }
  }
  
  // Don't allow multiple simultaneous refresh attempts
  if (isRefreshingToken) {
    console.log('Token refresh already in progress, waiting...');
    await new Promise(resolve => setTimeout(resolve, 500));
    return getAuthToken(); // Just get the current token instead of trying a new refresh
  }
  
  try {
    isRefreshingToken = true;
    if (!supabase) {
      console.error('Supabase client not available (server-side render)');
      return null;
    }
    
    console.log('Attempting to refresh token...');
    
    // Create a timeout promise
    const refreshPromise = supabase.auth.refreshSession();
    const timeoutPromise = new Promise<{data: null, error: Error}>((_, reject) => {
      setTimeout(() => reject(new Error('Token refresh timed out')), AUTH_OPERATION_TIMEOUT);
    });
    
    try {
      // Race the promises with proper error handling
      const { data, error } = await Promise.race([
        refreshPromise,
        timeoutPromise
      ]);
      
      if (error) {
        console.error('Error refreshing token:', error);
        // Make sure we clean up local storage on refresh error
        if (isBrowser) {
          localStorage.removeItem('token');
          sessionStorage.removeItem('token');
        }
        return null;
      }
      
      if (!data?.session?.access_token) {
        console.log('No new session received during refresh');
        return null;
      }
      
      // Update stored tokens
      if (isBrowser) {
        localStorage.setItem('token', data.session.access_token);
        sessionStorage.setItem('token', data.session.access_token);
        // Also update the last activity timestamp
        updateLastActivity();
      }
      
      console.log('Token refreshed successfully');
      return data.session.access_token;
    } catch (innerError) {
      console.error('Error in token refresh race:', innerError);
      // Cleanup on timeout or other errors
      if (isBrowser) {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
      }
      return null;
    }
  } catch (error) {
    console.error('Error in refreshToken:', error);
    // Ensure cleanup happens even in the outer catch block
    if (isBrowser) {
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
    }
    return null;
  } finally {
    // Always reset the flag when done
    isRefreshingToken = false;
  }
}

// Helper functions for authentication and authorization

/**
 * A helper function to make authenticated API requests
 */
export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  // Get the token from localStorage
  let token = isBrowser ? localStorage.getItem('token') : null;
  
  if (!token) {
    throw new Error('No authentication token found. Please log in.');
  }
  
  // Check if token is expired
  if (isTokenExpired(token)) {
    console.log('Token is expired, attempting to refresh...');
    token = await refreshToken();
    
    if (!token) {
      // Force logout if refresh fails
      if (isBrowser) {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        // Clear any Supabase-specific storage
        Object.keys(localStorage).forEach(key => {
          if (/^sb-.*-auth-token$/.test(key)) {
            localStorage.removeItem(key);
          }
        });
        window.location.href = '/login?expired=true';
      }
      throw new Error('Session expired. Please log in again.');
    }
  }
  
  // Add the authorization header to the request
  const authHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  // Return the fetch promise
  try {
    const response = await fetch(url, {
      ...options,
      headers: authHeaders
    });
    
    // If we get a 401 Unauthorized, try to refresh the token once
    if (response.status === 401) {
      console.log('Got 401 response, attempting to refresh token...');
      const newToken = await refreshToken();
      
      if (newToken) {
        // Retry the request with the new token
        return fetch(url, {
          ...options,
          headers: {
            ...authHeaders,
            'Authorization': `Bearer ${newToken}`
          }
        });
      } else {
        // Force logout if refresh fails
        if (isBrowser) {
          localStorage.removeItem('token');
          sessionStorage.removeItem('token');
          // Clear any Supabase-specific storage
          Object.keys(localStorage).forEach(key => {
            if (/^sb-.*-auth-token$/.test(key)) {
              localStorage.removeItem(key);
            }
          });
          window.location.href = '/login?expired=true';
        }
        throw new Error('Session expired during request. Please log in again.');
      }
    }
    
    return response;
  } catch (error) {
    console.error('Error in fetchWithAuth:', error);
    throw error;
  }
}

/**
 * Get JWT token expiration timestamp
 */
export function getTokenExpiration(token: string): number | null {
  try {
    if (!token || typeof token !== 'string') {
      console.error('Invalid token provided to getTokenExpiration');
      return null;
    }
    
    // Check if the token has the expected JWT format
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('Token does not appear to be a valid JWT');
      return null;
    }
    
    // Extract the payload part of the JWT
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    
    // Parse the JSON payload
    try {
      const payload = JSON.parse(window.atob(base64));
      
      // Return the expiration timestamp
      if (!payload.exp) {
        console.warn('Token payload does not contain expiration');
        return null;
      }
      
      return payload.exp * 1000; // Convert to milliseconds
    } catch (parseError) {
      console.error('Error parsing token payload:', parseError);
      return null;
    }
  } catch (error) {
    console.error('Error in getTokenExpiration:', error);
    return null;
  }
}

/**
 * Check if a token is expired
 */
export function isTokenExpired(token: string): boolean {
  if (!token) {
    console.warn('No token provided to isTokenExpired');
    return true;
  }
  
  const expiration = getTokenExpiration(token);
  if (!expiration) {
    console.warn('Could not determine token expiration, treating as expired');
    return true;
  }
  
  // Return true if token is expired or will expire in the next 60 seconds
  // Increased buffer from 30s to 60s to give more time for token refresh
  const expirationBuffer = 60000; // 60 seconds in ms
  const isExpired = Date.now() > (expiration - expirationBuffer);
  
  if (isExpired) {
    console.log(`Token will expire soon or has expired. Current time: ${new Date(Date.now()).toISOString()}, Expiration: ${new Date(expiration).toISOString()}`);
  }
  
  return isExpired;
}

/**
 * Get role-specific redirect path
 */
export function getRoleRedirectPath(role: string): string {
  switch (role) {
    case 'admin':
      return '/dashboard/admin';
    case 'coach':
      return '/dashboard/coach';
    case 'student':
      return '/dashboard/student';
    default:
      return '/dashboard';
  }
}

/**
 * Enhanced logout function that handles session cleanup
 * This provides a more reliable logout mechanism especially after idle periods
 */
export async function performLogout(): Promise<boolean> {
  if (isLoggingOut) {
    console.log('Logout already in progress, waiting...');
    return false;
  }
  
  try {
    isLoggingOut = true;
    console.log('Performing logout with enhanced cleanup...');
    
    // 1. Clear all local state (tokens, etc) FIRST before any async operations
    if (isBrowser) {
      // Clear application tokens
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      localStorage.removeItem('last-activity');
      
      // Clear Supabase tokens from localStorage
      Object.keys(localStorage).forEach(key => {
        if (/^sb-.*-auth-token$/.test(key) || key.includes('supabase')) {
          console.log(`Removing Supabase localStorage key: ${key}`);
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
    
    // 2. After local cleanup, attempt Supabase signOut with timeout protection
    try {
      const logoutPromise = supabase.auth.signOut({ scope: 'global' });
      const timeoutPromise = new Promise<{error: Error}>((_, reject) => {
        setTimeout(() => reject(new Error('Logout timed out')), 5000); // Shorter timeout for logout
      });
      
      await Promise.race([
        logoutPromise,
        timeoutPromise
      ]);
      
      console.log('Logout successful');
      return true;
    } catch (error) {
      console.error('Error or timeout during logout:', error);
      // Even if the server-side signOut fails, we've already cleared client state
      // so the user can still be considered logged out from the client's perspective
      return true;
    }
  } catch (error) {
    console.error('Unexpected error in performLogout:', error);
    return false;
  } finally {
    isLoggingOut = false;
  }
}
