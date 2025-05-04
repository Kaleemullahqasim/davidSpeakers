import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, ArrowLeft } from 'lucide-react';

export default function StudentSessions() {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center">
          <p>Loading...</p>
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
            <h1 className="text-3xl font-bold">Coaching Sessions</h1>
            <p className="text-gray-600">
              Schedule and manage your live coaching sessions
            </p>
          </div>
          
          <Button 
            onClick={() => router.push('/dashboard/student')}
            variant="outline"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 text-indigo-500 mr-2" />
              Coming Soon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="py-12 text-center">
              <h2 className="text-2xl font-bold text-gray-700 mb-3">Live Coaching Sessions</h2>
              <p className="text-gray-600 max-w-md mx-auto mb-6">
                This feature will allow you to schedule live 1-on-1 coaching sessions 
                with our professional speaking coaches.
              </p>
              <p className="text-sm text-indigo-600 font-medium">
                We're working on this feature and it will be available soon!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
