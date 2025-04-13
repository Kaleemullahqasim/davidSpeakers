import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import { fetchCoachUsers, fetchStudentUsers, fetchAllEvaluations } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { getAuthToken } from '@/lib/auth-helpers';

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  // Fetch coaches
  const { 
    data: coaches, 
    isLoading: coachesLoading 
  } = useQuery({
    queryKey: ['coaches'],
    queryFn: fetchCoachUsers,
    enabled: !!user?.id && user?.role === 'admin'
  });

  // Enhance the student data query with error handling and logging
  const { 
    data: students, 
    isLoading: studentsLoading,
    error: studentsError 
  } = useQuery({
    queryKey: ['students'],
    queryFn: fetchStudentUsers,
    enabled: !!user?.id && user?.role === 'admin',
    onSuccess: (data) => {
      console.log('Students loaded successfully:', data);
    },
    onError: (error) => {
      console.error('Error loading students:', error);
    },
    retry: 3
  });

  // Fetch all evaluations
  const { 
    data: allEvaluations, 
    isLoading: evaluationsLoading 
  } = useQuery({
    queryKey: ['all-evaluations'],
    queryFn: fetchAllEvaluations,
    enabled: !!user?.id && user?.role === 'admin'
  });
  
  // Add a direct fetch as fallback
  const [directStudents, setDirectStudents] = useState<any[]>([]);
  const [fetchingDirectly, setFetchingDirectly] = useState(false);

  useEffect(() => {
    async function fetchDirectly() {
      if (!user?.id || user.role !== 'admin' || (students && students.length > 0)) {
        return;
      }
      
      try {
        setFetchingDirectly(true);
        console.log('Attempting direct fetch of students...');
        
        const token = await getAuthToken();
        if (!token) {
          throw new Error('No auth token available');
        }
        
        const response = await fetch('/api/admin/get-students', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Direct fetch result:', data);
        setDirectStudents(data);
      } catch (error) {
        console.error('Error in direct fetch:', error);
      } finally {
        setFetchingDirectly(false);
      }
    }
    
    if (studentsError || (students && students.length === 0)) {
      fetchDirectly();
    }
  }, [user, students, studentsError]);

  // Add effect for debugging
  useEffect(() => {
    if (user?.role === 'admin') {
      console.log('Admin dashboard mounted, user:', user);
      console.log('Students data:', students);
      console.log('Coaches data:', coaches);
    }
  }, [user, students, coaches]);

  // Use either the React Query result or direct fetch result
  const effectiveStudents = students?.length ? students : directStudents;

  // Calculate pending coach approvals
  const pendingCoachApprovals = coaches?.filter(coach => !coach.approved).length || 0;
  
  // User distribution data for chart
  const userDistributionData = [
    {
      name: 'Students',
      value: effectiveStudents.length || 0,
      color: '#4f46e5'
    },
    {
      name: 'Coaches',
      value: coaches?.filter(coach => coach.approved).length || 0,
      color: '#10b981'
    },
    {
      name: 'Admins',
      value: 1, // Current user is admin, plus any others
      color: '#f97316'
    }
  ];

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!user || user.role !== 'admin') {
    router.push('/login');
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-600">
            Welcome, {user.name}! Manage users and configure system settings.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl">
                {studentsLoading || fetchingDirectly ? '...' : effectiveStudents.length || 0}
              </CardTitle>
              <CardDescription>Total Students</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl">
                {coachesLoading ? '...' : coaches?.length || 0}
              </CardTitle>
              <CardDescription>Total Coaches</CardDescription>
            </CardHeader>
          </Card>
          <Card className={pendingCoachApprovals > 0 ? "border-orange-300 bg-orange-50" : ""}>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl">
                {coachesLoading ? '...' : pendingCoachApprovals}
              </CardTitle>
              <CardDescription>Pending Coach Approvals</CardDescription>
            </CardHeader>
            {pendingCoachApprovals > 0 && (
              <CardContent>
                <Button
                  size="sm"
                  onClick={() => router.push('/dashboard/admin/users')}
                >
                  Review Requests
                </Button>
              </CardContent>
            )}
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>User Distribution</CardTitle>
              <CardDescription>
                Breakdown of platform users by role
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={userDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {userDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common administrative tasks
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4">
              <Button
                className="w-full justify-start"
                onClick={() => router.push('/dashboard/admin/users')}
              >
                Manage Users
              </Button>
              <Button
                className="w-full justify-start"
                onClick={() => router.push('/dashboard/admin/settings')}
              >
                Configure Scoring Settings
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push('/dashboard/admin/analytics')}
              >
                View Analytics
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Student Submissions</CardTitle>
            <CardDescription>
              All evaluations submitted by students across the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            {evaluationsLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : allEvaluations && allEvaluations.length > 0 ? (
              <div className="space-y-4">
                {allEvaluations.map((evaluation) => (
                  <div key={evaluation.id} className="flex items-center justify-between border-b pb-4">
                    <div>
                      <h3 className="font-medium">{evaluation.title || `Evaluation #${evaluation.id.slice(0, 8)}`}</h3>
                      <p className="text-sm text-gray-500">
                        Student: {evaluation.users?.name || 'Unknown'} •{' '}
                        {new Date(evaluation.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={
                        evaluation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        evaluation.status === 'completed' ? 'bg-green-100 text-green-800' :
                        evaluation.status === 'review_requested' ? 'bg-blue-100 text-blue-800' :
                        evaluation.status === 'reviewed' ? 'bg-purple-100 text-purple-800' :
                        'bg-red-100 text-red-800'
                      }>
                        {evaluation.status === 'pending' ? 'Processing' :
                         evaluation.status === 'completed' ? 'Completed' : 
                         evaluation.status === 'review_requested' ? 'Review Requested' :
                         evaluation.status === 'reviewed' ? 'Reviewed' : 'Error'}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/dashboard/admin/evaluations/${evaluation.id}`)}
                      >
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-4 text-gray-500">
                No evaluations have been submitted yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
