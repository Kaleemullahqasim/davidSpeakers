import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function FixRoles() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const { user, loadUser } = useAuth();
  const [syncStatus, setSyncStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState('');
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Function to sync user roles across tables
  const syncUserRoles = async (specifiedRole?: string) => {
    setSyncStatus('loading');
    setSyncMessage('Synchronizing roles across tables...');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated. Please log in first.');
      }
      
      const response = await fetch('/api/sync-user-roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: specifiedRole })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error ${response.status}: Role sync failed`);
      }
      
      const result = await response.json();
      
      setSyncStatus('success');
      setSyncMessage(`Role successfully synchronized as "${result.role}". Refreshing user data...`);
      
      // Reload the user to get updated role
      await loadUser();
      
      // Wait a moment before redirecting to the appropriate dashboard
      setTimeout(() => {
        if (result.role === 'admin') {
          router.push('/dashboard/admin');
        } else if (result.role === 'coach') {
          router.push('/dashboard/coach');
        } else {
          router.push('/dashboard/student');
        }
      }, 2000);
      
    } catch (error) {
      console.error('Error synchronizing roles:', error);
      setSyncStatus('error');
      setSyncMessage(error instanceof Error ? error.message : 'An unknown error occurred');
    }
  };
  
  if (!isMounted) {
    return <div className="p-8">Loading...</div>;
  }
  
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Fix User Roles Issues</h1>
      
      <div className="grid gap-6">
        <Card className="border-indigo-200 bg-indigo-50">
          <CardHeader>
            <CardTitle>Quick Role Fix</CardTitle>
            <CardDescription>
              Synchronize your role across all tables to fix redirection issues
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-white rounded-lg border border-indigo-100">
              <h3 className="font-medium mb-2">Your Current Status</h3>
              <p className="text-sm mb-3">
                Logged in as: <span className="font-medium">{user?.email || 'Not logged in'}</span>
              </p>
              <p className="text-sm mb-3">
                Current role: <span className="font-medium">{user?.role || 'Unknown'}</span>
              </p>
              
              {user?.email?.includes('coach') && user?.role !== 'coach' && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md mb-4">
                  <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">Role Mismatch Detected</p>
                    <p className="text-sm text-amber-700 mt-1">
                      Your email contains "coach" but your role is set to "{user?.role}". 
                      Click the button below to fix this.
                    </p>
                  </div>
                </div>
              )}
              
              {syncStatus === 'loading' && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md mb-4">
                  <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                  <p className="text-sm font-medium text-blue-800">{syncMessage}</p>
                </div>
              )}
              
              {syncStatus === 'success' && (
                <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-md mb-4">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-800">Roles Synchronized Successfully</p>
                    <p className="text-sm text-green-700 mt-1">{syncMessage}</p>
                  </div>
                </div>
              )}
              
              {syncStatus === 'error' && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md mb-4">
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Synchronization Failed</p>
                    <p className="text-sm text-red-700 mt-1">{syncMessage}</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                variant="default" 
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => syncUserRoles('admin')}
                disabled={syncStatus === 'loading'}
              >
                Set as Admin
              </Button>
              <Button 
                variant="default" 
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => syncUserRoles('coach')}
                disabled={syncStatus === 'loading'}
              >
                Set as Coach
              </Button>
              <Button 
                variant="default" 
                className="bg-purple-600 hover:bg-purple-700 text-white"
                onClick={() => syncUserRoles('student')}
                disabled={syncStatus === 'loading'}
              >
                Set as Student
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Overview of the Problem</CardTitle>
            <CardDescription>
              All users are being redirected to the student dashboard regardless of their actual role
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              The issue is that users with different roles (admin, coach, student) are all being
              redirected to the student dashboard. This happens because:
            </p>
            
            <ol className="list-decimal list-inside space-y-2">
              <li>
                The <code>profiles</code> table in Supabase might be missing or not properly set up
              </li>
              <li>
                User accounts might not have the correct role set in their profile
              </li>
              <li>
                Authentication works, but role-based redirection is not using the right role
              </li>
            </ol>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Create the Profiles Table</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              First, make sure the <code>profiles</code> table exists in your Supabase database.
              We've created a tool to help you set this up:
            </p>
            
            <div className="p-4 bg-blue-50 text-blue-800 rounded">
              <p className="font-medium">Go to the Debug Profiles page, and click "Create Profiles Table"</p>
              <Button
                variant="default"
                className="mt-3"
                onClick={() => router.push('/debug-profiles')}
              >
                Go to Debug Profiles
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Step 2: Create Test Users with Correct Roles</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Next, create test users with the correct roles. This will ensure you have accounts
              to test with:
            </p>
            
            <div className="p-4 bg-blue-50 text-blue-800 rounded">
              <p className="font-medium">On the Debug Profiles page, click "Create Test Users"</p>
              <p className="text-sm mt-2">
                This will create three users with different roles:
              </p>
              <ul className="list-disc list-inside mt-1 text-sm">
                <li>admin@davidspeaker.com (admin role)</li>
                <li>coach@davidspeaker.com (coach role)</li>
                <li>student@davidspeaker.com (student role)</li>
              </ul>
              <p className="text-sm mt-2">
                All with the password: <code>Testpassword123</code>
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Step 3: Fix Existing User Roles</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              If you already have users with incorrect roles, you can update them using the Profile Debugger:
            </p>
            
            <div className="p-4 bg-blue-50 text-blue-800 rounded">
              <p className="font-medium">How to fix a user's role:</p>
              <ol className="list-decimal list-inside mt-2 space-y-2 text-sm">
                <li>Log in with the user account that has the wrong role</li>
                <li>Go to the <Link href="/debug-profiles" className="underline">Debug Profiles</Link> page</li>
                <li>Click one of the "Set as X" buttons to set the correct role</li>
                <li>You'll be automatically redirected to the correct dashboard</li>
              </ol>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Step 4: Test Each User Type</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">After setting up the profiles and roles, test each user type:</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded">
                <h3 className="font-semibold mb-2">Admin</h3>
                <p className="text-sm mb-3">Admins should see the admin dashboard with access to all users, evaluations, analytics, and settings.</p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => router.push('/dashboard/admin')}
                >
                  Test Admin Dashboard
                </Button>
              </div>
              
              <div className="p-4 bg-gray-50 rounded">
                <h3 className="font-semibold mb-2">Coach</h3>
                <p className="text-sm mb-3">Coaches should see the coach dashboard with student management and evaluation tools.</p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => router.push('/dashboard/coach')}
                >
                  Test Coach Dashboard
                </Button>
              </div>
              
              <div className="p-4 bg-gray-50 rounded">
                <h3 className="font-semibold mb-2">Student</h3>
                <p className="text-sm mb-3">Students should see the student dashboard with video submission and evaluation history.</p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => router.push('/dashboard/student')}
                >
                  Test Student Dashboard
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Need More Help?</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              If you still experience issues after following these steps, check these common problems:
            </p>
            
            <div className="p-4 bg-gray-50 rounded mt-4 space-y-3">
              <p className="font-medium">Common Issues:</p>
              
              <div>
                <p className="font-medium text-sm">1. Database Permissions</p>
                <p className="text-sm">Make sure your Supabase RLS (Row Level Security) policies allow reading and updating profiles.</p>
              </div>
              
              <div>
                <p className="font-medium text-sm">2. Token Validity</p>
                <p className="text-sm">Try logging out and logging back in if you change a user's role and it doesn't take effect.</p>
              </div>
              
              <div>
                <p className="font-medium text-sm">3. Browser Cache</p>
                <p className="text-sm">Clear your browser cache/local storage if you continue to experience auth issues.</p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              variant="default"
              onClick={() => router.push('/debug-profiles')}
            >
              Go to Debug Profiles
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 