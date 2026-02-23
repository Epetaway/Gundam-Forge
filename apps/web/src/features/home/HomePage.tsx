import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useDeckStore } from '../deckbuilder/deckStore';

export function HomePage() {
  const authUser = useAuthStore((s) => s.user);
  const deckEntries = useDeckStore((s) => s.entries);

  return (
    <div className="min-h-[calc(100vh-58px)]">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gf-blue-dark">
        {/* Blueprint grid overlay */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.3) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />

        <div className="relative mx-auto max-w-6xl px-6 py-20 sm:py-28">
          <div className="flex flex-col items-center text-center">
            {/* Logo mark */}
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-gf-blue to-gf-blue-dark shadow-lg shadow-gf-blue/20">
              <span className="text-xl font-black text-white tracking-tight">GF</span>
            </div>

            <h1 className="font-heading text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
              Gundam <span className="text-gf-blue">Forge</span>
            </h1>
            <p className="mt-4 max-w-xl text-base text-white/60 sm:text-lg">
              The premier deck-building platform for the Gundam Card Game.
              Build, test, and share your strategies.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/forge"
                className="gf-btn gf-btn-primary gf-btn-cut px-6 py-3 text-sm font-bold shadow-lg shadow-gf-blue/25"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                </svg>
                Create New Deck
              </Link>
              <Link
                to="/decks"
                className="rounded-lg border border-white/20 bg-white/10 px-6 py-3 text-sm font-bold text-white backdrop-blur-sm hover:bg-white/20 transition-colors"
              >
                Explore Top Decks
              </Link>
            </div>

            {/* Quick stats */}
            <div className="mt-12 grid grid-cols-3 gap-8">
              {[
                { value: '32+', label: 'Cards' },
                { value: 'Free', label: 'To Use' },
                { value: 'Beta', label: 'Status' },
              ].map(({ value, label }) => (
                <div key={label} className="text-center">
                  <p className="text-2xl font-bold text-white">{value}</p>
                  <p className="text-xs text-white/40 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-gf-light to-transparent" />
      </section>

      {/* My Decks (if logged in) */}
      {authUser && (
        <section className="mx-auto max-w-6xl px-6 py-10">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-heading text-lg font-bold text-gf-text">My Decks</h2>
              <p className="text-xs text-gf-text-secondary mt-0.5">Your recently edited decks</p>
            </div>
            <Link to="/decks" className="text-xs font-medium text-gf-blue hover:underline">
              View All
            </Link>
          </div>
          <div className="rounded-xl border border-gf-border bg-white p-6 text-center">
            <p className="text-sm text-gf-text-secondary">
              Your saved decks will appear here.
            </p>
            <Link to="/forge" className="inline-block mt-3 text-xs font-medium text-gf-blue hover:underline">
              Create your first deck
            </Link>
          </div>
        </section>
      )}

      {/* Current Session (if guest with cards in deck) */}
      {!authUser && deckEntries.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 py-10">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-heading text-lg font-bold text-gf-text">Current Session</h2>
              <p className="text-xs text-gf-text-secondary mt-0.5">
                {deckEntries.reduce((sum, e) => sum + e.qty, 0)} cards in your local deck
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-gf-blue/20 bg-gf-blue-light/30 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gf-blue/10">
                <svg className="h-5 w-5 text-gf-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M12 8v8M8 12h8" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-gf-text">Unsaved Deck</p>
                <p className="text-[10px] text-gf-text-muted">
                  <Link to="/auth/login" className="text-gf-blue hover:underline">Sign in</Link> to save your progress
                </p>
              </div>
            </div>
            <Link to="/forge" className="gf-btn gf-btn-primary text-xs py-2 px-4">
              Continue Building
            </Link>
          </div>
        </section>
      )}

      {/* Top Decks */}
      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-heading text-lg font-bold text-gf-text">Top Decks</h2>
            <p className="text-xs text-gf-text-secondary mt-0.5">
              Most popular community decks
            </p>
          </div>
          <Link to="/decks" className="text-xs font-medium text-gf-blue hover:underline">
            View All
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { name: 'Blue Tempo Rush', colors: ['Blue'], cards: 50, author: 'Pilot_Alpha' },
            { name: 'Red Aggro Blitz', colors: ['Red'], cards: 50, author: 'Commander_Z' },
            { name: 'Green Ramp Control', colors: ['Green'], cards: 50, author: 'NewtypeAce' },
          ].map((deck) => (
            <div
              key={deck.name}
              className="rounded-xl border border-gf-border bg-white p-5 hover:border-gf-blue/30 hover:shadow-sm transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gf-light">
                  <svg className="h-4.5 w-4.5 text-gf-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M12 8v8M8 12h8" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-gf-text truncate group-hover:text-gf-blue transition-colors">
                    {deck.name}
                  </h3>
                  <p className="text-[10px] text-gf-text-muted">by {deck.author}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {deck.colors.map((c) => (
                    <span
                      key={c}
                      className={`h-3 w-3 rounded-full ${
                        { Blue: 'bg-blue-500', Red: 'bg-red-500', Green: 'bg-green-500', White: 'bg-gray-300', Purple: 'bg-purple-500' }[c] || 'bg-gray-400'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-[10px] text-gf-text-muted">{deck.cards} cards</span>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-gf-text-muted mt-4">
          Community decks coming soon. Be the first to publish yours!
        </p>
      </section>

      {/* Latest News */}
      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-heading text-lg font-bold text-gf-text">Latest News</h2>
            <p className="text-xs text-gf-text-secondary mt-0.5">Updates and announcements</p>
          </div>
          <Link to="/news" className="text-xs font-medium text-gf-blue hover:underline">
            View All
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: 'Gundam Forge Beta Launch',
              date: 'Feb 2026',
              summary: 'Welcome to the Gundam Forge beta! Build and test your Gundam TCG decks with our free online deck builder.',
              tag: 'Announcement',
            },
            {
              title: 'Deck Import Feature',
              date: 'Feb 2026',
              summary: 'You can now import deck lists from text format directly into the Forge. Paste your list and start playing.',
              tag: 'Feature',
            },
            {
              title: 'Card Database Expansion',
              date: 'Coming Soon',
              summary: 'We\'re working on expanding the card database with the latest set releases and updated pricing data.',
              tag: 'Upcoming',
            },
          ].map((news) => (
            <article
              key={news.title}
              className="rounded-xl border border-gf-border bg-white p-5 hover:border-gf-blue/30 hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex rounded bg-gf-blue-light px-1.5 py-0.5 text-[9px] font-bold text-gf-blue uppercase tracking-wide">
                  {news.tag}
                </span>
                <span className="text-[10px] text-gf-text-muted">{news.date}</span>
              </div>
              <h3 className="text-sm font-bold text-gf-text mb-1">{news.title}</h3>
              <p className="text-xs text-gf-text-secondary leading-relaxed">{news.summary}</p>
            </article>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      {!authUser && (
        <section className="mx-auto max-w-6xl px-6 pb-16 pt-6">
          <div className="rounded-2xl bg-gradient-to-r from-gf-blue to-gf-blue-dark p-8 text-center">
            <h2 className="font-heading text-xl font-bold text-white sm:text-2xl">
              Ready to build your deck?
            </h2>
            <p className="mt-2 text-sm text-white/70">
              Create an account to save decks, publish them publicly, and join the community.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/auth/register"
                className="rounded-lg bg-white px-6 py-2.5 text-sm font-bold text-gf-blue hover:bg-gray-100 transition-colors"
              >
                Create Free Account
              </Link>
              <Link
                to="/forge"
                className="rounded-lg border border-white/30 px-6 py-2.5 text-sm font-bold text-white hover:bg-white/10 transition-colors"
              >
                Try Without Account
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-gf-border bg-white py-8">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-gradient-to-br from-gf-blue to-gf-blue-dark">
                <span className="text-[8px] font-black text-white">GF</span>
              </div>
              <span className="text-xs font-bold text-gf-text">Gundam Forge</span>
              <span className="text-[10px] text-gf-text-muted ml-1">Beta</span>
            </div>
            <div className="flex items-center gap-4 text-[10px] text-gf-text-muted">
              <Link to="/cards" className="hover:text-gf-text transition-colors">Cards</Link>
              <Link to="/decks" className="hover:text-gf-text transition-colors">Decks</Link>
              <Link to="/forge" className="hover:text-gf-text transition-colors">Forge</Link>
              <Link to="/news" className="hover:text-gf-text transition-colors">News</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
