'use client';

import * as React from 'react';
import { LayoutGrid, SlidersHorizontal, Table2 } from 'lucide-react';
import { Container } from '@/components/layout/Container';
import { DeckHeader } from '@/components/deck/DeckHeader';
import { DeckToolbar, type DeckToolbarViewOption } from '@/components/deck/DeckToolbar';
import { ImageGridView } from '@/components/deck/views/ImageGridView';
import { StacksView } from '@/components/deck/views/StacksView';
import { TextListView } from '@/components/deck/views/TextListView';
import { CardViewerModal } from '@/components/deck/CardViewerModal';
import type { DeckViewRendererProps } from '@/components/deck/types';
import {
  applyDeckFilterSort,
  buildDeckExportText,
  type DeckDensity,
  type DeckSortKey,
  type DeckViewItem,
  type DeckViewMode,
} from '@/lib/deck/sortFilter';
import { useLocalStorageState } from '@/lib/useLocalStorageState';

interface DeckViewPageProps {
  deck: {
    id: string;
    name: string;
    description: string;
    archetype: string;
    owner: string;
    colors: string[];
  };
  initialItems: DeckViewItem[];
}

interface DeckViewRegistryEntry {
  id: DeckViewMode;
  label: string;
  icon: DeckToolbarViewOption['icon'];
  Component: (props: DeckViewRendererProps) => JSX.Element;
}

const features = {
  collection: false,
  deckEdit: false,
} as const;

const viewRegistry: DeckViewRegistryEntry[] = [
  { id: 'image', label: 'Image', icon: LayoutGrid, Component: ImageGridView },
  { id: 'stacks', label: 'Stacks', icon: SlidersHorizontal, Component: StacksView },
  { id: 'text', label: 'Text', icon: Table2, Component: TextListView },
];

export function DeckViewPage({ deck, initialItems }: DeckViewPageProps): JSX.Element {
  const [viewMode, setViewMode] = useLocalStorageState<DeckViewMode>('gundam-forge.deck.viewer.viewMode', 'image');
  const [density, setDensity] = useLocalStorageState<DeckDensity>('gundam-forge.deck.viewer.density', 'comfortable');
  const [query, setQuery] = React.useState('');
  const [sortBy, setSortBy] = React.useState<DeckSortKey>('name');
  const [activeCardId, setActiveCardId] = React.useState<string | null>(null);
  const [feedback, setFeedback] = React.useState('');

  const visibleCards = React.useMemo(
    () => applyDeckFilterSort(initialItems, { query, sortBy }),
    [initialItems, query, sortBy],
  );

  React.useEffect(() => {
    if (!activeCardId) return;
    const stillVisible = visibleCards.some((card) => card.id === activeCardId);
    if (!stillVisible) {
      setActiveCardId(null);
    }
  }, [activeCardId, visibleCards]);

  const activeView = React.useMemo(
    () => viewRegistry.find((view) => view.id === viewMode) ?? viewRegistry[0],
    [viewMode],
  );

  const handleShare = React.useCallback(async () => {
    try {
      const shareUrl = window.location.href;
      if (navigator.share) {
        await navigator.share({ title: deck.name, url: shareUrl });
        setFeedback('Deck link shared.');
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setFeedback('Deck link copied to clipboard.');
      }
    } catch {
      setFeedback('Unable to share this deck on this device.');
    }
    window.setTimeout(() => setFeedback(''), 1800);
  }, [deck.name]);

  const handleExport = React.useCallback(async () => {
    try {
      const text = buildDeckExportText(initialItems);
      await navigator.clipboard.writeText(text);
      setFeedback('Deck list copied to clipboard.');
    } catch {
      setFeedback('Unable to export to clipboard.');
    }
    window.setTimeout(() => setFeedback(''), 1800);
  }, [initialItems]);

  const ActiveRenderer = activeView.Component;

  return (
    <Container className="space-y-4 py-6" wide>
      <DeckHeader
        archetype={deck.archetype}
        colors={deck.colors}
        description={deck.description}
        feedback={feedback}
        name={deck.name}
        onExport={handleExport}
        onShare={handleShare}
        owner={deck.owner}
        totalCards={initialItems.reduce((sum, item) => sum + item.qty, 0)}
      />

      <DeckToolbar
        density={density}
        onDensityChange={setDensity}
        onQueryChange={setQuery}
        onSortByChange={setSortBy}
        onViewModeChange={setViewMode}
        query={query}
        sortBy={sortBy}
        viewMode={activeView.id}
        views={viewRegistry}
      />

      <section aria-live="polite" className="space-y-3 pb-4">
        <p className="text-xs text-steel-600">{visibleCards.length} cards shown</p>
        <ActiveRenderer
          actions={{ onOpenCard: setActiveCardId }}
          items={visibleCards}
          selection={{ activeCardId }}
          ui={{ density, features, mode: 'viewer' }}
        />
      </section>

      <CardViewerModal
        activeCardId={activeCardId}
        items={visibleCards}
        onOpenChange={(open) => {
          if (!open) setActiveCardId(null);
        }}
        onSelectCard={setActiveCardId}
      />
    </Container>
  );
}
