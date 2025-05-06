import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabaseClient';
import { fetchWithAuth } from '@/lib/auth-helpers';
import { getRoleRedirectPath } from '@/lib/auth-helpers';

export function ProfileDebugger() {
  const { user, loadUser } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkProfile = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetchWithAuth('/api/check-profile');
      const data = await res.json();
      setProfileData(data);
    } catch (err) {
      console.error('Error checking profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to check profile');
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async (role: 'admin' | 'coach' | 'student') => {
    if (!user?.id) return;
    setLoading(true);
    
    try {
      // Update the profile with the new role
      const { error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', user.id);
      
      if (error) {
        throw error;
      }
      
      // Reload user data to reflect the new role
      await loadUser();
      await checkProfile();
      
      // Show success message
      alert(`Role updated to ${role}. You'll now be redirected to the ${role} dashboard.`);
      
      // Redirect to the appropriate dashboard
      window.location.href = getRoleRedirectPath(role);
      
    } catch (err) {
      console.error('Error updating role:', err);
      setError(err instanceof Error ? err.message : 'Failed to update role');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      checkProfile();
    }
  }, [user?.id]);

  if (!user) return null;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Profile Debugger</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <h3 className="font-medium">User Info:</h3>
          <pre className="bg-gray-100 p-2 rounded overflow-auto text-xs">
            {JSON.stringify({ id: user.id, email: user.email, role: user.role }, null, 2)}
          </pre>
        </div>
        
        {profileData && (
          <div className="mb-4">
            <h3 className="font-medium">Profile Data:</h3>
            <pre className="bg-gray-100 p-2 rounded overflow-auto text-xs">
              {JSON.stringify(profileData, null, 2)}
            </pre>
          </div>
        )}
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">
            {error}
          </div>
        )}
        
        <div className="flex flex-col space-y-2">
          <Button 
            onClick={checkProfile} 
            disabled={loading}
            variant="outline"
            className="justify-start"
          >
            {loading ? 'Checking...' : 'Check Profile'}
          </Button>
          
          <div className="p-3 bg-yellow-50 rounded text-amber-800 text-sm mb-2">
            <p className="font-medium">Set User Role</p>
            <p className="text-xs mb-2">Clicking a button will update your role in the database and reload the page.</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <Button 
                onClick={() => updateRole('admin')} 
                disabled={loading}
                variant="destructive"
                size="sm"
              >
                Set as Admin
              </Button>
              <Button 
                onClick={() => updateRole('coach')} 
                disabled={loading}
                variant="secondary"
                size="sm"
              >
                Set as Coach
              </Button>
              <Button 
                onClick={() => updateRole('student')} 
                disabled={loading}
                variant="default"
                size="sm"
              >
                Set as Student
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 