import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useState } from 'react';

const NAV_ITEMS = [
  { to: '/', label: 'Home', exact: true },
  { to: '/decks', label: 'Explorer' },
  { to: '/forge', label: 'Forge' },
  { to: '/cards', label: 'Cards' },
  { to: '/news', label: 'News' },
];

export function Header() {
  const location = useLocation();
  const authUser = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const isHomePage = location.pathname === '/';

  const isActive = (path: string, exact?: boolean) =>
    exact ? location.pathname === path : location.pathname.startsWith(path);

  const handleSignOut = async () => {
    setUserMenuOpen(false);
    await signOut();
  };

  const navLinkClass = (active: boolean) => {
    if (isHomePage) {
      return [
        'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
        active
          ? 'text-white bg-white/18'
          : 'text-white/75 hover:text-white hover:bg-white/12',
      ].join(' ');
    }
    return `gf-nav-link${active ? ' text-gf-blue font-semibold' : ''}`;
  };

  return (
    <header
      className={
        isHomePage
          ? 'gf-header-transparent z-header'
          : 'sticky top-0 z-header border-b border-gf-border bg-white shadow-xs'
      }
    >
      <div className="flex h-14 items-center justify-between px-6">
        {/* Left: Logo */}
        <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${isHomePage ? 'bg-white/15' : 'bg-gf-blue'}`}>
            <span className="font-mono text-xs font-black text-white tracking-tight">
              GF
            </span>
          </div>
          <span className={`font-display text-lg font-bold hidden sm:inline ${isHomePage ? 'text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.3)]' : 'text-gf-text'}`}>
            Gundam <span className={isHomePage ? 'text-white' : 'text-gf-blue'}>Forge</span>
          </span>
        </Link>

        {/* Center: Nav */}
        <nav
          className={`hidden md:flex items-center justify-between rounded-full px-1.5 py-1 ${
            isHomePage
              ? 'bg-black/35 backdrop-blur-md'
              : 'bg-gf-gray-100/80 backdrop-blur-sm'
          }`}
          aria-label="Main navigation"
        >
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.to, item.exact);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={navLinkClass(active)}
                data-active={active}
                aria-current={active ? 'page' : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: Auth */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          {authUser ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen((o) => !o)}
                className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                  isHomePage
                    ? 'bg-white/15 text-white hover:bg-white/25'
                    : 'bg-gf-blue-50 text-gf-blue hover:bg-gf-blue hover:text-white'
                }`}
                aria-label="User menu"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path
                    d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </button>

              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-overlay"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.05),var(--gf-shadow-lg)] z-modal overflow-hidden gf-animate-fade-in">
                    <div className="border-b border-gf-border px-4 py-3">
                      <p className="text-sm font-medium text-gf-text truncate">
                        {authUser.email}
                      </p>
                    </div>
                    <div className="py-1">
                      <Link
                        to="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gf-text hover:bg-gf-gray-50 transition-colors"
                      >
                        My Profile
                      </Link>
                      <Link
                        to="/forge"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gf-text hover:bg-gf-gray-50 transition-colors"
                      >
                        My Decks
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gf-error hover:bg-gf-error-bg transition-colors"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <Link
                to="/auth/login"
                className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-all ${
                  isHomePage
                    ? 'text-white/90 border border-white/20 hover:bg-white/10 [text-shadow:0_1px_2px_rgba(0,0,0,0.2)]'
                    : 'text-gf-text-secondary shadow-[0_0_0_1px_rgba(0,0,0,0.1)] hover:shadow-[0_0_0_1px_rgba(0,0,0,0.2)] hover:text-gf-text'
                }`}
              >
                Sign In
              </Link>
              <Link
                to="/auth/register"
                className={
                  isHomePage
                    ? 'rounded-lg bg-white px-4 py-1.5 text-sm font-bold text-gray-900 hover:bg-white/90 transition-colors shadow-sm'
                    : 'gf-btn gf-btn-primary gf-btn-sm'
                }
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
