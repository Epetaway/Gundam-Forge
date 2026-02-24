import type { Config } from 'tailwindcss';
import { designTheme } from './lib/design-system/theme';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: designTheme.colors,
      spacing: designTheme.spacing,
      borderRadius: designTheme.radii,
      boxShadow: designTheme.shadows,
      fontFamily: designTheme.typography.fontFamily,
      fontSize: designTheme.typography.fontSize,
      letterSpacing: designTheme.typography.letterSpacing,
      transitionDuration: designTheme.motion.duration,
      transitionTimingFunction: designTheme.motion.easing,
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'fade-out': {
          from: { opacity: '1' },
          to: { opacity: '0' },
        },
        'zoom-in': {
          from: { opacity: '0', transform: 'translate(-50%, -47%) scale(0.97)' },
          to: { opacity: '1', transform: 'translate(-50%, -50%) scale(1)' },
        },
        'zoom-out': {
          from: { opacity: '1', transform: 'translate(-50%, -50%) scale(1)' },
          to: { opacity: '0', transform: 'translate(-50%, -47%) scale(0.97)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 160ms ease-out',
        'fade-out': 'fade-out 140ms ease-in',
        'zoom-in': 'zoom-in 200ms ease-out',
        'zoom-out': 'zoom-out 140ms ease-in',
      },
      maxWidth: {
        content: '80rem',
        reading: '65ch',
      },
      gridTemplateColumns: {
        forge: 'minmax(0, 1fr) minmax(18rem, 24rem)',
      },
    },
  },
  plugins: [],
};

export default config;
