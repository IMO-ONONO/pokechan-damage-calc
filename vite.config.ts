import { defineConfig } from 'vite';

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
};

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    target: 'es2022',
  },
  server: {
    host: true,
    port: 8000,
    strictPort: true,
    headers: NO_CACHE_HEADERS,
  },
  preview: {
    host: true,
    port: 8000,
    strictPort: true,
    headers: NO_CACHE_HEADERS,
  },
});
