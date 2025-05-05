import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { refreshToken, isTokenExpired } from '../lib/auth-helpers';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient'; // Import the singleton instance

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
const AUTH_OPERATION_TIMEOUT = 15000; // 10 seconds timeout for auth operations

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Session refresh function that will be exposed in context
  // Note: This manually triggers a refresh if needed, useful for specific UI actions.
  // Background refresh is handled by Supabase and fetchWithAuth.
  const refreshSession = async (): Promise<boolean> => {
    if (!user?.token) {
      console.log('refreshSession: No user token available');
      return false;
    }
    
    try {
      // Check if token is expired or will expire soon
      if (isTokenExpired(user.token)) {
        console.log('refreshSession: Token expired or expiring soon, refreshing...');
        const newToken = await refreshToken(); // Uses helper with timeout
        
        if (!newToken) {
          console.error('refreshSession: Failed to refresh token');
          // Clean up immediately on refresh failure
          setUser(null);
          localStorage.removeItem('token');
          sessionStorage.removeItem('token');
          
          // Clear any Supabase-specific tokens
          if (typeof window !== 'undefined') {
            Object.keys(localStorage).forEach(key => {
              if (/^sb-.*-auth-token$/.test(key)) {
                localStorage.removeItem(key);
              }
            });
          }
          
          // Don't redirect here to avoid interrupting user experience
          return false;
        }
        
        // Update user with new token
        setUser(prev => prev ? { ...prev, token: newToken } : null);
        console.log('refreshSession: Token refreshed successfully');
        return true;
      }
      console.log('refreshSession: Token is still valid');
      return true; // Token still valid
    } catch (error) {
      console.error('Error refreshing session:', error);
      return false;
    }
  };

  // Load user on initial render
  useEffect(() => {
    let isActive = true; // Flag to prevent state updates after unmount
    console.log('[AuthContext] useEffect Mount: Initializing...');
    
    const loadUser = async () => {
      console.groupCollapsed('[AuthContext] loadUser: Starting initial authentication check...');
      try {
        // Add timeout to getSession call
        console.log('[AuthContext] loadUser: Calling supabase.auth.getSession()');
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Session check timed out')), AUTH_OPERATION_TIMEOUT);
        });
        
        console.log(`[AuthContext] loadUser: Racing getSession against ${AUTH_OPERATION_TIMEOUT}ms timeout.`);
        const { data: sessionData, error: sessionError } = await Promise.race([
          sessionPromise,
          timeoutPromise.then(() => ({ data: { session: null }, error: new Error('Session check timed out') }))
        ]) as any;
        
        if (!isActive) {
          console.warn('[AuthContext] loadUser: Aborted - Component unmounted during getSession');
          console.groupEnd();
          return;
        }
        
        if (sessionError) {
          console.error('[AuthContext] loadUser: Error or timeout during getSession:', sessionError);
          setUser(null);
          setLoading(false);
          console.groupEnd();
          return;
        }
        
        if (!sessionData.session) {
          console.log('[AuthContext] loadUser: No active session found via getSession.');
          setUser(null);
          setLoading(false);
          console.groupEnd();
          return;
        }
        
        console.log('[AuthContext] loadUser: Session found via getSession. Validating token...', { session: sessionData.session });
        let currentToken = sessionData.session.access_token;
        let isTokenValid = !isTokenExpired(currentToken);
        console.log(`[AuthContext] loadUser: Token from session - isTokenExpired result: ${!isTokenValid}`);
        
        // Check if the found token is expired
        if (!isTokenValid) {
          console.log('[AuthContext] loadUser: Token in session is expired, attempting refresh...');
          console.log('[AuthContext] loadUser: Calling refreshToken()...');
          const newToken = await refreshToken(); // Uses helper with timeout
          
          if (!isActive) {
            console.warn('[AuthContext] loadUser: Aborted - Component unmounted during refreshToken');
            console.groupEnd();
            return;
          }
          
          if (!newToken) {
            console.error('[AuthContext] loadUser: Failed to refresh expired token. Clearing state.');
            // If refresh fails, treat as logged out
            setUser(null);
            localStorage.removeItem('token');
            sessionStorage.removeItem('token');
            // Explicitly try to sign out supabase client state after failed refresh
            supabase.auth.signOut().catch(err => console.error('[AuthContext] loadUser: Supabase signOut error after failed refresh:', err));
            setLoading(false);
            console.groupEnd();
            return;
          }
          console.log('[AuthContext] loadUser: Token refresh successful. Proceeding with new token.');
          currentToken = newToken;
          isTokenValid = true; // Mark as valid now
        } else {
          console.log('[AuthContext] loadUser: Token in session is valid. Proceeding.');
        }
        
        // Session should exist and token should be valid now.
        console.log('[AuthContext] loadUser: Calling supabase.auth.getUser()...');
        const { data: userData, error: userError } = await supabase.auth.getUser();
        
        if (!isActive) {
          console.warn('[AuthContext] loadUser: Aborted - Component unmounted during getUser');
          console.groupEnd();
          return;
        }
        
        if (userError || !userData.user) {
          console.error('[AuthContext] loadUser: Error getting user data from Supabase:', userError);
          setUser(null);
          setLoading(false);
          console.groupEnd();
          return;
        }
        
        console.log('[AuthContext] loadUser: Got user data from Supabase. Fetching profile...:', { user: userData.user });
        // Get user role from users table
        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .select('role, name')
          .eq('id', userData.user.id)
          .single();
        
        if (!isActive) {
          console.warn('[AuthContext] loadUser: Aborted - Component unmounted during profile fetch');
          console.groupEnd();
          return;
        }
        
        if (profileError) {
          console.error('[AuthContext] loadUser: Error fetching user profile from DB:', profileError);
          // Decide if this is critical. Maybe log error but still set user?
          // For now, treat as failure
          setUser(null);
          setLoading(false);
          console.groupEnd();
          return;
        }
        
        console.log('[AuthContext] loadUser: Profile fetched successfully:', { profile: profileData });
        console.log('[AuthContext] loadUser: Setting user state and storing token.');
        // Store token in localStorage for API calls (using the potentially refreshed token)
        localStorage.setItem('token', currentToken);
        sessionStorage.setItem('token', currentToken);
        
        // Set the complete user object with role information
        const finalUser = {
          id: userData.user.id,
          email: userData.user.email!,
          role: profileData.role,
          name: profileData.name,
          token: currentToken
        };
        setUser(finalUser);
        console.log('[AuthContext] loadUser: User state successfully set:', finalUser);
        
      } catch (error) {
        console.error('[AuthContext] loadUser: Unexpected error during auth check:', error);
        if (isActive) {
          setUser(null);
        }
      } finally {
        if (isActive) {
          console.log('[AuthContext] loadUser: Final step - setting loading = false.');
          setLoading(false);
        }
        console.groupEnd();
      }
    };
    
    loadUser();
    
    // Set up auth state change listener
    console.log('[AuthContext] useEffect Mount: Setting up onAuthStateChange listener.');
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.groupCollapsed(`[AuthContext] onAuthStateChange: Event received: ${event}`);
      console.log('Details:', { event, session });
      
      if (!isActive) {
        console.warn('[AuthContext] onAuthStateChange: Aborted - Component unmounted, ignoring event');
        console.groupEnd();
        return;
      }
      
      if (event === 'SIGNED_IN' && session) {
        console.log('[AuthContext] onAuthStateChange (SIGNED_IN): Processing...');
        try {
          console.log('[AuthContext] onAuthStateChange (SIGNED_IN): Fetching profile...');
          // Get user role from database
          const { data: profileData, error: profileError } = await supabase
            .from('users')
            .select('role, name')
            .eq('id', session.user.id)
            .single();
          
          if (!isActive) {
            console.warn('[AuthContext] onAuthStateChange (SIGNED_IN): Aborted - Component unmounted during profile fetch');
            console.groupEnd();
            return;
          }
          
          if (profileError) {
            console.error('[AuthContext] onAuthStateChange (SIGNED_IN): Error fetching user profile:', profileError);
            // Handle appropriately - maybe sign out again?
            setUser(null); 
            console.groupEnd();
            return;
          }
          
          console.log('[AuthContext] onAuthStateChange (SIGNED_IN): Profile fetched. Setting state and tokens.', { profile: profileData });
          // Save token to localStorage/sessionStorage
          localStorage.setItem('token', session.access_token);
          sessionStorage.setItem('token', session.access_token);
          
          // Set the complete user
          const signedInUser = {
            id: session.user.id,
            email: session.user.email!,
            role: profileData.role,
            name: profileData.name,
            token: session.access_token
          };
          setUser(signedInUser);
          console.log('[AuthContext] onAuthStateChange (SIGNED_IN): User state updated successfully.', signedInUser);
        } catch (error) {
          console.error('onAuthStateChange (SIGNED_IN): Error setting user data:', error);
          if (isActive) setUser(null);
        }
      } else if (event === 'TOKEN_REFRESHED' && session) {
        console.log('[AuthContext] onAuthStateChange (TOKEN_REFRESHED): Processing...');
        
        if (!isActive) {
          console.warn('[AuthContext] onAuthStateChange (TOKEN_REFRESHED): Aborted - Component unmounted.');
          console.groupEnd();
          return;
        }
        
        console.log('[AuthContext] onAuthStateChange (TOKEN_REFRESHED): Updating tokens and user state.');
        // Update stored tokens
        localStorage.setItem('token', session.access_token);
        sessionStorage.setItem('token', session.access_token);
        
        // Update user state with new token
        setUser(prev => {
          const updatedUser = prev ? { ...prev, token: session.access_token } : null;
          console.log('[AuthContext] onAuthStateChange (TOKEN_REFRESHED): User state updated with new token.', updatedUser);
          return updatedUser;
        });
        
      } else if (event === 'SIGNED_OUT') {
        console.log('[AuthContext] onAuthStateChange (SIGNED_OUT): Processing...');
        if (!isActive) {
          console.warn('[AuthContext] onAuthStateChange (SIGNED_OUT): Aborted - Component unmounted.');
          console.groupEnd();
          return;
        }
        
        console.log('[AuthContext] onAuthStateChange (SIGNED_OUT): Clearing user state and tokens.');
        // Clear user state and tokens
        setUser(null);
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
      } else if (event === 'INITIAL_SESSION') {
        console.log('[AuthContext] onAuthStateChange (INITIAL_SESSION): Event received. Usually handled by loadUser.');
        // Usually handled by the initial loadUser, but good to log.
      } else {
        console.log(`[AuthContext] onAuthStateChange: Unhandled event type: ${event}`);
      }
      console.groupEnd();
    });
    
    // Cleanup listener on unmount
    return () => {
      console.log('[AuthContext] useEffect Cleanup: Unsubscribing from onAuthStateChange and setting isActive=false.');
      isActive = false;
      authListener?.subscription.unsubscribe();
    };
  }, []); // Only run on mount
  
  const login = async (email: string, password: string) => {
    console.groupCollapsed(`[AuthContext] login: Attempting login for ${email}...`);
    try {
      console.log('[AuthContext] login: Calling supabase.auth.signInWithPassword()...');
      
      // Clean up any existing tokens first to avoid conflicts
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      if (typeof window !== 'undefined') {
        Object.keys(localStorage).forEach(key => { 
          if (/^sb-.*-auth-token$/.test(key)) { 
            localStorage.removeItem(key);
          }
        });
      }
      
      // Create a Promise to handle the login request with a timeout
      const loginPromise = supabase.auth.signInWithPassword({
        email,
        password
      });
      
      console.log(`[AuthContext] login: Racing signInWithPassword against ${AUTH_OPERATION_TIMEOUT}ms timeout.`);
      const timeoutPromise = new Promise<{data: null, error: Error}>((_, reject) => {
        setTimeout(() => reject(new Error('Login timed out')), AUTH_OPERATION_TIMEOUT);
      });
      
      try {
        // Await the result of the sign-in attempt or timeout with better type safety
        const { data, error } = await Promise.race([
          loginPromise,
          timeoutPromise
        ]);
        
        if (error) {
          console.error('[AuthContext] login: Supabase sign-in error:', error);
          // Clear state just in case something partially succeeded before error
          setUser(null);
          localStorage.removeItem('token');
          sessionStorage.removeItem('token');
          if (typeof window !== 'undefined') {
            Object.keys(localStorage).forEach(key => { 
              if (/^sb-.*-auth-token$/.test(key)) { 
                localStorage.removeItem(key); 
              }
            });
          }
          console.groupEnd();
          throw error; // Propagate error to UI
        }
        
        // IMPORTANT: Check if we actually got a user and session.
        if (!data?.user || !data?.session) { 
          console.warn('[AuthContext] login: signInWithPassword call succeeded but returned no user/session data immediately.', { data });
          // This is unusual but can happen. Let onAuthStateChange handle it.
          console.groupEnd();
          return; // Still return success as onAuthStateChange will likely handle this
        } 
        
        console.log('[AuthContext] login: signInWithPassword successful with data:', { 
          user: data.user, 
          session: data.session 
        });
        
        // Store the token immediately
        localStorage.setItem('token', data.session.access_token);
        sessionStorage.setItem('token', data.session.access_token);
        
        // Return minimal success indicator
        console.groupEnd();
        return true; // Indicate success
      } catch (raceError) {
        // This handles Promise.race errors, particularly timeout
        console.error('[AuthContext] login: Error during login race:', raceError);
        setUser(null);
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        if (typeof window !== 'undefined') {
          Object.keys(localStorage).forEach(key => { 
            if (/^sb-.*-auth-token$/.test(key)) { 
              localStorage.removeItem(key); 
            }
          });
        }
        console.groupEnd();
        throw new Error('Login process timed out. Please try again.');
      }
    } catch (outerError) {
      // This catch block now primarily handles errors from the whole login process
      console.error('[AuthContext] login: Outer catch - Error during login process:', outerError);
      // Ensure local state is cleared on any login failure
      setUser(null);
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      if (typeof window !== 'undefined') {
        Object.keys(localStorage).forEach(key => { 
          if (/^sb-.*-auth-token$/.test(key)) { 
            localStorage.removeItem(key); 
          }
        });
      }
      console.groupEnd();
      throw outerError; // Re-throw the error for the UI to handle
    }
  };

  const logout = async () => {
    console.groupCollapsed('[AuthContext] logout: Attempting logout...');
    try {
      // --- Aggressive Cleanup --- 
      // 1. Clear application state
      console.log('[AuthContext] logout: Step 1 - Clearing local user state and application tokens.');
      setUser(null);
      localStorage.removeItem('token');       // App-specific token
      sessionStorage.removeItem('token');      // App-specific token (if used)

      // 2. Manually clear Supabase auth token from localStorage
      console.log('[AuthContext] logout: Step 2 - Manually clearing Supabase localStorage keys...');
      if (typeof window !== 'undefined') {
        let foundSupabaseKey = false;
        Object.keys(localStorage).forEach(key => {
          // Target keys like sb-xxxxxxxxxxxxxxxxxx-auth-token
          if (/^sb-.*-auth-token$/.test(key)) { 
            foundSupabaseKey = true;
            localStorage.removeItem(key);
            console.log(`[AuthContext] logout: Removed Supabase localStorage key: ${key}`);
          }
        });
        if (!foundSupabaseKey) {
          console.warn('[AuthContext] logout: No Supabase auth token key found in localStorage to remove.');
        }
      }

      // 3. Manually clear Supabase auth cookies
      console.log('[AuthContext] logout: Step 3 - Manually clearing Supabase cookies...');
      if (typeof document !== 'undefined') {
        const cookies = document.cookie.split(';');
        let foundSupabaseCookie = false;
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i];
            const eqPos = cookie.indexOf('=');
            const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
            // Target common Supabase cookie names or pattern
            if (name.startsWith('sb-')) { 
                foundSupabaseCookie = true;
                console.log(`[AuthContext] logout: Deleting cookie: ${name}`);
                // Delete cookie by setting expiry date to the past
                // Path=/ is important to ensure deletion regardless of current path
                document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
            }
        }
        if (!foundSupabaseCookie) {
             console.warn('[AuthContext] logout: No Supabase cookies found to remove.');
        }
      }
      // --- End Aggressive Cleanup ---

      // 4. Attempt Supabase sign out (with timeout)
      console.log('[AuthContext] logout: Step 4 - Calling Supabase signOut...');
      
      try {
        const logoutPromise = supabase.auth.signOut();
        const timeoutPromise = new Promise<{error: Error}>((_, reject) => {
          setTimeout(() => reject(new Error('Logout timed out')), AUTH_OPERATION_TIMEOUT);
        });
        
        console.log(`[AuthContext] logout: Racing signOut against ${AUTH_OPERATION_TIMEOUT}ms timeout.`);
        const { error } = await Promise.race([
          logoutPromise,
          timeoutPromise
        ]);
        
        if (error) {
          console.error('[AuthContext] logout: Supabase signOut error:', error);
          // Log error, but local state, localStorage & cookies are already cleared.
        } else {
          console.log('[AuthContext] logout: Supabase signOut call completed successfully.');
        }
      } catch (raceError) {
        console.error('[AuthContext] logout: Timeout or race error during signOut:', raceError);
        // This is fine, we've already cleared local state
      }
      
      // Always make sure we report successful logout from the application perspective
      // since we've already cleared all local state and storage
      console.log('[AuthContext] logout: Logout process finished.');
    } catch (error) {
      console.error('[AuthContext] logout: Unexpected error during logout process:', error);
      // Ensure local state is cleared even if there's an unexpected exception
      setUser(null);
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      
      // Attempt manual Supabase key/cookie removal again in case of early error
      if (typeof window !== 'undefined') {
        Object.keys(localStorage).forEach(key => {
          if (/^sb-.*-auth-token$/.test(key)) { localStorage.removeItem(key); }
        });
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
    } finally {
      // Always redirect to login page after logout attempt, regardless of success/failure
      // to ensure user isn't stuck with partially logged-out state
      if (typeof window !== 'undefined') {
        // Slight delay to allow state updates to complete
        setTimeout(() => {
          window.location.href = '/login';
        }, 100);
      }
      console.groupEnd();
    }
  };

  const signUp = async (email: string, password: string, name: string, role: string) => {
    // Existing signUp logic - assumed OK for now as focus is login/logout
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
