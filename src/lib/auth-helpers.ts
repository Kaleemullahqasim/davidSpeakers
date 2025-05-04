import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with proper types
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Check if we're in the browser environment
const isBrowser = typeof window !== 'undefined';

// Get the current site URL for proper redirects
const getSiteUrl = () => {
  if (isBrowser) {
    return window.location.origin;
  }
  // Default fallback - should be overridden by actual origin in browser
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://david-speakers-pcas.vercel.app';
};

// Create supabase client only on the client side
const supabase = isBrowser 
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        flowType: 'implicit',
        site_url: getSiteUrl()
      }
    })
  : null;

// Environment-specific configuration
const ENV_CONFIG = {
  development: {
    authTimeout: 5000,
    retryAttempts: 1
  },
  production: {
    authTimeout: 15000, // Longer timeout for production
    retryAttempts: 2    // Allow more retries in production
  }
};

// Get environment-specific configuration
const getEnvConfig = () => {
  const env = process.env.NODE_ENV === 'production' ? 'production' : 'development';
  return ENV_CONFIG[env];
};

// Timeout for auth operations to prevent hanging
const AUTH_OPERATION_TIMEOUT = getEnvConfig().authTimeout;

/**
 * Wraps an async function with a timeout
 */
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> {
  let timeoutId: NodeJS.Timeout;
  
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeoutMs);
  });
  
  return Promise.race([
    promise.then(result => {
      clearTimeout(timeoutId);
      return result;
    }),
    timeoutPromise
  ]);
}

/**
 * Retry an async operation with exponential backoff
 */
