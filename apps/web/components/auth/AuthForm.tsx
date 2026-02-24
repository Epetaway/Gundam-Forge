'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { canUseSupabase, supabase } from '@/lib/supabase/client';

interface AuthFormProps {
  mode: 'login' | 'register';
}

export function AuthForm({ mode }: AuthFormProps): JSX.Element {
  const router = useRouter();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [pending, setPending] = React.useState(false);

  const isLogin = mode === 'login';

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError('');
    setStatus('');

    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!canUseSupabase() || !supabase) {
      setStatus('Supabase credentials are not configured. Auth forms are operating in preview mode.');
      return;
    }

    setPending(true);

    try {
      if (isLogin) {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) {
          setError(signInError.message);
          return;
        }
      } else {
        const { error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) {
          setError(signUpError.message);
          return;
        }
        setStatus('Account created. Check your email for confirmation.');
      }

      router.push('/profile');
    } finally {
      setPending(false);
    }
  };

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle>{isLogin ? 'Sign in' : 'Create account'}</CardTitle>
        <CardDescription>
          {isLogin
            ? 'Access saved builds and profile analytics.'
            : 'Register to persist decks and share links.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form className="space-y-4" onSubmit={onSubmit}>
          <Input
            autoComplete="email"
            id="auth-email"
            label="Email"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />

          <Input
            autoComplete={isLogin ? 'current-password' : 'new-password'}
            id="auth-password"
            label="Password"
            minLength={8}
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />

          {!isLogin ? (
            <Input
              autoComplete="new-password"
              id="auth-confirm-password"
              label="Confirm password"
              minLength={8}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              type="password"
              value={confirmPassword}
            />
          ) : null}

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
            {pending ? 'Working...' : isLogin ? 'Sign in' : 'Create account'}
          </Button>
        </form>

        <p className="text-sm text-steel-600">
          {isLogin ? 'Need an account?' : 'Already registered?'}{' '}
          <Link className="font-medium text-cobalt-600 hover:text-cobalt-700" href={isLogin ? '/auth/register' : '/auth/login'}>
            {isLogin ? 'Register' : 'Sign in'}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
