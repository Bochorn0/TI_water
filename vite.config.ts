import fs from 'fs';
import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

/** Dev server (`npm run dev`). */
const PORT = 3040;
/**
 * Preview of production build (`npm run start` / `vite preview`).
 * Keep different from PORT so you never have preview + dev fighting for one port
 * (which causes 404s for `/@vite/client` and `/@react-refresh`).
 */
const PREVIEW_PORT = 3041;
const HTTPS_KEY = process.env.VITE_HTTPS_KEY;
const HTTPS_CERT = process.env.VITE_HTTPS_CERT;
const HTTPS_CONFIG =
  HTTPS_KEY && HTTPS_CERT
    ? {
        key: fs.readFileSync(HTTPS_KEY),
        cert: fs.readFileSync(HTTPS_CERT),
      }
    : undefined;

/** SPA fallback: serve index.html for client routes (e.g. /cotizaciones) when opening directly or refreshing */
function spaFallback() {
  return {
    name: 'spa-fallback',
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: () => void) => {
        const u = req.url || '';
        // Vite HMR, /@id, /node_modules, etc. — no dot; must not be forced to /index.html
        if (u.startsWith('/api') || u.startsWith('/@') || u.includes('.')) return next();
        req.url = '/index.html';
        next();
      });
    },
    configurePreviewServer(server: any) {
      server.middlewares.use((req: any, res: any, next: () => void) => {
        const u = req.url || '';
        if (u.startsWith('/api') || u.startsWith('/@') || u.includes('.')) return next();
        req.url = '/index.html';
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), spaFallback()],
  resolve: {
    alias: [
      {
        find: /^~(.+)/,
        replacement: path.join(process.cwd(), 'node_modules/$1'),
      },
      {
        find: /^src(.+)/,
        replacement: path.join(process.cwd(), 'src/$1'),
      },
    ],
  },
  server: { port: PORT, strictPort: true, host: true, https: HTTPS_CONFIG },
  preview: { port: PREVIEW_PORT, strictPort: true, host: true },
});

