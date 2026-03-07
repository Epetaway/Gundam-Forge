import { supabase } from './client';
import type { User, Session } from '@supabase/supabase-js';

/**
 * Get the current authenticated user
 */
export async function getCurrentUser(): Promise<User | null> {
  if (!supabase) return null;
  
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Get the current session
 */
export async function getSession(): Promise<Session | null> {
  if (!supabase) return null;
  
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session !== null;
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<void> {
  if (!supabase) return;
  
  await supabase.auth.signOut();
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string): Promise<{ error: Error | null }> {
  if (!supabase) {
    return { error: new Error('Supabase not configured') };
  }
  
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });
  
  return { error };
}

/**
 * Update user password
 */
export async function updatePassword(newPassword: string): Promise<{ error: Error | null }> {
  if (!supabase) {
    return { error: new Error('Supabase not configured') };
  }
  
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  
  return { error };
}

/**
 * Refresh the current session
 */
export async function refreshSession(): Promise<{ session: Session | null; error: Error | null }> {
  if (!supabase) {
    return { session: null, error: new Error('Supabase not configured') };
  }
  
  const { data, error } = await supabase.auth.refreshSession();
  return { session: data.session, error };
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(callback: (event: string, session: Session | null) => void) {
  if (!supabase) return () => {};
  
  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
  
  return () => {
    subscription.unsubscribe();
  };
}
