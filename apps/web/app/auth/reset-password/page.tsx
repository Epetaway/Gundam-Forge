import { Suspense } from 'react';
import { Container } from '@/components/layout/Container';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';

export default function ResetPasswordPage(): JSX.Element {
  return (
    <Container className="space-y-6 py-8">
      <PageHeader
        description="Enter your email to receive a password reset link."
        eyebrow="Authentication"
        title="Reset Password"
      />
      <Suspense fallback={
        <Card className="mx-auto w-full max-w-md">
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
            <CardDescription>Please wait.</CardDescription>
          </CardHeader>
        </Card>
      }>
        <ResetPasswordForm />
      </Suspense>
    </Container>
  );
}
