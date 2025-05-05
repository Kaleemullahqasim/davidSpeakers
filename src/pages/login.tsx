import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, Mic } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, user, loading } = useAuth();
  const router = useRouter();
  const [authCheckTimeout, setAuthCheckTimeout] = useState(false);
  
  // Handle extended auth check timeouts with more aggressive recovery
  useEffect(() => {
    // If loading takes too long, provide an option to retry
    const timeoutId = setTimeout(() => {
      if (loading) {
        setAuthCheckTimeout(true);
      }
    }, 8000); // 8 seconds timeout for initial auth check
    
    return () => clearTimeout(timeoutId);
  }, [loading]);
  
  // Handle forced refresh if authentication check is stuck
  const handleForceRefresh = () => {
    // Clear any potential stuck auth state before refreshing
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    
    // Clear any Supabase-specific tokens
    if (typeof window !== 'undefined') {
      Object.keys(localStorage).forEach(key => {
        if (/^sb-.*-auth-token$/.test(key)) {
          localStorage.removeItem(key);
        }
      });
      
      // Clear cookies
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
    
    window.location.reload();
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

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    // Set a timeout to handle stuck login requests
    const loginTimeout = setTimeout(() => {
      if (isSubmitting) {
        setError('Login is taking longer than expected. Please try again.');
        setIsSubmitting(false);
      }
    }, 10000); // 10-second timeout for login operation
    
    try {
      const user = await login(email, password);
      clearTimeout(loginTimeout);
      console.log('Login successful, user:', user);
      
      // Router will handle redirect based on role in useEffect
    } catch (err) {
      clearTimeout(loginTimeout);
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Login failed. Please check your credentials.');
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
          <div className="mt-6 text-center">
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
