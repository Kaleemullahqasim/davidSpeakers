import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '@/contexts/AuthContext'
import { Loader2, AlertTriangle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { fetchLatestCompletedEvaluation } from '@/lib/api'

export default function Dashboard() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const { user, loading } = useAuth();
  const [roleMismatch, setRoleMismatch] = useState(false);
  
  // Set mounted state
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Check if there's a role mismatch based on email pattern
  useEffect(() => {
    if (user && user.email) {
      const hasAdminEmail = user.email.includes('admin');
      const hasCoachEmail = user.email.includes('coach');
      
      if ((hasAdminEmail && user?.role !== 'admin') || 
          (hasCoachEmail && user?.role !== 'coach') ||
          (!hasAdminEmail && !hasCoachEmail && user?.role !== 'student')) {
        setRoleMismatch(true);
      } else {
        setRoleMismatch(false);
      }
    }
  }, [user]);
  
  // Handle redirects only on client-side
  useEffect(() => {
    if (!isMounted) return;
    
    // Redirect to login if not authenticated
    if (!loading && !user) {
      console.log('No user found, redirecting to login');
      router.push('/login');
      return;
    }
    
    // If there's a role mismatch, don't redirect yet
    if (roleMismatch) {
      console.warn('Role mismatch detected. Staying on dashboard page to allow fixing.');
      return;
    }
    
    // Handle student redirect to latest completed evaluation
    const handleStudentRedirect = async () => {
      try {
        console.log('🔄 Starting handleStudentRedirect function...');
        console.log('📡 Calling fetchLatestCompletedEvaluation API...');
        const { evaluation, hasCompletedEvaluations } = await fetchLatestCompletedEvaluation();
        
        console.log('📊 API Response:', { 
          hasCompletedEvaluations, 
          evaluationId: evaluation?.id,
          evaluationStatus: evaluation?.status,
          evaluationCompletedAt: evaluation?.completed_at
        });
        
        if (hasCompletedEvaluations && evaluation) {
          console.log(`✅ Found completed evaluation! Redirecting to: /dashboard/student/evaluations/${evaluation.id}`);
          router.push(`/dashboard/student/evaluations/${evaluation.id}`);
        } else {
          console.log('❌ No completed evaluations found, redirecting to student dashboard');
          router.push('/dashboard/student');
        }
      } catch (error) {
        console.error('💥 Error in handleStudentRedirect:', error);
        console.log('🔄 Falling back to student dashboard');
        router.push('/dashboard/student');
      }
    };
    
    // Redirect to role-specific dashboard once loaded
    if (!loading && user) {
      console.log('User authenticated with role:', user?.role);
      
      if (user?.role === 'admin') {
        console.log('Redirecting to admin dashboard');
        router.push('/dashboard/admin');
      } else if (user?.role === 'coach') {
        console.log('Redirecting to coach dashboard');
        router.push('/dashboard/coach');
      } else if (user?.role === 'student') {
        console.log('Student login detected - checking for latest completed evaluation');
        
        // For students, try to redirect to their latest completed evaluation
        handleStudentRedirect();
      } else {
        // Default dashboard - generic view if role not recognized
        console.warn('User has unknown role:', user?.role);
        console.log('Displaying generic dashboard');
      }
    }
  }, [isMounted, user, loading, router, roleMismatch]);
  
  // Show loading state while checking auth
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="text-center max-w-md w-full">
        {loading ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
            <p className="mb-2 text-lg font-medium">Loading your dashboard...</p>
            <p className="text-sm text-gray-500 mb-4">Checking authentication...</p>
          </>
        ) : roleMismatch ? (
          <div className="mb-8">
            <div className="flex justify-center mb-4">
              <AlertTriangle className="h-12 w-12 text-amber-500" />
            </div>
            <h2 className="text-xl font-bold text-amber-800 mb-2">Role Configuration Issue Detected</h2>
            <p className="mb-6 text-gray-600">
              Your email ({user?.email}) suggests you should have the role of 
              {user?.email?.includes('admin') ? ' admin' : user?.email?.includes('coach') ? ' coach' : ' student'},
              but your current role is set to <span className="font-medium">{user?.role || 'unknown'}</span>.
            </p>
            
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-6">
              <p className="text-amber-800 mb-3">
                This is likely causing the redirection issues where you're sent to the wrong dashboard.
              </p>
              <p className="text-amber-800 font-medium">
                Click the button below to fix this issue:
              </p>
            </div>
            
            <Link href="/fix-roles">
              <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white">
                Fix My Role Configuration <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        ) : !user ? (
          <div className="text-center">
            <p className="mb-2 text-lg font-medium">You're not logged in</p>
            <p className="text-sm text-gray-500 mb-6">Redirecting to login page...</p>
          </div>
        ) : (
          <div className="text-center">
            <p className="mb-2 text-lg font-medium">Redirecting to {user?.role} dashboard...</p>
            <p className="text-sm text-gray-500 mb-6">If you're not redirected automatically, use the links below.</p>
            
            <div className="flex flex-col gap-2">
              <Link href={`/dashboard/${user?.role}`}>
                <Button variant="default" className="w-full">
                  Go to {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User'} Dashboard
                </Button>
              </Link>
            </div>
          </div>
        )}
        
        {/* Always show debugging links */}
        <div className="mt-8 border-t pt-6">
          <p className="text-sm font-medium text-gray-700 mb-3">Dashboard Links & Debug Tools</p>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <Link href="/dashboard/admin">
              <Button variant="outline" size="sm" className="w-full">
                Admin Dashboard
              </Button>
            </Link>
            <Link href="/dashboard/coach">
              <Button variant="outline" size="sm" className="w-full">
                Coach Dashboard
              </Button>
            </Link>
            <Link href="/dashboard/student">
              <Button variant="outline" size="sm" className="w-full">
                Student Dashboard
              </Button>
            </Link>
            <Link href="/fix-roles">
              <Button variant="outline" size="sm" className="w-full">
                Fix Role Issues
              </Button>
            </Link>
          </div>
          
          <Link href="/debug-profiles">
            <Button variant="ghost" size="sm" className="w-full">
              Debug Profiles
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export async function getServerSideProps() {
  return {
    props: {}, // will be passed to the page component as props
  }
} 