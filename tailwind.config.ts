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
            filter: 'drop-shadow(0 0 5px currentColor) drop-shadow(0 0 10px currentColor)' 
          },
          '50%': { 
            filter: 'drop-shadow(0 0 10px currentColor) drop-shadow(0 0 20px currentColor) drop-shadow(0 0 30px currentColor)' 
          },
        },
        'neon-flicker': {
          '0%, 100%': { opacity: '1' },
          '25%': { opacity: '0.8' },
          '50%': { opacity: '1' },
          '75%': { opacity: '0.9' },
        },
      },
      animation: {
        'neon-pulse': 'neon-pulse 2s ease-in-out infinite',
        'neon-flicker': 'neon-flicker 1.5s ease-in-out infinite',
      },
    },
  },
  plugins: []
};

export default config;
