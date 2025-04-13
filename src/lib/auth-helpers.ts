import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with proper types
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Check if we're in the browser environment
const isBrowser = typeof window !== 'undefined';

// Create supabase client only on the client side
const supabase = isBrowser 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export async function getAuthToken(): Promise<string | null> {
  try {
    if (!supabase) {
      console.error('Supabase client not available (server-side render)');
      return null;
    }
    
    const { data, error } = await supabase.auth.getSession();
    
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
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error('Error refreshing token:', error);
      return null;
    }
    
    if (!data?.session?.access_token) {
      console.log('No new session received during refresh');
      return null;
    }
    
    // Update stored tokens
    localStorage.setItem('token', data.session.access_token);
    sessionStorage.setItem('token', data.session.access_token);
    
    console.log('Token refreshed successfully');
    return data.session.access_token;
  } catch (error) {
    console.error('Error in refreshToken:', error);
    return null;
  }
}

// Helper functions for authentication and authorization

/**
 * A helper function to make authenticated API requests
 */
export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  // Get the token from localStorage
  let token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error('No authentication token found. Please log in.');
  }
  
  // Check if token is expired
  if (isTokenExpired(token)) {
    console.log('Token is expired, attempting to refresh...');
    token = await refreshToken();
    
    if (!token) {
      // Force logout if refresh fails
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
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
  return fetch(url, {
    ...options,
    headers: authHeaders
  });
}

/**
 * Get JWT token expiration timestamp
 */
export function getTokenExpiration(token: string): number | null {
  try {
    // Extract the payload part of the JWT
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    // Parse the JSON payload
    const payload = JSON.parse(window.atob(base64));
    
    // Return the expiration timestamp
    return payload.exp * 1000; // Convert to milliseconds
  } catch (error) {
    console.error('Error parsing token:', error);
    return null;
  }
}

/**
 * Check if a token is expired
 */
export function isTokenExpired(token: string): boolean {
  const expiration = getTokenExpiration(token);
  if (!expiration) return true;
  
  // Return true if token is expired or will expire in the next 30 seconds
  // This gives us a buffer to refresh tokens before they actually expire
  return Date.now() > (expiration - 30000);
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
