import { useState } from 'react';
import { Bell, User, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/router';

interface HeaderProps {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export default function Header({ user }: HeaderProps) {
  const { logout } = useAuth();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling
    
    // Prevent multiple logout attempts
    if (isLoggingOut) return;
    
    try {
      setIsLoggingOut(true);
      
      // Set a timeout to force navigation if logout takes too long
      const timeoutId = setTimeout(() => {
        console.log('Logout timeout reached, forcing navigation');
        router.push('/login');
      }, 5000); // 5 second timeout
      
      await logout();
      clearTimeout(timeoutId);
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Force client-side logout even if there was an error
      router.push('/login');
    } finally {
      setIsLoggingOut(false);
    }
  };
  
  // Get user initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part: any) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Update the Avatar component logic to use a data URL instead of a file path
  const getDefaultAvatarDataUrl = () => {
    // Return a simple SVG data URL with the user's initials
    const initials = getInitials(user.name);
    const bgColor = stringToColor(user.name);
    
    // Create a simple SVG with the initials
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
        <rect width="40" height="40" fill="${bgColor}" />
        <text x="20" y="24" font-family="Arial" font-size="16" fill="white" text-anchor="middle">${initials}</text>
      </svg>
    `;
    
    // Convert SVG to data URL
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  };
  
  // Generate a color based on the user's name
  const stringToColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = '#';
    for (let i = 0; i < 3; i++) {
      const value = (hash >> (i * 8)) & 0xFF;
      color += ('00' + value.toString(16)).substr(-2);
    }
    return color;
  };

  const roleMap = {
    'admin': 'Administrator',
    'coach': 'Coach',
    'student': 'Student'
  };
  
  const roleName = roleMap[user.role as keyof typeof roleMap] || user.role;

  return (
    <header className="bg-white border-b border-gray-200 py-3 px-6 flex items-center justify-between">
      <div>
        {/* Page title can go here if needed */}
      </div>
      
      <div className="flex items-center gap-4">
        {/* Notifications dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="rounded-full relative">
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                3
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-80 overflow-auto">
              <DropdownMenuItem className="py-3">
                <div>
                  <p className="font-medium">New evaluation received</p>
                  <p className="text-sm text-gray-500">You have a new speech to review</p>
                  <p className="text-xs text-gray-400 mt-1">5 minutes ago</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="py-3">
                <div>
                  <p className="font-medium">Feedback available</p>
                  <p className="text-sm text-gray-500">Your coach left feedback on your speech</p>
                  <p className="text-xs text-gray-400 mt-1">1 hour ago</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="py-3">
                <div>
                  <p className="font-medium">System update</p>
                  <p className="text-sm text-gray-500">New features have been added</p>
                  <p className="text-xs text-gray-400 mt-1">1 day ago</p>
                </div>
              </DropdownMenuItem>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-center font-medium text-primary">
              View all notifications
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 rounded-full flex items-center gap-2">
              <Avatar className="h-8 w-8">
                {/* Use data URL for avatar instead of file path */}
                <AvatarImage src={getDefaultAvatarDataUrl()} alt={user.name} />
                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
              </Avatar>
              <span className="hidden md:inline-block text-sm font-medium truncate max-w-[100px]">
                {user.name}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <div>
                <p>{user.name}</p>
                <p className="text-xs text-gray-500">{roleName}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => router.push(`/dashboard/${user.role}/profile`)}
            >
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push(`/dashboard/${user.role}/settings`)}
            >
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleLogout}
              disabled={isLoggingOut}
              className={isLoggingOut ? "opacity-50 cursor-not-allowed" : ""}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>{isLoggingOut ? "Logging out..." : "Log out"}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
