/**
 * Extensões globais do objeto Window
 * Para SDKs externos e debugging
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import type React from 'react';

declare global {
  interface Window {
    // MercadoPago SDK - tipagem completa em mercadopago.d.ts
    MercadoPago?: MercadoPagoConstructor;

    // TikTok Pixel
    ttq?: {
      track: (event: string, params?: Record<string, unknown>) => void;
      identify: (params: Record<string, unknown>) => void;
      page: () => void;
      load: (pixelId: string) => void;
    };

    // Kwai Pixel
    kwaiq?: {
      track: (event: string, params?: Record<string, unknown>) => void;
      instance: (pixelId: string) => {
        track: (event: string, params?: Record<string, unknown>) => void;
      };
    };

    // Facebook Pixel
    fbq?: (action: string, event: string, params?: Record<string, unknown>) => void;

    // Google Tag Manager / Analytics
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];

    // Debug - React instance for dev tools
    __APP_REACT__?: typeof React;
  }
}

export {};
