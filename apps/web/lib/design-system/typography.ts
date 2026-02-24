export const typography = {
  fontFamily: {
    sans: 'var(--font-sans)',
    display: 'var(--font-display)',
    mono: 'var(--font-mono)',
  },
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],
    sm: ['0.875rem', { lineHeight: '1.25rem' }],
    base: ['1rem', { lineHeight: '1.5rem' }],
    lg: ['1.125rem', { lineHeight: '1.75rem' }],
    xl: ['1.25rem', { lineHeight: '1.75rem' }],
    '2xl': ['1.5rem', { lineHeight: '2rem' }],
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
  },
  letterSpacing: {
    tight: '-0.02em',
    normal: '0',
    wide: '0.08em',
  },
} as const;
