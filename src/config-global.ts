import packageJson from '../package.json';

// ----------------------------------------------------------------------
// TI Water Frontend Configuration
// API endpoints configuration for TI Water quotes system

const PRODUCTION_API_BASE = 'https://www.lcc.com.mx/api/v2.0';
const DEV_API_BASE = 'http://localhost:3009/api/v2.0';

const rawEnv = import.meta.env.VITE_API_BASE_URL;
const isDev = import.meta.env.DEV;
// Production: never use old IP or http; use www.lcc.com.mx
const isOldOrHttp = !rawEnv || rawEnv.includes('164.92.95.176') || rawEnv.startsWith('http://');
const API_BASE_URL =
  !isDev && isOldOrHttp
    ? PRODUCTION_API_BASE
    : (rawEnv || (isDev ? DEV_API_BASE : PRODUCTION_API_BASE));
const API_BASE_URL_TIWATER = import.meta.env.VITE_API_BASE_URL_TIWATER || `${API_BASE_URL}/tiwater`;

// TI Water API Key for authentication (from environment variable)
const TIWATER_API_KEY = import.meta.env.VITE_TIWATER_API_KEY || '';

// Port configuration
const PORT = import.meta.env.PORT || '3040';

export type ConfigValue = {
  appName: string;
  appVersion: string;
  API_BASE_URL: string;
  API_BASE_URL_TIWATER: string;
  TIWATER_API_KEY: string;
  PORT: string;
};

// ----------------------------------------------------------------------

export const CONFIG: ConfigValue = {
  appName: 'TI Water',
  appVersion: packageJson.version,
  API_BASE_URL,
  API_BASE_URL_TIWATER,
  TIWATER_API_KEY,
  PORT,
};
