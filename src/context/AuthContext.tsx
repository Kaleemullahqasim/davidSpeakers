import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { createClient } from '@supabase/supabase-js';
import { refreshToken, isTokenExpired, logAuthError } from '../lib/auth-helpers';
import { useRouter } from 'next/router';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

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

// Retry function for auth operations
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

// Get the current site URL for proper redirects
const getSiteUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  // Default fallback - should be overridden by actual origin in browser
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://david-speakers-pcas.vercel.app';
};

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'implicit',
    // Add site URL for proper redirects in production
    site_url: getSiteUrl()
  }
});

// Define the user type with role information
interface User {
  id: string;
  email: string;
  role: 'admin' | 'coach' | 'student';
  name: string;
  token?: string; // Include token for authentication
}

// Define the context shape
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  signUp: (email: string, password: string, name: string, role: string) => Promise<any>;
  isAuthenticated: boolean; // Add explicit authentication check
  refreshSession: () => Promise<boolean>; // Add refresh session function
}

const AuthContext = createContext<AuthContextType | null>(null);

// Constants for token refresh
const TOKEN_REFRESH_INTERVAL = 4 * 60 * 1000; // 4 minutes
const SESSION_KEEPALIVE_INTERVAL = 60 * 1000; // 1 minute
const MAX_AUTH_WAIT_TIME = getEnvConfig().authTimeout; // Dynamic timeout based on environment

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Session refresh function that will be exposed in context
  const refreshSession = async (): Promise<boolean> => {
    if (!user?.token) return false;
    
    try {
      // Check if token is expired or will expire soon
      if (isTokenExpired(user.token)) {
        console.log('Token expired or expiring soon, refreshing...');
        const newToken = await refreshToken();
        
        if (!newToken) {
          console.error('Failed to refresh token');
          return false;
        }
        
        // Update user with new token
        setUser(prev => prev ? { ...prev, token: newToken } : null);
        return true;
      }
      return true; // Token still valid
    } catch (error) {
      console.error('Error refreshing session:', error);
      return false;
    }
  };

  // Load user on initial render
  useEffect(() => {
    let authTimeout: NodeJS.Timeout;
    
    const loadUser = async () => {
      try {
        // Set timeout to prevent hanging on auth check
        authTimeout = setTimeout(() => {
          console.log('Auth check timed out, clearing loading state');
          setLoading(false);
        }, MAX_AUTH_WAIT_TIME);
        
        // Check for session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        clearTimeout(authTimeout);
        
        if (sessionError) {
          console.error('Error getting session:', sessionError);
          setLoading(false);
          return;
        }
        
        if (!sessionData.session) {
          setLoading(false);
          return;
        }
        
        // Session exists, get user data
        const { data: userData, error: userError } = await supabase.auth.getUser();
        
        if (userError || !userData.user) {
          console.error('Error getting user:', userError);
          setLoading(false);
          return;
        }
        
        // Get user role from users table
        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .select('role, name')
          .eq('id', userData.user.id)
          .single();
        
        if (profileError) {
          console.error('Error fetching user profile:', profileError);
          setLoading(false);
          return;
        }
        
        // Store token in localStorage for API calls
        if (sessionData.session.access_token) {
          localStorage.setItem('token', sessionData.session.access_token);
          sessionStorage.setItem('token', sessionData.session.access_token);
        }
        
        // Set the complete user object with role information
        setUser({
          id: userData.user.id,
          email: userData.user.email!,
          role: profileData.role,
          name: profileData.name,
          token: sessionData.session.access_token
        });
        
      } catch (error) {
        console.error('Unexpected error during auth check:', error);
      } finally {
        clearTimeout(authTimeout);
        setLoading(false);
      }
    };
    
    loadUser();
    
    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event);
      
      if (event === 'SIGNED_IN' && session) {
        try {
          // Get user role from database
          const { data: profileData, error: profileError } = await supabase
            .from('users')
            .select('role, name')
            .eq('id', session.user.id)
            .single();
          
          if (profileError) {
            console.error('Error fetching user profile after sign in:', profileError);
            return;
          }
          
          // Save token to localStorage for API calls
          localStorage.setItem('token', session.access_token);
          sessionStorage.setItem('token', session.access_token);
          
          // Set the complete user
          setUser({
            id: session.user.id,
            email: session.user.email!,
            role: profileData.role,
            name: profileData.name,
            token: session.access_token
          });
        } catch (error) {
          console.error('Error setting user data after sign in:', error);
        }
      } else if (event === 'TOKEN_REFRESHED' && session) {
        console.log('Token refreshed by Supabase');
        
        // Update stored tokens
        localStorage.setItem('token', session.access_token);
        sessionStorage.setItem('token', session.access_token);
        
        // Update user state with new token
        setUser(prev => prev ? { ...prev, token: session.access_token } : null);
      }
      else if (event === 'SIGNED_OUT') {
        setUser(null);
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
      }
    });
    
    return () => {
      clearTimeout(authTimeout);
      authListener.subscription.unsubscribe();
    };
  }, []);
  
  // Set up token refresh interval
  useEffect(() => {
    if (!user) return; // Don't run if not authenticated
    
    // Function to check and refresh token if needed
    const checkAndRefreshToken = async () => {
      try {
        if (!user.token) return;
        
        // Check if token is expired or will expire soon
        if (isTokenExpired(user.token)) {
          console.log('Token expired or expiring soon, refreshing in background...');
          
          // Set a timeout to prevent hanging on refresh
          const refreshTimeout = setTimeout(() => {
            console.error('Token refresh operation timed out');
            // Force logout on refresh timeout
            logout().then(() => router.push('/login?expired=true'));
          }, MAX_AUTH_WAIT_TIME);
          
          const newToken = await refreshToken();
          clearTimeout(refreshTimeout);
          
          if (newToken) {
            setUser(prev => prev ? { ...prev, token: newToken } : null);
            console.log('Token refreshed successfully in background');
          } else {
            console.error('Failed to refresh token in background');
            // Force logout on persistent refresh failure
            await logout();
            router.push('/login?expired=true');
          }
        }
      } catch (error) {
        console.error('Error in token refresh interval:', error);
      }
    };
    
    // Check token validity on user activity
    const setupUserActivityListeners = () => {
      const activityEvents = ['mousedown', 'keydown', 'touchstart', 'click'];
      
      const handleUserActivity = () => {
        checkAndRefreshToken();
      };
      
      // Add activity listeners
      activityEvents.forEach((event: any) => {
        window.addEventListener(event, handleUserActivity);
      });
      
      // Return cleanup function
      return () => {
        activityEvents.forEach((event: any) => {
          window.removeEventListener(event, handleUserActivity);
        });
      };
    };
    
    // Set up automatic token refresh on interval
    const tokenRefreshInterval = setInterval(checkAndRefreshToken, TOKEN_REFRESH_INTERVAL);
    
    // Set up a "keepalive" ping to prevent session from becoming stale
    const sessionKeepAliveInterval = setInterval(() => {
      // Add timeout to prevent hanging on this operation
      const keepaliveTimeout = setTimeout(() => {
        console.error('Session keepalive operation timed out');
      }, MAX_AUTH_WAIT_TIME);
      
      supabase.auth.getSession().then(({ data, error }) => {
        clearTimeout(keepaliveTimeout);
        if (error) {
          console.error('Error in session keepalive:', error);
        } else if (data?.session) {
          console.log('Session keepalive ping successful');
        }
      });
    }, SESSION_KEEPALIVE_INTERVAL);
    
    // Set up user activity listeners
    const cleanupActivityListeners = setupUserActivityListeners();
    
    // Cleanup on unmount
    return () => {
      clearInterval(tokenRefreshInterval);
      clearInterval(sessionKeepAliveInterval);
      cleanupActivityListeners();
    };
  }, [user, router]);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log('Attempting login for user:', email);
      
      // Clear any stale tokens first
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
      }
      
      // Login operation that will be retried if necessary
      const performLogin = async () => {
        // Set timeout to prevent hanging on login
        const loginPromise = supabase.auth.signInWithPassword({
          email,
          password
        });
        
        // Use Promise.race to implement a timeout
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error(`Login operation timed out after ${MAX_AUTH_WAIT_TIME}ms`));
          }, MAX_AUTH_WAIT_TIME);
        });
        
        // Race the login promise against the timeout
        const { data, error } = await Promise.race([
          loginPromise,
          timeoutPromise
        ]) as any;
        
        if (error) {
          console.error('Supabase auth error:', error.message);
          throw error;
        }
        
        if (!data?.user) {
          console.error('Login successful but no user returned from Supabase');
          throw new Error('Login successful but no user returned');
        }
        
        console.log('Supabase auth successful, fetching user role');
        
        // Get user role from database
        const profileResponse = await supabase
          .from('users')
          .select('role, name')
          .eq('id', data.user.id)
          .single();
          
        if (profileResponse.error) {
          console.error('Error retrieving user role:', profileResponse.error);
          throw new Error('Could not retrieve user role');
        }
        
        const profileData = profileResponse.data;
        console.log('User role retrieved:', profileData.role);
        
        // Construct complete user object with role and token
        const userWithRole = {
          id: data.user.id,
          email: data.user.email!,
          role: profileData.role,
          name: profileData.name,
          token: data.session.access_token
        };
        
        return userWithRole;
      };
      
      // Use the retry mechanism for better reliability in production
      const userWithRole = await withRetry(performLogin);
      
      // Set the user state after successful login with retries
      setUser(userWithRole);
      
      // Save token to localStorage for API calls
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', userWithRole.token);
        sessionStorage.setItem('token', userWithRole.token);
        console.log('Auth token saved to storage');
      }
      
      return userWithRole;
    } catch (error) {
      console.error('Login error:', error);
      logAuthError('Login Function', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      console.log('Starting logout process');
      
      // Clear user state first to prevent UI issues
      setUser(null);
      
      // Clear tokens from storage
      if (typeof window !== 'undefined') {
        console.log('Clearing auth tokens from storage');
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        
        // Also clear any other Supabase-related storage items
        for (const key of Object.keys(localStorage)) {
          if (key.startsWith('sb-') || key.includes('supabase')) {
            console.log('Clearing Supabase storage item:', key);
            localStorage.removeItem(key);
          }
        }
      }
      
      // Set timeout to prevent hanging on logout
      const logoutTimeout = setTimeout(() => {
        console.error('Logout operation timed out, but local state is cleared');
        setLoading(false);
      }, MAX_AUTH_WAIT_TIME);
      
      // Attempt to sign out from Supabase
      console.log('Sending signOut request to Supabase');
      const { error } = await supabase.auth.signOut();
      
      clearTimeout(logoutTimeout);
      
      if (error) {
        console.error('Supabase logout error:', error);
        // Despite the error, we've already cleared local state,
        // so the user will be effectively logged out on the client
      } else {
        console.log('Supabase signOut completed successfully');
      }
    } catch (error) {
      console.error('Error during logout:', error);
      // Ensure we're still logged out locally even if there's an exception
    } finally {
      setLoading(false);
      console.log('Logout process completed');
    }
  };

  const signUp = async (email: string, password: string, name: string, role: string) => {
    try {
      // Create the user in Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) {
        throw error;
      }
      
      if (!data.user) {
        throw new Error('Signup successful but no user returned');
      }
      
      // Now create an entry in the users table with role information
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email: data.user.email,
          name,
          role
        });
      
      if (profileError) {
        // Clean up the auth user if profile creation fails
        await supabase.auth.admin.deleteUser(data.user.id);
        throw new Error('Could not create user profile');
      }
      
      return {
        id: data.user.id,
        email: data.user.email,
        role,
        name
      };
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    signUp,
    isAuthenticated: !!user && !!user.id,
    refreshSession
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};
