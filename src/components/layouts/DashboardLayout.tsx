import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/layouts/Sidebar';
import Header from '@/components/layouts/Header';
import { Loader2 } from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If not loading and not authenticated, redirect to login
    if (!loading && !user) {
      router.push('/login');
    } else if (!loading && user) {
      // Check if user is accessing the correct dashboard for their role
      const path = router.pathname;
      const isAdminPath = path.includes('/dashboard/admin');
      const isCoachPath = path.includes('/dashboard/coach');
      const isStudentPath = path.includes('/dashboard/student');
      
      // Redirect if accessing a role-specific dashboard they shouldn't access
      if (isAdminPath && user.role !== 'admin') {
        router.push(`/dashboard/${user.role}`);
      } else if (isCoachPath && user.role !== 'coach') {
        router.push(`/dashboard/${user.role}`);
      } else if (isStudentPath && user.role !== 'student') {
        router.push(`/dashboard/${user.role}`);
      }
      
      // If at root /dashboard, redirect to role-specific dashboard
      if (path === '/dashboard') {
        router.push(`/dashboard/${user.role}`);
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  if (!user) {
    // This shouldn't render due to the redirect in useEffect
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <Sidebar userRole={user.role} />
        <div className="flex-1">
          <Header user={user} />
          <main className="p-6 max-w-7xl mx-auto">{children}</main>
        </div>
      </div>
    </div>
  );
}
