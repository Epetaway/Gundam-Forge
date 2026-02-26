export const colorPrimitives = {
  steel: {
    50: '#141b26',
    100: '#18202d',
    200: '#202a3a',
    300: '#2a3444',
    400: '#3a475c',
    500: '#7d8ea8',
    600: '#9aa9bf',
    700: '#bac6d8',
    800: '#d5ddeb',
    900: '#e6edf8',
  },
  cobalt: {
    300: '#60a5fa',
    400: '#4c90fa',
    500: '#3b82f6',
    600: '#2f6fd8',
    700: '#2558aa',
  },
  amber: {
    400: '#f59e0b',
    500: '#d97706',
  },
  red: {
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
  },
  green: {
    400: '#34d399',
    500: '#22c55e',
  },
} as const;

export const semanticColorTokens = {
  background: '#0e1116',
  foreground: '#e6edf8',
  surface: '#151a22',
  surfaceMuted: '#1c2330',
  accent: '#3b82f6',
  accentForeground: '#ffffff',
  border: '#2a3444',
  ring: '#3b82f6',
  destructive: '#ef4444',
  destructiveForeground: '#ffffff',
  success: '#22c55e',
  warning: '#f59e0b',
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
  sm: '0 2px 6px rgba(2, 6, 23, 0.28)',
  md: '0 12px 28px rgba(2, 6, 23, 0.38)',
  lg: '0 24px 48px rgba(2, 6, 23, 0.52)',
} as const;
