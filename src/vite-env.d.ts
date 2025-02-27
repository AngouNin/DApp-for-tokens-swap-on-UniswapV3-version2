/// <reference types="vite/client" />

interface Window {
  ethereum: any;
}

interface ImportMetaEnv {
  VITE_INFURA_PROJECT_ID: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}