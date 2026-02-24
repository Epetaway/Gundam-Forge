import { Link } from 'react-router-dom';

export function GuestBanner() {
  return (
    <div className="bg-gf-warning-bg border-b border-gf-warning/20 px-4 py-2 text-center">
      <span className="text-xs text-gf-gray-700">
        Guest mode &mdash;{' '}
        <Link
          to="/auth/login"
          className="font-semibold text-gf-gray-800 underline hover:no-underline"
        >
          Sign in
        </Link>{' '}
        to save decks to the cloud.
      </span>
    </div>
  );
}
