import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Gundam Forge Brand Colors
        'gf-blue': '#1A5CFF',         // Primary brand blue
        'gf-blue-dark': '#0D47D1',    // Darker blue for hover
        'gf-blue-light': '#E8F0FE',   // Light blue background
        'gf-red': '#E60012',          // Bandai Red accent
        'gf-red-dark': '#CC0010',     // Darker red for hover
        'gf-orange': '#F59E0B',       // Warning/accent orange
        'gf-dark': '#1A1A2E',         // Dark background
        'gf-light': '#F8F9FC',        // Light page background
        'gf-white': '#FFFFFF',        // Card/panel background
        'gf-text': '#1F2937',         // Primary text
        'gf-text-secondary': '#6B7280', // Secondary text
        'gf-border': '#E5E7EB',       // Border color
        'gf-border-dark': '#D1D5DB',  // Darker border
        // Card Colors (from official game)
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
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in',
        'slide-up': 'slideUp 0.2s ease-out',
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
      },
    }
  },
  plugins: []
};

export default config;
