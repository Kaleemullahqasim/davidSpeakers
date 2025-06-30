import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { syncAuthToken, getRoleRedirectPath } from '@/lib/auth-helpers';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { AlertCircle, Loader2, Mic } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  // Check for expired session
  const isExpired = router.query.expired === 'true';
  
  // Use the auth context consistently - don't conditionally call hooks
  const auth = useAuth();
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.login || !isMounted) return; // Only proceed if mounted and login is available
    
    setError('');
    setIsSubmitting(true);
    
    try {
      // Perform login
      await auth.login(email, password);
      
      // Sync the auth token to localStorage
      await syncAuthToken();
      
      // Auth state change will handle redirect
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Redirect ONLY when auth is not loading and user with role is confirmed
  useEffect(() => {
    if (isMounted && !auth.loading && auth.user?.role) {
      const targetPath = getRoleRedirectPath(auth.user.role);
      console.log(`Login page: User found with role ${auth.user.role}, redirecting to ${targetPath}`);
      router.push(targetPath);
    } else if (isMounted && !auth.loading && auth.user && !auth.user.role) {
       // Handle case where user is loaded but role is missing (should be less likely with stricter AuthContext)
       console.warn("Login page: User is loaded but role is missing. Potential issue.");
       setError("Could not determine your user role. Please contact support.");
       // Consider forcing logout: auth.logout();
    }
  }, [isMounted, auth.loading, auth.user, router, auth.logout]); // Added auth.logout to dependency array if used

  // Show loading indicator while checking auth state or if not mounted yet
  if (!isMounted || auth.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // If user is logged in but redirection hasn't happened (e.g., useEffect pending)
  if (auth.user) {
     return (
       <div className="flex items-center justify-center min-h-screen bg-gray-100">
         <div className="p-8 text-center">
           <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
           <p>Redirecting to dashboard...</p>
         </div>
       </div>
     );
  }

  // Rest of the component stays the same
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
            {isExpired && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Session Expired</AlertTitle>
                <AlertDescription>Your session has expired. Please log in again.</AlertDescription>
              </Alert>
            )}
            
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Login Failed</AlertTitle>
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

// Add getServerSideProps
export async function getServerSideProps() {
  return {
    props: {}, // will be passed to the page component as props
  }
}
