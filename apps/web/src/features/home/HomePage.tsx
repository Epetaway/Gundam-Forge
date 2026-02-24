import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, FreeMode } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/free-mode';
import { useAuthStore } from '../../stores/authStore';
import { fetchPublicDecks, type PublicDeckRecord } from '../../services/deckService';
import { TopDeckCard } from '../../components/deck/TopDeckCard';
import heroBg from '/hero-bg.png?url';

export function HomePage() {
  const navigate = useNavigate();
  const authUser = useAuthStore((s) => s.user);

  const [searchQuery, setSearchQuery] = useState('');
  const [decks, setDecks] = useState<PublicDeckRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchPublicDecks({ limit: 12, orderBy: 'view_count' })
      .then((data) => { if (!cancelled) setDecks(data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (trimmed) {
      navigate(`/decks?q=${encodeURIComponent(trimmed)}`);
    } else {
      navigate('/decks');
    }
  };

  return (
    <div>
      {/* ============================================================
         HERO — Full viewport storefront
         ============================================================ */}
      <section className="relative h-screen w-full overflow-hidden">
        <img
          src={heroBg}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />

        {/* Multi-layer gradient: darken top (header) + bottom (controls) */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/70" />

        {/* Bottom content */}
        <div className="relative flex h-full flex-col items-center justify-end pb-14 sm:pb-20">
          {/* Search */}
          <form onSubmit={handleSearch} className="w-full max-w-md px-6 mb-4">
            <div className="relative">
              <svg
                className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search community decks..."
                className="w-full rounded-lg border border-white/15 bg-black/40 py-3 pl-11 pr-4 text-sm text-white placeholder-white/40 backdrop-blur-xl outline-none focus:border-white/30 focus:bg-black/50 transition-all"
              />
            </div>
          </form>

          {/* Action buttons */}
          <div className="flex items-center gap-3 px-6">
            <Link
              to="/forge"
              className="gf-btn gf-btn-primary px-6 py-2.5 text-sm font-bold shadow-lg shadow-black/20"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              </svg>
              Create Deck
            </Link>
            <Link
              to="/decks"
              className="rounded-lg border border-white/20 bg-white/8 px-6 py-2.5 text-sm font-medium text-white/90 backdrop-blur-sm hover:bg-white/15 hover:border-white/30 transition-all"
            >
              Browse Decks
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================
         BELOW THE FOLD
         ============================================================ */}

      {/* Dark transition strip */}
      <div className="bg-gradient-to-b from-gray-900 to-gray-50 h-24" />

      {/* Community Decks */}
      <section className="bg-gray-50 pb-16">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="font-heading text-xl font-bold text-gf-text">
                Community Decks
              </h2>
              <p className="text-xs text-gf-text-secondary mt-1">
                Top builds from the community
              </p>
            </div>
            <Link
              to="/decks"
              className="text-xs font-medium text-gf-blue hover:text-gf-blue-dark transition-colors"
            >
              View all &rarr;
            </Link>
          </div>

          {loading ? (
            <div className="flex gap-4 overflow-hidden">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="w-[150px] flex-shrink-0 rounded-xl bg-gf-border/20 animate-pulse" style={{ aspectRatio: '5/7' }} />
              ))}
            </div>
          ) : decks.length > 0 ? (
            <div className="gf-deck-swiper">
              <Swiper
                modules={[Navigation, FreeMode]}
                spaceBetween={12}
                slidesPerView="auto"
                freeMode={{ enabled: true, sticky: false }}
                navigation
              >
                {decks.map((deck) => (
                  <SwiperSlide key={deck.id} style={{ width: '150px' }}>
                    <TopDeckCard deck={deck} />
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          ) : (
            <div className="rounded-xl bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.05)] shadow-sm p-10 text-center">
              <svg className="mx-auto mb-2 h-8 w-8 text-gf-border" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M12 8v8M8 12h8" strokeLinecap="round" />
              </svg>
              <p className="text-sm font-medium text-gf-text">No public decks yet</p>
              <p className="text-[11px] text-gf-text-muted mt-1">
                Be the first to publish yours
              </p>
              <Link to="/forge" className="inline-block mt-3 gf-btn gf-btn-primary gf-btn-sm">
                Create a Deck
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Guest CTA */}
      {!authUser && (
        <section className="bg-gray-50 pb-16">
          <div className="mx-auto max-w-5xl px-6">
            <div className="rounded-2xl bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.05)] shadow-sm p-8 text-center">
              <h2 className="text-lg font-bold text-gf-text">
                Ready to build?
              </h2>
              <p className="mt-1.5 text-sm text-gf-text-secondary">
                Create a free account to save decks, share them, and join the community.
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                <Link to="/auth/register" className="gf-btn gf-btn-primary px-6 py-2.5 text-sm font-bold">
                  Create Free Account
                </Link>
                <Link
                  to="/forge"
                  className="gf-btn gf-btn-secondary px-6 py-2.5 text-sm font-bold"
                >
                  Try Without Account
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-gf-border bg-gf-gray-50 py-6">
        <div className="mx-auto max-w-5xl px-6">
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-5 w-5 items-center justify-center rounded bg-gf-blue">
                <span className="text-[7px] font-black text-white">GF</span>
              </div>
              <span className="text-xs font-bold text-gf-text">Gundam Forge</span>
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
