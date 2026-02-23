import { Link, useParams } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

export function PublicDeckViewPage() {
  const { id } = useParams<{ id: string }>();
  const authUser = useAuthStore((s) => s.user);

  // Placeholder: In production this would fetch from Supabase
  const deck = {
    id: id || 'unknown',
    name: 'Blue Tempo Rush',
    author: 'Pilot_Alpha',
    description: 'A fast-paced blue deck focused on tempo advantage and efficient unit deployment.',
    cards: 50,
    colors: ['Blue'],
    is_public: true,
    created_at: '2026-02-15',
    updated_at: '2026-02-20',
    views: 342,
    validation: { isValid: true, errors: [] as string[], warnings: [] as string[] },
    entries: [
      { name: 'Strike Gundam', type: 'Unit', qty: 4, cost: 3, color: 'Blue' },
      { name: 'Freedom Gundam', type: 'Unit', qty: 3, cost: 5, color: 'Blue' },
      { name: 'Kira Yamato', type: 'Pilot', qty: 4, cost: 2, color: 'Blue' },
      { name: 'Strategic Retreat', type: 'Command', qty: 4, cost: 1, color: 'Blue' },
    ],
  };

  const handleCopyList = () => {
    const list = deck.entries.map((e) => `${e.qty}x ${e.name}`).join('\n');
    navigator.clipboard.writeText(list);
  };

  const handleExportJSON = () => {
    const json = JSON.stringify({ name: deck.name, entries: deck.entries }, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${deck.name.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const COLOR_DOT: Record<string, string> = {
    Blue: 'bg-blue-500', Red: 'bg-red-500', Green: 'bg-green-500',
    White: 'bg-gray-300', Purple: 'bg-purple-500', Colorless: 'bg-gray-400',
  };

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

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="font-heading text-2xl font-bold text-gf-text">{deck.name}</h1>
            {deck.validation.isValid && (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-50 border border-green-200 px-2 py-0.5 text-[10px] font-bold text-green-700">
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Valid
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-gf-text-muted">
            <span>by <strong className="text-gf-text">{deck.author}</strong></span>
            <span>·</span>
            <span>{deck.cards} cards</span>
            <span>·</span>
            <span>{deck.views} views</span>
            <span>·</span>
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
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyList}
            className="rounded-lg border border-gf-border bg-white px-3 py-2 text-xs font-medium text-gf-text hover:bg-gf-light transition-colors"
          >
            <svg className="inline h-3.5 w-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Copy List
          </button>
          <button
            onClick={handleExportJSON}
            className="rounded-lg border border-gf-border bg-white px-3 py-2 text-xs font-medium text-gf-text hover:bg-gf-light transition-colors"
          >
            <svg className="inline h-3.5 w-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Export JSON
          </button>
          <Link
            to={`/forge?import=${deck.id}`}
            className="gf-btn gf-btn-primary text-xs py-2 px-4"
          >
            Open in Forge
          </Link>
          {authUser && (
            <button className="gf-btn gf-btn-primary text-xs py-2 px-3">
              Duplicate
            </button>
          )}
        </div>
      </div>

      {/* Deck List */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-gf-border bg-white">
            <div className="border-b border-gf-border px-4 py-3">
              <h2 className="text-sm font-bold text-gf-text">Deck List</h2>
            </div>

            {/* Group by type */}
            {(['Unit', 'Pilot', 'Command', 'Base', 'Resource'] as const).map((type) => {
              const group = deck.entries.filter((e) => e.type === type);
              if (group.length === 0) return null;
              const groupTotal = group.reduce((s, e) => s + e.qty, 0);
              return (
                <div key={type} className="border-b border-gf-border last:border-0">
                  <div className="flex items-center justify-between px-4 py-2 bg-gf-light/50">
                    <span className="text-[10px] font-bold text-gf-text-muted uppercase tracking-wider">{type}s</span>
                    <span className="text-[10px] text-gf-text-muted">{groupTotal}</span>
                  </div>
                  {group.map((entry) => (
                    <div key={entry.name} className="flex items-center justify-between px-4 py-2 hover:bg-gf-light/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="flex h-5 w-5 items-center justify-center rounded bg-gf-light text-[10px] font-bold text-gf-text">
                          {entry.qty}
                        </span>
                        <span className="text-sm text-gf-text">{entry.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${COLOR_DOT[entry.color] || 'bg-gray-400'}`} />
                        <span className="text-[10px] text-gf-text-muted">Cost {entry.cost}</span>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        {/* Analytics Snapshot */}
        <div className="space-y-4">
          <div className="rounded-xl border border-gf-border bg-white p-5">
            <h3 className="text-sm font-bold text-gf-text mb-3">Deck Stats</h3>
            <div className="space-y-2">
              {[
                { label: 'Total Cards', value: `${deck.cards}` },
                { label: 'Colors', value: deck.colors.join(', ') },
                { label: 'Status', value: deck.validation.isValid ? 'Valid' : 'Invalid' },
                { label: 'Created', value: deck.created_at },
                { label: 'Updated', value: deck.updated_at },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-xs text-gf-text-muted">{label}</span>
                  <span className="text-xs font-medium text-gf-text">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {!authUser && (
            <div className="rounded-xl border border-dashed border-gf-border bg-gf-light/50 p-5 text-center">
              <p className="text-xs text-gf-text-secondary mb-2">
                Sign in to duplicate and edit this deck
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
