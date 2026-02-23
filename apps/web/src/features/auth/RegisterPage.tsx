import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

export function RegisterPage() {
  const signUp = useAuthStore((s) => s.signUp);
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    const err = await signUp(email, password);
    setLoading(false);

    if (err) {
      setError(err);
    } else {
      setSuccess(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gf-light gf-blueprint px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-gf-blue to-gf-blue-dark mb-3">
            <span className="text-lg font-black text-white tracking-tight">GF</span>
          </div>
          <h1 className="font-heading text-2xl font-bold text-gf-text">
            Gundam <span className="text-gf-blue">Forge</span>
          </h1>
          <p className="text-sm text-gf-text-secondary mt-1">Create your pilot account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gf-border shadow-sm p-6 space-y-4">
          <div className="gf-accent-line mb-4" />

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          )}

          {success ? (
            <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-3 text-center">
              <p className="text-sm font-medium text-green-800">Account created!</p>
              <p className="text-xs text-green-700 mt-1">Check your email to confirm, then sign in.</p>
              <Link
                to="/auth/login"
                className="inline-block mt-3 text-sm font-medium text-gf-blue hover:underline"
              >
                Go to Sign In
              </Link>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-[10px] font-medium text-gf-text-muted uppercase tracking-wide mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-gf-border bg-gf-light py-2.5 px-3 text-sm text-gf-text outline-none focus:border-gf-blue focus:bg-white focus:ring-1 focus:ring-gf-blue/30 transition-colors"
                  placeholder="pilot@gundam-forge.app"
                />
              </div>

              <div>
                <label className="block text-[10px] font-medium text-gf-text-muted uppercase tracking-wide mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-gf-border bg-gf-light py-2.5 px-3 text-sm text-gf-text outline-none focus:border-gf-blue focus:bg-white focus:ring-1 focus:ring-gf-blue/30 transition-colors"
                  placeholder="Min 6 characters"
                />
              </div>

              <div>
                <label className="block text-[10px] font-medium text-gf-text-muted uppercase tracking-wide mb-1.5">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-lg border border-gf-border bg-gf-light py-2.5 px-3 text-sm text-gf-text outline-none focus:border-gf-blue focus:bg-white focus:ring-1 focus:ring-gf-blue/30 transition-colors"
                  placeholder="Confirm password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="gf-btn gf-btn-primary gf-btn-cut w-full py-2.5 text-sm disabled:opacity-60"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>

              <p className="text-center text-xs text-gf-text-secondary">
                Already have an account?{' '}
                <Link to="/auth/login" className="text-gf-blue font-medium hover:underline">
                  Sign In
                </Link>
              </p>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
