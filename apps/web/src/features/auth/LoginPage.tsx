import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

export function LoginPage() {
  const signIn = useAuthStore((s) => s.signIn);
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const err = await signIn(email, password);
    setLoading(false);

    if (err) {
      setError(err);
    } else {
      navigate('/builder');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gf-gray-50 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-gf-blue to-gf-blue-dark mb-3">
            <span className="text-lg font-black text-white tracking-tight">GF</span>
          </div>
          <h1 className="font-heading text-2xl font-bold text-gf-text">
            Gundam <span className="text-gf-blue">Forge</span>
          </h1>
          <p className="text-sm text-gf-text-secondary mt-1">Sign in to your workstation</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-[0_0_0_1px_rgba(0,0,0,0.05)] shadow-sm p-6 space-y-4">

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gf-gray-700 mb-1.5">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg bg-white py-2.5 px-3 text-sm text-gf-text outline-none shadow-[0_0_0_1px_rgba(0,0,0,0.1)] focus:shadow-[0_0_0_2px_var(--gf-blue-500)] transition-shadow placeholder:text-gf-text-muted"
              placeholder="pilot@gundam-forge.app"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gf-gray-700 mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg bg-white py-2.5 px-3 text-sm text-gf-text outline-none shadow-[0_0_0_1px_rgba(0,0,0,0.1)] focus:shadow-[0_0_0_2px_var(--gf-blue-500)] transition-shadow placeholder:text-gf-text-muted"
              placeholder="Enter password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="gf-btn gf-btn-primary w-full py-2.5 text-sm disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <p className="text-center text-xs text-gf-text-secondary">
            No account?{' '}
            <Link to="/auth/register" className="text-gf-blue font-medium hover:underline">
              Register
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
