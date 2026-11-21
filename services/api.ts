import { Capacitor } from '@capacitor/core';

const DEFAULT_API_BASE = 'https://flow-finance-alpha.vercel.app';

const getNativeApiBase = (): string => {
  const configured = (import.meta.env?.VITE_API_BASE_URL || DEFAULT_API_BASE).trim();
  return configured.replace(/\/+$/, '');
};

/**
 * Resolves relative /api/* paths to the production Vercel backend when running
 * inside the native Capacitor Android/iOS WebView, while keeping relative paths on Web.
 */
export const apiUrl = (path: string): string => {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (Capacitor.isNativePlatform()) {
    return `${getNativeApiBase()}${normalized}`;
  }
  return normalized;
};
