import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchEvaluation, fetchCoachUsers, updateEvaluation } from '@/lib/api';
import { getAuthToken, fetchWithAuth } from '@/lib/auth-helpers';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { getParentClassForSkill } from '@/lib/skillsUtils';
import { getSkillById } from '@/lib/skillsData';

// Define types for coach and evaluation
interface Coach {
  id: string;
  name?: string;
  email?: string;
  role: string;
}

interface EvaluationData {
  id: string;
  title?: string;
  status: string;
  created_at: string;
  completed_at?: string;
  video_id: string;
  coach_id?: string;
  coach?: {
    id: string;
    name?: string;
    email?: string;
  };
  student?: {
    id: string;
    name?: string;
    email?: string;
  };
  coach_feedback?: string;
  results?: {
    transcript?: string;
    analysis?: Record<string, any>;
    manual_scores?: Record<string, any>;
    critical_skills?: Array<{
      name: string;
      rating: string;
      feedback?: string;
    }>;
    language_analysis?: Array<{
      title?: string;
      content: string;
    }>;
  };
}

export default function AdminEvaluationDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedCoachId, setSelectedCoachId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Use useEffect to check authentication after component mounts (client-side only)
  useEffect(() => {
    setMounted(true);
    if (user && user.role !== 'admin') {
      router.push('/login');
    }
  }, [user, router]);

  const { data: evaluation, isLoading, error } = useQuery<EvaluationData>({
    queryKey: ['evaluation', id],
    queryFn: () => fetchEvaluation(id as string),
    enabled: !!id && !!user && user.role === 'admin'
  });

  // Fetch available coaches
  const { data: coaches = [] } = useQuery<Coach[]>({
    queryKey: ['coaches'],
    queryFn: fetchCoachUsers,
    enabled: !!user?.id && user?.role === 'admin'
  });

  // Log data for debugging
  useEffect(() => {
    if (coaches) {
      console.log(`Coaches data (${coaches.length}):`, coaches);
    }
    if (evaluation) {
      console.log('Evaluation data:', evaluation);
    }
  }, [coaches, evaluation]);

  const assignCoachMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCoachId) throw new Error("No coach selected");
      console.log(`Assigning coach ${selectedCoachId} to evaluation ${id}`);
      
      // Use direct API endpoint instead of going through updateEvaluation
      const response = await fetchWithAuth(`/api/evaluations/assign-coach`, {
        method: 'POST',
        body: JSON.stringify({ 
          evaluationId: id, 
          coachId: selectedCoachId 
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to assign coach');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      console.log('Coach assignment successful');
      queryClient.invalidateQueries({ queryKey: ['evaluation', id] });
      queryClient.invalidateQueries({ queryKey: ['all-evaluations'] });
      toast({
        title: 'Coach assigned',
        description: 'The coach has been assigned to this evaluation.',
      });
      // Stay on the same page, don't navigate away from admin view
    },
    onError: (error: Error) => {
      console.error('Coach assignment error:', error);
      toast({
        title: 'Error assigning coach',
        description: error.message || 'Failed to assign coach',
        variant: 'destructive',
      });
    }
  });

  // Function to check if coach assignment is allowed for the current evaluation status
  const canAssignCoach = (status: string) => {
    // Allow assignment for pending, completed, and ready_for_coach statuses
    return ['pending', 'completed', 'ready_for_coach'].includes(status);
  };

  // Early return if component hasn't mounted yet (server rendering)
  if (!mounted) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-[200px] w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-[400px]" />
            <Skeleton className="h-[400px]" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Now we can use router.push safely because the component is mounted (client-side)
  if (user && user.role !== 'admin') {
    return null; // Already redirecting in useEffect
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-[200px] w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-[400px]" />
            <Skeleton className="h-[400px]" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !evaluation) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center">
          <h2 className="text-2xl font-bold text-red-600">Error loading evaluation</h2>
          <p className="mt-2 text-gray-600">
            {error instanceof Error ? error.message : 'Could not load evaluation data'}
          </p>
          <Button 
            className="mt-4" 
            onClick={() => router.push('/dashboard/admin')}
          >
            Return to Dashboard
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  // Get student name from the nested student object returned by the API
  const studentName = evaluation.student?.name || evaluation.student?.email || 'Unknown';
  
  // Get coach name from the nested coach object or coaches array
  const coachName = evaluation.coach?.name || 
                   evaluation.coach?.email || 
                   coaches.find(c => c.id === evaluation.coach_id)?.name || 
                   coaches.find(c => c.id === evaluation.coach_id)?.email || 
                   'Unknown Coach';

  // Transform analysis data for the chart
  const chartData = evaluation.results?.analysis 
    ? Object.entries(evaluation.results.analysis).map(([skill, data]) => ({
        skill: skill.replace(/_/g, ' '),
        score: data.score,
        category: getSkillCategory(skill)
      })).sort((a, b) => b.score - a.score)
    : [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">{evaluation.title || 'Speech Evaluation'}</h1>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>Student: {studentName}</span>
              <span>•</span>
              <span>
                {new Date(evaluation.created_at).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
              <span>•</span>
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
            </div>
          </div>
          
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/admin')}
          >
            Back to Dashboard
          </Button>
        </div>

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="transcript">Transcript</TabsTrigger>
            {evaluation.coach_feedback && (
              <TabsTrigger value="feedback">Coach Feedback</TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Speech Score Distribution</CardTitle>
                  <CardDescription>Scores for each language skill detected</CardDescription>
                </CardHeader>
                <CardContent className="h-[450px]">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartData}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          type="number" 
                          domain={[-10, 10]} 
                          tickCount={11} 
                        />
                        <YAxis 
                          type="category" 
                          dataKey="skill" 
                          width={150} 
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip />
                        <Bar 
                          dataKey="score" 
                          fill="#10b981" // Use a static color and handle conditional styling elsewhere
                          radius={[0, 4, 4, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-gray-500">
                      No analysis data available
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Evaluation Summary</CardTitle>
                  <CardDescription>Key information about this evaluation</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Student</h3>
                      <p>{studentName}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Status</h3>
                      <p className="capitalize">{evaluation.status.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Submitted</h3>
                      <p>{new Date(evaluation.created_at).toLocaleString()}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Completed</h3>
                      <p>{evaluation.completed_at ? new Date(evaluation.completed_at).toLocaleString() : 'Not completed'}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">YouTube ID</h3>
                      <p className="truncate">{evaluation.video_id}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Reviewer</h3>
                      <p>{evaluation.coach_id ? coachName : 'AI Evaluation'}</p>
                    </div>
                  </div>
                  
                  <div className="pt-4">
                    <Button
                      variant="outline"
                      onClick={() => window.open(`https://www.youtube.com/watch?v=${evaluation.video_id}`, '_blank')}
                    >
                      View Video on YouTube
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Coach Assignment</CardTitle>
                <CardDescription>
                  Assign a coach to review this evaluation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-4">
                  <div className="flex-1">
                    <Label htmlFor="coach-select" className="mb-2 block">Select Coach</Label>
                    
                    {coaches && coaches.length > 0 ? (
                      <select
                        id="coach-select"
                        value={selectedCoachId || ''}
                        onChange={(e) => setSelectedCoachId(e.target.value)}
                        disabled={!canAssignCoach(evaluation.status) || assignCoachMutation.isPending}
                        className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="" disabled>Select a coach</option>
                        {coaches.map((coach: Coach) => (
                          <option key={coach.id} value={coach.id}>
                            {coach.name || coach.email || 'Unknown Coach'}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="p-3 bg-amber-50 text-amber-800 rounded-md">
                        <p className="text-sm">No coaches found. Please check the database.</p>
                      </div>
                    )}
                  </div>
                  <Button 
                    onClick={() => assignCoachMutation.mutate()}
                    disabled={!selectedCoachId || !canAssignCoach(evaluation.status) || assignCoachMutation.isPending}
                  >
                    {assignCoachMutation.isPending ? 'Assigning...' : 'Assign Coach'}
                  </Button>
                </div>
                
                {evaluation.coach_id && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-md">
                    <p className="text-sm font-medium">Currently assigned to:</p>
                    <p className="mt-1">{coachName}</p>
                  </div>
                )}
                
                {!canAssignCoach(evaluation.status) && (
                  <p className="mt-4 text-sm text-amber-600">
                    This evaluation is currently in "{evaluation.status.replace(/_/g, ' ')}" status and cannot be reassigned.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="transcript">
            <Card>
              <CardHeader>
                <CardTitle>Speech Transcript</CardTitle>
                <CardDescription>
                  Transcribed text from the student's video
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-md text-gray-700 whitespace-pre-wrap">
                  {evaluation.results?.transcript || 'No transcript available'}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {evaluation.coach_feedback && (
            <TabsContent value="feedback">
              <Card>
                <CardHeader>
                  <CardTitle>Coach Feedback</CardTitle>
                  <CardDescription>
                    Personalized feedback from speaking coach
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 p-4 rounded-md text-gray-700 whitespace-pre-wrap">
                    {evaluation.coach_feedback}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

// Helper functions
function formatSkillName(skill: string): string {
  return skill.split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatCategoryName(category: string): string {
  return category.charAt(0).toUpperCase() + category.slice(1).replace(/_/g, ' ');
}

function getSkillCategory(skill: string): string {
  const categories: {[key: string]: string} = {
    adapted_language: 'structural',
    flow: 'structural',
    strong_rhetoric: 'structural',
    strategic_language: 'structural',
    valued_language: 'structural',
    filler_language: 'filler',
    negations: 'filler',
    repetitive_words: 'filler',
    absolute_words: 'filler',
    hexacolon: 'rhetorical',
    tricolon: 'rhetorical',
    repetition: 'rhetorical',
    anaphora: 'rhetorical',
    epiphora: 'rhetorical',
    alliteration: 'rhetorical',
    correctio: 'rhetorical',
    climax: 'rhetorical',
    anadiplosis: 'rhetorical'
  };
  
  return categories[skill] || 'other';
}

function groupSkillsByCategory(analysis: any) {
  const grouped: {[key: string]: any} = {};
  
  Object.entries(analysis).forEach(([skill, data]) => {
    const category = getSkillCategory(skill);
    
    if (!grouped[category]) {
      grouped[category] = {};
    }
    
    grouped[category][skill] = data;
  });
  
  return grouped;
}