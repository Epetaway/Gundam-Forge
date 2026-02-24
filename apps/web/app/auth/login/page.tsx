import { Container } from '@/components/layout/Container';
import { PageHeader } from '@/components/layout/PageHeader';
import { AuthForm } from '@/components/auth/AuthForm';

export default function LoginPage(): JSX.Element {
  return (
    <Container className="space-y-6 py-8">
      <PageHeader
        description="Authentication flows use Supabase when configured and degrade gracefully when credentials are absent."
        eyebrow="Authentication"
        title="Pilot Login"
      />
      <AuthForm mode="login" />
    </Container>
  );
}
