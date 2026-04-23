'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/layout/PageHeader';
import { useAuth } from '@/components/providers/AuthProvider';
import { getCurrentProfile, type Profile } from '@/lib/api/profiles';
import { ProfileStats } from '@/components/profile/ProfileStats';
import { ProfileEditForm } from '@/components/profile/ProfileEditForm';
import { ProfilePanel } from '@/app/profile/profile-panel';
import { getDecks } from '@/lib/data/decks';
import { UserCircle2 } from 'lucide-react';

export default function ProfilePage(): JSX.Element {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      const profileData = await getCurrentProfile();
      setProfile(profileData);
      setLoading(false);
    };

    if (!authLoading) {
      loadProfile();
    }
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <Container className="space-y-6 py-8">
        <PageHeader
          description="Deck portfolio, activity, and account controls."
          eyebrow="Profile"
          title="Pilot Profile"
        />
        <div className="space-y-4" role="status" aria-live="polite">
          <div className="h-24 animate-pulse rounded-lg border border-border bg-surface-muted" />
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={`profile-loading-${index}`} className="h-28 animate-pulse rounded-lg border border-border bg-surface-muted" />
            ))}
          </div>
        </div>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container className="space-y-6 py-8">
        <PageHeader
          description="Deck portfolio, activity, and account controls."
          eyebrow="Profile"
          title="Pilot Profile"
        />
        <EmptyState
          icon={<UserCircle2 className="h-5 w-5 text-text-muted" />}
          title="Sign in required"
          description="Please sign in to view your profile."
          cta={
            <Button asChild>
              <Link href="/auth/login">Sign In</Link>
            </Button>
          }
        />
      </Container>
    );
  }

  if (!profile) {
    return (
      <Container className="space-y-6 py-8">
        <PageHeader
          description="Deck portfolio, activity, and account controls."
          eyebrow="Profile"
          title="Pilot Profile"
        />
        <EmptyState
          icon={<UserCircle2 className="h-5 w-5 text-text-muted" />}
          title="Profile not found"
          description="Unable to load your profile. Please try again later."
        />
      </Container>
    );
  }

  const decks = getDecks();

  const handleEditComplete = async () => {
    setEditing(false);
    // Reload profile data
    const updatedProfile = await getCurrentProfile();
    if (updatedProfile) {
      setProfile(updatedProfile);
    }
    router.refresh();
  };

  return (
    <Container className="space-y-6 py-8">
      <PageHeader
        description="Deck portfolio, activity, and account controls."
        eyebrow="Profile"
        title="Pilot Profile"
      />

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          {profile.avatar_url ? (
            <img
              alt={profile.display_name || profile.username || 'Avatar'}
              className="h-20 w-20 rounded-full object-cover"
              src={profile.avatar_url}
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-cobalt-500/25 text-2xl font-semibold text-cobalt-300">
              {(profile.username || user.email)?.[0]?.toUpperCase() || '?'}
            </div>
          )}
          <div>
            <h1 className="text-3xl font-semibold text-foreground">
              {profile.display_name || profile.username || 'Pilot'}
            </h1>
            {profile.username && (
              <p className="text-sm text-steel-600">@{profile.username}</p>
            )}
            {profile.bio && (
              <p className="mt-2 max-w-reading text-sm text-foreground">{profile.bio}</p>
            )}
          </div>
        </div>
        
        {!editing && (
          <Button onClick={() => setEditing(true)} variant="secondary">
            Edit Profile
          </Button>
        )}
      </div>

      {editing ? (
        <ProfileEditForm
          onCancel={() => setEditing(false)}
          onSave={handleEditComplete}
          profile={profile}
        />
      ) : (
        <>
          <ProfileStats profile={profile} />
          
          <ProfilePanel decks={decks.map((deck) => ({
            id: deck.id,
            name: deck.name,
            likes: deck.likes,
            views: deck.views,
            archetype: deck.archetype,
          }))} />
        </>
      )}
    </Container>
  );
}
