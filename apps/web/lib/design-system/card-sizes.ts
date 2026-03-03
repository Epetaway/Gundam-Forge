/**
 * Standardized card sizing tokens used across all card views and components.
 * Maintains consistent GCG card aspect ratio (5:7) and responsive sizing.
 */

export const CARD_SIZE_TOKENS = {
  // Base card dimensions (official GCG card aspect ratio 5:7)
  BASE_ASPECT: '5/7' as const,

  // Responsive widths per context
  GRID: {
    mobile: 'w-full',         // 1 column on mobile
    tablet: 'w-[140px]',      // ~2-3 columns on tablet
    desktop: 'w-[160px]',     // ~4-5 columns on desktop
    wide: 'w-[180px]',        // ~6 columns on wide
  } as const,

  STACK: {
    mobile: 'w-full',
    tablet: 'w-[130px]',
    desktop: 'w-[150px]',
    wide: 'w-[170px]',
  } as const,

  LIST: {
    thumbnail: 'w-12 h-16',   // Compact thumbnail for list views
  } as const,

  MODAL: {
    mobile: 'w-40',           // Modal preview on mobile (160px)
    desktop: 'w-80',          // Modal preview on desktop (320px)
  } as const,
} as const;

export type CardSizeContext = keyof typeof CARD_SIZE_TOKENS;

/**
 * Get the appropriate card width class for a given context and breakpoint
 * @example
 * // Usage in responsive grid
 * <div className={`${getCardWidth('GRID')} sm:${getCardWidth('GRID')}`}>
 */
export function getCardWidth(context: CardSizeContext, breakpoint: 'mobile' | 'tablet' | 'desktop' | 'wide' = 'desktop'): string {
  const contextTokens = CARD_SIZE_TOKENS[context] as Record<string, string>;
  if (!contextTokens || typeof contextTokens !== 'object') return '';
  
  // Use type assertion to handle the union type safely
  const widthValue = (contextTokens as any)[breakpoint];
  return widthValue || (contextTokens as any).desktop || '';
}

/**
 * Applies consistent card layout classes (aspect ratio + sizing)
 * @example
 * // Usage
 * <img className={getCardClasses('GRID')} />
 */
export function getCardClasses(context: CardSizeContext, breakpoint: 'mobile' | 'tablet' | 'desktop' | 'wide' = 'desktop'): string {
  const width = getCardWidth(context, breakpoint);
  return `aspect-[${CARD_SIZE_TOKENS.BASE_ASPECT}] ${width}`;
}
