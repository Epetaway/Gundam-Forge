'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { canUseSupabase } from '@/lib/supabase/client';
import { sendPasswordResetEmail, updatePassword } from '@/lib/supabase/auth-helpers';

export function ResetPasswordForm(): JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [pending, setPending] = React.useState(false);

  // Check if we're in "update password" mode (user clicked email link)
  const isUpdateMode = searchParams.get('type') === 'recovery';

  const onSubmitRequest = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError('');
    setStatus('');

    if (!canUseSupabase()) {
      setStatus('Supabase credentials are not configured. Auth forms are operating in preview mode.');
      return;
    }

    setPending(true);

    try {
      const { error: resetError } = await sendPasswordResetEmail(email);
      
      if (resetError) {
        setError(resetError.message);
        return;
      }

      setStatus('Password reset email sent. Check your inbox.');
      setEmail('');
    } finally {
      setPending(false);
    }
  };

  const onSubmitUpdate = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError('');
    setStatus('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (!canUseSupabase()) {
      setStatus('Supabase credentials are not configured.');
      return;
    }

    setPending(true);

    try {
      const { error: updateError } = await updatePassword(newPassword);
      
      if (updateError) {
        setError(updateError.message);
        return;
      }

      setStatus('Password updated successfully! Redirecting...');
      setTimeout(() => {
        router.push('/profile');
      }, 2000);
    } finally {
      setPending(false);
    }
  };

  if (isUpdateMode) {
    // Update password form (after clicking email link)
    return (
      <Card className="mx-auto w-full max-w-md">
        <CardHeader>
          <CardTitle>Set New Password</CardTitle>
          <CardDescription>
            Enter your new password below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="space-y-4" onSubmit={onSubmitUpdate}>
            <Input
              autoComplete="new-password"
              id="new-password"
              label="New password"
              minLength={8}
              onChange={(event) => setNewPassword(event.target.value)}
              required
              type="password"
              value={newPassword}
            />

            <Input
              autoComplete="new-password"
              id="confirm-password"
              label="Confirm new password"
              minLength={8}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              type="password"
              value={confirmPassword}
            />

            {error ? (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                {error}
              </p>
            ) : null}

            {status ? (
              <p aria-live="polite" className="rounded-md border border-cobalt-200 bg-cobalt-50 px-3 py-2 text-sm text-cobalt-700">
                {status}
              </p>
            ) : null}

            <Button className="w-full" disabled={pending} type="submit">
              {pending ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  // Request password reset form
  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle>Reset Your Password</CardTitle>
        <CardDescription>
          Enter your email and we'll send you a reset link.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form className="space-y-4" onSubmit={onSubmitRequest}>
          <Input
            autoComplete="email"
            id="reset-email"
            label="Email"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />

          {error ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {error}
            </p>
          ) : null}

          {status ? (
            <p aria-live="polite" className="rounded-md border border-cobalt-200 bg-cobalt-50 px-3 py-2 text-sm text-cobalt-700">
              {status}
            </p>
          ) : null}

          <Button className="w-full" disabled={pending} type="submit">
            {pending ? 'Sending...' : 'Send Reset Link'}
          </Button>
        </form>

        <p className="text-sm text-steel-600">
          Remember your password?{' '}
          <Link className="font-medium text-cobalt-600 hover:text-cobalt-700" href="/auth/login">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
