'use client';

import { Container } from '@/components/layout/Container';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export default function SecurityPage(): JSX.Element {
  return (
    <Container className="space-y-6 py-8">
      <PageHeader
        description="Manage your account security settings"
        eyebrow="Security"
        title="Account Security"
      />

      <Card>
        <CardHeader>
          <CardTitle>Two-Factor Authentication</CardTitle>
          <CardDescription>
            Add an extra layer of security to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">2FA Status</p>
              <p className="text-xs text-steel-600">Coming in Phase 19.5</p>
            </div>
            <Badge variant="default">Not Enabled</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>
            Change your password or reset it if forgotten
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-steel-600">
            Use the password reset flow from the login page to change your password.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
          <CardDescription>
            View and manage devices where you're signed in
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-steel-600">
            Session management coming soon.
          </p>
        </CardContent>
      </Card>
    </Container>
  );
}