async function withRetry<T>(
  operation: () => Promise<T>, 
  maxRetries: number = getEnvConfig().retryAttempts
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // If not the first attempt, add a delay with exponential backoff
      if (attempt > 0) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Max 5 second delay
        console.log(`Retry attempt ${attempt}/${maxRetries} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      return await operation();
    } catch (error) {
      console.error(`Attempt ${attempt + 1}/${maxRetries + 1} failed:`, error);
      lastError = error;
      
      // If this is a "no retry" type of error, break immediately
      if (error?.message?.includes('Invalid login credentials') || 
          error?.message?.includes('invalid refresh token')) {
        throw error;
      }
    }
  }
  
  throw lastError || new Error('Operation failed after retries');
}

export async function getAuthToken(): Promise<string | null> {
  try {
    if (!supabase) {
      console.error('Supabase client not available (server-side render)');
      return null;
    }
    
    const sessionPromise = supabase.auth.getSession();
    const { data, error } = await withTimeout(
      sessionPromise,
      AUTH_OPERATION_TIMEOUT,
      'Timeout getting auth session'
    );
    
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
    
    // In production, we might need to handle different error scenarios
    const refreshOperation = async () => {
      const refreshPromise = supabase.auth.refreshSession();
      try {
        const { data, error } = await withTimeout(
          refreshPromise,
          AUTH_OPERATION_TIMEOUT,
          'Timeout refreshing token'
        );
        
        if (error) {
          console.error('Error refreshing token:', error);
          // Log more details about the error
          console.error('Error details:', {
            message: error.message,
            status: error.status,
            name: error.name
          });
          
          // Clear tokens if refresh fails due to invalid refresh token
          if (error.message.includes('invalid refresh token') || 
              error.message.includes('expired') ||
              error.message.includes('JWT')) {
            if (isBrowser) {
              console.log('Clearing invalid tokens from storage');
              localStorage.removeItem('token');
              sessionStorage.removeItem('token');
              
              // Also clear other Supabase storage
              for (const key of Object.keys(localStorage)) {
                if (key.startsWith('sb-') || key.includes('supabase')) {
                  localStorage.removeItem(key);
                }
              }
            }
          }
          throw error;
        }
        
        if (!data?.session?.access_token) {
          console.log('No new session received during refresh');
          throw new Error('No session in refresh response');
        }
        
        // Update stored tokens
        if (isBrowser) {
          console.log('Token refreshed successfully, updating storage');
          localStorage.setItem('token', data.session.access_token);
          sessionStorage.setItem('token', data.session.access_token);
        }
        
        console.log('Token refreshed successfully');
        return data.session.access_token;
      } catch (timeoutError) {
        console.error('Refresh token operation timed out:', timeoutError);
        throw timeoutError;
      }
    };
    
    // Use retry mechanism in production
    return await withRetry(refreshOperation);
  } catch (error) {
    console.error('Error in refreshToken:', error);
    logAuthError('Token Refresh Failed', error);
    
    // Force cleanup on any refresh error
    if (isBrowser) {
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      
      // For critical failures in production, redirect to login
      if (process.env.NODE_ENV === 'production' && error?.message !== 'Invalid login credentials') {
        console.log('Critical auth error - redirecting to login');
        window.location.href = '/login?expired=true';
      }
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
    
    try {
      token = await withTimeout(
        refreshToken(),
        AUTH_OPERATION_TIMEOUT,
        'Timeout refreshing token during fetch'
      );
      
      if (!token) {
        // Force logout if refresh fails
        if (isBrowser) {
          localStorage.removeItem('token');
          sessionStorage.removeItem('token');
          window.location.href = '/login?expired=true';
        }
        throw new Error('Session expired. Please log in again.');
      }
    } catch (error) {
      console.error('Error refreshing token during fetch:', error);
      // Force logout on any refresh error
      if (isBrowser) {
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
  try {
    const expiration = getTokenExpiration(token);
    if (!expiration) return true;
    
    // Return true if token is expired or will expire in the next 30 seconds
    // This gives us a buffer to refresh tokens before they actually expire
    return Date.now() > (expiration - 30000);
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true; // Treat as expired if we can't verify
  }
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
 * Helper function to log detailed auth errors for debugging
 */
export function logAuthError(context: string, error: any): void {
  console.error(`[Auth Error - ${context}]`, error);
  
  // Capture detailed error information
  const errorDetails = {
    message: error?.message || 'Unknown error',
    status: error?.status,
    name: error?.name,
    stack: error?.stack,
    timestamp: new Date().toISOString(),
    userAgent: isBrowser ? navigator.userAgent : 'Node.js',
    url: isBrowser ? window.location.href : '',
    environment: process.env.NODE_ENV || 'development'
  };
  
  console.error('Detailed auth error:', errorDetails);
  
  // For production, you might want to send this to a logging service
  if (process.env.NODE_ENV === 'production' && isBrowser) {
    // You could implement a remote logging service here
    // Example: sendToErrorLogging(errorDetails);
    
    // For now, just log to console in an easily identifiable way
    console.error('PRODUCTION AUTH ERROR:', JSON.stringify(errorDetails, null, 2));
  }
}

/**
 * Check for Supabase client health
 */
export function checkSupabaseHealth(): { isHealthy: boolean; details: any } {
  if (!supabase) {
    return { 
      isHealthy: false, 
      details: { error: 'Supabase client not available' } 
    };
  }
  
  // Check if we can access auth methods
  try {
    const hasAuthMethods = !!supabase.auth && 
      typeof supabase.auth.getSession === 'function' &&
      typeof supabase.auth.signInWithPassword === 'function';
      
    const storageAvailable = isBrowser && 
      typeof localStorage !== 'undefined' &&
      typeof sessionStorage !== 'undefined';
    
    // Check if supabase URL and key are properly configured
    const configValid = !!supabaseUrl && !!supabaseKey;
    
    return {
      isHealthy: hasAuthMethods && storageAvailable && configValid,
      details: {
        hasAuthMethods,
        storageAvailable,
        configValid,
        environment: process.env.NODE_ENV,
        url: isBrowser ? window.location.origin : null,
        clientInitialized: !!supabase
      }
    };
  } catch (error) {
    return {
      isHealthy: false,
      details: { 
        error: 'Error checking Supabase health',
        message: error?.message
      }
    };
  }
}
