/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AUTH0_DOMAIN: string
  readonly VITE_AUTH0_CLIENT_ID: string  
  readonly VITE_AUTH0_AUDIENCE: string
  // Customer branding
  readonly VITE_CUSTOMER_NAME?: string
  readonly VITE_LOGO_URL?: string
  readonly VITE_PRIMARY_COLOR?: string
  readonly VITE_SECONDARY_COLOR?: string
  readonly VITE_BG_PRIMARY?: string
  readonly VITE_BG_SECONDARY?: string
  readonly VITE_BG_SIDEBAR?: string
  readonly VITE_TEXT_PRIMARY?: string
  readonly VITE_TEXT_SECONDARY?: string
  readonly VITE_TEXT_MUTED?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
