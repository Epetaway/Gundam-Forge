
'use client';

import * as React from 'react';
import { DeckHeader } from '@/components/deck/DeckHeader';
import { DeckToolbar, type DeckToolbarViewOption } from '@/components/deck/DeckToolbar';
import { DeckListRenderer } from '@/components/deck/DeckListRenderer';
import { CardViewerModal } from '@/components/deck/CardViewerModal';
import { LayoutGrid, SlidersHorizontal, Table2 } from 'lucide-react';
import { toDeckViewItem, applyDeckFilterSort, buildDeckExportText, type DeckViewItem, type DeckDensity, type DeckSortKey, type DeckViewMode } from '@/lib/deck/sortFilter';


interface ForgeWorkbenchProps {
  cards: any[];
}


// Deck view registry (same as Deck Viewer)
const viewRegistry = [
  { id: 'image', label: 'Image', icon: LayoutGrid, Component: DeckListRenderer },
  { id: 'stacks', label: 'Stacks', icon: SlidersHorizontal, Component: DeckListRenderer },
  { id: 'text', label: 'Text', icon: Table2, Component: DeckListRenderer },
] as const;

export function DeckBuilderPage({ cards }: ForgeWorkbenchProps): JSX.Element | null {
  // Hydration guard
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => { setMounted(true); }, []);

  // Deck meta and deck state
  const [deckMeta, setDeckMeta] = React.useState({
    name: 'Untitled Deck',
    description: '',
    archetype: '',
    owner: 'You',
    colors: [] as string[],
  });
  const [deck, setDeck] = React.useState<Record<string, number>>({});

  // UI state
  const [viewMode, setViewMode] = React.useState<DeckViewMode>('image');
  const [density, setDensity] = React.useState<DeckDensity>('comfortable');
  const [query, setQuery] = React.useState('');
  const [sortBy, setSortBy] = React.useState<DeckSortKey>('name');
  const [activeCardId, setActiveCardId] = React.useState<string | null>(null);
  const [feedback, setFeedback] = React.useState('');

  // Convert deck state to DeckViewItem[]
  const initialItems: DeckViewItem[] = React.useMemo(() => {
    return Object.entries(deck)
      .filter(([, qty]) => qty > 0)
      .map(([cardId, qty]) => {
        const card = cards.find((c) => c.id === cardId);
        return card ? toDeckViewItem({ cardId, qty, card }) : null;
      })
      .filter(Boolean) as DeckViewItem[];
  }, [deck, cards]);

  // Filter/sort
  const visibleCards = React.useMemo(
    () => applyDeckFilterSort(initialItems, { query, sortBy }),
    [initialItems, query, sortBy],
  );

  React.useEffect(() => {
    if (!activeCardId) return;
    const stillVisible = visibleCards.some((card) => card.id === activeCardId);
    if (!stillVisible) setActiveCardId(null);
  }, [activeCardId, visibleCards]);

  // Handlers (customize for builder)
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

  const handleShare = React.useCallback(async () => {
    try {
      const shareUrl = window.location.href;
      if (navigator.share) {
        await navigator.share({ title: deckMeta.name, url: shareUrl });
        setFeedback('Deck link shared.');
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setFeedback('Deck link copied to clipboard.');
      }
    } catch {
      setFeedback('Unable to share this deck on this device.');
    }
    window.setTimeout(() => setFeedback(''), 1800);
  }, [deckMeta.name]);

  // Deck editing handlers (add/remove cards, update meta, etc.) would go here

  if (!mounted) return null;

  // Pick the correct view renderer (all use DeckListRenderer for now)
  const activeView = viewRegistry.find((v) => v.id === viewMode) ?? viewRegistry[0];
  const ActiveRenderer = activeView.Component;

  return (
    <div className="space-y-4 py-6">
      <DeckHeader
        archetype={deckMeta.archetype}
        colors={deckMeta.colors}
        description={deckMeta.description}
        feedback={feedback}
        name={deckMeta.name}
        onExport={handleExport}
        onShare={handleShare}
        owner={deckMeta.owner}
        totalCards={initialItems.reduce((sum, item) => sum + item.qty, 0)}
      >
        {/* Builder-specific action buttons can go here */}
      </DeckHeader>

      <DeckToolbar
        density={density}
        onDensityChange={setDensity}
        onQueryChange={setQuery}
        onSortByChange={setSortBy}
        onViewModeChange={setViewMode}
        query={query}
        sortBy={sortBy}
        viewMode={activeView.id}
        views={[...viewRegistry]}
      />

      <section aria-live="polite" className="space-y-3 pb-4">
        <p className="text-xs text-steel-600">{visibleCards.length} cards shown</p>
        <ActiveRenderer
          actions={{ onOpenCard: setActiveCardId }}
          items={visibleCards}
          selection={{ activeCardId }}
          ui={{ density, features: { collection: false, deckEdit: true }, mode: 'builder' }}
          viewMode={viewMode}
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
    </div>
  );
// End of file
}
