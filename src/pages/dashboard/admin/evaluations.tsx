import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import { fetchAllEvaluations } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

export default function AdminEvaluations() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  // Fetch all evaluations
  const { 
    data: allEvaluations, 
    isLoading: evaluationsLoading 
  } = useQuery({
    queryKey: ['all-evaluations'],
    queryFn: fetchAllEvaluations,
    enabled: !!user?.id && user?.role === 'admin'
  });

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
          <h1 className="text-3xl font-bold">Evaluations</h1>
          <p className="text-gray-600">
            View and manage all student evaluations across the platform.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Student Submissions</CardTitle>
            <CardDescription>
              Comprehensive list of evaluations submitted by students
            </CardDescription>
          </CardHeader>
          <CardContent>
            {evaluationsLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : allEvaluations && allEvaluations.length > 0 ? (
              <div className="space-y-4">
                {allEvaluations.map((evaluation: any) => (
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
                        'bg-gray-100'
                      }>
                        {evaluation.status === 'pending' ? 'Processing' :
                         evaluation.status === 'completed' ? 'Completed' : 
                         evaluation.status === 'review_requested' ? 'Review Requested' :
                         evaluation.status === 'reviewed' ? 'Reviewed' : 'Unknown'}
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