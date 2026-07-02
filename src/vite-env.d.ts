/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_API_BASE_URL_TIWATER: string;
  readonly VITE_TIWATER_API_KEY: string;
  readonly VITE_USE_MOCK_API: string;
  readonly VITE_API_LOCAL_USE_PROD: string;
  readonly VITE_HTTPS_KEY: string;
  readonly VITE_HTTPS_CERT: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
