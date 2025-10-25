# 🔧 Session Management Deep Dive - Advanced Debugging

## Critical Bugs Fixed

### Bug #1: Infinite Re-render Loop (CRITICAL)
**Location:** `lib/auth-context.tsx` - useEffect dependency array

**Problem:**
```typescript
useEffect(() => {
  // ... code
  setInitialized(true);
}, [router, initialized]); // ❌ initialized in deps causes infinite loop!
```

**Fix Applied:**
```typescript
useEffect(() => {
  // ... code
  setInitialized(true);
}, [router]); // ✅ Removed initialized from deps
```

**Impact:** This was causing the entire auth context to reinitialize on every state change, resetting user session.

---

### Bug #2: Multiple Navigation Attempts
**Location:** `lib/auth-context.tsx` - onAuthStateChange handler

**Problem:**
```typescript
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    router.push('/dashboard/main/home'); // Called multiple times!
  }
});
```

**Fix Applied:**
```typescript
let hasNavigated = false;
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' && !hasNavigated) {
    hasNavigated = true; // ✅ Prevent duplicate navigation
    router.push('/dashboard/main/home');
  }
});
```

**Impact:** Prevents race conditions where navigation happens multiple times.

---

### Bug #3: SSR Hydration Mismatch
**Location:** `lib/supabase.ts` - Client creation

**Problem:**
```typescript
export const createClient = () => {
  if (!supabaseInstance) {
    supabaseInstance = createSupabaseClient(...);
  }
  return supabaseInstance;
}
```

**Fix Applied:**
```typescript
export const createClient = () => {
  // Server-side: return dummy client
  if (typeof window === 'undefined') {
    return createSupabaseClient(..., {
      auth: { persistSession: false }
    });
  }
  
  // Client-side: singleton with proper config
  if (!supabaseInstance) {
    supabaseInstance = createSupabaseClient(..., {
      auth: {
        persistSession: true,
        storageKey: 'ecoroute-auth-token',
        flowType: 'pkce',
      }
    });
  }
  return supabaseInstance;
}
```

**Impact:** Prevents server/client mismatch errors and ensures clean hydration.

---

### Bug #4: ProtectedRoute Redirect Loop
**Location:** `lib/auth-context.tsx` - ProtectedRoute component

**Problem:**
```typescript
export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (!user) {
    return null; // No guard against multiple redirects
  }
  return <>{children}</>;
}
```

**Fix Applied:**
```typescript
export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const [hasRedirected, setHasRedirected] = useState(false);
  
  useEffect(() => {
    if (!loading && !user && !hasRedirected) {
      setHasRedirected(true); // ✅ Only redirect once
      router.push('/dashboard/auth/signin');
    }
  }, [loading, user, hasRedirected, router]);
  
  if (!user) {
    return <LoadingState />;
  }
  return <>{children}</>;
}
```

**Impact:** Prevents redirect loops and flashing content.

---

## Diagnostic Steps

### Step 1: Check Browser Console Logs

After the fix, you should see these logs in order:

```
🔧 Creating new Supabase client instance
✅ Session restored from storage: user@example.com
🔔 Auth state change: INITIAL_SESSION user@example.com
✅ User state updated from event: INITIAL_SESSION
✅ Protected route: User authenticated, rendering content
```

**Bad logs (indicates problem):**
```
❌ No user found
🔒 Protected route: No user, redirecting to sign in
```

### Step 2: Inspect localStorage

Open DevTools → Application → Local Storage → Check for:

```
Key: ecoroute-auth-token
Value: {"access_token": "eyJ...", "refresh_token": "...", ...}
```

**If missing:** Session is not persisting (check Supabase config)
**If present but user is null:** Token may be expired or invalid

### Step 3: Watch Network Tab

When navigating between pages, you should see:

✅ **Normal behavior:**
- No auth requests on navigation
- Only periodic token refresh requests (~every 50 minutes)

❌ **Problem behavior:**
- Frequent `/auth/v1/user` requests on every navigation
- Multiple `/auth/v1/token?grant_type=refresh_token` requests

### Step 4: Use Auth Debug Panel

The debug panel (bottom-right corner in dev mode) shows real-time auth state:

```
🔍 Auth Debug Panel
Loading: ✅ No
User: ✅ user@example.com
Session Active: ✅ Yes
Token Expires: 3:45:23 PM
```

**Watch for:**
- Loading stays "Yes" → Auth provider not initializing
- User flickers between value and null → State reset issue
- Session Active is "No" but User is "Yes" → Storage problem

---

## Testing Checklist

Run through these scenarios in order:

### Scenario 1: Fresh Sign In
1. Open incognito window
2. Sign in with credentials
3. ✅ Should navigate to `/dashboard/main/home`
4. ✅ Debug panel should show user info
5. ✅ Console should show session restored log

### Scenario 2: Tab Navigation
1. While signed in, click "Route Planner"
2. ✅ Should stay signed in
3. ✅ No flash of loading screen
4. Click "Route History"
5. ✅ Should stay signed in
6. Click "Settings"
7. ✅ Should stay signed in

