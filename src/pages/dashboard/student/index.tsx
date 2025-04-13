import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { fetchUserEvaluations } from '@/lib/api';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { VideoUploadForm } from '@/components/student/VideoUploadForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatSkillName } from '@/lib/speechUtils';
import { useToast } from '@/components/ui/use-toast';
import { 
  BarChart,
  TrendingUp,
  Activity,
  Calendar,
  Video,
  CheckCircle2,
  Clock,
  AlertCircle,
  MessageSquare,
  ExternalLink
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart as RechartsBarChart,
  Bar,
  PieChart, 
  Pie,
  Cell,
  Legend
} from 'recharts';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444'];

export default function StudentDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  
  // Mount effect to prevent hydration errors
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch evaluations for the logged-in student
  const { data: evaluations, isLoading: evaluationsLoading, error } = useQuery({
    queryKey: ['user-evaluations', user?.id],
    queryFn: () => fetchUserEvaluations(user?.id as string),
    enabled: !!user?.id && user?.role === 'student',
    refetchInterval: 15000, // Refresh every 15 seconds to check for updates
  });
  
  // Log any errors for debugging
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

  // Filter evaluations by status
  const pendingEvaluations = evaluations?.filter(
    evaluation => ['pending', 'review_requested'].includes(evaluation.status)
  ) || [];
  
  const completedEvaluations = evaluations?.filter(
    evaluation => ['completed', 'reviewed'].includes(evaluation.status)
  ) || [];
  
  // All evaluations that have been completed, sorted by date
  const recentEvaluations = [...(completedEvaluations || [])]
    .sort((a, b) => new Date(b.completed_at || b.created_at).getTime() - 
                    new Date(a.completed_at || a.created_at).getTime())
    .slice(0, 5);

  // Calculate progress metrics
  const totalEvaluations = evaluations?.length || 0;
  const completionRate = totalEvaluations > 0 
    ? Math.round((completedEvaluations.length / totalEvaluations) * 100) 
    : 0;

  // Generate skills improvement data
  const skillsData = generateSkillsData(completedEvaluations);
  
  // Generate progress over time data
  const progressData = generateProgressData(completedEvaluations);
  
  // Generate distribution data
  const distributionData = [
    { name: 'Completed', value: completedEvaluations.length || 0 },
    { name: 'Pending', value: pendingEvaluations.length || 0 },
  ];

  if (loading || !mounted) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <Skeleton className="h-8 w-[250px]" />
          <Skeleton className="h-4 w-[400px]" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <Skeleton className="h-[120px]" />
            <Skeleton className="h-[120px]" />
            <Skeleton className="h-[120px]" />
          </div>
          <Skeleton className="h-[300px] mt-6" />
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
        <div>
          <h1 className="text-3xl font-bold mb-1">Your Speaking Dashboard</h1>
          <p className="text-gray-600">
            Welcome, <span className="font-medium">{user.name || user.email}</span>. Track your speaking progress and submit new videos for evaluation.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <Card className="border-indigo-100 hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-base font-medium text-gray-700 flex items-center">
                  <Video className="h-4 w-4 text-indigo-500 mr-2" />
                  <span>Total Submissions</span>
                </CardTitle>
              </div>
              <CardDescription>Your speech evaluations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalEvaluations}</div>
              <div className="text-xs text-gray-500 mt-1">
                {completedEvaluations.length} completed
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-indigo-100 hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-base font-medium text-gray-700 flex items-center">
                  <TrendingUp className="h-4 w-4 text-indigo-500 mr-2" />
                  <span>Completion Rate</span>
                </CardTitle>
              </div>
              <CardDescription>Evaluated speeches</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{completionRate}%</div>
              <div className="text-xs text-gray-500 mt-1">
                {pendingEvaluations.length} pending
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-indigo-100 hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-base font-medium text-gray-700 flex items-center">
                  <Activity className="h-4 w-4 text-indigo-500 mr-2" />
                  <span>Top Skill</span>
                </CardTitle>
              </div>
              <CardDescription>Your strongest area</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold truncate">
                {skillsData.length > 0 
                  ? formatSkillName(skillsData[0].name) 
                  : 'No data yet'}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {skillsData.length > 0 
                  ? `Score: ${skillsData[0].score > 0 ? '+' : ''}${skillsData[0].score}` 
                  : 'Submit videos for analysis'}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="submit">Submit Video</TabsTrigger>
            <TabsTrigger value="evaluations">My Evaluations</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Skills Chart */}
              <Card className="md:col-span-1 lg:col-span-2 border-indigo-100 overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center">
                        <BarChart className="h-5 w-5 text-indigo-500 mr-2" />
                        Speaking Skills Progress
                      </CardTitle>
                      <CardDescription>Your performance across key speaking skills</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {skillsData.length > 0 ? (
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsBarChart
                          data={skillsData.slice(0, 10)}
                          layout="vertical"
                          margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                          barGap={2}
                          barSize={18}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis 
                            type="number" 
                            domain={[-10, 10]} 
                            tickCount={11}
                            axisLine={false} 
                            tickLine={false}
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis 
                            type="category" 
                            dataKey="formattedName" 
                            width={130}
                            axisLine={false} 
                            tickLine={false}
                            tick={{ fontSize: 12 }}
                          />
                          <Tooltip 
                            cursor={{ fill: 'rgba(240, 240, 240, 0.3)' }}
                            formatter={(value: number) => [`${value > 0 ? '+' : ''}${value}`, 'Score']}
                            contentStyle={{ 
                              backgroundColor: 'white', 
                              borderRadius: '8px',
                              border: '1px solid #e2e8f0',
                              boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
                            }}
                          />
                          <Bar 
                            dataKey="score" 
                            fill="#10b981"
                            radius={[0, 4, 4, 0]}
                          >
                            {skillsData.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={entry.score > 0 
                                  ? entry.score > 7 ? '#059669' : '#10b981'
                                  : entry.score < -5 ? '#dc2626' : '#ef4444'} 
                              />
                            ))}
                          </Bar>
                        </RechartsBarChart>
                      </ResponsiveContainer>
                      {/* Note when showing sample data */}
                      {(!evaluations || evaluations.length === 0 || !evaluations.some(e => e.results?.analysis)) && (
                        <div className="text-center mt-2">
                          <p className="text-xs text-gray-500 italic">Sample data shown. Submit a video for personalized analysis.</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
                      <div className="text-center p-6">
                        <BarChart className="mx-auto h-10 w-10 text-gray-400 mb-3" />
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No skills data yet</h3>
                        <p className="text-sm text-gray-600 max-w-sm mx-auto mb-4">
                          Submit your first speech video for evaluation to see your skills analysis.
                        </p>
                        <Button onClick={() => (document.querySelector('[data-value="submit"]') as HTMLElement)?.click()}>
                          Submit a Video
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Progress Distribution */}
              <Card className="border-indigo-100 h-auto md:col-span-1">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center">
                    <Activity className="h-5 w-5 text-indigo-500 mr-2" />
                    Evaluation Status
                  </CardTitle>
                  <CardDescription>Distribution of your evaluations</CardDescription>
                </CardHeader>
                <CardContent>
                  {totalEvaluations > 0 ? (
                    <div className="h-[300px] flex flex-col justify-center">
                      <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={distributionData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                              labelLine={false}
                              label={({ name, percent }) => percent > 0 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''}
                            >
                              {distributionData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip 
                              formatter={(value) => [`${value} ${value === 1 ? 'evaluation' : 'evaluations'}`, '']}
                              contentStyle={{ 
                                backgroundColor: 'white', 
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex justify-center gap-6 mt-4 flex-wrap">
                        {distributionData.map((entry, index) => (
                          <div key={index} className="flex items-center">
                            <div 
                              className="w-3 h-3 rounded-full mr-1" 
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            ></div>
                            <span className="text-xs">{entry.name}: {entry.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
                      <div className="text-center p-6">
                        <Activity className="mx-auto h-10 w-10 text-gray-400 mb-3" />
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No data yet</h3>
                        <p className="text-sm text-gray-600 max-w-sm mx-auto">
                          Submit your first speech to see your statistics.
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Evaluations */}
            <Card className="border-indigo-100">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <div>
                    <CardTitle className="flex items-center">
                      <Clock className="h-5 w-5 text-indigo-500 mr-2" />
                      Recent Evaluations
                    </CardTitle>
                    <CardDescription>Your speech evaluation history</CardDescription>
                  </div>
                  {recentEvaluations.length > 0 && (
                    <Button variant="outline" size="sm" onClick={() => document.querySelector('[data-value="evaluations"]')?.click()}>
                      View All
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {evaluationsLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : recentEvaluations.length > 0 ? (
                  <div className="space-y-4">
                    {recentEvaluations.map(evaluation => (
                      <div key={evaluation.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors flex-wrap sm:flex-nowrap gap-2">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${
                            evaluation.status === 'completed' ? 'bg-blue-100' : 
                            evaluation.status === 'reviewed' ? 'bg-green-100' :
                            'bg-gray-100'
                          }`}>
                            {evaluation.status === 'completed' ? (
                              <Video className="h-4 w-4 text-blue-600" />
                            ) : evaluation.status === 'reviewed' ? (
                              <MessageSquare className="h-4 w-4 text-green-600" />
                            ) : (
                              <Clock className="h-4 w-4 text-gray-600" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-medium">{evaluation.title || `Speech #${evaluation.id.slice(0, 8)}`}</h3>
                            <p className="text-sm text-gray-600 flex items-center gap-1 flex-wrap">
                              <Calendar className="h-3 w-3 inline" />
                              {new Date(evaluation.completed_at || evaluation.created_at).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                              <span>•</span>
                              <Badge variant="outline" className={`
                                ${evaluation.status === 'completed' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                                evaluation.status === 'reviewed' ? 'bg-green-50 text-green-700 border-green-200' :
                                'bg-gray-100 text-gray-700 border-gray-200'}
                              `}>
                                {evaluation.status === 'completed' ? 'AI Evaluated' :
                                 evaluation.status === 'reviewed' ? 'Coach Reviewed' :
                                 'Processing'}
                              </Badge>
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
                          <Link href={`/dashboard/student/evaluations/${evaluation.id}`}>
                            <ExternalLink className="h-4 w-4 text-gray-500" />
                          </Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    <div className="inline-flex rounded-full bg-gray-100 p-3 mb-4">
                      <Clock className="h-6 w-6 text-gray-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No evaluations yet</h3>
                    <p className="text-sm text-gray-600 max-w-sm mx-auto mb-4">
                      Upload your first speech video to get started with your speaking journey.
                    </p>
                    <Button onClick={() => document.querySelector('[data-value="submit"]')?.click()}>
                      Submit a Video
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="submit">
            <VideoUploadForm />
          </TabsContent>
          
          <TabsContent value="evaluations">
            <Card>
              <CardHeader>
                <CardTitle>Your Evaluations</CardTitle>
                <CardDescription>
                  View all your speech evaluations and results
                </CardDescription>
              </CardHeader>
              <CardContent>
                {evaluationsLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : evaluations && evaluations.length > 0 ? (
                  <div className="space-y-4">
                    {evaluations.map(evaluation => (
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
                      <AlertCircle className="h-6 w-6 text-gray-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No evaluations found</h3>
                    <p className="text-sm text-gray-600 max-w-sm mx-auto mb-4">
                      You haven't submitted any speech videos yet. Upload a video to get started.
                    </p>
                    <Button onClick={() => document.querySelector('[data-value="submit"]')?.click()}>
                      Submit Your First Video
                    </Button>
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

// Helper functions
function generateSkillsData(evaluations: any[]) {
  if (!evaluations || evaluations.length === 0) {
    // Return sample data if no evaluations are available
    return [
      { name: "strong_rhetoric", formattedName: "Strong Rhetoric", score: 8.5, category: "structural" },
      { name: "adapted_language", formattedName: "Adapted Language", score: 7.2, category: "structural" },
      { name: "flow", formattedName: "Speech Flow", score: 6.8, category: "structural" },
      { name: "tricolon", formattedName: "Tricolon", score: 5.9, category: "rhetorical" },
      { name: "repetition", formattedName: "Repetition", score: 4.7, category: "rhetorical" },
      { name: "filler_language", formattedName: "Filler Language", score: -2.3, category: "filler" },
      { name: "repetitive_words", formattedName: "Repetitive Words", score: -3.1, category: "filler" }
    ];
  }
  
  // Get the most recent evaluation with analysis data
  const evaluationsWithAnalysis = evaluations
    .filter(e => e.results?.analysis)
    .sort((a, b) => new Date(b.completed_at || b.created_at).getTime() - 
                  new Date(a.completed_at || a.created_at).getTime());
  
  if (evaluationsWithAnalysis.length === 0) {
    // Return sample data if no evaluations with analysis
    return [
      { name: "strong_rhetoric", formattedName: "Strong Rhetoric", score: 8.5, category: "structural" },
      { name: "adapted_language", formattedName: "Adapted Language", score: 7.2, category: "structural" },
      { name: "flow", formattedName: "Speech Flow", score: 6.8, category: "structural" },
      { name: "tricolon", formattedName: "Tricolon", score: 5.9, category: "rhetorical" },
      { name: "repetition", formattedName: "Repetition", score: 4.7, category: "rhetorical" },
      { name: "filler_language", formattedName: "Filler Language", score: -2.3, category: "filler" },
      { name: "repetitive_words", formattedName: "Repetitive Words", score: -3.1, category: "filler" }
    ];
  }
  
  const latestAnalysis = evaluationsWithAnalysis[0].results.analysis;
  
  // Transform to chart data
  return Object.entries(latestAnalysis)
    .map(([name, data]: [string, any]) => ({
      name,
      formattedName: formatSkillName(name),
      score: data.score,
      category: getSkillCategory(name)
    }))
    .sort((a, b) => b.score - a.score);
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

function generateProgressData(evaluations: any[]) {
  if (!evaluations || evaluations.length === 0) return [];
  
  const evaluationsWithAnalysis = evaluations
    .filter(e => e.results?.analysis)
    .sort((a, b) => new Date(a.completed_at || a.created_at).getTime() - 
                  new Date(b.completed_at || b.created_at).getTime());
  
  if (evaluationsWithAnalysis.length === 0) return [];
  
  // Create data points for each evaluation
  return evaluationsWithAnalysis.map(evaluation => {
    const analysis = evaluation.results.analysis;
    
    // Calculate average scores by category
    const scores = {
      structural: 0,
      filler: 0,
      rhetorical: 0,
      count: { structural: 0, filler: 0, rhetorical: 0 }
    };
    
    Object.entries(analysis).forEach(([skill, data]: [string, any]) => {
      const category = getSkillCategory(skill);
      if (category === 'structural' || category === 'filler' || category === 'rhetorical') {
        scores[category] += data.score;
        scores.count[category]++;
      }
    });
    
    // Calculate averages
    const structural = scores.count.structural > 0 ? scores.structural / scores.count.structural : 0;
    const filler = scores.count.filler > 0 ? scores.filler / scores.count.filler : 0;
    const rhetorical = scores.count.rhetorical > 0 ? scores.rhetorical / scores.count.rhetorical : 0;
    
    return {
      name: new Date(evaluation.completed_at || evaluation.created_at).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric'
      }),
      structural: parseFloat(structural.toFixed(1)),
      filler: parseFloat(filler.toFixed(1)),
      rhetorical: parseFloat(rhetorical.toFixed(1)),
    };
  });
}
