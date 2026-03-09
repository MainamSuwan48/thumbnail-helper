import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#1a1a1a',
          raised: '#242424',
          overlay: '#2e2e2e',
          border: '#3a3a3a',
        },
        accent: {
          DEFAULT: '#7c3aed',
          hover: '#6d28d9',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
