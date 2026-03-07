'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Container } from '@/components/layout/Container';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { useAuth } from '@/components/providers/AuthProvider';
import { getCurrentProfile, type Profile } from '@/lib/api/profiles';
import { ProfileStats } from '@/components/profile/ProfileStats';
import { ProfileEditForm } from '@/components/profile/ProfileEditForm';
import { ProfilePanel } from '@/app/profile/profile-panel';
import { getDecks } from '@/lib/data/decks';

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
        <div className="flex min-h-[40vh] items-center justify-center">
          <p className="text-steel-600">Loading profile...</p>
        </div>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container className="space-y-6 py-8">
        <Card>
          <CardContent className="py-8 text-center">
            <h2 className="text-xl font-semibold text-foreground">Sign in Required</h2>
            <p className="mt-2 text-sm text-steel-600">
              Please sign in to view your profile.
            </p>
            <Button asChild className="mt-4">
              <Link href="/auth/login">Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </Container>
    );
  }

  if (!profile) {
    return (
      <Container className="space-y-6 py-8">
        <Card>
          <CardContent className="py-8 text-center">
            <h2 className="text-xl font-semibold text-foreground">Profile Not Found</h2>
            <p className="mt-2 text-sm text-steel-600">
              Unable to load your profile. Please try again later.
            </p>
          </CardContent>
        </Card>
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
      {/* Profile Header */}
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
              <p className="mt-2 max-w-2xl text-sm text-foreground">{profile.bio}</p>
            )}
          </div>
        </div>
        
        {!editing && (
          <Button onClick={() => setEditing(true)} variant="secondary">
            Edit Profile
          </Button>
        )}
      </div>

      {/* Edit Form or Stats */}
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
