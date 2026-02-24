import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // Brand — references CSS custom properties from tokens.css
        'gf-blue':          'var(--gf-blue-500)',
        'gf-blue-dark':     'var(--gf-blue-600)',
        'gf-blue-light':    'var(--gf-blue-50)',
        'gf-blue-muted':    'var(--gf-blue-300)',
        'gf-red':           'var(--gf-error)',
        'gf-red-dark':      '#CC0010',
        'gf-orange':        'var(--gf-warning)',
        'gf-dark':          'var(--gf-gray-900)',
        'gf-light':         'var(--gf-bg)',
        'gf-white':         'var(--gf-surface)',
        'gf-text':          'var(--gf-text-primary)',
        'gf-text-secondary':'var(--gf-text-secondary)',
        'gf-text-muted':    'var(--gf-text-muted)',
        'gf-border':        'var(--gf-border)',
        'gf-border-dark':   'var(--gf-border-strong)',

        // Semantic
        'gf-success':    'var(--gf-success)',
        'gf-warning':    'var(--gf-warning)',
        'gf-error':      'var(--gf-error)',
        'gf-info':       'var(--gf-info)',
        'gf-success-bg': 'var(--gf-success-bg)',
        'gf-warning-bg': 'var(--gf-warning-bg)',
        'gf-error-bg':   'var(--gf-error-bg)',
        'gf-info-bg':    'var(--gf-info-bg)',

        // Surface
        'gf-surface':       'var(--gf-surface)',
        'gf-surface-inset': 'var(--gf-surface-inset)',

        // Blue scale for granular usage
        'gf-blue-50':  'var(--gf-blue-50)',
        'gf-blue-100': 'var(--gf-blue-100)',
        'gf-blue-200': 'var(--gf-blue-200)',
        'gf-blue-300': 'var(--gf-blue-300)',
        'gf-blue-400': 'var(--gf-blue-400)',
        'gf-blue-500': 'var(--gf-blue-500)',
        'gf-blue-600': 'var(--gf-blue-600)',
        'gf-blue-700': 'var(--gf-blue-700)',

        // Gray scale
        'gf-gray-50':  'var(--gf-gray-50)',
        'gf-gray-100': 'var(--gf-gray-100)',
        'gf-gray-200': 'var(--gf-gray-200)',
        'gf-gray-300': 'var(--gf-gray-300)',
        'gf-gray-400': 'var(--gf-gray-400)',
        'gf-gray-500': 'var(--gf-gray-500)',
        'gf-gray-600': 'var(--gf-gray-600)',
        'gf-gray-700': 'var(--gf-gray-700)',
        'gf-gray-800': 'var(--gf-gray-800)',
        'gf-gray-900': 'var(--gf-gray-900)',

        // Card Colors
        'card-white':  'var(--gf-card-white)',
        'card-blue':   'var(--gf-card-blue)',
        'card-red':    'var(--gf-card-red)',
        'card-green':  'var(--gf-card-green)',
        'card-yellow': 'var(--gf-card-yellow)',
        'card-black':  'var(--gf-card-black)',
        'card-purple': 'var(--gf-card-purple)',

        // Playmat
        'playmat-felt':    'var(--gf-playmat-felt)',
        'playmat-surface': 'var(--gf-playmat-surface)',
      },
      fontFamily: {
        'sans':    ['var(--gf-font-sans)'],
        'display': ['var(--gf-font-display)'],
        'heading': ['var(--gf-font-display)'],
        'mono':    ['var(--gf-font-mono)'],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      borderRadius: {
        'sm':   'var(--gf-radius-sm)',
        'md':   'var(--gf-radius-md)',
        'lg':   'var(--gf-radius-lg)',
        'xl':   'var(--gf-radius-xl)',
        '2xl':  'var(--gf-radius-2xl)',
      },
      boxShadow: {
        'xs':    'var(--gf-shadow-xs)',
        'sm':    'var(--gf-shadow-sm)',
        'md':    'var(--gf-shadow-md)',
        'lg':    'var(--gf-shadow-lg)',
        'xl':    'var(--gf-shadow-xl)',
        'focus': 'var(--gf-shadow-focus)',
        'card-hover': 'var(--gf-shadow-card-hover)',
      },
      zIndex: {
        'base':     '0',
        'raised':   '1',
        'dropdown': '10',
        'sticky':   '20',
        'header':   '30',
        'overlay':  '40',
        'modal':    '50',
        'toast':    '60',
        'tooltip':  '70',
      },
      animation: {
        'fade-in':    'gf-fade-in var(--gf-duration-normal) var(--gf-ease-out)',
        'slide-up':   'gf-slide-up var(--gf-duration-normal) var(--gf-ease-out)',
        'scale-in':   'gf-scale-in var(--gf-duration-normal) var(--gf-ease-out)',
        'qty-pulse':  'gf-qty-pulse 300ms var(--gf-ease-out)',
        'spin-slow':  'spin 2s linear infinite',
        'shimmer':    'gf-shimmer 1.5s var(--gf-ease-in-out) infinite',
      },
      keyframes: {
        'gf-fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'gf-slide-up': {
          '0%':   { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'gf-scale-in': {
          '0%':   { transform: 'scale(0.96)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'gf-qty-pulse': {
          '0%':   { transform: 'scale(1)' },
          '40%':  { transform: 'scale(1.2)' },
          '100%': { transform: 'scale(1)' },
        },
        'gf-shimmer': {
          '0%':   { 'background-position': '-200% 0' },
          '100%': { 'background-position': '200% 0' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
