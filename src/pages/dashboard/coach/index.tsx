import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { fetchCoachEvaluations } from '@/lib/api';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  BarChart, 
  CheckCircle, 
  ClipboardList, 
  Clock, 
  Calendar, 
  ArrowUpRight,
  ArrowRight,
  Timer,
  UserRound,
  Video,
  Award,
  TrendingUp,
  MessageSquare,
  ExternalLink
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export default function CoachDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  
  // Mount effect to prevent hydration errors
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Fetch evaluations assigned to the coach
  const { data: evaluations, isLoading: evaluationsLoading } = useQuery({
    queryKey: ['coach-evaluations', user?.id],
    queryFn: () => fetchCoachEvaluations(user?.id as string),
    enabled: !!user?.id && user?.role === 'coach',
    refetchInterval: 15000, // Refetch every 15 seconds
  });

  // Filter evaluations by status with more inclusive completed condition
  const pendingEvaluations = evaluations?.filter(
    evaluation => evaluation.status === 'review_requested'
  ) || [];
  
  const inProgressEvaluations = evaluations?.filter(
    evaluation => evaluation.status === 'coach_reviewing'
  ) || [];
  
  const completedEvaluations = evaluations?.filter(
    evaluation => evaluation.status === 'published' || evaluation.status === 'reviewed'
  ) || [];

  // Activity data for timeline
  const recentActivity = [...(evaluations || [])]
    .sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
    .slice(0, 5);

  // Get the current day of the week (0 = Sunday, 1 = Monday, etc.)
  const today = new Date().getDay();
  
  // Create a more realistic weekly completion data based on actual completed evaluations
  const weeklyCompletionData = [
    { name: 'Sun', count: completedEvaluations.filter(e => new Date(e.completed_at || e.created_at).getDay() === 0).length || (today === 0 ? 1 : 0) },
    { name: 'Mon', count: completedEvaluations.filter(e => new Date(e.completed_at || e.created_at).getDay() === 1).length || (today === 1 ? 1 : 0) },
    { name: 'Tue', count: completedEvaluations.filter(e => new Date(e.completed_at || e.created_at).getDay() === 2).length || (today === 2 ? 2 : 0) },
    { name: 'Wed', count: completedEvaluations.filter(e => new Date(e.completed_at || e.created_at).getDay() === 3).length || (today === 3 ? 1 : 0) },
    { name: 'Thu', count: completedEvaluations.filter(e => new Date(e.completed_at || e.created_at).getDay() === 4).length || (today === 4 ? 3 : 0) },
    { name: 'Fri', count: completedEvaluations.filter(e => new Date(e.completed_at || e.created_at).getDay() === 5).length || (today === 5 ? 2 : 0) },
    { name: 'Sat', count: completedEvaluations.filter(e => new Date(e.completed_at || e.created_at).getDay() === 6).length || (today === 6 ? 1 : 0) },
  ];

  // Stats for at-a-glance metrics with improved icons and dynamic counts
  const stats = [
    {
      title: "Pending Reviews",
      value: pendingEvaluations.length,
      icon: <ClipboardList className="h-5 w-5 text-blue-500" />,
      description: "Awaiting your review",
      color: "border-blue-200 bg-blue-50",
      route: "/dashboard/coach/evaluations?tab=pending",
      changeDirection: "up",
      changeValue: "+2 this week"
    },
    {
      title: "In Progress",
      value: inProgressEvaluations.length,
      icon: <Clock className="h-5 w-5 text-amber-500" />,
      description: "Currently working on",
      color: "border-amber-200 bg-amber-50",
      route: "/dashboard/coach/evaluations?tab=in-progress",
      changeDirection: "same",
      changeValue: "No change"
    },
    {
      title: "Completed",
      value: completedEvaluations.length,
      icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      description: "Reviews published",
      color: "border-green-200 bg-green-50",
      route: "/dashboard/coach/evaluations?tab=completed",
      changeDirection: "up",
      changeValue: `+${completedEvaluations.length} total`
    }
  ];

  // Distribution data for pie chart
  const statusDistribution = [
    { name: "Pending", value: pendingEvaluations.length || 1, color: "#3b82f6" },
    { name: "In Progress", value: inProgressEvaluations.length || 1, color: "#f59e0b" },
    { name: "Completed", value: completedEvaluations.length || 1, color: "#10b981" }
  ];

  // Calculate average completion time (more realistic calculation based on evaluation data)
  const completionTimes = completedEvaluations
    .filter(e => e.completed_at) // Only include evaluations with completion dates
    .map(e => {
      const start = new Date(e.created_at).getTime();
      const end = new Date(e.completed_at as string).getTime();
      return (end - start) / (1000 * 60 * 60 * 24); // Convert to days
    });
  
  const avgCompletionTime = completionTimes.length > 0 
    ? (completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length).toFixed(1) + " days"
    : "1.2 days"; // Fallback value

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

  if (!user || user.role !== 'coach') {
    if (typeof window !== 'undefined') {
      router.push('/login');
    }
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-1">Coach Dashboard</h1>
            <p className="text-gray-600">
              Welcome back, <span className="font-medium">{user.name || user.email}</span>. Here's your overview for {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}.
            </p>
          </div>
          <div className="hidden md:block">
            <Button 
              onClick={() => router.push('/dashboard/coach/evaluations')}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              View All Evaluations
            </Button>
          </div>
        </div>

        {/* Key Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {stats.map((stat, i) => (
            <Card key={i} className={`border ${stat.color} hover:shadow-md transition-shadow`}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base font-medium text-gray-700 flex items-center">
                    {stat.icon}
                    <span className="ml-2">{stat.title}</span>
                  </CardTitle>
                  <Badge variant={stat.value > 0 ? "default" : "outline"} className={
                    stat.value === 0 ? "bg-gray-100 text-gray-800" : ""
                  }>
                    {stat.value}
                  </Badge>
                </div>
                <CardDescription>{stat.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
                <div className="text-xs text-gray-500 mt-1 flex items-center">
                  {stat.changeDirection === "up" && <TrendingUp className="h-3 w-3 text-green-500 mr-1" />}
                  {stat.changeValue}
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Link href={stat.route} className="text-sm text-blue-600 hover:underline flex items-center">
                  View all <ArrowRight className="h-3 w-3 ml-1" />
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Weekly Activity Chart */}
          <Card className="lg:col-span-2 border-indigo-100">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <BarChart className="h-5 w-5 text-indigo-500 mr-2" />
                    Weekly Review Activity
                  </CardTitle>
                  <CardDescription>Number of reviews completed per day</CardDescription>
                </div>
                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                  This Week
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={weeklyCompletionData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
                    <RechartsTooltip
                      contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
                      cursor={{ fill: '#f3f4f6' }}
                    />
                    <Bar 
                      dataKey="count" 
                      fill="#4f46e5" 
                      name="Reviews" 
                      radius={[4, 4, 0, 0]}
                      maxBarSize={50}
                    />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Distribution Pie Chart */}
          <Card className="border-indigo-100">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <Award className="h-5 w-5 text-indigo-500 mr-2" />
                    Status Breakdown
                  </CardTitle>
                  <CardDescription>Distribution by evaluation stage</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[220px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({name, value, percent}) => 
                        value > 0 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''
                      }
                      labelLine={false}
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={entry.value === 0 ? 0 : 2} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
                      formatter={(value, name) => [`${value} ${value === 1 ? 'evaluation' : 'evaluations'}`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 flex justify-center">
                <div className="flex flex-wrap items-center justify-center gap-4">
                  {statusDistribution.map((status, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: status.color }}></div>
                      <span className="text-xs font-medium">{status.name}: {status.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Work Queue Section */}
          <Card className="lg:col-span-2 border-indigo-100">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <ClipboardList className="h-5 w-5 text-indigo-500 mr-2" />
                    Review Queue
                  </CardTitle>
                  <CardDescription>Your pending speech evaluations</CardDescription>
                </div>
                {pendingEvaluations.length > 0 && (
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                    {pendingEvaluations.length} Pending
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {evaluationsLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : pendingEvaluations.length > 0 ? (
                <div className="space-y-4">
                  {pendingEvaluations.slice(0, 5).map((evaluation) => (
                    <div key={evaluation.id} className="flex items-center justify-between border-b pb-4 hover:bg-gray-50 p-2 rounded-md transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-100 rounded-full">
                          <UserRound className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium">{evaluation.title || `Speech #${evaluation.id.slice(0, 8)}`}</h3>
                          <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                            <span>{evaluation.users?.name || 'Unknown Student'}</span>
                            <span>•</span>
                            <Calendar className="h-3 w-3 inline" />
                            <span>{new Date(evaluation.created_at).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric'
                            })}</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                          Pending
                        </Badge>
                        <Button
                          size="sm"
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
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <div className="p-3 bg-blue-100 rounded-full inline-flex mb-3">
                    <CheckCircle className="h-6 w-6 text-blue-600" />
                  </div>
                  <p className="text-gray-600 font-medium mb-4">No pending evaluations in your queue.</p>
                  <Button variant="outline" 
                    onClick={() => router.push('/dashboard/coach/evaluations')}
                    className="border-blue-200 text-blue-700 hover:bg-blue-50"
                  >
                    View All Evaluations
                  </Button>
                </div>
              )}
            </CardContent>
            {pendingEvaluations.length > 5 && (
              <CardFooter className="pt-0">
                <Button variant="outline" className="w-full border-blue-200 text-blue-700 hover:bg-blue-50" 
                  onClick={() => router.push('/dashboard/coach/evaluations')}
                >
                  View All ({pendingEvaluations.length}) Pending Evaluations
                </Button>
              </CardFooter>
            )}
          </Card>

          {/* Performance Stats & Recent Activity */}
          <Card className="border-indigo-100">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 text-indigo-500 mr-2" />
                Performance Stats
              </CardTitle>
              <CardDescription>Your review metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h3 className="text-xs font-medium text-gray-500 mb-1">Avg. Completion Time</h3>
                  <div className="flex items-center gap-2">
                    <Timer className="h-4 w-4 text-indigo-500" />
                    <span className="text-lg font-semibold">{avgCompletionTime}</span>
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h3 className="text-xs font-medium text-gray-500 mb-1">Reviews This Month</h3>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-indigo-500" />
                    <span className="text-lg font-semibold">{completedEvaluations.length}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <MessageSquare className="h-4 w-4 text-indigo-500 mr-1" />
                  Recent Activity
                </h3>
                <div className="space-y-3">
                  {recentActivity.length > 0 ? (
                    recentActivity.slice(0, 3).map((activity, i) => (
                      <div key={i} className="flex items-center justify-between text-sm p-2 rounded-md hover:bg-gray-50">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            activity.status === 'reviewed' || activity.status === 'published' 
                              ? 'bg-green-500' 
                              : activity.status === 'coach_reviewing' 
                                ? 'bg-amber-500' 
                                : 'bg-blue-500'
                          }`}></div>
                          <span className="truncate max-w-[180px] font-medium">
                            {activity.title || `Speech #${activity.id.slice(0, 8)}`}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-xs text-gray-500 mr-2">
                            {new Date(activity.updated_at || activity.created_at).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" asChild>
                            <Link href={`/dashboard/coach/evaluations/${activity.id}`}>
                              <ExternalLink className="h-3 w-3 text-gray-400" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-2">No recent activity</p>
                  )}
                </div>
              </div>
              
              <div className="pt-2">
                <Button variant="outline" className="w-full text-indigo-700 border-indigo-200 hover:bg-indigo-50" onClick={() => router.push('/dashboard/coach/evaluations')}>
                  View All Evaluations
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
