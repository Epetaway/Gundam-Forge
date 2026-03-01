/**
 * Accessibility Utilities
 * ARIA labels, keyboard navigation, screen reader support
 */

/**
 * Generate ARIA label for card
 */
export function getCardAriaLabel(card: any): string {
  const name = card.cardDef?.name || card.cardId;
  const atk = card.cardDef?.atk || 0;
  const def = card.cardDef?.def || 0;
  const state = card.state || 'ready';
  const damage = card.damageMarkers || 0;

  return `${name}, Attack ${atk}, Defense ${def}, ${state}${damage > 0 ? `, ${damage} damage` : ''}`;
}

/**
 * Generate ARIA label for phase
 */
export function getPhaseAriaLabel(phase: string, turnNumber: number): string {
  const phaseNames: Record<string, string> = {
    setup: 'Setup Phase',
    draw: 'Draw Phase',
    main: 'Main Phase',
    action: 'Action Phase',
    battle: 'Battle Phase',
    end: 'End Phase',
  };

  return `Turn ${turnNumber}, ${phaseNames[phase] || phase}`;
}

/**
 * Generate ARIA label for game status
 */
export function getGameStatusAriaLabel(
  activePlayer: string,
  playerHealth: number,
  opponentHealth: number,
): string {
  return `${activePlayer}'s turn. You have ${playerHealth} health. Opponent has ${opponentHealth} health.`;
}

/**
 * Announce to screen readers (uses aria-live region)
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.setAttribute('class', 'sr-only');
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove after announcement
  setTimeout(() => {
    announcement.remove();
  }, 2000);
}

/**
 * Component for screen reader announcements
 */
export function ScreenReaderAnnouncement({ message }: { message: string }) {
  return (
    <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
      {message}
    </div>
  );
}

/**
 * Accessible button with proper ARIA attributes
 */
export function AccessibleButton({
  children,
  onClick,
  disabled,
  ariaLabel,
  ariaPressed,
  className = '',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  ariaLabel?: string;
  ariaPressed?: boolean;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      className={`px-4 py-2 rounded font-semibold transition focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${className}`}
    >
      {children}
    </button>
  );
}

/**
 * Keyboard focus visible styles
 */
export const focusStyles = `
  focus:outline-none
  focus:ring-2
  focus:ring-purple-500
  focus:ring-offset-2
  focus:ring-offset-slate-900
`;

/**
 * Skip to main content link (for accessibility)
 */
export function SkipToMainContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only absolute top-4 left-4 z-50 px-4 py-2 bg-purple-600 text-white rounded"
    >
      Skip to main content
    </a>
  );
}

/**
 * Accessible card display with proper ARIA attributes
 */
export function AccessibleCard({
  card,
  isSelected,
  onClick,
}: {
  card: any;
  isSelected?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={isSelected}
      aria-label={getCardAriaLabel(card)}
      className={`p-3 rounded border-2 transition focus:ring-2 focus:ring-purple-500 ${
        isSelected ? 'ring-2 ring-yellow-400' : ''
      }`}
    >
      <div className="text-sm font-bold">{card.cardDef?.name || card.cardId}</div>
      <div className="mt-2 text-xs">
        ⚔️ {card.cardDef?.atk || '-'} | 🛡️ {card.cardDef?.def || '-'}
      </div>
    </button>
  );
}

/**
 * Game state announcement for screen readers
 */
export function GameStateAnnouncement({
  phase,
  turn,
  activePlayer,
}: {
  phase: string;
  turn: number;
  activePlayer: string;
}) {
  return (
    <div className="sr-only" role="region" aria-label="Game state">
      <ScreenReaderAnnouncement
        message={`Turn ${turn}, ${phase} phase. ${activePlayer} is playing.`}
      />
    </div>
  );
}
