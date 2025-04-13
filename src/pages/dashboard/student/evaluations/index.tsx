import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { fetchUserEvaluations } from '@/lib/api';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import {
  Calendar,
  Video,
  CheckCircle2,
  Clock,
  MessageSquare,
  ExternalLink,
  Search,
  Filter,
  ArrowUpDown
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

export default function StudentEvaluations() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  
  // Fetch evaluations for the logged-in student
  const { data: evaluations, isLoading: evaluationsLoading, error } = useQuery({
    queryKey: ['user-evaluations', user?.id],
    queryFn: () => fetchUserEvaluations(user?.id as string),
    enabled: !!user?.id && user?.role === 'student',
    refetchInterval: 15000, // Refresh every 15 seconds to check for updates
  });
  
  useEffect(() => {
    if (error) {
      console.error('Error fetching evaluations:', error);
      toast({
        title: 'Error loading your evaluations',
        description: error instanceof Error ? error.message : 'Please try again later',
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  // Filter and sort evaluations
  const filteredEvaluations = evaluations?.filter((evaluation: any) => {
    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'pending' && !['pending', 'review_requested'].includes(evaluation.status)) {
        return false;
      }
      if (statusFilter === 'completed' && !['completed', 'reviewed'].includes(evaluation.status)) {
        return false;
      }
    }
    
    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const titleMatch = evaluation.title?.toLowerCase().includes(searchLower);
      const idMatch = evaluation.id.toLowerCase().includes(searchLower);
      return titleMatch || idMatch;
    }
    
    return true;
  }) || [];
  
  // Sort evaluations
  const sortedEvaluations = [...filteredEvaluations].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    } else if (sortBy === 'oldest') {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    } else if (sortBy === 'title') {
      return (a.title || '').localeCompare(b.title || '');
    }
    return 0;
  });

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <Skeleton className="h-8 w-[250px]" />
          <Skeleton className="h-4 w-[400px]" />
          <div className="grid grid-cols-1 gap-4 mt-6">
            <Skeleton className="h-[120px]" />
            <Skeleton className="h-[120px]" />
            <Skeleton className="h-[120px]" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!user || user.role !== 'student') {
    if (typeof window !== 'undefined') {
      router.push('/login');
    }
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">My Evaluations</h1>
            <p className="text-gray-600">
              View and track all your speech evaluation submissions
            </p>
          </div>
          
          <Button 
            onClick={() => router.push('/dashboard/student')}
            variant="outline"
          >
            Back to Dashboard
          </Button>
        </div>

        {/* Filters and search */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input
              placeholder="Search evaluations..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2 w-full md:w-auto">
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value)}
              className="w-full md:w-36"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </Select>
            
            <Select
              value={sortBy}
              onValueChange={(value) => setSortBy(value)}
              className="w-full md:w-36"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="title">Title</option>
            </Select>
          </div>
          
          <Button
            variant="ghost"
            className="w-full md:w-auto"
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
              setSortBy('newest');
            }}
          >
            Reset
          </Button>
        </div>

        {/* Evaluations List */}
        <Card>
          <CardHeader>
            <CardTitle>Speech Evaluations</CardTitle>
            <CardDescription>
              Your complete evaluation history
            </CardDescription>
          </CardHeader>
          <CardContent>
            {evaluationsLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : sortedEvaluations.length > 0 ? (
              <div className="space-y-4">
                {sortedEvaluations.map((evaluation: any) => (
                  <div key={evaluation.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border hover:bg-gray-50 transition-colors">
                    <div className="mb-3 sm:mb-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium">{evaluation.title || `Speech #${evaluation.id.slice(0, 8)}`}</h3>
                        <Badge variant="outline" className={`
                          ${evaluation.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 
                           evaluation.status === 'review_requested' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                           evaluation.status === 'completed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                           evaluation.status === 'reviewed' ? 'bg-green-50 text-green-700 border-green-200' :
                           'bg-red-50 text-red-700 border-red-200'}
                        `}>
                          {evaluation.status === 'pending' ? 'Processing' :
                           evaluation.status === 'review_requested' ? 'Coach Assigned' :
                           evaluation.status === 'completed' ? 'AI Evaluated' :
                           evaluation.status === 'reviewed' ? 'Coach Reviewed' :
                           'Error'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 flex items-center flex-wrap gap-2">
                        <span className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(evaluation.created_at).toLocaleDateString()}
                        </span>
                        {evaluation.completed_at && (
                          <span className="flex items-center">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Completed: {new Date(evaluation.completed_at).toLocaleDateString()}
                          </span>
                        )}
                        {evaluation.coach_feedback && (
                          <span className="flex items-center text-green-600">
                            <MessageSquare className="h-3 w-3 mr-1" />
                            Coach Feedback Available
                          </span>
                        )}
                      </p>
                    </div>
                    
                    <div className="flex gap-2 self-end sm:self-center">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`https://www.youtube.com/watch?v=${evaluation.video_id}`} target="_blank">
                          <Video className="h-4 w-4 mr-1" />
                          <span className="hidden sm:inline">View Video</span>
                        </Link>
                      </Button>
                      
                      <Button asChild size="sm" disabled={evaluation.status === 'pending'}>
                        <Link href={`/dashboard/student/evaluations/${evaluation.id}`}>
                          <span>View Results</span>
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                <div className="inline-flex rounded-full bg-gray-100 p-3 mb-4">
                  <Clock className="h-6 w-6 text-gray-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No evaluations found</h3>
                <p className="text-sm text-gray-600 max-w-sm mx-auto mb-4">
                  {searchQuery || statusFilter !== 'all' 
                    ? 'No evaluations match your search criteria. Try adjusting your filters.' 
                    : 'You haven\'t submitted any speech videos yet. Upload a video to get started.'}
                </p>
                <Button onClick={() => router.push('/dashboard/student?tab=submit')}>
                  Submit Your First Video
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
