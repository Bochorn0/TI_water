import fs from 'fs';
import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

const PORT = 3040;
const HTTPS_KEY = process.env.VITE_HTTPS_KEY;
const HTTPS_CERT = process.env.VITE_HTTPS_CERT;
const HTTPS_CONFIG =
  HTTPS_KEY && HTTPS_CERT
    ? {
        key: fs.readFileSync(HTTPS_KEY),
        cert: fs.readFileSync(HTTPS_CERT),
      }
    : undefined;

export default defineConfig({
  plugins: [react()],
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
  server: { port: PORT, host: true, https: HTTPS_CONFIG },
  preview: { port: PORT, host: true },
});

