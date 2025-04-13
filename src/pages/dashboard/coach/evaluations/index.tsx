import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { fetchCoachEvaluations } from '@/lib/api';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarIcon, Clock, CheckCircle, AlertCircle } from 'lucide-react';

export default function CoachEvaluations() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('pending');
  
  // Fetch evaluations assigned to the coach with better error handling and lower polling interval
  const { data: evaluations, isLoading: evaluationsLoading, error } = useQuery({
    queryKey: ['coach-evaluations', user?.id],
    queryFn: () => fetchCoachEvaluations(user?.id as string),
    enabled: !!user?.id && user?.role === 'coach',
    refetchInterval: 15000, // Refetch every 15 seconds for more responsive updates
    staleTime: 10000, // Consider data stale after 10 seconds
  });
  
  // Log any errors for debugging
  useEffect(() => {
    if (error) {
      console.error('Error fetching evaluations:', error);
    }
  }, [error]);

  // Filter evaluations by status - using includes for more robust status matching
  const pendingEvaluations = evaluations?.filter(
    evaluation => evaluation.status === 'review_requested'
  ) || [];
  
  const inProgressEvaluations = evaluations?.filter(
    evaluation => evaluation.status === 'coach_reviewing'
  ) || [];
  
  const completedEvaluations = evaluations?.filter(
    evaluation => evaluation.status === 'published' || evaluation.status === 'reviewed'
  ) || [];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-full max-w-md" />
          <Skeleton className="h-10 w-full max-w-md" />
          <div className="grid grid-cols-1 gap-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!user || user.role !== 'coach') {
    router.push('/login');
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Student Evaluations</h1>
            <p className="text-gray-600">
              View and provide feedback on student speech submissions
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard/coach')}
            >
              Back to Dashboard
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <Clock className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-900">Pending Review</p>
                    <p className="text-2xl font-bold text-blue-700">{pendingEvaluations.length}</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  Awaiting Review
                </Badge>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-amber-100 rounded-full">
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-amber-900">In Progress</p>
                    <p className="text-2xl font-bold text-amber-700">{inProgressEvaluations.length}</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                  Started
                </Badge>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-green-100 rounded-full">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-900">Completed</p>
                    <p className="text-2xl font-bold text-green-700">{completedEvaluations.length}</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Finished
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 w-full sm:w-auto">
            <TabsTrigger value="pending" className="relative">
              Pending
              {pendingEvaluations.length > 0 && (
                <Badge variant="secondary" className="ml-2 absolute -top-2 -right-2 bg-blue-500 text-white">
                  {pendingEvaluations.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="in-progress" className="relative">
              In Progress
              {inProgressEvaluations.length > 0 && (
                <Badge variant="secondary" className="ml-2 absolute -top-2 -right-2 bg-amber-500 text-white">
                  {inProgressEvaluations.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed" className="relative">
              Completed
              {completedEvaluations.length > 0 && (
                <Badge variant="secondary" className="ml-2 absolute -top-2 -right-2 bg-green-500 text-white">
                  {completedEvaluations.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="pending" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Pending Reviews</CardTitle>
                <CardDescription>
                  New speech evaluations assigned to you
                </CardDescription>
              </CardHeader>
              <CardContent>
                {evaluationsLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : pendingEvaluations.length > 0 ? (
                  <div className="space-y-4">
                    {pendingEvaluations.map((evaluation: any) => (
                      <div key={evaluation.id} className="flex items-center justify-between border border-blue-100 bg-blue-50 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div>
                          <h3 className="font-medium">{evaluation.title || `Speech #${evaluation.id.slice(0, 8)}`}</h3>
                          <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                            <span className="font-medium">{evaluation.users?.name || 'Unknown Student'}</span>
                            <span>•</span>
                            <div className="flex items-center">
                              <CalendarIcon className="h-3 w-3 mr-1" />
                              {new Date(evaluation.created_at).toLocaleDateString(undefined, {
                                month: 'short', 
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                            Pending
                          </Badge>
                          <Button
                            onClick={() => router.push(`/dashboard/coach/evaluations/${evaluation.id}`)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            Start Review
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    <div className="inline-flex rounded-full bg-blue-100 p-3 mb-4">
                      <Clock className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No pending evaluations</h3>
                    <p className="text-sm text-gray-600 max-w-sm mx-auto">
                      You're all caught up! New evaluations will appear here when they're assigned to you.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="in-progress" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>In Progress</CardTitle>
                <CardDescription>
                  Evaluations you are currently working on
                </CardDescription>
              </CardHeader>
              <CardContent>
                {evaluationsLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : inProgressEvaluations.length > 0 ? (
                  <div className="space-y-4">
                    {inProgressEvaluations.map((evaluation: any) => (
                      <div key={evaluation.id} className="flex items-center justify-between border border-amber-100 bg-amber-50 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div>
                          <h3 className="font-medium">{evaluation.title || `Speech #${evaluation.id.slice(0, 8)}`}</h3>
                          <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                            <span className="font-medium">{evaluation.users?.name || 'Unknown Student'}</span>
                            <span>•</span>
                            <div className="flex items-center">
                              <CalendarIcon className="h-3 w-3 mr-1" />
                              {new Date(evaluation.created_at).toLocaleDateString(undefined, {
                                month: 'short', 
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">
                            In Progress
                          </Badge>
                          <Button
                            onClick={() => router.push(`/dashboard/coach/evaluations/${evaluation.id}`)}
                            className="bg-amber-600 hover:bg-amber-700"
                          >
                            Continue
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    <div className="inline-flex rounded-full bg-amber-100 p-3 mb-4">
                      <AlertCircle className="h-6 w-6 text-amber-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No in-progress evaluations</h3>
                    <p className="text-sm text-gray-600 max-w-sm mx-auto">
                      You don't have any evaluations in progress. Start reviewing a pending evaluation.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="completed" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Completed</CardTitle>
                <CardDescription>
                  Evaluations you have already reviewed
                </CardDescription>
              </CardHeader>
              <CardContent>
                {evaluationsLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : completedEvaluations.length > 0 ? (
                  <div className="space-y-4">
                    {completedEvaluations.map((evaluation: any) => (
                      <div key={evaluation.id} className="flex items-center justify-between border border-green-100 bg-green-50 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div>
                          <h3 className="font-medium">{evaluation.title || `Speech #${evaluation.id.slice(0, 8)}`}</h3>
                          <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                            <span className="font-medium">{evaluation.users?.name || 'Unknown Student'}</span>
                            <span>•</span>
                            <div className="flex items-center">
                              <CalendarIcon className="h-3 w-3 mr-1" />
                              {new Date(evaluation.created_at).toLocaleDateString(undefined, {
                                month: 'short', 
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </div>
                            <span>•</span>
                            <span className="text-green-600 font-medium">Completed: {
                              evaluation.completed_at ? new Date(evaluation.completed_at).toLocaleDateString(undefined, {
                                month: 'short', 
                                day: 'numeric'
                              }) : 'Unknown'
                            }</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                            Completed
                          </Badge>
                          <Button
                            variant="outline"
                            onClick={() => router.push(`/dashboard/coach/evaluations/${evaluation.id}`)}
                            className="border-green-200 text-green-700 hover:bg-green-50"
                          >
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    <div className="inline-flex rounded-full bg-green-100 p-3 mb-4">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No completed evaluations</h3>
                    <p className="text-sm text-gray-600 max-w-sm mx-auto">
                      You haven't completed any evaluations yet. Finish your reviews to see them here.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
