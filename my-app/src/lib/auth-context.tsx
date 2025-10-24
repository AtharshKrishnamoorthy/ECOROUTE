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
    const getInitialUser = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error('Error getting initial user:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialUser();

    // Listen for auth state changes with real Supabase client
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email);
        
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          toast.success('Welcome back!');
          // Small delay to ensure auth state is set
          setTimeout(() => {
            router.push('/dashboard/main/home');
          }, 100);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          toast.success('Signed out successfully');
          router.push('/dashboard/auth/signin');
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
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
        router.push('/dashboard/main/home');
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
  
  useEffect(() => {
    if (!loading && !user) {
      // Redirect to sign in
      router.push('/dashboard/auth/signin');
    }
  }, [user, loading, router]);

  return { user, loading };
}

// Type guard for user
export function isAuthenticated(user: User | null): user is User {
  return user !== null;
}

// Protected route wrapper component
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useRequireAuth();

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

  if (!user) {
    return null; // Will redirect via useRequireAuth
  }

  return <>{children}</>;
}