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
      changefreq: 'weekly',
      priority: 1.0,
      readable: true,
      generateRobotsTxt: true,
      robots: [
        {
          userAgent: '*',
          allow: '/',
          disallow: ['/?code=', '/?token='],
        },
        {
          userAgent: 'GPTBot',
          allow: '/',
        },
        {
          userAgent: 'ClaudeBot',
          allow: '/',
        },
        {
          userAgent: 'PerplexityBot',
          allow: '/',
        },
        {
          userAgent: 'Applebot-Extended',
          allow: '/',
        },
        {
          userAgent: 'CCBot',
          allow: '/',
        },
      ],
    }),
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
