'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListItem } from '@/components/ui/ListItem';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Layers } from 'lucide-react';

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
          <CardContent className="space-y-4">
            {decks.length === 0 ? (
              <EmptyState
                icon={<Layers className="h-5 w-5 text-text-muted" />}
                title="No decks found"
                description="You have not created any decks yet."
                cta={
                  <Button asChild variant="primary">
                    <Link href="/forge">Create Deck</Link>
                  </Button>
                }
              />
            ) : null}
            {decks.map((deck) => (
              <ListItem
                key={deck.id}
                meta={`${deck.likes} likes • ${deck.views} views`}
                title={deck.name}
                action={
                  <div className="flex items-center gap-2">
                    <Badge size="sm" variant="archetype">
                      {deck.archetype.replace(/Rogue\s*\/\s*Other|Other/gi, 'Unclassified')}
                    </Badge>
                    <Button asChild size="sm" variant="secondary">
                      <Link href={`/decks/${deck.id}`}>View</Link>
                    </Button>
                  </div>
                }
              />
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
          <CardContent className="space-y-4 py-6">
            <p className="text-sm text-steel-600">Account preferences and theme controls are managed in this panel.</p>
            <Button variant="secondary">Manage authentication</Button>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
