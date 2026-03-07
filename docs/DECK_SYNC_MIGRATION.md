# Deck Sync Migration Guide

## Overview

Gundam-Forge now supports automatic synchronization of locally-stored decks to your user account. When you sign in, any decks you've created while signed out will be automatically detected and you'll be prompted to sync them to your account.

## How It Works

### Local Deck Storage

Decks you create are stored in your browser's localStorage under the key `gundam-forge-local-decks`. This allows you to build and save decks without creating an account.

### Automatic Detection

When you sign in to your account:
1. The system checks for any unsynced local decks
2. If found, you'll see a sync prompt with the number of decks ready to sync
3. You can choose to sync immediately or dismiss the prompt for later

### Sync Process

When you click "Sync Now":
1. Each local deck is uploaded to your account one at a time
2. A progress bar shows the current deck being synced
3. Once synced, the deck is marked as synced locally and won't be prompted again
4. Your deck is now accessible from any device when you sign in

### Bidirectional Sync

On sign-in, the system also downloads any decks you've created on other devices, ensuring you have access to all your decks across all your devices.

## Data Structure

### LocalDeck Format

```typescript
interface LocalDeck {
  localId: string;          // Unique local identifier
  id: string;               // Deck ID (slug)
  name: string;             // Deck name
  description?: string;     // Optional description
  archetype: string;        // Deck archetype
  colors: string[];         // Color array
  entries: DeckEntry[];     // Card entries
  createdAt: string;        // ISO timestamp
  updatedAt: string;        // ISO timestamp
  synced?: boolean;         // Sync status
  syncedAt?: string;        // Sync timestamp
  serverId?: string;        // Server deck ID after sync
}
```

### Sync Status Tracking

The system maintains sync status in localStorage under `gundam-forge-sync-status`:

```typescript
interface SyncStatus {
  lastSyncAt: string;       // Last sync timestamp
  totalDecks: number;       // Total local decks
  syncedDecks: number;      // Number of synced decks
  pendingDecks: number;     // Number pending sync
}
```

## Privacy & Visibility

- All synced decks default to **private** visibility
- You can change deck visibility to public from your profile or deck settings
- Private decks are only visible to you
- Public decks can be viewed by anyone and shared via link

## Conflict Resolution

If a deck with the same name already exists in your account:
- The sync system will create a copy with a suffix (e.g., "My Deck (2)")
- Both decks will be preserved
- You can manually merge or delete duplicates if desired

## Manual Sync

You can manually trigger a sync from:
- **Profile page**: "Sync Local Decks" button (if unsynced decks exist)
- **Deck browser**: "Sync" indicator in deck list
- The system will check for unsynced decks each time you sign in

## Troubleshooting

### Sync Fails

If a deck fails to sync:
1. Check your internet connection
2. Ensure you're still signed in
3. Try the "Retry Failed" button in the sync prompt
4. Check the error message for specific details

### Missing Decks

If decks don't appear after sync:
1. Refresh the page
2. Check your profile's "My Decks" section
3. Verify the deck was successfully synced (check sync status)

### Duplicate Decks

If you see duplicate decks:
- This can happen if you created decks with the same name on different devices
- You can safely delete duplicates from your profile
- The system preserves all decks to prevent data loss

## Technical Details

### localStorage Keys

- `gundam-forge-local-decks`: Array of LocalDeck objects
- `gundam-forge-sync-status`: SyncStatus object

### Database Tables

Synced decks are stored in the following Supabase tables:
- `decks`: Main deck information
- `deck_cards`: Card entries for each deck
- Row-level security ensures only you can access your private decks

### API Functions

The sync engine provides these key functions:
- `getLocalDecks()`: Get all local decks
- `getUnsyncedDecks()`: Get decks not yet synced
- `syncDecksToServer()`: Sync all unsynced decks
- `downloadDecksFromServer()`: Download server decks to local
- `needsSync()`: Check if sync is needed

## Future Enhancements

Potential future improvements:
- Real-time sync (sync immediately on deck save)
- Conflict resolution UI for duplicate names
- Selective sync (choose which decks to sync)
- Sync history and rollback
- Cross-device sync notifications

## Migration Checklist

For existing users with local decks:
- [ ] Sign in to your account
- [ ] Review the sync prompt showing N decks ready to sync
- [ ] Click "Sync Now" to upload your local decks
- [ ] Wait for the sync to complete (progress bar will show status)
- [ ] Verify your synced decks appear in your profile
- [ ] Set visibility for your decks (public/private)
- [ ] Enjoy access to your decks from any device!

## Support

If you encounter issues with deck sync:
1. Check the browser console for error messages
2. Verify your Supabase connection is configured
3. Ensure you have a verified email address
4. Try signing out and back in
5. Clear your browser cache and try again
6. Report issues on GitHub with error details
