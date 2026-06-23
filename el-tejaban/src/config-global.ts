import packageJson from '../../package.json';

export const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== 'false';

const PRODUCTION_API_BASE =
  'https://tiwatermx-api-hgaua5f6bycshrc5.australiaeast-01.azurewebsites.net/api/v1.0';
const DEV_API_BASE = 'http://localhost:3009/api/v1.0';

const rawEnv = import.meta.env.VITE_API_BASE_URL;
const isDev = import.meta.env.DEV;
const API_BASE_URL = (isDev ? rawEnv || DEV_API_BASE : rawEnv || PRODUCTION_API_BASE).replace(/\/+$/, '');

export const CONFIG = {
  appName: 'El Tejaban',
  appVersion: packageJson.version,
  slogan: '¡La mejor Cahuamanta de la región!',
  API_BASE_URL,
  /** El Tejaban REST module — tejaban_products, tejaban_ordenes, … */
  API_TIJABAN_BASE: `${API_BASE_URL}/tejaban`,
  TIWATER_API_KEY: import.meta.env.VITE_TIWATER_API_KEY || '',
  USE_MOCK_API,
  /** Base path on tiwater.mx */
  APP_BASE: '/el-tejaban',
} as const;
