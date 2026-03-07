import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { Profile } from '@/lib/api/profiles';

interface ProfileStatsProps {
  profile: Profile;
}

export function ProfileStats({ profile }: ProfileStatsProps): JSX.Element {
  const joinDate = new Date(profile.created_at).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const stats = [
    { label: 'Total Decks', value: profile.total_decks },
    { label: 'Public Decks', value: profile.public_decks },
    { label: 'Profile Views', value: profile.profile_views },
  ];

  return (
    <div className="space-y-4">
      {/* Basic Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-steel-600">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Extended Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Deck Building Insights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Favorite Archetype */}
          {profile.favorite_archetype && (
            <div>
              <p className="text-sm font-medium text-steel-600">Favorite Archetype</p>
              <Badge className="mt-1" variant="accent">
                {profile.favorite_archetype}
              </Badge>
            </div>
          )}

          {/* Most Used Colors */}
          {profile.most_used_colors.length > 0 && (
            <div>
              <p className="text-sm font-medium text-steel-600">Most Used Colors</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {profile.most_used_colors.map((color) => (
                  <Badge key={color} variant="default">
                    {color}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Join Date */}
          <div>
            <p className="text-sm font-medium text-steel-600">Member Since</p>
            <p className="mt-1 text-sm text-foreground">{joinDate}</p>
          </div>

          {/* Role Badge */}
          {profile.role !== 'user' && (
            <div>
              <p className="text-sm font-medium text-steel-600">Role</p>
              <Badge className="mt-1" variant="accent">
                {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Social Stats (placeholder for future) */}
      {(profile.follower_count > 0 || profile.following_count > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Social</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-6">
              <div>
                <p className="text-2xl font-bold text-foreground">{profile.follower_count}</p>
                <p className="text-sm text-steel-600">Followers</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{profile.following_count}</p>
                <p className="text-sm text-steel-600">Following</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
