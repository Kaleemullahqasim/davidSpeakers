import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  Home, 
  VideoIcon, 
  Users, 
  Settings, 
  Book, 
  LogOut, 
  ChevronRight, 
  Menu, 
  X,
  User, 
  Award,
  Headphones
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface SidebarProps {
  userRole: 'admin' | 'coach' | 'student' | string;
}

export default function Sidebar({ userRole }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Force client-side logout even if there was an error
      router.push('/login');
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Define navigation items based on user role
  const getNavItems = () => {
    // Normalize role to handle any case variations
    const normalizedRole = typeof userRole === 'string' ? userRole.toLowerCase() : '';
    
    switch (normalizedRole) {
      case 'admin':
        return [
          { href: '/dashboard/admin', label: 'Dashboard', icon: <Home className="h-5 w-5" /> },
          { href: '/dashboard/admin/users', label: 'User Management', icon: <Users className="h-5 w-5" /> },
          { href: '/dashboard/admin/evaluations', label: 'Evaluations', icon: <VideoIcon className="h-5 w-5" /> },
          { href: '/dashboard/admin/settings', label: 'Settings', icon: <Settings className="h-5 w-5" /> },
        ];
      case 'coach':
        return [
          { href: '/dashboard/coach', label: 'Dashboard', icon: <Home className="h-5 w-5" /> },
          { href: '/dashboard/coach/evaluations', label: 'Evaluations', icon: <VideoIcon className="h-5 w-5" /> },
          { href: '/dashboard/coach/students', label: 'Students', icon: <Users className="h-5 w-5" /> },
          { href: '/dashboard/coach/resources', label: 'Resources', icon: <Book className="h-5 w-5" /> },
        ];
      case 'student':
      default:
        // Default to student navigation if role is not recognized
        return [
          { href: '/dashboard/student', label: 'Dashboard', icon: <Home className="h-5 w-5" /> },
          { href: '/dashboard/student/evaluations', label: 'My Evaluations', icon: <VideoIcon className="h-5 w-5" /> },
          { href: '/dashboard/student/resources', label: 'Learning Resources', icon: <Book className="h-5 w-5" /> },
        ];
    }
  };

  const navItems = getNavItems();

  return (
    <>
      {/* Mobile sidebar toggle button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-40 bg-primary text-primary-foreground p-2 rounded-md"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
        <span className="sr-only">Toggle menu</span>
      </button>

      {/* Mobile overlay */}
      {!collapsed && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setCollapsed(true)}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full bg-slate-900 text-white z-30 transition-all duration-300 ease-in-out",
          collapsed ? "-translate-x-full lg:translate-x-0 lg:w-[80px]" : "translate-x-0 w-64"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b border-slate-800">
            <div className="flex items-center justify-between">
              {!collapsed && (
                <div className="text-lg font-bold">David Speaker</div>
              )}
              <button
                className="hidden lg:block text-slate-400 hover:text-white"
                onClick={() => setCollapsed(!collapsed)}
              >
                <ChevronRight className={cn("h-5 w-5 transition-transform", !collapsed && "rotate-180")} />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="px-2 space-y-1">
              {navItems.map((item, index) => (
                <li key={index}>
                  <Link 
                    href={item.href} 
                    className={cn(
                      "flex items-center px-3 py-2 rounded-md transition-colors",
                      router.pathname === item.href
                        ? "bg-primary text-primary-foreground"
                        : "text-slate-300 hover:bg-slate-800"
                    )}
                    onClick={() => {
                      if (window.innerWidth < 1024) setCollapsed(true);
                    }}
                  >
                    <span className="flex-shrink-0">{item.icon}</span>
                    {!collapsed && <span className="ml-3">{item.label}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Logout button */}
          <div className="p-4 border-t border-slate-800">
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className={`flex items-center w-full px-3 py-2 text-left rounded-md transition-colors ${
                isLoggingOut 
                  ? "bg-slate-700 text-slate-400 cursor-not-allowed" 
                  : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              <LogOut className="h-5 w-5" />
              {!collapsed && (
                <span className="ml-3">
                  {isLoggingOut ? "Logging out..." : "Logout"}
                </span>
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Add spacer for content to avoid overlap with sidebar */}
      <div className={cn("lg:block", collapsed ? "lg:w-[80px]" : "lg:w-64")}></div>
    </>
  );
}
