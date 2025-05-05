import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
// Import helpers correctly
import { refreshToken, isTokenExpired, performLogout, getLastActivity, updateLastActivity } from '../lib/auth-helpers'; 
import { useRouter } from 'next/router';
import { supabase, resetSupabaseAuth } from '../lib/supabaseClient'; // Keep resetSupabaseAuth import for login

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
const AUTH_OPERATION_TIMEOUT = 15000; // 15 seconds timeout

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // Start loading true
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
        updateLastActivity();
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
    let isActive = true;
    console.log('[AuthContext] useEffect Mount: Initializing auth state...');
    setLoading(true); // Ensure loading is true at the start

    const loadUser = async () => {
      console.groupCollapsed('[AuthContext] loadUser: Starting initial authentication check...');
      try {
        console.log('[AuthContext] loadUser: Calling supabase.auth.getSession()');
        // Use timeout for getSession
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session check timed out')), AUTH_OPERATION_TIMEOUT)
        );
        
        const { data: sessionData, error: sessionError } = await Promise.race([
          sessionPromise.then(res => ({ ...res, source: 'getSession' })), // Add source for debugging
          timeoutPromise.then(() => ({ data: null, error: new Error('Session check timed out'), source: 'timeout' }))
        ]) as any;

        if (!isActive) {
          console.warn('[AuthContext] loadUser: Aborted - Component unmounted during getSession');
          console.groupEnd();
          return;
        }

        if (sessionError) {
          console.error('[AuthContext] loadUser: Error or timeout during getSession:', sessionError);
          // Treat timeout/error as logged out state
          setUser(null); 
          // Don't clear tokens here, resetSupabaseAuth handles it if needed during login/logout
        } else if (!sessionData?.session) {
          console.log('[AuthContext] loadUser: No active session found via getSession.');
          setUser(null);
        } else {
          // Session found - validate token and potentially refresh
          console.log('[AuthContext] loadUser: Session found. Validating token...');
          let currentToken = sessionData.session.access_token;
          let isTokenValid = !isTokenExpired(currentToken);
          console.log(`[AuthContext] loadUser: Token validity check: ${isTokenValid}`);

          if (!isTokenValid) {
            console.log('[AuthContext] loadUser: Token expired, attempting refresh...');
            const newToken = await refreshToken(); // Uses helper with timeout & logging

            if (!isActive) { /* ... unmount check ... */ return; }

            if (!newToken) {
              console.error('[AuthContext] loadUser: Failed to refresh expired token. Treating as logged out.');
              setUser(null);
              // Perform a clean reset if refresh fails during load
              await resetSupabaseAuth(); 
            } else {
              console.log('[AuthContext] loadUser: Token refresh successful.');
              currentToken = newToken;
              isTokenValid = true;
            }
          }

          // If token is valid (or was refreshed), get user details
          if (isTokenValid && currentToken) {
            console.log('[AuthContext] loadUser: Token valid, calling supabase.auth.getUser()...');
            const { data: userData, error: userError } = await supabase.auth.getUser();

            if (!isActive) { /* ... unmount check ... */ return; }

            if (userError || !userData?.user) {
              console.error('[AuthContext] loadUser: Error getting user data:', userError);
              setUser(null);
              await resetSupabaseAuth(); // Reset if getUser fails despite valid token
            } else {
              console.log('[AuthContext] loadUser: Got user data. Fetching profile...');
              // Fetch profile... (existing logic)
              const { data: profileData, error: profileError } = await supabase
                .from('users')
                .select('role, name')
                .eq('id', userData.user.id)
                .single();

              if (!isActive) { /* ... unmount check ... */ return; }

              if (profileError) {
                console.error('[AuthContext] loadUser: Error fetching profile:', profileError);
                setUser(null);
                await resetSupabaseAuth(); // Reset if profile fetch fails
              } else {
                console.log('[AuthContext] loadUser: Profile fetched. Setting user state.');
                const finalUser: User = {
                  id: userData.user.id,
                  email: userData.user.email!,
                  role: profileData.role,
                  name: profileData.name,
                  token: currentToken // Store the valid token
                };
                setUser(finalUser);
                // Store token and update activity *only* when user is successfully set
                localStorage.setItem('token', currentToken);
                sessionStorage.setItem('token', currentToken);
                updateLastActivity();
                console.log('[AuthContext] loadUser: User state successfully set:', finalUser);
              }
            }
          }
        }
      } catch (error) {
        console.error('[AuthContext] loadUser: Unexpected error during auth check:', error);
        if (isActive) setUser(null);
        // Attempt reset on unexpected errors too
        await resetSupabaseAuth();
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
      // Debounce or ensure listener logic doesn't conflict with manual loadUser/login/logout
      console.groupCollapsed(`[AuthContext] onAuthStateChange: Event received: ${event}`);
      console.log('Details:', { event, session });

      if (!isActive) {
        console.warn('[AuthContext] onAuthStateChange: Aborted - Component unmounted.');
        console.groupEnd();
        return;
      }

      // Simplify listener logic - primarily rely on manual flows (login/logout/loadUser)
      // and use the listener mainly for external events (e.g., password recovery, multi-tab)
      // or token refreshes initiated by Supabase itself.

      if (event === 'SIGNED_IN' && session) {
        console.log('[AuthContext] onAuthStateChange (SIGNED_IN): Received SIGNED_IN event. Re-validating session...');
        // Re-trigger loadUser or a simplified version to ensure consistency
        // Avoid setting state directly here if login function handles it
        // Maybe just log it or trigger a re-validation if user is not set
        if (!user) {
           console.log('[AuthContext] onAuthStateChange (SIGNED_IN): User not set, potentially initial load or external sign in. Triggering loadUser.');
           await loadUser(); // Re-run the load logic
        } else {
           console.log('[AuthContext] onAuthStateChange (SIGNED_IN): User already set, likely handled by login function.');
           // Optionally update token if different
           if (user.token !== session.access_token) {
             console.log('[AuthContext] onAuthStateChange (SIGNED_IN): Updating token from event.');
             localStorage.setItem('token', session.access_token);
             sessionStorage.setItem('token', session.access_token);
             setUser(prev => prev ? { ...prev, token: session.access_token } : null);
             updateLastActivity();
           }
        }
      } else if (event === 'TOKEN_REFRESHED' && session) {
        console.log('[AuthContext] onAuthStateChange (TOKEN_REFRESHED): Updating token and activity.');
        localStorage.setItem('token', session.access_token);
        sessionStorage.setItem('token', session.access_token);
        setUser(prev => prev ? { ...prev, token: session.access_token } : null);
        updateLastActivity(); // Update activity on background refresh too
      } else if (event === 'SIGNED_OUT') {
        console.log('[AuthContext] onAuthStateChange (SIGNED_OUT): Received SIGNED_OUT event.');
        // Ensure state is cleared if a sign out happens unexpectedly (e.g., from another tab)
        if (user) { // Only clear if user was previously set
          console.log('[AuthContext] onAuthStateChange (SIGNED_OUT): Clearing user state due to external event.');
          setUser(null);
          localStorage.removeItem('token');
          sessionStorage.removeItem('token');
          localStorage.removeItem('last-activity');
          // Consider if a redirect is needed here, maybe router.push('/login?reason=external_logout');
        } else {
          console.log('[AuthContext] onAuthStateChange (SIGNED_OUT): User already null, likely handled by logout function.');
        }
      } else if (event === 'INITIAL_SESSION') {
         console.log('[AuthContext] onAuthStateChange (INITIAL_SESSION): Handled by initial loadUser.');
      } else {
         console.log(`[AuthContext] onAuthStateChange: Unhandled event type: ${event}`);
      }
      console.groupEnd();
    });

    // Cleanup listener on unmount
    return () => {
      console.log('[AuthContext] useEffect Cleanup: Unsubscribing from onAuthStateChange.');
      isActive = false;
      authListener?.subscription.unsubscribe();
    };
  }, []); // Run only on mount

  // Track user activity
  useEffect(() => {
    if (typeof window !== 'undefined' && user) {
      // Update activity timestamp on user interaction
      const handleActivity = () => updateLastActivity();
      
      ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
        window.addEventListener(event, handleActivity, { passive: true });
      });
      
      return () => {
        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
          window.removeEventListener(event, handleActivity);
        });
      };
    }
  }, [user]);
  
  // Helper function to get last activity timestamp for idle detection
  const getLastActivityTime = (): number | null => {
    if (typeof window === 'undefined') return null;
    const lastActivity = localStorage.getItem('last-activity');
    return lastActivity ? parseInt(lastActivity, 10) : null;
  };

  const login = async (email: string, password: string): Promise<boolean> => { // Return boolean success
    console.groupCollapsed(`[AuthContext] login: Attempting login for ${email}...`);
    setLoading(true); // Indicate loading state during login attempt
    setError(''); // Clear previous errors (assuming an error state exists)

    try {
      // 1. Perform a full auth reset BEFORE attempting to sign in.
      // This is crucial to clear any potentially inconsistent state from idle periods.
      console.log('[AuthContext] login: Performing pre-login auth reset...');
      await resetSupabaseAuth();
      console.log('[AuthContext] login: Pre-login auth reset complete.');

      // 2. Attempt sign-in with timeout
      console.log('[AuthContext] login: Calling supabase.auth.signInWithPassword()...');
      const loginPromise = supabase.auth.signInWithPassword({ email, password });
      const timeoutPromise = new Promise<{ data: null, error: Error }>((_, reject) =>
        setTimeout(() => reject(new Error('Login timed out')), AUTH_OPERATION_TIMEOUT)
      );

      const { data, error } = await Promise.race([loginPromise, timeoutPromise]);

      if (error) {
        console.error('[AuthContext] login: Supabase sign-in error or timeout:', error);
        // Ensure state is clear after failed login
        setUser(null); 
        // resetSupabaseAuth already cleared storage, no need to repeat fully
        localStorage.removeItem('token'); // Just ensure app token is gone
        sessionStorage.removeItem('token');
        throw error; // Propagate error to UI
      }

      if (!data?.user || !data?.session) {
        console.error('[AuthContext] login: signInWithPassword succeeded but returned no user/session data.');
        setUser(null);
        throw new Error('Login failed: No session data received.');
      }

      // 3. Sign-in successful, now fetch profile and set state
      console.log('[AuthContext] login: signInWithPassword successful. Fetching profile...');
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('role, name')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        console.error('[AuthContext] login: Error fetching user profile after sign-in:', profileError);
        // Sign out again if profile fetch fails
        await resetSupabaseAuth();
        setUser(null);
        throw new Error('Login failed: Could not fetch user profile.');
      }

      console.log('[AuthContext] login: Profile fetched. Setting user state.');
      const loggedInUser: User = {
        id: data.user.id,
        email: data.user.email!,
        role: profileData.role,
        name: profileData.name,
        token: data.session.access_token
      };
      
      // Set state and store token/activity
      setUser(loggedInUser);
      localStorage.setItem('token', data.session.access_token);
      sessionStorage.setItem('token', data.session.access_token);
      updateLastActivity();
      
      console.log('[AuthContext] login: Login process successful.');
      console.groupEnd();
      return true; // Indicate success

    } catch (outerError) {
      console.error('[AuthContext] login: Error during login process:', outerError);
      // Ensure cleanup on any error
      setUser(null);
      // Attempt reset again just in case something went wrong mid-process
      await resetSupabaseAuth(); 
      console.groupEnd();
      throw outerError; // Re-throw for the UI
    } finally {
      setLoading(false); // Ensure loading is set to false after attempt
    }
  };

  const logout = async () => {
    console.groupCollapsed('[AuthContext] logout: Starting logout process...');
    // Set user to null immediately for faster UI feedback
    setUser(null); 
    
    try {
      // Call the enhanced performLogout helper
      console.log('[AuthContext] logout: Calling performLogout helper...');
      await performLogout(); // This now handles resetSupabaseAuth internally
      console.log('[AuthContext] logout: performLogout completed.');
      
      // Redirect MUST happen after state is cleared and async operations finish
      // Use router.push for SPA navigation, window.location for full page reload if needed
      console.log('[AuthContext] logout: Redirecting to /login...');
      router.push('/login'); 
      
    } catch (error) {
      console.error('[AuthContext] logout: Error during logout:', error);
      // Even on error, attempt to force redirect to login page
      console.log('[AuthContext] logout: Forcing redirect to /login due to error...');
      router.push('/login'); 
    } finally {
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
    isAuthenticated: !!user && !!user.id, // Based on user state
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
