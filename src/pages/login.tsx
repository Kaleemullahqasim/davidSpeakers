import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, Mic } from 'lucide-react';

// Import resetSupabaseAuth
import { resetSupabaseAuth } from '@/lib/supabaseClient';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, user, loading } = useAuth();
  const router = useRouter();
  const [authCheckTimeout, setAuthCheckTimeout] = useState(false);
  const [recoveryInProgress, setRecoveryInProgress] = useState(false);
  
  // Handle extended auth check timeouts with more aggressive recovery
  useEffect(() => {
    // Add URL query param check to detect if we're coming from a recovery attempt
    const hasReset = router.query.reset === 'true';
    
    // If loading takes too long, provide an option to retry
    const timeoutId = setTimeout(() => {
      if (loading) {
        setAuthCheckTimeout(true);
      }
    }, hasReset ? 12000 : 8000); // Longer timeout if we're already attempted a reset
    
    // Check for expired param which indicates session expired
    if (router.query.expired === 'true' && !error) {
      setError('Your session has expired. Please log in again.');
    }
    
    return () => clearTimeout(timeoutId);
  }, [loading, router.query, error]);
  
  // Enhance handleForceRefresh function with more detailed recovery steps
  const handleForceRefresh = async () => {
    try {
      setError(''); // Clear any existing errors
      setAuthCheckTimeout(false); // Hide the recovery UI while we're working
      
      // Show a temporary processing message
      const tempErrorId = setTimeout(() => {
        setError('Cleaning up authentication state...');
      }, 100);
      
      // Use the centralized reset function
      await resetSupabaseAuth();
      
      // Also reset our own tokens
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      localStorage.removeItem('last-activity');
      
      // Clean any other potential Supabase artifacts
      if (typeof window !== 'undefined') {
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('sb-') || key.includes('supabase')) {
            localStorage.removeItem(key);
          }
        });
        
        // Clean cookies
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
      
      clearTimeout(tempErrorId);
      setError('Authentication reset successful. Reloading page...');
      
      // Force page reload after short delay to ensure cleanup is complete
      setTimeout(() => {
        window.location.href = '/login?reset=true';
      }, 500);
    } catch (error) {
      console.error('Error during recovery:', error);
      setError('Recovery failed. Please try again or clear your browser cache.');
    }
  };

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && user) {
      console.log('[Login Page] User detected, redirecting...');
      // Redirect based on user role
      if (user.role === 'admin') {
        router.push('/dashboard/admin');
      } else if (user.role === 'coach') {
        router.push('/dashboard/coach');
      } else if (user.role === 'student') {
        router.push('/dashboard/student');
      } else {
        // Fallback for unknown roles
        router.push('/dashboard');
      }
    } else if (!loading && !user) {
      console.log('[Login Page] No user detected, showing login form.');
    }
  }, [user, loading, router]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    setAuthCheckTimeout(false); // Reset recovery prompt on new attempt
    
    try {
      // login function now returns boolean
      const success = await login(email, password); 
      
      if (success) {
        console.log('[Login Page] Login successful, waiting for redirect...');
        // Redirect is handled by the useEffect watching `user` state
      } else {
         // This case might not happen if login throws errors, but handle defensively
         setError('Login failed. Please try again.');
      }
    } catch (err: any) {
      console.error('[Login Page] Login error:', err);
      // Provide more specific error messages
      if (err.message.includes('timed out')) {
        setError('Login request timed out. Please check your connection or try recovering session.');
        setAuthCheckTimeout(true); // Show recovery option on timeout
      } else if (err.message.includes('Invalid login credentials')) { // Check for Supabase specific error
        setError('Invalid email or password.');
      } else if (err.message.includes('fetch user profile')) {
         setError('Login succeeded but failed to load profile. Please try again.');
      } else {
        setError(`Login failed: ${err.message || 'Please try again.'}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // If still checking auth state, show loading
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="flex items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Checking authentication...</span>
        </div>
        
        {authCheckTimeout && (
          <div className="mt-6 text-center p-4 max-w-md">
            <p className="text-gray-600 mb-2">Authentication check is taking longer than usual.</p>
            <Button 
              onClick={handleForceRefresh} 
              variant="outline" 
              size="sm"
            >
              Refresh Page
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Only show login form if not already authenticated
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="w-full max-w-md px-4">
          <Card className="shadow-lg">
            <CardHeader className="space-y-1 flex flex-col items-center">
              <div className="flex items-center justify-center mb-4">
                <Mic className="h-8 w-8 text-primary mr-2" />
                <span className="text-2xl font-bold text-primary">David Speaker</span>
              </div>
              <CardTitle className="text-2xl">Login</CardTitle>
              <CardDescription>
                Enter your credentials to access your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {authCheckTimeout && !isSubmitting && (
                <Alert variant="warning" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Login request timed out. Please check your connection or try recovering session.
                  </AlertDescription>
                </Alert>
              )}
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      <a href="#" className="text-sm text-primary hover:underline">
                        Forgot password?
                      </a>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isSubmitting || recoveryInProgress}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Logging in...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
            <CardFooter className="flex justify-center">
              <p className="text-sm text-gray-500">
                Don't have an account? Contact your administrator.
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  // This should not be rendered due to the redirect in useEffect, but as a fallback
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <span className="ml-2">Redirecting to dashboard...</span>
    </div>
  );
}