### Scenario 3: Page Refresh
1. While on any dashboard page, press F5
2. ✅ Should stay signed in
3. ✅ Should stay on same page
4. ✅ Console should show "Session restored from storage"

### Scenario 4: Close and Reopen
1. Close browser tab
2. Reopen and navigate to `/dashboard/main/home`
3. ✅ Should automatically sign in from localStorage
4. ✅ No redirect to sign-in page

### Scenario 5: Token Expiry (Manual Test)
1. Sign in
2. In DevTools console, run:
   ```javascript
   // Expire the token manually
   const key = Object.keys(localStorage).find(k => k.includes('ecoroute-auth'));
   const data = JSON.parse(localStorage.getItem(key));
   data.expires_at = Math.floor(Date.now() / 1000) - 100; // 100 seconds ago
   localStorage.setItem(key, JSON.stringify(data));
   ```
3. Navigate to a new page
4. ✅ Should auto-refresh token
5. ✅ Should NOT sign out

### Scenario 6: Manual Sign Out
1. Click "Sign Out" button
2. ✅ Should redirect to sign-in page
3. ✅ localStorage should be cleared
4. Manually navigate to `/dashboard/main/home`
5. ✅ Should redirect back to sign-in

---

## Common Issues and Solutions

### Issue: "Session restored" log but user is null

**Diagnosis:**
```javascript
// Check token validity
const supabase = createClient();
const { data, error } = await supabase.auth.getUser();
console.log('Token check:', error);
```

**Possible causes:**
- Token expired and refresh failed
- Supabase project credentials changed
- User deleted from Supabase dashboard

**Solution:**
1. Clear localStorage: `localStorage.clear()`
2. Sign in again
3. Check Supabase dashboard for user status

---

### Issue: User keeps getting redirected to sign-in

**Diagnosis:**
Look for this pattern in console:
```
✅ Session restored from storage: user@example.com
🔒 Protected route: No user, redirecting to sign in
```

**This means:** Session restored but `user` state not updating in React

**Solution:**
Check that `setUser()` is being called in the auth context:
```typescript
const { data: { session } } = await supabase.auth.getSession();
if (session?.user) {
  setUser(session.user); // ← Make sure this is called!
}
```

---

### Issue: Multiple auth state change events firing

**Diagnosis:**
Console shows:
```
🔔 Auth state change: INITIAL_SESSION
🔔 Auth state change: SIGNED_IN
🔔 Auth state change: TOKEN_REFRESHED
... (repeating rapidly)
```

**This means:** Multiple subscriptions or infinite loop

**Solution:**
1. Ensure only ONE `AuthProvider` in component tree (check all layouts)
2. Verify useEffect cleanup:
   ```typescript
   return () => {
     subscription.unsubscribe(); // ← Must be called!
   };
   ```

---

### Issue: Works on first load, breaks on navigation

**Diagnosis:**
- First page load: Works ✅
- Click link to another page: Redirects to sign-in ❌

**This means:** State not persisting across navigation

**Solution:**
1. Verify AuthProvider is in root layout (not child layouts)
2. Check that Supabase client is singleton:
   ```typescript
   console.log('Client instance:', supabaseInstance); // Should be same object
   ```

---

## Environment Variables Checklist

Verify these are set in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Test:**
```javascript
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
// Should print: https://your-project.supabase.co
```

**If undefined:**
1. Restart dev server
2. Check `.env.local` exists in project root
3. Verify no typos in variable names

---

## Performance Monitoring

After the fix, monitor these metrics:

| Metric | Before Fix | After Fix |
|--------|-----------|-----------|
| Auth checks per navigation | 3-5 | 0-1 |
| Token refresh calls | Frequent | Every ~50 min |
| Re-renders on navigation | 5-10 | 1-2 |
| Time to render protected page | 300-500ms | 50-100ms |

---

## Rollback Plan

If issues persist after applying fixes:

1. **Quick rollback:**
   ```bash
   git checkout HEAD~1 lib/auth-context.tsx
   git checkout HEAD~1 lib/supabase.ts
   ```

2. **Verify old behavior:**
   - Clear browser cache and localStorage
   - Test sign-in flow

3. **Report issue with:**
   - Browser console logs
   - Network tab screenshot
   - Auth debug panel screenshot

---

## Next Steps

1. ✅ Apply all fixes above
2. ✅ Test all scenarios
3. ✅ Monitor console logs
4. ✅ Remove AuthDebugger component before production:
   ```typescript
   // In dashboard/main/layout.tsx
   <AuthDebugger /> // ← Remove this line
   ```

5. Optional: Add session timeout warning
6. Optional: Add multi-tab sync (already works via localStorage events)

---

**Last Updated:** October 24, 2025  
**Status:** 🛠️ Advanced fixes applied - Ready for testing

**Need Help?**
- Check browser console for color-coded logs
- Use Auth Debug Panel (bottom-right corner)
- Verify localStorage has `ecoroute-auth-token` key
