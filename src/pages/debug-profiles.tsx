import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { ProfileDebugger } from '@/components/utils/ProfileDebugger';
import { FixProfilesButton } from '@/components/utils/FixProfilesButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { syncAuthToken } from '@/lib/auth-helpers';
import { supabase } from '@/lib/supabaseClient';

export default function DebugProfiles() {
  const { user, loading, loadUser } = useAuth();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [sqlResult, setSqlResult] = useState<{ success: boolean; message: string } | null>(null);
  const [sqlLoading, setSqlLoading] = useState(false);
  const [createUsersResult, setCreateUsersResult] = useState<any>(null);
  const [creatingUsers, setCreatingUsers] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    // Try to sync auth token on page load
    if (typeof window !== 'undefined') {
      syncAuthToken().catch(err => {
        console.warn('Failed to sync token on debug page load:', err);
      });
    }
  }, []);

  if (!isMounted) {
    return <div className="p-8">Loading...</div>;
  }

  const runSqlSetup = async () => {
    setSqlLoading(true);
    setSqlResult(null);
    
    try {
      // This would need a secure API endpoint in production
      // For local development we can use the client directly
      // In production this should be run via a secure admin API or migration
      
      // Here we're just showing the approach - this won't work for normal users
      // as they don't have permission to create tables
      const { error } = await supabase.rpc('run_sql', { 
        sql_query: create_profiles_table 
      });
      
      if (error) {
        setSqlResult({ 
          success: false, 
          message: `Failed to run setup SQL: ${error.message}` 
        });
      } else {
        setSqlResult({ 
          success: true, 
          message: 'Successfully created profiles table. Please reload the page.' 
        });
        
        // Reload user data to reflect changes
        await loadUser();
      }
    } catch (err) {
      console.error('Error running SQL setup:', err);
      setSqlResult({ 
        success: false, 
        message: err instanceof Error ? err.message : 'Unknown error running SQL setup'
      });
    } finally {
      setSqlLoading(false);
    }
  };

  const createTestUsers = async () => {
    setCreatingUsers(true);
    setCreateUsersResult(null);
    
    try {
      const response = await fetch('/api/create-test-users', {
        method: 'POST',
      });
      
      const data = await response.json();
      setCreateUsersResult(data);
    } catch (err) {
      console.error('Error creating test users:', err);
      setCreateUsersResult({
        message: 'Error creating test users',
        error: err instanceof Error ? err.message : String(err)
      });
    } finally {
      setCreatingUsers(false);
    }
  };

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Profile Debugging Tools</h1>
      
      {!user && !loading && (
        <Card>
          <CardHeader>
            <CardTitle>Not Authenticated</CardTitle>
            <CardDescription>You need to be logged in to use these tools.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/login')}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      )}
      
      {loading && (
        <Card>
          <CardHeader>
            <CardTitle>Loading Authentication...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse">Checking your authentication status...</div>
          </CardContent>
        </Card>
      )}
      
      {user && (
        <>
          <ProfileDebugger />
          
          <FixProfilesButton />
          
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Database Setup</CardTitle>
              <CardDescription>
                Run this if you're missing the profiles table in your Supabase database.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-3 bg-blue-50 text-blue-800 rounded text-sm">
                  <p className="font-medium">What this does:</p>
                  <p>
                    This will attempt to create the profiles table in your Supabase database if it doesn't exist.
                    Note: This requires admin privileges and won't work for regular users.
                  </p>
                </div>
                
                <Button 
                  onClick={runSqlSetup} 
                  disabled={sqlLoading}
                  variant="outline"
                >
                  {sqlLoading ? 'Running SQL...' : 'Create Profiles Table'}
                </Button>
                
                {sqlResult && (
                  <div className={`p-3 rounded text-sm ${
                    sqlResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                  }`}>
                    {sqlResult.message}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Create Test Users</CardTitle>
              <CardDescription>
                Create test users with predefined roles for testing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-3 bg-yellow-50 text-amber-800 rounded text-sm">
                  <p className="font-medium">What this does:</p>
                  <p>
                    This will create three test users with predefined roles:
                  </p>
                  <ul className="list-disc list-inside mt-2">
                    <li>admin@davidspeaker.com (admin role)</li>
                    <li>coach@davidspeaker.com (coach role)</li>
                    <li>student@davidspeaker.com (student role)</li>
                  </ul>
                  <p className="mt-2">All with the password: Testpassword123</p>
                </div>
                
                <Button 
                  onClick={createTestUsers} 
                  disabled={creatingUsers}
                  variant="outline"
                >
                  {creatingUsers ? 'Creating Users...' : 'Create Test Users'}
                </Button>
                
                {createUsersResult && (
                  <div className="p-3 bg-gray-50 text-gray-700 rounded text-sm">
                    <p className="font-medium mb-2">{createUsersResult.message}</p>
                    
                    {createUsersResult.results && (
                      <div className="space-y-2">
                        {createUsersResult.results.map((result: any, index: number) => (
                          <div 
                            key={index} 
                            className={`p-2 rounded text-xs ${
                              result.status === 'success' 
                                ? 'bg-green-50 text-green-700' 
                                : result.status === 'partial'
                                  ? 'bg-yellow-50 text-amber-700'
                                  : 'bg-red-50 text-red-700'
                            }`}
                          >
                            <span className="font-medium">{result.email}:</span> {result.message}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {createUsersResult.testPassword && (
                      <div className="mt-3 p-2 bg-blue-50 text-blue-700 rounded">
                        <p className="font-medium">Test Password: {createUsersResult.testPassword}</p>
                      </div>
                    )}
                    
                    {createUsersResult.error && (
                      <div className="mt-3 p-2 bg-red-50 text-red-700 rounded">
                        <p className="font-medium">Error:</p>
                        <p>{String(createUsersResult.error)}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Navigation</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => router.push('/dashboard')}>
                Dashboard
              </Button>
              <Button variant="outline" onClick={() => router.push('/dashboard/admin')}>
                Admin Dashboard
              </Button>
              <Button variant="outline" onClick={() => router.push('/dashboard/coach')}>
                Coach Dashboard
              </Button>
              <Button variant="outline" onClick={() => router.push('/dashboard/student')}>
                Student Dashboard
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

// Add this SQL string at the top of the file
const create_profiles_table = `
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  role TEXT CHECK (role IN ('admin', 'coach', 'student')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow individuals to read their own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Allow individuals to update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Create a trigger to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();
`;