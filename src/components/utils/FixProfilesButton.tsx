import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchWithAuth } from '@/lib/auth-helpers';
import { AlertCircle, CheckCircle } from 'lucide-react';

export function FixProfilesButton() {
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Analyze profiles without fixing
  const analyzeProfiles = async () => {
    setAnalyzing(true);
    setError(null);
    setResults(null);
    
    try {
      const response = await fetchWithAuth('/api/fix-profiles', {
        method: 'POST',
        body: JSON.stringify({ apply: false }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to analyze profiles');
      }
      
      const data = await response.json();
      setResults(data);
    } catch (err) {
      console.error('Error analyzing profiles:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze profiles');
    } finally {
      setAnalyzing(false);
    }
  };

  // Apply the fixes
  const applyFixes = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetchWithAuth('/api/fix-profiles', {
        method: 'POST',
        body: JSON.stringify({ apply: true }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to apply profile fixes');
      }
      
      const data = await response.json();
      setResults(data);
      
      // If successful, prompt for refresh
      if (data.updates && data.updates.some((u: any) => u.success)) {
        setTimeout(() => {
          if (window.confirm('Profiles updated successfully! Reload the page to see changes?')) {
            window.location.reload();
          }
        }, 500);
      }
    } catch (err) {
      console.error('Error applying profile fixes:', err);
      setError(err instanceof Error ? err.message : 'Failed to apply profile fixes');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Fix User Roles</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-3 bg-yellow-50 text-amber-800 rounded text-sm">
            <p className="font-medium">What this does:</p>
            <p>
              This tool analyzes all users and their profiles, and fixes any missing or incorrect role assignments.
              It will set roles based on email addresses:
            </p>
            <ul className="list-disc list-inside mt-2">
              <li>Emails containing "admin" will get the admin role</li>
              <li>Emails containing "coach" will get the coach role</li>
              <li>All other users will get the student role</li>
            </ul>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={analyzeProfiles} 
              disabled={analyzing || loading}
              variant="outline"
            >
              {analyzing ? 'Analyzing...' : 'Analyze Profiles'}
            </Button>
            
            <Button 
              onClick={applyFixes} 
              disabled={analyzing || loading}
              variant="default"
            >
              {loading ? 'Applying Fixes...' : 'Apply Fixes'}
            </Button>
          </div>
          
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded flex items-start gap-2">
              <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Error</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}
          
          {results && (
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 text-blue-800 rounded">
                <p className="font-medium">{results.message}</p>
                <p className="text-sm mt-1">Found {results.fixes?.length || 0} issues to fix</p>
              </div>
              
              {results.fixes && results.fixes.length > 0 && (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  <p className="font-medium text-sm">Role Changes:</p>
                  {results.fixes.map((fix: any, i: number) => (
                    <div 
                      key={i} 
                      className={`p-2 text-xs rounded ${
                        fix.action === 'create' 
                          ? 'bg-green-50 text-green-700' 
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      <p>
                        <span className="font-medium">{fix.email}:</span> {fix.action === 'create' 
                          ? `Create with role "${fix.newRole}"` 
                          : `Change role from "${fix.oldRole}" to "${fix.newRole}"`
                        }
                      </p>
                    </div>
                  ))}
                </div>
              )}
              
              {results.updates && (
                <div className="p-3 bg-green-50 text-green-700 rounded flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Updates Applied</p>
                    <p className="text-sm">
                      {results.updates.filter((u: any) => u.success).length} of {results.updates.length} updates succeeded
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 