'use client';

import { useState } from 'react';
import { syncDecksToServer, type SyncProgress } from '@/lib/deck/sync-engine';
import { Button } from '@/components/ui/Button';

interface DeckSyncPromptProps {
  deckCount: number;
  onComplete: () => void;
  onDismiss: () => void;
}

export function DeckSyncPrompt({ deckCount, onComplete, onDismiss }: DeckSyncPromptProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [progress, setProgress] = useState<SyncProgress | null>(null);
  const [result, setResult] = useState<{ success: boolean; syncedCount: number; failedCount: number; errors: string[] } | null>(null);

  const handleSync = async () => {
    setIsSyncing(true);
    setResult(null);

    const syncResult = await syncDecksToServer((prog) => {
      setProgress(prog);
    });

    setResult(syncResult);
    setIsSyncing(false);

    if (syncResult.success) {
      // Auto-close after 2 seconds on success
      setTimeout(() => {
        onComplete();
      }, 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-card border border-border rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold mb-2 text-foreground">Sync Local Decks</h2>
        
        {!result && !isSyncing && (
          <>
            <p className="text-muted-foreground mb-6">
              You have {deckCount} local {deckCount === 1 ? 'deck' : 'decks'} saved on this device. 
              Would you like to sync {deckCount === 1 ? 'it' : 'them'} to your account?
            </p>
            <div className="flex gap-3">
              <Button onClick={handleSync} className="flex-1">
                Sync Now
              </Button>
              <Button onClick={onDismiss} variant="secondary" className="flex-1">
                Later
              </Button>
            </div>
          </>
        )}

        {isSyncing && progress && (
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">
                  Syncing deck {progress.current} of {progress.total}
                </span>
                <span className="text-foreground font-medium">
                  {Math.round((progress.current / progress.total) * 100)}%
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground truncate">
              {progress.deckName}
            </p>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            {result.success ? (
              <div className="text-center py-4">
                <div className="text-4xl mb-2">✓</div>
                <p className="text-foreground font-medium mb-1">
                  Successfully synced {result.syncedCount} {result.syncedCount === 1 ? 'deck' : 'decks'}!
                </p>
                <p className="text-sm text-muted-foreground">
                  Closing automatically...
                </p>
              </div>
            ) : (
              <>
                <div className="text-center py-2">
                  <p className="text-foreground font-medium mb-1">
                    Synced {result.syncedCount}, failed {result.failedCount}
                  </p>
                </div>
                {result.errors.length > 0 && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded p-3 max-h-32 overflow-y-auto">
                    <p className="text-sm font-medium text-destructive mb-2">Errors:</p>
                    <ul className="text-xs text-destructive/90 space-y-1">
                      {result.errors.map((error, i) => (
                        <li key={i}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="flex gap-3">
                  {result.failedCount > 0 && result.syncedCount < deckCount && (
                    <Button onClick={handleSync} className="flex-1">
                      Retry Failed
                    </Button>
                  )}
                  <Button 
                    onClick={onComplete} 
                    variant="secondary" 
                    className="flex-1"
                  >
                    Close
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
