import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Official Gundam GCG Brand Colors
        'gcg-primary': '#E60012',     // Official Bandai Red
        'gcg-dark': '#1A1A1A',        // Dark background
        'gcg-light': '#F5F5F5',       // Light background
        'gcg-text': '#333333',        // Primary text
        'gcg-border': '#E0E0E0',      // Border color
        'gcg-hover': '#CC0010',       // Hover state
        // Card Colors (from official game)
        'card-white': '#FFFFFF',
        'card-blue': '#0066CC',
        'card-red': '#CC0000',
        'card-green': '#00AA44',
        'card-yellow': '#FFCC00',
        'card-black': '#333333',
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'heading': ['Roboto', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in',
        'slide-up': 'slideUp 0.3s ease-out',
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
