'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Container } from '@/components/layout/Container';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase/client';

function VerifyEmailContent(): JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!supabase) {
        setStatus('error');
        setMessage('Authentication service not configured.');
        return;
      }

      // Check if there's a token in the URL (from email link)
      const token = searchParams.get('token');
      const type = searchParams.get('type');

      if (type === 'signup' || token) {
        // Email verification successful (Supabase handles this automatically)
        setStatus('success');
        setMessage('Email verified successfully! You can now sign in.');
      } else {
        // Check current auth state
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user?.email_confirmed_at) {
          setStatus('success');
          setMessage('Your email is already verified!');
        } else {
          setStatus('error');
          setMessage('Unable to verify email. Please check your verification link or request a new one.');
        }
      }
    };

    verifyEmail();
  }, [searchParams]);

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle>
          {status === 'verifying' && 'Verifying...'}
          {status === 'success' && 'Success!'}
          {status === 'error' && 'Verification Failed'}
        </CardTitle>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {status === 'success' && (
          <Button
            className="w-full"
            onClick={() => router.push('/auth/login')}
          >
            Continue to Sign In
          </Button>
        )}
        {status === 'error' && (
          <Button
            className="w-full"
            onClick={() => router.push('/auth/register')}
            variant="secondary"
          >
            Back to Registration
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default function VerifyEmailPage(): JSX.Element {
  return (
    <Container className="space-y-6 py-8">
      <PageHeader
        description="Email verification status"
        eyebrow="Authentication"
        title="Verify Email"
      />
      
      <Suspense fallback={
        <Card className="mx-auto w-full max-w-md">
          <CardHeader>
            <CardTitle>Verifying...</CardTitle>
            <CardDescription>Please wait while we verify your email.</CardDescription>
          </CardHeader>
        </Card>
      }>
        <VerifyEmailContent />
      </Suspense>
    </Container>
  );
}
