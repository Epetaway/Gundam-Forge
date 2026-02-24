'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';

interface ProfileDeckSummary {
  id: string;
  name: string;
  likes: number;
  views: number;
  archetype: string;
}

interface ProfilePanelProps {
  decks: ProfileDeckSummary[];
}

export function ProfilePanel({ decks }: ProfilePanelProps): JSX.Element {
  return (
    <Tabs className="space-y-4" defaultValue="decks">
      <TabsList>
        <TabsTrigger value="decks">My Decks</TabsTrigger>
        <TabsTrigger value="activity">Activity</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>

      <TabsContent value="decks">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Deck Portfolio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {decks.map((deck) => (
              <div className="flex items-center justify-between rounded-md border border-border bg-steel-50 px-3 py-2" key={deck.id}>
                <div>
                  <p className="font-medium">{deck.name}</p>
                  <p className="text-xs text-steel-600">{deck.likes} likes • {deck.views} views</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="accent">{deck.archetype}</Badge>
                  <Button asChild size="sm" variant="secondary">
                    <Link href={`/decks/${deck.id}`}>View</Link>
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="activity">
        <Card>
          <CardContent className="space-y-2 py-6 text-sm text-steel-600">
            <p>Published deck updates are tracked here.</p>
            <p>Team comments and testing notes can be integrated via Supabase events.</p>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="settings">
        <Card>
          <CardContent className="space-y-3 py-6">
            <p className="text-sm text-steel-600">Account preferences and theme controls are managed in this panel.</p>
            <Button variant="secondary">Manage authentication</Button>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
