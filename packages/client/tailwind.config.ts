import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#161618',
          raised: '#202024',
          overlay: '#2a2a2e',
          border: '#38383f',
        },
        accent: {
          DEFAULT: '#e8547a',
          hover: '#d4436a',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
