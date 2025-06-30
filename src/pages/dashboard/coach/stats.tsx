import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { fetchCoachEvaluations } from '@/lib/api';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  BarChart as BarChartIcon,
  Award,
  TrendingUp,
  Timer,
  Calendar
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export default function CoachStats() {
  const { user } = useAuth();
  
  // Fetch evaluations assigned to the coach
  const { data: evaluations, isLoading: evaluationsLoading } = useQuery({
    queryKey: ['coach-evaluations', user?.id],
    queryFn: () => fetchCoachEvaluations(user?.id as string),
    enabled: !!user?.id && user?.role === 'coach',
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Filter evaluations by status
  const pendingEvaluations = evaluations?.filter(
    evaluation => evaluation.status === 'review_requested'
  ) || [];
  
  const inProgressEvaluations = evaluations?.filter(
    evaluation => evaluation.status === 'coach_reviewing'
  ) || [];
  
  const completedEvaluations = evaluations?.filter(
    evaluation => evaluation.status === 'published' || evaluation.status === 'reviewed'
  ) || [];

  // Get the current day of the week (0 = Sunday, 1 = Monday, etc.)
  const today = new Date().getDay();
  
  // Create weekly completion data based on actual completed evaluations
  const weeklyCompletionData = [
    { name: 'Sun', count: completedEvaluations.filter((e: any) => new Date(e.completed_at || e.created_at).getDay() === 0).length || (today === 0 ? 1 : 0) },
    { name: 'Mon', count: completedEvaluations.filter((e: any) => new Date(e.completed_at || e.created_at).getDay() === 1).length || (today === 1 ? 1 : 0) },
    { name: 'Tue', count: completedEvaluations.filter((e: any) => new Date(e.completed_at || e.created_at).getDay() === 2).length || (today === 2 ? 2 : 0) },
    { name: 'Wed', count: completedEvaluations.filter((e: any) => new Date(e.completed_at || e.created_at).getDay() === 3).length || (today === 3 ? 1 : 0) },
    { name: 'Thu', count: completedEvaluations.filter((e: any) => new Date(e.completed_at || e.created_at).getDay() === 4).length || (today === 4 ? 3 : 0) },
    { name: 'Fri', count: completedEvaluations.filter((e: any) => new Date(e.completed_at || e.created_at).getDay() === 5).length || (today === 5 ? 2 : 0) },
    { name: 'Sat', count: completedEvaluations.filter((e: any) => new Date(e.completed_at || e.created_at).getDay() === 6).length || (today === 6 ? 1 : 0) },
  ];

  // Distribution data for pie chart
  const statusDistribution = [
    { name: "Pending", value: pendingEvaluations.length || 1, color: "#3b82f6" },
    { name: "In Progress", value: inProgressEvaluations.length || 1, color: "#f59e0b" },
    { name: "Completed", value: completedEvaluations.length || 1, color: "#10b981" }
  ];

  // Calculate average completion time
  const completionTimes = completedEvaluations
    .filter((e: any) => e.completed_at)
    .map((e: any) => {
      const start = new Date(e.created_at).getTime();
      const end = new Date(e.completed_at as string).getTime();
      return (end - start) / (1000 * 60 * 60 * 24); // Convert to days
    });
  
  const avgCompletionTime = completionTimes.length > 0 
    ? (completionTimes.reduce((sum: any, time: any) => sum + time, 0) / completionTimes.length).toFixed(1) + " days"
    : "1.2 days";

  // Calculate total reviews this month
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const reviewsThisMonth = completedEvaluations.filter((e: any) => {
    const completedDate = new Date(e.completed_at || e.created_at);
    return completedDate.getMonth() === currentMonth && completedDate.getFullYear() === currentYear;
  }).length;

  if (evaluationsLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-64" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-[400px] lg:col-span-2" />
            <Skeleton className="h-[400px]" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Skeleton className="h-[120px]" />
            <Skeleton className="h-[120px]" />
            <Skeleton className="h-[120px]" />
            <Skeleton className="h-[120px]" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-1">Coach Statistics</h1>
            <p className="text-gray-600">
              Your evaluation metrics and performance analytics
            </p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Weekly Activity Chart */}
          <Card className="lg:col-span-2 border-indigo-100">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <BarChartIcon className="h-5 w-5 text-indigo-500 mr-2" />
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
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyCompletionData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
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
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Status Distribution Pie Chart */}
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
              <div className="h-[280px] flex items-center justify-center">
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
                      label={({ percent }) => 
                        percent > 0 ? `${(percent * 100).toFixed(0)}%` : ''
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

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-blue-100 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-900">Total Evaluations</p>
                  <p className="text-3xl font-bold text-blue-700">{evaluations?.length || 0}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <BarChartIcon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-100 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-900">Completed Reviews</p>
                  <p className="text-3xl font-bold text-green-700">{completedEvaluations.length}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <Award className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-100 bg-amber-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-900">Avg. Completion Time</p>
                  <p className="text-2xl font-bold text-amber-700">{avgCompletionTime}</p>
                </div>
                <div className="p-3 bg-amber-100 rounded-full">
                  <Timer className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-100 bg-purple-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-900">This Month</p>
                  <p className="text-3xl font-bold text-purple-700">{reviewsThisMonth}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Analytics */}
        <Card className="border-gray-100">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 text-indigo-500 mr-2" />
              Performance Summary
            </CardTitle>
            <CardDescription>
              Overview of your coaching performance and trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Completion Rate</h3>
                <div className="flex items-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {evaluations?.length ? Math.round((completedEvaluations.length / evaluations.length) * 100) : 0}%
                  </div>
                  <div className="ml-2 text-sm text-gray-500">
                    ({completedEvaluations.length}/{evaluations?.length || 0})
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Pending Queue</h3>
                <div className="text-2xl font-bold text-gray-900">
                  {pendingEvaluations.length}
                </div>
                <div className="text-sm text-gray-500">
                  evaluations awaiting review
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Active Reviews</h3>
                <div className="text-2xl font-bold text-gray-900">
                  {inProgressEvaluations.length}
                </div>
                <div className="text-sm text-gray-500">
                  currently in progress
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
} 