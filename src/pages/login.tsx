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
    }, hasReset ? 12000 : 8000); // Longer timeout if we've already attempted a reset
    
    // Check for expired param which indicates session expired
    if (router.query.expired === 'true' && !error) {
      setError('Your session has expired. Please log in again.');
    }
    
    return () => clearTimeout(timeoutId);
  }, [loading, router.query, error]);
  
  // Enhanced recovery function with better visual feedback
  const handleForceRefresh = async () => {
    try {
      setRecoveryInProgress(true);
      setError('Cleaning up authentication state...'); 
      setAuthCheckTimeout(false); // Hide the recovery UI while we're working
      
      // Complete auth reset with our improved function
      await resetSupabaseAuth();
      
      setError('Authentication reset successful! Reloading page...');
      
      // Force page reload after short delay to ensure cleanup is complete
      setTimeout(() => {
        window.location.href = '/login?reset=true';
      }, 800);
    } catch (error) {
      console.error('Error during recovery:', error);
      setError('Recovery failed. Please try again or clear your browser cache.');
      setRecoveryInProgress(false);
    }
  };

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && user) {
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
    }
  }, [user, loading, router]);

  // Enhanced form submission with better error handling
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    // Set a timeout to handle stuck login requests
    const loginTimeout = setTimeout(() => {
      if (isSubmitting) {
        setError('Login is taking longer than expected. Please try recovering your session below.');
        setIsSubmitting(false);
        setAuthCheckTimeout(true); // Show recovery option
      }
    }, 8000); // 8-second timeout for login operation
    
    try {
      // First do a light cleanup before attempting login
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      
      const user = await login(email, password);
      clearTimeout(loginTimeout);
      console.log('Login successful, user:', user);
      
      // Router will handle redirect based on role in useEffect
    } catch (err) {
      clearTimeout(loginTimeout);
      console.error('Login error:', err);
      
      // Provide more specific error messages based on error type
      if (err instanceof Error) {
        if (err.message.includes('timeout') || err.message.includes('network')) {
          setError('Login request timed out or network error. Please try recovering your session.');
          setAuthCheckTimeout(true); // Show recovery option
        } else if (err.message.includes('Invalid login')) {
          setError('Invalid email or password. Please check your credentials.');
        } else {
          setError(`Login failed: ${err.message}`);
        }
      } else {
        setError('Login failed. Please check your credentials or try recovering your session.');
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
            <Alert variant="warning" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Authentication check is taking longer than usual.</AlertDescription>
            </Alert>
            <p className="text-gray-600 mb-4">
              This could be due to a stale session or network issues. Click below to clean up your session data and try again.
            </p>
            <Button 
              onClick={handleForceRefresh} 
              disabled={recoveryInProgress}
              variant="outline"
              size="sm"
            >
              {recoveryInProgress ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cleaning up...
                </>
              ) : (
                'Recover Session'
              )}
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
                    Having trouble logging in? 
                    <Button 
                      variant="link" 
                      className="p-0 h-auto text-primary underline ml-1" 
                      onClick={handleForceRefresh}
                      disabled={recoveryInProgress}
                    >
                      {recoveryInProgress ? 'Recovering session...' : 'Recover your session'}
                    </Button>
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
