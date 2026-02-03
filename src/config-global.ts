import packageJson from '../package.json';

// ----------------------------------------------------------------------
// TI Water Frontend Configuration
// API endpoints configuration for TI Water quotes system

// API Base URL - v2.0 TI Water endpoints
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? 'http://localhost:3009/api/v2.0' : 'https://www.lcc.com.mx/api/v2.0');
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
