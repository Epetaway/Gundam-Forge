import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * Wraps protected routes. Redirects to /auth/login when
 * Supabase is configured but the user is not authenticated.
 * When Supabase is NOT configured (local-only mode), allows
 * all traffic through so the app remains usable without a backend.
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);

  const supabaseConfigured =
    !!import.meta.env.VITE_SUPABASE_URL &&
    !!import.meta.env.VITE_SUPABASE_ANON_KEY;

  // If Supabase isn't configured, bypass auth entirely (local-only mode)
  if (!supabaseConfigured) {
    return <>{children}</>;
  }

  // Wait for the auth session to resolve
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gf-light">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gf-blue border-t-transparent" />
          <span className="text-sm text-gf-text-secondary">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  return <>{children}</>;
}
