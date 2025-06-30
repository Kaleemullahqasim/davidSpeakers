import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// Mock data for analytics
const userData = [
  { name: 'Jan', students: 4, coaches: 2 },
  { name: 'Feb', students: 10, coaches: 3 },
  { name: 'Mar', students: 15, coaches: 5 },
  { name: 'Apr', students: 22, coaches: 7 },
  { name: 'May', students: 30, coaches: 8 },
  { name: 'Jun', students: 35, coaches: 9 },
];

const evaluationData = [
  { name: 'Jan', completed: 12, reviewed: 8 },
  { name: 'Feb', completed: 20, reviewed: 15 },
  { name: 'Mar', completed: 30, reviewed: 22 },
  { name: 'Apr', completed: 40, reviewed: 30 },
  { name: 'May', completed: 55, reviewed: 42 },
  { name: 'Jun', completed: 65, reviewed: 50 },
];

const skillPerformanceData = [
  { name: 'Filler Language', score: -2.5 },
  { name: 'Repetitive Words', score: -1.8 },
  { name: 'Alliteration', score: 5.3 },
  { name: 'Tricolon', score: 4.2 },
  { name: 'Flow', score: 3.8 },
  { name: 'Anaphora', score: 2.9 },
  { name: 'Negations', score: -1.2 },
  { name: 'Absolute Words', score: -0.9 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function AdminAnalytics() {
  const { user, loading } = useAuth();
  const router = useRouter();

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
          <h1 className="text-3xl font-bold">Platform Analytics</h1>
          <p className="text-gray-600">
            Review platform usage, evaluation metrics, and user growth trends
          </p>
        </div>

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">User Growth</TabsTrigger>
            <TabsTrigger value="evaluations">Evaluations</TabsTrigger>
            <TabsTrigger value="skills">Skills Analysis</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>User Growth</CardTitle>
                  <CardDescription>
                    Students and coaches registered over time
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={userData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="students" stroke="#4f46e5" activeDot={{ r: 8 }} />
                      <Line type="monotone" dataKey="coaches" stroke="#10b981" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Evaluation Activity</CardTitle>
                  <CardDescription>
                    AI evaluations and coach reviews
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={evaluationData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="completed" name="AI Evaluated" fill="#4f46e5" />
                      <Bar dataKey="reviewed" name="Coach Reviewed" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="users" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>User Growth Trends</CardTitle>
                <CardDescription>
                  Historical data on platform adoption
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={userData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="students" 
                      name="Student Signups"
                      stroke="#4f46e5" 
                      strokeWidth={2}
                      activeDot={{ r: 8 }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="coaches" 
                      name="Coach Signups"
                      stroke="#10b981" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="evaluations" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Evaluation Metrics</CardTitle>
                <CardDescription>
                  Completed evaluations and coach reviews over time
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={evaluationData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar 
                      dataKey="completed" 
                      name="AI Evaluations Completed" 
                      fill="#4f46e5" 
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar 
                      dataKey="reviewed" 
                      name="Coach Reviews Provided" 
                      fill="#10b981" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="skills" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Average Skill Performance</CardTitle>
                <CardDescription>
                  Average scores across all speech patterns
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[500px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={skillPerformanceData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      type="number" 
                      domain={[-5, 6]} 
                    />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                    />
                    <Tooltip />
                    <Bar 
                      dataKey="score" 
                      fill="#10b981"
                      radius={[0, 4, 4, 0]}
                    >
                      {skillPerformanceData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.score > 0 ? '#10b981' : '#ef4444'} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
