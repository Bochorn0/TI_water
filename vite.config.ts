import fs from 'fs';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react-swc';

const ROOT = process.cwd();
const TEJABAN_SRC = path.join(ROOT, 'el-tejaban/src');

const PORT = 3040;
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

function spaFallback(): Plugin {
  return {
    name: 'spa-fallback',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const u = req.url || '';
        if (u.startsWith('/api') || u.startsWith('/@') || u.includes('.')) return next();
        req.url = '/index.html';
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, _res, next) => {
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
    dedupe: ['react', 'react-dom', '@emotion/react', '@emotion/styled', '@mui/material'],
    alias: [
      { find: /^~(.+)/, replacement: path.join(ROOT, 'node_modules/$1') },
      { find: /^src(.+)/, replacement: path.join(ROOT, 'src$1') },
      { find: '@tejaban', replacement: TEJABAN_SRC },
    ],
  },
  server: {
    port: PORT,
    strictPort: true,
    host: '0.0.0.0',
    https: HTTPS_CONFIG,
    hmr: {
      // Allow HMR when opening via LAN IP (e.g. tablet at 192.168.x.x:3040)
      clientPort: PORT,
    },
  },
  preview: { port: PREVIEW_PORT, strictPort: true, host: true },
});
