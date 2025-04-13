import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { fetchStudentUsers } from '@/lib/api';

export default function CoachStudents() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Fetch students (could be filtered by coach assignment in the future)
  const { 
    data: students, 
    isLoading: studentsLoading 
  } = useQuery({
    queryKey: ['coach-students'],
    queryFn: fetchStudentUsers, // This will need to be modified in the future to only return assigned students
    enabled: !!user?.id && user?.role === 'coach'
  });

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!user || user.role !== 'coach') {
    router.push('/login');
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Students</h1>
          <p className="text-gray-600">
            View and manage your assigned students.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>My Students</CardTitle>
            <CardDescription>
              Students assigned to you for coaching and evaluation
            </CardDescription>
          </CardHeader>
          <CardContent>
            {studentsLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : students && students.length > 0 ? (
              <div className="space-y-4">
                {students.map((student: any) => (
                  <div key={student.id} className="flex items-center justify-between border-b pb-4">
                    <div>
                      <h3 className="font-medium">{student.name}</h3>
                      <p className="text-sm text-gray-500">
                        {student.email} • Joined: {new Date(student.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/dashboard/coach/students/${student.id}`)}
                      >
                        View Profile
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-gray-500 mb-4">
                  No students are currently assigned to you.
                </p>
                <p className="text-sm text-gray-400">
                  Students will appear here once they are assigned to you for coaching.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h3 className="font-medium text-blue-800">Note</h3>
          <p className="text-sm text-blue-600">
            This feature is under development. In the future, this page will show only students who are specifically assigned to you.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}