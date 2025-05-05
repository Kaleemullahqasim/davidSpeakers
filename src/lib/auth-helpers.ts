import { supabase } from './supabaseClient'; // Import the singleton instance

// Check if we're in the browser environment
const isBrowser = typeof window !== 'undefined';

// Constants
const AUTH_OPERATION_TIMEOUT = 10000; // 10 seconds

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
 * Refreshes the authentication token
 */
export async function refreshToken(): Promise<string | null> {
  try {
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
    token = await refreshToken(); // refreshToken already handles its own storage updates/clearing
    
    if (!token) {
      // Force logout if refresh fails - Rely on signOut and redirect
      if (isBrowser) {
        localStorage.removeItem('token'); // App token
        sessionStorage.removeItem('token'); // App token
        // REMOVED: Manual Supabase localStorage key clearing loop
        
        // Attempt a clean sign out via Supabase
        supabase.auth.signOut().catch(err => console.error('fetchWithAuth: Supabase signOut error after failed refresh:', err));
        
        // Redirect to login
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
      const newToken = await refreshToken(); // refreshToken handles its own storage updates/clearing
      
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
        // Force logout if refresh fails - Rely on signOut and redirect
        if (isBrowser) {
          localStorage.removeItem('token'); // App token
          sessionStorage.removeItem('token'); // App token
          // REMOVED: Manual Supabase localStorage key clearing loop
          
          // Attempt a clean sign out via Supabase
          supabase.auth.signOut().catch(err => console.error('fetchWithAuth: Supabase signOut error after 401 refresh failure:', err));
          
          // Redirect to login
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
