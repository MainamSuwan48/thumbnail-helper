import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Use monorepo root public dir so /fot-yuruka-std.ttf and other assets are served
  publicDir: '../../public',
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001',
      '/user-assets': 'http://localhost:3001',
    },
  },
});
