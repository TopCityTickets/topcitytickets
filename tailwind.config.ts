import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'neon-cyan': 'var(--neon-cyan)',
        'neon-pink': 'var(--neon-pink)',
        'neon-yellow': 'var(--neon-yellow)',
        'neon-purple': 'var(--neon-purple)',
        'neon-green': 'var(--neon-green)',
        'neon-blue': 'var(--neon-blue)',
      },
      keyframes: {
        'neon-pulse': {
          '0%, 100%': { 
            filter: 'drop-shadow(0 0 8px currentColor) drop-shadow(0 0 16px currentColor)',
            transform: 'scale(1)'
          },
          '50%': { 
            filter: 'drop-shadow(0 0 16px currentColor) drop-shadow(0 0 32px currentColor) drop-shadow(0 0 48px currentColor)',
            transform: 'scale(1.05)'
          },
        },
        'neon-flicker': {
          '0%, 100%': { opacity: '1', filter: 'brightness(1)' },
          '25%': { opacity: '0.9', filter: 'brightness(1.2)' },
          '50%': { opacity: '1', filter: 'brightness(1.5)' },
          '75%': { opacity: '0.95', filter: 'brightness(1.3)' },
        },
      },
      animation: {
        'neon-pulse': 'neon-pulse 3s ease-in-out infinite',
        'neon-flicker': 'neon-flicker 2s ease-in-out infinite',
      },
    },
  },
  plugins: []
};

export default config;
