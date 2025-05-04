import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { createClient } from '@supabase/supabase-js';
import { refreshToken, isTokenExpired } from '../lib/auth-helpers';
import { useRouter } from 'next/router';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
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
const MAX_AUTH_WAIT_TIME = 5000; // 5 seconds max wait time for auth operations

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
      
      // Set timeout to prevent hanging on login
      const loginTimeout = setTimeout(() => {
        setLoading(false);
        throw new Error('Login operation timed out. Please try again.');
      }, MAX_AUTH_WAIT_TIME);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      clearTimeout(loginTimeout);
      
      if (error) {
        throw error;
      }
      
      if (!data.user) {
        throw new Error('Login successful but no user returned');
      }
      
      // Get user role from database
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('role, name')
        .eq('id', data.user.id)
        .single();
      
      if (profileError) {
        throw new Error('Could not retrieve user role');
      }
      
      // Construct complete user object with role and token
      const userWithRole = {
        id: data.user.id,
        email: data.user.email!,
        role: profileData.role,
        name: profileData.name,
        token: data.session.access_token
      };
      
      setUser(userWithRole);
      
      // Save token to localStorage for API calls
      localStorage.setItem('token', data.session.access_token);
      sessionStorage.setItem('token', data.session.access_token);
      
      return userWithRole;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      
      // Clear user state first to prevent UI issues
      setUser(null);
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      
      // Set timeout to prevent hanging on logout
      const logoutTimeout = setTimeout(() => {
        console.error('Logout operation timed out, but local state is cleared');
        setLoading(false);
      }, MAX_AUTH_WAIT_TIME);
      
      // Attempt to sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      clearTimeout(logoutTimeout);
      
      if (error) {
        console.error('Supabase logout error:', error);
        // Despite the error, we've already cleared local state,
        // so the user will be effectively logged out on the client
      }
    } catch (error) {
      console.error('Error during logout:', error);
      // Ensure we're still logged out locally even if there's an exception
    } finally {
      setLoading(false);
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
