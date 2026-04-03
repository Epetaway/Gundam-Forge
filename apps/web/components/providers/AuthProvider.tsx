'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { getUnsyncedDecks, downloadDecksFromServer } from '@/lib/deck/sync-engine';
import { DeckSyncPrompt } from '@/components/deck/DeckSyncPrompt';
import { isFeatureEnabled } from '@/lib/config/features';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps): JSX.Element {
  const authEnabled = isFeatureEnabled('authEnabled');
  const cloudDeckSyncEnabled = isFeatureEnabled('cloudDeckSyncEnabled');
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSyncPrompt, setShowSyncPrompt] = useState(false);
  const [unsyncedCount, setUnsyncedCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    if (!authEnabled) {
      setLoading(false);
      return;
    }

    // Get initial session
    const initializeAuth = async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }

      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    if (!supabase) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        // Handle sign in: check for local decks to sync and download server decks
        if (event === 'SIGNED_IN' && currentSession?.user && cloudDeckSyncEnabled) {
          // Check for unsynced local decks
          const unsyncedDecks = getUnsyncedDecks();
          if (unsyncedDecks.length > 0) {
            setUnsyncedCount(unsyncedDecks.length);
            setShowSyncPrompt(true);
          }

          // Download server decks in the background
          downloadDecksFromServer().catch(error => {
            console.error('Error downloading server decks:', error);
          });
        }

        // Refresh the page data when auth state changes
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          router.refresh();
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [router, authEnabled, cloudDeckSyncEnabled]);

  const handleSignOut = async () => {
    if (!authEnabled || !supabase) return;

    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const value = {
    user,
    session,
    loading,
    signOut: handleSignOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      {cloudDeckSyncEnabled && showSyncPrompt && (
        <DeckSyncPrompt
          deckCount={unsyncedCount}
          onComplete={() => {
            setShowSyncPrompt(false);
            router.refresh();
          }}
          onDismiss={() => setShowSyncPrompt(false)}
        />
      )}
    </AuthContext.Provider>
  );
}
