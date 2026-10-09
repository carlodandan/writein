import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import Sitemap from 'vite-plugin-sitemap';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  root: __dirname,
  plugins: [
    react(),
    tailwindcss(),
    Sitemap({
      hostname: 'https://writein.pages.dev',
      dynamicRoutes: [
        '/home',
      ],
      priority: {
        '/home': 0.9,
      },
      generateRobotsTxt: true,
      robots: [
        {
          userAgent: '*',
          allow: '/',
          disallow: '/api/',
          crawlDelay: 2,
        },
      ],
      readable: true,
    })
  ],
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
    },
  },
  server: {
    port: 3000,
  },
});
