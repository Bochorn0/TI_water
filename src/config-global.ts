import packageJson from '../package.json';

// ----------------------------------------------------------------------
// TI Water Frontend — single API version: /api/v1.0 (auth, users, tiwater/*)
// Health: .../api/v1.0/health

/** Normalize legacy env vars that still point at /api/v2.0 */
function normalizeToApiV1(url: string): string {
  if (!url) return url;
  return url.replace(/\/api\/v2\.0(\/|$)/g, '/api/v1.0$1');
}

const PRODUCTION_API_BASE =
  'https://tiwatermx-api-hgaua5f6bycshrc5.australiaeast-01.azurewebsites.net/api/v1.0';
const DEV_API_BASE = 'http://localhost:3009/api/v1.0';

const rawEnv = import.meta.env.VITE_API_BASE_URL;
const isDev = import.meta.env.DEV;
// Do NOT treat all http:// URLs as "legacy" — that forced Azure even for http://localhost
// in `vite build` + `vite preview` (import.meta.env.DEV is false there).
const legacyDroplet = Boolean(rawEnv?.includes('164.92.95.176'));
const useHardcodedAzure = !isDev && (!rawEnv || legacyDroplet);

let API_BASE_URL = normalizeToApiV1(
  useHardcodedAzure
    ? PRODUCTION_API_BASE
    : (rawEnv || (isDev ? DEV_API_BASE : PRODUCTION_API_BASE)),
).replace(/\/+$/, '');

/**
 * `vite build` bakes VITE_API_BASE_URL into the bundle. Preview (`npm run start`) therefore
 * still had the Azure URL. When the app runs in the browser on localhost, prefer the local API.
 * Set VITE_API_LOCAL_USE_PROD=true at build time to test the real Azure API from a local tab.
 */
function shouldUseLocalApiFromBrowser() {
  if (import.meta.env.VITE_API_LOCAL_USE_PROD === 'true') return false;
  if (typeof window === 'undefined') return false;
  const h = window.location.hostname;
  return h === 'localhost' || h === '127.0.0.1' || h === '[::1]';
}
if (shouldUseLocalApiFromBrowser()) {
  if (rawEnv && (rawEnv.includes('localhost') || rawEnv.includes('127.0.0.1'))) {
    API_BASE_URL = normalizeToApiV1(rawEnv).replace(/\/+$/, '');
  } else {
    API_BASE_URL = DEV_API_BASE;
  }
}

const rawTiwater = import.meta.env.VITE_API_BASE_URL_TIWATER as string | undefined;
const baseWasBakedToRemote = Boolean(
  !rawEnv || (!rawEnv.includes('127.0.0.1') && !rawEnv.includes('localhost')),
);
const API_BASE_URL_TIWATER = normalizeToApiV1(
  shouldUseLocalApiFromBrowser() && baseWasBakedToRemote
    ? `${API_BASE_URL}/tiwater`
    : rawTiwater || `${API_BASE_URL}/tiwater`,
).replace(/\/+$/, '');

/** Same as API_BASE_URL — auth is /api/v1.0/auth/login, tiwater is API_BASE_URL_TIWATER */
export const API_V1_BASE = API_BASE_URL;

const TIWATER_API_KEY = import.meta.env.VITE_TIWATER_API_KEY || '';

const PORT = import.meta.env.PORT || '3040';

export type ConfigValue = {
  appName: string;
  appVersion: string;
  API_BASE_URL: string;
  API_BASE_URL_TIWATER: string;
  API_V1_BASE: string;
  TIWATER_API_KEY: string;
  PORT: string;
};

// ----------------------------------------------------------------------

export const CONFIG: ConfigValue = {
  appName: 'TI Water',
  appVersion: packageJson.version,
  API_BASE_URL,
  API_BASE_URL_TIWATER,
  API_V1_BASE,
  TIWATER_API_KEY,
  PORT,
};
