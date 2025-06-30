import React, { createContext, useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import { Session, User as SupabaseAuthUser } from '@supabase/supabase-js';

// Define your application-specific User type
interface AppUser {
  id: string;
  email?: string;
  role?: string;
  name?: string;
  // Add other properties from your 'users' table
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean; // True when initially loading session or when user profile is being fetched
  isLoadingSession: boolean; // True only during the initial session check on mount
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signUp: (email: string, password: string, name: string, role: string) => Promise<any>;
  getRoleRedirectPath: (role: string) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [supabaseSession, setSupabaseSession] = useState<Session | null | undefined>(undefined); // undefined initially, null if no session, Session object if session exists
  const [user, setUser] = useState<AppUser | null>(null); // Your application user profile
  const [loading, setLoading] = useState(true); // General loading for user profile fetching
  const [isLoadingSession, setIsLoadingSession] = useState(true); // Specific to initial session load

  const router = useRouter();

  const getRoleRedirectPath = (role: string): string => {
    switch (role) {
      case 'admin': return '/dashboard/admin';
      case 'coach': return '/dashboard/coach';
      case 'student': return '/dashboard/student';
      default: return '/login';
    }
  };

  // Effect for initial session check and auth state changes
  useEffect(() => {
    setIsLoadingSession(true);
    setLoading(true); // Also set general loading true initially

    // Check initial session
    supabase.auth.getSession().then(({ data }) => {
      setSupabaseSession(data.session); // This will trigger the next useEffect
      setIsLoadingSession(false);
      // setLoading will be handled by the profile fetching useEffect
    }).catch(error => {
      console.error("Error in initial getSession():", error);
      setSupabaseSession(null);
      setIsLoadingSession(false);
      setLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        console.log(`Auth state changed: ${_event}`, session);
        // Directly set the Supabase session from the event.
        // The useEffect below will handle fetching the user profile.
        setSupabaseSession(session);
        setIsLoadingSession(false); // No longer loading the raw session
        if (!session) { // If session becomes null (e.g. SIGNED_OUT)
            setUser(null);
            setLoading(false); // No profile to fetch
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // Effect to fetch user profile when Supabase session changes
  useEffect(() => {
    if (supabaseSession === undefined) { // Still waiting for initial getSession result
        return;
    }

    if (supabaseSession?.user) {
      setLoading(true); // About to fetch profile
      const supabaseAuthUser = supabaseSession.user;
      console.log(`Supabase session active, fetching app profile for ID: ${supabaseAuthUser.id}`);

      // Store the access token in localStorage for API calls
      if (supabaseSession.access_token) {
        localStorage.setItem('token', supabaseSession.access_token);
        console.log('Token stored in localStorage for API calls');
      }

      // Fetch user profile with async/await to avoid promise chain issues
      (async () => {
        try {
          const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, name, role')
        .eq('id', supabaseAuthUser.id)
            .single();

          if (userError) {
            console.error('AuthContext: Error fetching user data from users table:', userError);
            setUser(null);
          } else if (!userData) {
            console.warn(`AuthContext: No entry found in users table for ID: ${supabaseAuthUser.id}.`);
            setUser(null);
          } else if (!userData.role) {
            console.warn(`AuthContext: User entry found for ID: ${supabaseAuthUser.id} but 'role' is null or empty.`);
            setUser(null);
          } else {
            console.log(`AuthContext: App user profile loaded: ${userData.role}`);
            setUser({
              id: supabaseAuthUser.id,
              email: supabaseAuthUser.email,
              name: userData.name,
              role: userData.role,
            });
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setUser(null);
        } finally {
          setLoading(false);
        }
      })();
    } else if (supabaseSession === null) { // Explicitly no session
      // Clear tokens when session is null
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      setUser(null);
      setLoading(false);
    }
  }, [supabaseSession]);


  const login = async (email: string, password: string) => {
    // setLoading(true); // onAuthStateChange -> setSupabaseSession -> profile fetch will handle loading
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      // onAuthStateChange will handle the rest
    } catch (error) {
      console.error('Login error:', error);
      // setLoading(false); // Let state changes manage loading
      throw error;
    }
  };

  const logout = async () => {
    // setLoading(true); // onAuthStateChange will set session to null, triggering profile state update
    try {
      // Clear tokens immediately
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      
      await supabase.auth.signOut();
      // onAuthStateChange will set supabaseSession to null, which clears the user and sets loading.
    } catch (error) {
      console.error('Logout error:', error);
      // setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string, role: string) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error('Signup successful but no user returned');

      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: authData.user.email,
          name,
          role,
          approved: role === 'student'
        });
      if (userError) {
        // Attempt to clean up auth user if profile insertion fails (requires admin privileges or specific setup)
        // await supabase.auth.admin.deleteUser(authData.user.id); 
        throw new Error(`Could not create user record: ${userError.message}`);
      }
      // onAuthStateChange will eventually pick up the new user if email confirmation is not required,
      // or after email confirmation. For immediate UI update, you might optimistically set user,
      // but it's safer to rely on onAuthStateChange.
      return authData.user; // Or a custom object
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading: isLoadingSession || loading, // Combine loading states: true if either initial session check or profile fetch is ongoing
    isLoadingSession, // Expose if needed to differentiate initial load
    login,
    logout,
    signUp,
    getRoleRedirectPath,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  // SSR safe check - return a default value during server-side rendering
  if (typeof window === 'undefined') {
    return {
      user: null,
      loading: true,
      isLoadingSession: true,
      login: async () => console.warn('Login called during SSR'),
      logout: async () => console.warn('Logout called during SSR'),
      signUp: async () => console.warn('SignUp called during SSR'),
      getRoleRedirectPath: (role: string) => {
         switch (role) {
            case 'admin': return '/dashboard/admin';
            case 'coach': return '/dashboard/coach';
            case 'student': return '/dashboard/student';
            default: return '/login';
          }
      }
    } as AuthContextType;
  }

  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};