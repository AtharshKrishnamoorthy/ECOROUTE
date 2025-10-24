'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth-context';
import { 
  Home, 
  MapPin, 
  History, 
  Settings, 
  Leaf,
  LogOut,
  Menu,
  X 
} from 'lucide-react';
import { toast } from 'sonner';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  {
    name: 'Home',
    href: '/dashboard/main/home',
    icon: Home,
    description: 'Overview & Metrics'
  },
  {
    name: 'Route Planner',
    href: '/dashboard/main/route-planner',
    icon: MapPin,
    description: 'AI-Powered Planning'
  },
  {
    name: 'Route History',
    href: '/dashboard/main/route-history',
    icon: History,
    description: 'Past Routes & Analysis'
  },
  {
    name: 'Settings',
    href: '/dashboard/main/settings',
    icon: Settings,
    description: 'Preferences & Account'
  },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { user, signOut, isAuthenticated } = useAuth();

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
    } catch (error) {
      toast.error('Error signing out');
    }
  };

  // Get user display name
  const getUserDisplayName = () => {
    if (!user) return 'User';
    
    const firstName = user.user_metadata?.first_name || user.user_metadata?.firstName;
    const lastName = user.user_metadata?.last_name || user.user_metadata?.lastName;
    const fullName = user.user_metadata?.full_name || user.user_metadata?.name;
    
    if (fullName) return fullName;
    
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    
    if (firstName) return firstName;
    
    return user.email?.split('@')[0] || 'User';
  };

  const getUserInitials = () => {
    const name = getUserDisplayName();
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-gray-600 opacity-75" />
        </div>
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">EcoRoute</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-md hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors",
                    isActive
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  )}
                >
                  <item.icon
                    className={cn(
                      "mr-3 h-5 w-5 flex-shrink-0",
                      isActive ? "text-emerald-600" : "text-gray-400 group-hover:text-gray-500"
                    )}
                  />
                  <div className="flex-1">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{item.description}</div>
                  </div>
                  {isActive && (
                    <div className="w-2 h-2 bg-emerald-600 rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-emerald-700">
                  {getUserInitials()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {getUserDisplayName()}
                </p>
                <p className="text-xs text-gray-500 truncate">Free Plan</p>
              </div>
              <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                ✨ AI
              </Badge>
            </div>
            <Button
              onClick={handleSignOut}
              variant="outline"
              size="sm"
              className="w-full justify-start text-gray-600 hover:text-gray-900"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white shadow-sm border-b border-gray-200 lg:hidden">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-md hover:bg-gray-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-gradient-to-br from-emerald-500 to-teal-600 rounded flex items-center justify-center">
                <Leaf className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-gray-900">EcoRoute</span>
            </div>
            <div className="w-10" /> {/* Spacer for centering */}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto bg-gray-50">
          <div className="h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}