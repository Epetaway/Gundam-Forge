export const colorPrimitives = {
  steel: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
  cobalt: {
    300: '#93b7ff',
    400: '#5e8eff',
    500: '#2a66ff',
    600: '#1d4fe0',
    700: '#173eb1',
  },
  amber: {
    400: '#f5b642',
    500: '#d89629',
  },
  red: {
    400: '#f87171',
    500: '#dc2626',
    600: '#b91c1c',
  },
  green: {
    400: '#34d399',
    500: '#059669',
  },
} as const;

export const semanticColorTokens = {
  background: '#f4f6f8',
  foreground: '#0f172a',
  surface: '#ffffff',
  surfaceMuted: '#e2e8f0',
  accent: '#2a66ff',
  accentForeground: '#ffffff',
  border: '#d0d7e2',
  ring: '#2a66ff',
  destructive: '#dc2626',
  destructiveForeground: '#ffffff',
  success: '#059669',
  warning: '#d89629',
} as const;

export const radiusTokens = {
  none: '0px',
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  pill: '999px',
} as const;

export const elevationTokens = {
  sm: '0 1px 2px rgba(15, 23, 42, 0.08)',
  md: '0 6px 16px rgba(15, 23, 42, 0.10)',
  lg: '0 20px 40px rgba(15, 23, 42, 0.14)',
} as const;
