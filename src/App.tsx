import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { StudentDashboard } from './components/student/Dashboard';
import { CoachDashboard } from './components/coach/Dashboard';
import { AdminDashboard } from './components/admin/Dashboard';
import { LoginPage } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';
import { EmailVerificationPage } from './components/auth/EmailVerificationPage';
import { Mic, Users, Settings, LogOut } from 'lucide-react';
import { useAuthStore } from './store';
import { supabase } from './lib/supabase';
import { getSession, getUserFromSession, signOut } from './lib/auth-service';
import { runSupabaseDiagnostic } from './lib/diagnostic';

function PrivateRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function App() {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    // Force loading to finish after a timeout to prevent infinite spinner
    const forceTimeout = setTimeout(() => {
      if (loading) {
        console.warn('Auth check took too long - forcing timeout');
        console.log('Running diagnostics to check Supabase connection...');
        runSupabaseDiagnostic().then(result => {
          console.log('Diagnostic result:', result);
        });
        setLoading(false);
        setAuthChecked(true);
      }
    }, 5000); // 5 second timeout

    // Check if this is a verification callback from Supabase
    const isVerificationCallback = 
      location.hash.includes('access_token') || 
      location.hash.includes('confirmation_token') ||
      location.hash.includes('type=');
      
    if (isVerificationCallback) {
      console.log('Detected verification callback');
      // Let the EmailVerificationPage handle this
      setAuthChecked(true);
      setLoading(false);
      clearTimeout(forceTimeout);
      return;
    }
    
    // Check for active session on component mount
    const checkSession = async () => {
      try {
        setLoading(true);
        
        // Get current session
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
          setUser(null);
        } else if (data.session?.user) {
          try {
            const { data: userData, error: userError } = await supabase.auth.getUser();
            
            if (userError) {
              console.error('User data error:', userError);
              setUser(null);
            } else {
              const role = userData.user?.user_metadata?.role || 'student';
              const fullName = userData.user?.user_metadata?.full_name || '';
              const avatarUrl = userData.user?.user_metadata?.avatar_url || '';
              
              setUser({
                id: data.session.user.id,
                name: fullName,
                email: data.session.user.email || '',
                role: role,
                avatarUrl: avatarUrl,
              });
            }
          } catch (e) {
            console.error('Error processing user data:', e);
            setUser(null);
          }
        } else {
          // No active session
          setUser(null);
        }
      } catch (error) {
        console.error('Error checking session:', error);
        setUser(null);
      } finally {
        setLoading(false);
        setAuthChecked(true);
        clearTimeout(forceTimeout);
      }
    };
    
    checkSession();
    
    // Subscribe to auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        
        if (event === 'SIGNED_OUT') {
          console.log('User signed out, clearing user data');
          setUser(null);
          // Force a page reload to clean state on sign out
          if (location.pathname !== '/login' && location.pathname !== '/register') {
            window.location.href = '/login';
          }
        } else if (event === 'SIGNED_IN' && session) {
          console.log('User signed in, getting user data');
          try {
            const { data, error } = await supabase.auth.getUser();
            
            if (error) {
              console.error('Error getting user data:', error);
              return;
            }
            
            const role = data.user?.user_metadata?.role || 'student';
            const fullName = data.user?.user_metadata?.full_name || '';
            const avatarUrl = data.user?.user_metadata?.avatar_url || '';
            
            setUser({
              id: session.user.id,
              name: fullName,
              email: session.user.email || '',
              role: role,
              avatarUrl: avatarUrl,
            });
          } catch (e) {
            console.error('Error in auth state change handler:', e);
            setUser(null);
          }
        }
      }
    );
    
    return () => {
      // Cleanup
      clearTimeout(forceTimeout);
      
      // Cleanup auth listener
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [setUser, location, loading]);

  // Show loading state while checking for session (but add a timeout to prevent infinite loading)
  if (loading && !authChecked) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  // Check if this is a special route like email verification that should be accessible without login
  const isEmailVerificationRoute = location.pathname === '/verify-email' || 
                                  location.pathname.includes('/auth/v1/verify');

  if (isEmailVerificationRoute) {
    return (
      <Routes>
        <Route path="/verify-email" element={<EmailVerificationPage />} />
        <Route path="/auth/v1/verify" element={<EmailVerificationPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // If user is already logged in and tries to access login page, redirect to their dashboard
  if (user && (location.pathname === '/login' || location.pathname === '/signin')) {
    const dashboardPath = `/${user.role}`;
    return <Navigate to={dashboardPath} replace />;
  }

  // Public routes when user is not authenticated
  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signin" element={<LoginPage />} /> {/* Add a signin alias */}
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<EmailVerificationPage />} />
        <Route path="/auth/v1/verify" element={<EmailVerificationPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  const handleSignOut = async () => {
    console.log("Sign out initiated");
    try {
      // First clear the user from the store to immediately update UI
      setUser(null);
      // Then actually sign out from Supabase
      await supabase.auth.signOut();
      console.log("Sign out successful");
      // Force a full page refresh to ensure clean state
      window.location.href = "/login";
    } catch (error) {
      console.error('Error signing out:', error);
      alert("There was an error signing out. Please try again.");
      // Even on error, redirect to login for safety
      window.location.href = "/login";
    }
  };

  const getDashboardForRole = () => {
    switch (user.role) {
      case 'student':
        return <StudentDashboard />;
      case 'coach':
        return <CoachDashboard />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return <Navigate to="/login" replace />;
    }
  };

  // The authenticated app with navigation
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Mic className="h-8 w-8 text-indigo-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">SpeakWise</span>
              </div>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">Welcome, {user.name}</span>
                <button
                  type="button"
                  className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <span className="sr-only">View notifications</span>
                  <Users className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <span className="sr-only">Settings</span>
                  <Settings className="h-6 w-6" />
                </button>
                <button
                  onClick={handleSignOut}
                  type="button"
                  className="bg-white p-1 rounded-full text-red-400 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <span className="sr-only">Sign out</span>
                  <LogOut className="h-6 w-6" />
                </button>
                {user.avatarUrl ? (
                  <img
                    className="h-8 w-8 rounded-full"
                    src={user.avatarUrl}
                    alt={user.name}
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main>
        <Routes>
          <Route
            path="/"
            element={getDashboardForRole()}
          />
          <Route
            path="/student"
            element={
              <PrivateRoute allowedRoles={['student']}>
                <StudentDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/coach"
            element={
              <PrivateRoute allowedRoles={['coach']}>
                <CoachDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <PrivateRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </PrivateRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}