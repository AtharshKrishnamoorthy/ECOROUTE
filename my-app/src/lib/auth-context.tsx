'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient, signIn as supabaseSignIn, signUp as supabaseSignUp, signOut as supabaseSignOut } from '@/lib/supabase';
import { toast } from 'sonner';

// User type that matches Supabase's user object
interface User {
  id: string;
  email?: string;
  user_metadata?: {
    first_name?: string;
    last_name?: string;
    full_name?: string;
    avatar_url?: string;
    name?: string;
    [key: string]: any;
  };
  app_metadata?: {
    [key: string]: any;
  };
  created_at?: string;
  last_sign_in_at?: string;
  email_confirmed_at?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const router = useRouter();

  const refreshUser = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    } catch (error) {
      console.error('Error refreshing user:', error);
      setUser(null);
    }
  };

  useEffect(() => {
    let mounted = true;
    let hasNavigated = false;
    const supabase = createClient();

    const getInitialUser = async () => {
      try {
        // First check session from storage
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user && mounted) {
          setUser(session.user);
          console.log('✅ Session restored from storage:', session.user.email);
        } else if (mounted) {
          // If no session in storage, try to get user
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            setUser(user);
            console.log('✅ User fetched:', user.email);
          } else {
            setUser(null);
            console.log('❌ No user found');
          }
        }
      } catch (error) {
        console.error('❌ Error getting initial user:', error);
        if (mounted) setUser(null);
      } finally {
        if (mounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    getInitialUser();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔔 Auth state change:', event, session?.user?.email || 'no user');
        
        if (!mounted) return;

        // Update user state for all events with a session
        if (session?.user) {
          setUser(session.user);
          console.log('✅ User state updated from event:', event);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          console.log('❌ User signed out');
        }

        // Handle navigation ONLY for explicit sign in/out events
        if (event === 'SIGNED_IN' && session?.user && !hasNavigated) {
          hasNavigated = true;
          toast.success('Welcome back!');
          setTimeout(() => {
            router.push('/dashboard/main/home');
          }, 100);
        } else if (event === 'SIGNED_OUT' && !hasNavigated) {
          hasNavigated = true;
          toast.success('Signed out successfully');
          setTimeout(() => {
            router.push('/dashboard/auth/signin');
          }, 100);
        }
        
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const data = await supabaseSignIn(email, password);
      
      if (data.user) {
        setUser(data.user);
        toast.success('Welcome back!');
        router.push('/dashboard/main/home');
        return { success: true };
      }
      
      return { success: false, error: 'Unknown error occurred' };
    } catch (error: any) {
      const errorMessage = error.message || 'An error occurred during sign in';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setLoading(true);
      const data = await supabaseSignUp(email, password);
      
      if (data.user) {
        setUser(data.user);
        toast.success('Account created successfully!');
        router.push('/dashboard/auth/signin');
        return { success: true };
      }
      
      return { success: false, error: 'Unknown error occurred' };
    } catch (error: any) {
      const errorMessage = error.message || 'An error occurred during sign up';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await supabaseSignOut();
      setUser(null);
      toast.success('Signed out successfully');
      router.push('/dashboard/auth/signin');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Error signing out');
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    signOut,
    signIn,
    signUp,
    refreshUser,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook for protected routes
export function useRequireAuth() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [shouldRedirect, setShouldRedirect] = useState(false);
  
  useEffect(() => {
    if (!loading && !user) {
      // Only redirect if we've confirmed there's no user after loading
      setShouldRedirect(true);
      const timer = setTimeout(() => {
        router.push('/dashboard/auth/signin');
      }, 100);
      return () => clearTimeout(timer);
    } else if (user) {
      setShouldRedirect(false);
    }
  }, [user, loading, router]);

  return { user, loading, shouldRedirect };
}

// Type guard for user
export function isAuthenticated(user: User | null): user is User {
  return user !== null;
}

// Protected route wrapper component
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    // Only redirect once if not authenticated after loading completes
    if (!loading && !user && !hasRedirected) {
      console.log('🔒 Protected route: No user, redirecting to sign in');
      setHasRedirected(true);
      router.push('/dashboard/auth/signin');
    }
  }, [loading, user, hasRedirected, router]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-green-100">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated after loading, show redirecting message
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-green-100">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-gray-600">Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  // Render protected content only when authenticated
  console.log('✅ Protected route: User authenticated, rendering content');
  return <>{children}</>;
}