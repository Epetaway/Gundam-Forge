import { colorPrimitives, elevationTokens, radiusTokens, semanticColorTokens } from './tokens';
import { motion } from './motion';
import { spacing } from './spacing';
import { typography } from './typography';

export const designTheme = {
  colors: {
    background: 'hsl(var(--background))',
    foreground: 'hsl(var(--foreground))',
    surface: 'hsl(var(--surface))',
    'surface-muted': 'hsl(var(--surface-muted))',
    'surface-elevated': 'hsl(var(--surface-elevated))',
    'surface-interactive': 'hsl(var(--surface-interactive))',
    border: 'hsl(var(--border))',
    ring: 'hsl(var(--ring))',
    accent: {
      DEFAULT: 'hsl(var(--accent))',
      foreground: 'hsl(var(--accent-foreground))',
    },
    destructive: {
      DEFAULT: 'hsl(var(--destructive))',
      foreground: 'hsl(var(--destructive-foreground))',
    },
    success: 'hsl(var(--success))',
    warning: 'hsl(var(--warning))',
    steel: colorPrimitives.steel,
    cobalt: colorPrimitives.cobalt,
  },
  spacing,
  radii: {
    none: radiusTokens.none,
    sm: radiusTokens.sm,
    md: radiusTokens.md,
    lg: radiusTokens.lg,
    xl: radiusTokens.xl,
    full: radiusTokens.pill,
  },
  shadows: {
    sm: elevationTokens.sm,
    md: elevationTokens.md,
    lg: elevationTokens.lg,
  },
  typography,
  motion,
} as const;

const hexToHslToken = (hex: string): string => {
  const raw = hex.replace('#', '');
  const full = raw.length === 3 ? raw.split('').map((char) => `${char}${char}`).join('') : raw;
  const int = Number.parseInt(full, 16);
  const r = ((int >> 16) & 255) / 255;
  const g = ((int >> 8) & 255) / 255;
  const b = (int & 255) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const lightness = (max + min) / 2;

  let hue = 0;
  if (delta !== 0) {
    if (max === r) hue = ((g - b) / delta) % 6;
    else if (max === g) hue = (b - r) / delta + 2;
    else hue = (r - g) / delta + 4;
    hue *= 60;
    if (hue < 0) hue += 360;
  }

  const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));
  return `${Math.round(hue)} ${Math.round(saturation * 100)}% ${Math.round(lightness * 100)}%`;
};

export const semanticHslTokens = {
  background: hexToHslToken(semanticColorTokens.background),
  foreground: hexToHslToken(semanticColorTokens.foreground),
  surface: hexToHslToken(semanticColorTokens.surface),
  surfaceMuted: hexToHslToken(semanticColorTokens.surfaceMuted),
  accent: hexToHslToken(semanticColorTokens.accent),
  accentForeground: hexToHslToken(semanticColorTokens.accentForeground),
  border: hexToHslToken(semanticColorTokens.border),
  ring: hexToHslToken(semanticColorTokens.ring),
  destructive: hexToHslToken(semanticColorTokens.destructive),
  destructiveForeground: hexToHslToken(semanticColorTokens.destructiveForeground),
  success: hexToHslToken(semanticColorTokens.success),
  warning: hexToHslToken(semanticColorTokens.warning),
} as const;
