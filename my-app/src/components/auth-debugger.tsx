'use client';

import { useAuth } from '@/lib/auth-context';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase';

export function AuthDebugger() {
  const { user, loading, isAuthenticated } = useAuth();
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [storageInfo, setStorageInfo] = useState<any>(null);

  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      setSessionInfo(session);
    };

    const checkStorage = () => {
      if (typeof window !== 'undefined') {
        const keys = Object.keys(localStorage).filter(key => 
          key.includes('supabase') || key.includes('ecoroute')
        );
        const storage: any = {};
        keys.forEach(key => {
          try {
            storage[key] = JSON.parse(localStorage.getItem(key) || '{}');
          } catch {
            storage[key] = localStorage.getItem(key);
          }
        });
        setStorageInfo(storage);
      }
    };

    checkSession();
    checkStorage();

    const interval = setInterval(() => {
      checkSession();
      checkStorage();
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  if (process.env.NODE_ENV === 'production') return null;

  return (
    <Card className="fixed bottom-4 right-4 w-96 max-h-96 overflow-auto z-50 shadow-2xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <span>🔍 Auth Debug Panel</span>
          <Badge variant={isAuthenticated ? 'default' : 'destructive'}>
            {isAuthenticated ? 'Authenticated' : 'Not Auth'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="text-xs space-y-2">
        <div>
          <strong>Loading:</strong> {loading ? '⏳ Yes' : '✅ No'}
        </div>
        <div>
          <strong>User:</strong> {user ? `✅ ${user.email}` : '❌ None'}
        </div>
        <div>
          <strong>User ID:</strong> {user?.id || 'N/A'}
        </div>
        <div>
          <strong>Session Active:</strong> {sessionInfo ? '✅ Yes' : '❌ No'}
        </div>
        {sessionInfo && (
          <div>
            <strong>Token Expires:</strong> {new Date(sessionInfo.expires_at * 1000).toLocaleTimeString()}
          </div>
        )}
        <div className="pt-2 border-t">
          <strong>localStorage Keys:</strong>
          <pre className="text-[10px] mt-1 p-1 bg-gray-100 rounded overflow-x-auto">
            {JSON.stringify(Object.keys(storageInfo || {}), null, 2)}
          </pre>
        </div>
        <div className="text-[10px] text-gray-500">
          Updates every 2 seconds
        </div>
      </CardContent>
    </Card>
  );
}
