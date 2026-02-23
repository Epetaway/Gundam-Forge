import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Gundam Forge Brand Colors
        'gf-blue': '#1A5CFF',
        'gf-blue-dark': '#0D47D1',
        'gf-blue-light': '#E8F0FE',
        'gf-blue-muted': '#94B3F4',
        'gf-red': '#E60012',
        'gf-red-dark': '#CC0010',
        'gf-orange': '#F59E0B',
        'gf-dark': '#1A1A2E',
        'gf-light': '#F8F9FC',
        'gf-white': '#FFFFFF',
        'gf-text': '#1F2937',
        'gf-text-secondary': '#6B7280',
        'gf-text-muted': '#9CA3AF',
        'gf-border': '#E5E7EB',
        'gf-border-dark': '#D1D5DB',
        // Card Colors
        'card-white': '#FFFFFF',
        'card-blue': '#0066CC',
        'card-red': '#CC0000',
        'card-green': '#00AA44',
        'card-yellow': '#FFCC00',
        'card-black': '#333333',
        // Playmat
        'playmat-felt': '#1E3A5F',
        'playmat-surface': '#2A4A6B',
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'heading': ['Roboto', 'sans-serif'],
        'mono': ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in',
        'slide-up': 'slideUp 0.2s ease-out',
        'qty-pulse': 'qtyPulse 300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        'spin-slow': 'spin 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        qtyPulse: {
          '0%': { transform: 'scale(1)' },
          '40%': { transform: 'scale(1.25)' },
          '100%': { transform: 'scale(1)' },
        },
      },
    }
  },
  plugins: []
};

export default config;
