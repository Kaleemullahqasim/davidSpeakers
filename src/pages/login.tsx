import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, Mic } from 'lucide-react';
import { checkSupabaseHealth, logAuthError } from '@/lib/auth-helpers';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, user, loading } = useAuth();
  const router = useRouter();
  const [authCheckTimeout, setAuthCheckTimeout] = useState(false);

  // Run Supabase health check on mount
  useEffect(() => {
    const health = checkSupabaseHealth();
    console.log('[Login Page] Supabase health check:', health);
    
    if (!health.isHealthy) {
      setError(`Authentication system unavailable. Please try again later. (${health.details.error || 'Unknown error'})`);
    }
  }, []);

  // Handle case where auth check is taking too long
  useEffect(() => {
    if (loading) {
      const timeoutId = setTimeout(() => {
        setAuthCheckTimeout(true);
        console.log('[Login Page] Auth check timed out, showing login form');
      }, 10000); // Increased to 10 seconds for production
      
      return () => clearTimeout(timeoutId);
    }
  }, [loading]);

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && user) {
      console.log('[Login Page] User authenticated, redirecting to dashboard');
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

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    console.log('[Login Page] Attempting login...');
    
    // Check Supabase health before attempting login
    const health = checkSupabaseHealth();
    if (!health.isHealthy) {
      setIsSubmitting(false);
      setError(`Authentication system unavailable. Please try again later. (${health.details.error || 'Connection issue'})`);
      console.error('[Login Page] Supabase health check failed:', health);
      return;
    }
    
    // Set a timeout for login operation
    const loginTimeoutId = setTimeout(() => {
      setIsSubmitting(false);
      setError('Login request timed out. Please try again.');
      console.error('[Login Page] Login operation timed out after 20 seconds');
      logAuthError('Login Timeout', { email, duration: 20000 });
    }, 20000); // Increased to 20 seconds for production
    
    try {
      const user = await login(email, password);
      clearTimeout(loginTimeoutId);
      console.log('[Login Page] Login successful, user:', user);
      
      // Router will handle redirect based on role in useEffect
    } catch (err) {
      clearTimeout(loginTimeoutId);
      console.error('[Login Page] Login error:', err);
      logAuthError('Login Failure', err);
      
      // More user-friendly error messages
      if (err instanceof Error) {
        if (err.message.includes('timeout')) {
          setError('Login timed out. This could be due to network issues. Please try again.');
        } else if (err.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please check your credentials and try again.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } finally {
      clearTimeout(loginTimeoutId);
      setIsSubmitting(false);
    }
  };

  // If still checking auth state and not timed out, show loading
  if (loading && !authCheckTimeout) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Checking authentication...</span>
      </div>
    );
  }
  
  // If auth check timed out, show login form anyway
  if (loading && authCheckTimeout) {
    // Continue to show the login form, but with a warning
    console.log('Auth check timed out, showing login form');
  }

  // Only show login form if not already authenticated or auth check timed out
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
              {(error || authCheckTimeout) && (
                <Alert variant={authCheckTimeout ? "default" : "destructive"} className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {error || (authCheckTimeout ? "Authentication check taking longer than expected. You can still try to log in." : "")}
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
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
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
