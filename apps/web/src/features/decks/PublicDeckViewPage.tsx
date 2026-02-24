import { useCallback, useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useCardsStore } from '../deckbuilder/cardsStore';
import { useDeckStore } from '../deckbuilder/deckStore';
import {
  fetchDeck,
  fetchLikeStatus,
  toggleDeckLike,
  incrementDeckView,
  type DeckRecord,
  type DeckEntryWithBoss,
} from '../../services/deckService';
import { getMetaTierForColors, TIER_LABELS, TIER_COLORS } from '../../data/metaTierList';
import { resolveCardImage, formatUnknownCardId } from '../../utils/resolveCardImage';
import type { CardDefinition } from '@gundam-forge/shared';

const COLOR_DOT: Record<string, string> = {
  Blue: 'bg-blue-500', Red: 'bg-red-500', Green: 'bg-green-500',
  White: 'bg-gray-300', Purple: 'bg-purple-500', Colorless: 'bg-gray-400',
};

interface ResolvedEntry extends DeckEntryWithBoss {
  card: CardDefinition | undefined;
}

export function PublicDeckViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const authUser = useAuthStore((s) => s.user);
  const cardsById = useCardsStore((s) => s.cardsById);
  const cloneToDeck = useDeckStore((s) => s.setDeck);

  const [deck, setDeckRecord] = useState<DeckRecord | null>(null);
  const [entries, setEntries] = useState<DeckEntryWithBoss[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [viewIncremented, setViewIncremented] = useState(false);
  const [shareToast, setShareToast] = useState(false);

  // Fetch deck data
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    fetchDeck(id)
      .then(({ deck: d, cards }) => {
        setDeckRecord(d);
        setEntries(cards);
        setLikeCount(d.like_count);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load deck'))
      .finally(() => setLoading(false));
  }, [id]);

  // Increment view count once
  useEffect(() => {
    if (!id || viewIncremented) return;
    setViewIncremented(true);
    incrementDeckView(id).catch(() => {});
  }, [id, viewIncremented]);

  // Fetch like status
  useEffect(() => {
    if (!id || !authUser) return;
    fetchLikeStatus(id).then(setLiked).catch(() => {});
  }, [id, authUser]);

  // Resolve cards
  const resolvedEntries: ResolvedEntry[] = entries.map((e) => ({
    ...e,
    card: cardsById.get(e.cardId),
  }));

  const bossCards = resolvedEntries.filter((e) => e.isBoss);
  const totalCards = resolvedEntries.reduce((s, e) => s + e.qty, 0);

  const handleToggleLike = useCallback(async () => {
    if (!id || !authUser) return;
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount((c) => c + (wasLiked ? -1 : 1));
    try {
      const result = await toggleDeckLike(id);
      setLiked(result.liked);
      setLikeCount(result.like_count);
    } catch {
      setLiked(wasLiked);
      setLikeCount((c) => c + (wasLiked ? 1 : -1));
    }
  }, [id, authUser, liked]);

  const handleCopyList = () => {
    const list = resolvedEntries
      .map((e) => `${e.qty}x ${e.card?.name ?? formatUnknownCardId(e.cardId)}${e.isBoss ? ' *' : ''}`)
      .join('\n');
    navigator.clipboard.writeText(list);
  };

  const handleExportJSON = () => {
    if (!deck) return;
    const json = JSON.stringify({
      name: deck.name,
      archetype: deck.archetype,
      entries: entries.map((e) => ({ cardId: e.cardId, qty: e.qty, isBoss: e.isBoss })),
    }, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${deck.name.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShareLink = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2000);
    } catch {
      // Fallback: use Web Share API
      if (navigator.share) {
        navigator.share({ title: deck?.name ?? 'Deck', url }).catch(() => {});
      }
    }
  };

  const handleCloneDeck = () => {
    cloneToDeck(entries.map((e) => ({ cardId: e.cardId, qty: e.qty, isBoss: e.isBoss })));
    navigate('/forge');
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gf-blue border-t-transparent" />
        </div>
      </div>
    );
  }

  if (error || !deck) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-sm text-red-700">{error || 'Deck not found'}</p>
          <Link to="/decks" className="mt-4 inline-block text-xs font-medium text-gf-blue hover:underline">
            Back to Decks
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-1.5 text-xs text-gf-text-muted">
        <Link to="/decks" className="hover:text-gf-blue transition-colors">Decks</Link>
        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="text-gf-text">{deck.name}</span>
      </nav>

      <hr className="border-t border-gf-border" />

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <h1 className="font-heading text-2xl font-bold text-gf-text">{deck.name}</h1>
            {deck.source === 'official' && (
              <span className="rounded-full bg-yellow-50 border border-yellow-200 px-2.5 py-0.5 text-[10px] font-bold text-yellow-700">
                Official GCG
              </span>
            )}
            {(() => {
              const meta = getMetaTierForColors(deck.colors);
              if (!meta) return null;
              return (
                <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${TIER_COLORS[meta.tier]}`}>
                  Tier {TIER_LABELS[meta.tier]}
                </span>
              );
            })()}
            {deck.archetype && (
              <span className="rounded-full bg-gf-blue/5 border border-gf-blue/20 px-2.5 py-0.5 text-[10px] font-medium text-gf-blue">
                {deck.archetype}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-gf-text-muted">
            {deck.source === 'official' ? (
              <span>by <strong className="text-gf-text">Official GCG</strong></span>
            ) : (
              <span>by <strong className="text-gf-text">
                {(deck as unknown as { profiles?: { display_name?: string; username?: string } }).profiles?.display_name || 'User'}
              </strong></span>
            )}
            <span>&middot;</span>
            <span>{totalCards} cards</span>
            <span>&middot;</span>
            <span>{deck.view_count} views</span>
            <span>&middot;</span>
            <span className="flex items-center gap-0.5">
              <svg className="h-3 w-3" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {likeCount} likes
            </span>
            <span>&middot;</span>
            <div className="flex items-center gap-1">
              {deck.colors.map((c) => (
                <span key={c} className={`h-2.5 w-2.5 rounded-full ${COLOR_DOT[c] || 'bg-gray-400'}`} />
              ))}
            </div>
          </div>
          {deck.description && (
            <p className="mt-2 text-sm text-gf-text-secondary max-w-lg">{deck.description}</p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {authUser && (
            <button
              onClick={handleToggleLike}
              className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors flex items-center gap-1.5 ${
                liked
                  ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                  : 'border-gf-border bg-gf-white text-gf-text hover:bg-gf-light'
              }`}
            >
              <svg className="h-3.5 w-3.5" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {liked ? 'Liked' : 'Like'}
            </button>
          )}
          <div className="relative">
            <button
              onClick={handleShareLink}
              className="rounded-lg border border-gf-border bg-gf-white px-3 py-2 text-xs font-medium text-gf-text hover:bg-gf-light transition-colors flex items-center gap-1.5"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Share
            </button>
            {shareToast && (
              <div className="absolute right-0 top-full mt-1 rounded-lg bg-gf-success px-3 py-1.5 text-xs font-medium text-white shadow-md z-toast animate-fade-in whitespace-nowrap">
                Link copied!
              </div>
            )}
          </div>
          <button
            onClick={handleCopyList}
            className="rounded-lg border border-gf-border bg-gf-white px-3 py-2 text-xs font-medium text-gf-text hover:bg-gf-light transition-colors"
          >
            Copy List
          </button>
          <button
            onClick={handleExportJSON}
            className="rounded-lg border border-gf-border bg-gf-white px-3 py-2 text-xs font-medium text-gf-text hover:bg-gf-light transition-colors"
          >
            Export JSON
          </button>
          <button
            onClick={handleCloneDeck}
            className="rounded-lg border border-gf-blue bg-gf-blue px-3 py-2 text-xs font-bold text-white hover:bg-gf-blue/90 transition-colors flex items-center gap-1.5"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Clone to Forge
          </button>
          {deck.source === 'official' && deck.source_url && (
            <a
              href={deck.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-gf-border bg-gf-white px-3 py-2 text-xs font-medium text-gf-text hover:bg-gf-light transition-colors"
            >
              View on GCG
            </a>
          )}
        </div>
      </div>

      {/* Boss Cards Section */}
      {bossCards.length > 0 && (
        <div className="mb-6 rounded-xl border border-yellow-200 bg-yellow-50/50 p-4">
          <h2 className="text-xs font-bold text-yellow-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <svg className="h-4 w-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />
            </svg>
            Key / Boss Cards
          </h2>
          <div className="flex flex-wrap gap-2">
            {bossCards.map((e) => {
              const imgSrc = e.card ? resolveCardImage(e.card) : undefined;
              return (
                <div
                  key={e.cardId}
                  className="flex items-center gap-2 rounded-lg bg-gf-white border border-yellow-200 px-3 py-2"
                >
                  {imgSrc && (
                    <img
                      src={imgSrc}
                      alt={e.card?.name ?? e.cardId}
                      className="h-10 w-7 rounded object-cover"
                    />
                  )}
                  <div>
                    <p className="text-xs font-bold text-gf-text">{e.card?.name ?? e.cardId}</p>
                    <p className="text-[10px] text-gf-text-muted">
                      {e.card?.type} &middot; Cost {e.card?.cost ?? '?'}
                      {e.card?.ap !== undefined && ` \u00B7 ${e.card.ap} AP`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Deck List + Stats */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-gf-border bg-gf-white">
            <div className="border-b border-gf-border px-4 py-3">
              <h2 className="text-sm font-bold text-gf-text">Deck List</h2>
            </div>

            {(['Unit', 'Pilot', 'Command', 'Base', 'Resource'] as const).map((type) => {
              const group = resolvedEntries.filter((e) => e.card?.type === type);
              if (group.length === 0) return null;
              const groupTotal = group.reduce((s, e) => s + e.qty, 0);
              return (
                <div key={type} className="border-b border-gf-border last:border-0">
                  <div className="flex items-center justify-between px-4 py-2 bg-gf-light/50">
                    <span className="text-[10px] font-bold text-gf-text-muted uppercase tracking-wider">{type}s</span>
                    <span className="text-[10px] text-gf-text-muted">{groupTotal}</span>
                  </div>
                  {group.map((entry) => (
                    <div key={entry.cardId} className="flex items-center justify-between px-4 py-2 hover:bg-gf-light/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="flex h-5 w-5 items-center justify-center rounded bg-gf-light text-[10px] font-bold text-gf-text">
                          {entry.qty}
                        </span>
                        {entry.isBoss && (
                          <svg className="h-3.5 w-3.5 text-yellow-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />
                          </svg>
                        )}
                        <span className="text-sm text-gf-text">{entry.card?.name ?? entry.cardId}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${COLOR_DOT[entry.card?.color ?? ''] || 'bg-gray-400'}`} />
                        <span className="text-[10px] text-gf-text-muted">Cost {entry.card?.cost ?? '?'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}

            {/* Unresolved cards (cards not in catalog) */}
            {(() => {
              const unresolved = resolvedEntries.filter((e) => !e.card);
              if (unresolved.length === 0) return null;
              return (
                <div className="border-b border-gf-border last:border-0">
                  <div className="flex items-center justify-between px-4 py-2 bg-gf-light/50">
                    <span className="text-[10px] font-bold text-gf-text-muted uppercase tracking-wider">Unknown</span>
                    <span className="text-[10px] text-gf-text-muted">{unresolved.reduce((s, e) => s + e.qty, 0)}</span>
                  </div>
                  {unresolved.map((entry) => (
                    <div key={entry.cardId} className="flex items-center justify-between px-4 py-2 hover:bg-gf-light/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="flex h-5 w-5 items-center justify-center rounded bg-gf-light text-[10px] font-bold text-gf-text">
                          {entry.qty}
                        </span>
                        <span className="text-sm text-gf-text-muted">{formatUnknownCardId(entry.cardId)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>

        {/* Stats Sidebar */}
        <div className="space-y-4">
          <div className="rounded-xl border border-gf-border bg-gf-white p-5">
            <h3 className="text-sm font-bold text-gf-text mb-3">Deck Stats</h3>
            <div className="space-y-2">
              {[
                { label: 'Total Cards', value: `${totalCards}` },
                { label: 'Colors', value: deck.colors.length > 0 ? deck.colors.join(', ') : 'None' },
                { label: 'Archetype', value: deck.archetype || 'Untagged' },
                { label: 'Source', value: deck.source === 'official' ? 'Official GCG' : 'Community' },
                { label: 'Boss Cards', value: `${bossCards.length}` },
                { label: 'Views', value: `${deck.view_count}` },
                { label: 'Likes', value: `${likeCount}` },
                { label: 'Updated', value: new Date(deck.updated_at).toLocaleDateString() },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-xs text-gf-text-muted">{label}</span>
                  <span className="text-xs font-medium text-gf-text">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Meta Tier Info */}
          {(() => {
            const meta = getMetaTierForColors(deck.colors);
            if (!meta) return null;
            return (
              <div className="rounded-xl border border-gf-border bg-gf-white p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`flex h-6 w-6 items-center justify-center rounded-md border text-[10px] font-bold ${TIER_COLORS[meta.tier]}`}>
                    {TIER_LABELS[meta.tier]}
                  </span>
                  <h3 className="text-sm font-bold text-gf-text">Meta Tier {TIER_LABELS[meta.tier]}</h3>
                </div>
                <p className="text-xs text-gf-text-secondary mb-2">{meta.summary}</p>
                {meta.highlights && (
                  <p className="text-[10px] text-gf-text-muted italic">{meta.highlights}</p>
                )}
                <p className="text-[10px] text-gf-text-muted mt-2">
                  Source: gundamcard.gg
                </p>
              </div>
            );
          })()}

          {!authUser && (
            <div className="rounded-xl border border-dashed border-gf-border bg-gf-light/50 p-5 text-center">
              <p className="text-xs text-gf-text-secondary mb-2">
                Sign in to like and duplicate decks
              </p>
              <Link to="/auth/login" className="text-xs font-medium text-gf-blue hover:underline">
                Sign In
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
