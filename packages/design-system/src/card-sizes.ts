/**
 * Standardized card sizing tokens used across all card views and components.
 * Maintains consistent GCG card aspect ratio (5:7) and responsive sizing.
 */

export const CARD_SIZE_TOKENS = {
  BASE_ASPECT: '5/7' as const,

  GRID: {
    mobile: 'w-full',
    tablet: 'w-[140px]',
    desktop: 'w-[160px]',
    wide: 'w-[180px]',
  } as const,

  STACK: {
    mobile: 'w-full',
    tablet: 'w-[130px]',
    desktop: 'w-[150px]',
    wide: 'w-[170px]',
  } as const,

  LIST: {
    thumbnail: 'w-12 h-16',
  } as const,

  MODAL: {
    mobile: 'w-40',
    desktop: 'w-80',
  } as const,
} as const;

export type CardSizeContext = keyof typeof CARD_SIZE_TOKENS;

export function getCardWidth(
  context: CardSizeContext,
  breakpoint: 'mobile' | 'tablet' | 'desktop' | 'wide' = 'desktop',
): string {
  const contextTokens = CARD_SIZE_TOKENS[context] as Record<string, string>;
  if (!contextTokens || typeof contextTokens !== 'object') return '';

  const widthValue = contextTokens[breakpoint];
  return widthValue || contextTokens.desktop || '';
}

export function getCardClasses(
  context: CardSizeContext,
  breakpoint: 'mobile' | 'tablet' | 'desktop' | 'wide' = 'desktop',
): string {
  const width = getCardWidth(context, breakpoint);
  return `aspect-[${CARD_SIZE_TOKENS.BASE_ASPECT}] ${width}`;
}
