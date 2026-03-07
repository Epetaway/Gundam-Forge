import { Container } from '@/components/layout/Container';
import { PageHeader } from '@/components/layout/PageHeader';
import { AuthForm } from '@/components/auth/AuthForm';

export default function RegisterPage(): JSX.Element {
  return (
    <Container className="space-y-6 py-8">
      <PageHeader
        description="New accounts unlock persistent deck storage and publish controls."
        eyebrow="Authentication"
        title="Create Pilot Account"
      />
      <AuthForm mode="register" />
    </Container>
  );
}
