'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { getProfileByUsername, type Profile } from '@/lib/api/profiles';
import { ProfileStats } from '@/components/profile/ProfileStats';

export default function PublicProfilePage(): JSX.Element {
  const params = useParams();
  const username = params.username as string;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      const profileData = await getProfileByUsername(username);
      setProfile(profileData);
      setLoading(false);
    };

    loadProfile();
  }, [username]);

  if (loading) {
    return (
      <Container className="space-y-6 py-8">
        <div className="flex min-h-[40vh] items-center justify-center">
          <p className="text-steel-600">Loading profile...</p>
        </div>
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
              The profile you're looking for doesn't exist or has been removed.
            </p>
            <Button asChild className="mt-4" variant="secondary">
              <Link href="/explore">Browse Decks</Link>
            </Button>
          </CardContent>
        </Card>
      </Container>
    );
  }

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
              {profile.username?.[0]?.toUpperCase() || '?'}
            </div>
          )}
          <div>
            <h1 className="text-3xl font-semibold text-foreground">
              {profile.display_name || profile.username || 'Pilot'}
            </h1>
            {profile.username && (
              <p className="text-sm text-steel-600">@{profile.username}</p>
            )}
            {profile.role !== 'user' && (
              <Badge className="mt-1" variant="accent">
                {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
              </Badge>
            )}
            {profile.bio && (
              <p className="mt-2 max-w-2xl text-sm text-foreground">{profile.bio}</p>
            )}
          </div>
        </div>
      </div>

      {/* Profile Stats */}
      <ProfileStats profile={profile} />

      {/* Public Decks Section */}
      <Card>
        <CardContent className="py-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Public Decks</h2>
          {profile.public_decks === 0 ? (
            <p className="text-sm text-steel-600">
              {profile.display_name || profile.username} hasn't published any decks yet.
            </p>
          ) : (
            <p className="text-sm text-steel-600">
              {profile.public_decks} public deck{profile.public_decks === 1 ? '' : 's'} available
            </p>
          )}
          {/* TODO: In Phase 19.4, load and display actual public decks here */}
        </CardContent>
      </Card>
    </Container>
  );
}
