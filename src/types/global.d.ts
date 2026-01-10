/**
 * Global type declarations for tracking pixels and external libraries
 * 
 * Este arquivo centraliza todas as declarações de tipos globais
 * para evitar @ts-ignore nos módulos de tracking.
 */

export {};

// ============================================================================
// FACEBOOK PIXEL TYPES
// ============================================================================

/** Parâmetros de eventos do Facebook Pixel */
type FacebookPixelEventParams = Record<string, unknown>;

/** Função principal do Facebook Pixel */
interface FacebookPixelFunction {
  (method: 'init', pixelId: string): void;
  (method: 'track', eventName: string, params?: FacebookPixelEventParams): void;
  (method: 'trackCustom', eventName: string, params?: FacebookPixelEventParams): void;
  (...args: unknown[]): void;
}

/** Objeto completo do Facebook Pixel com metadados */
interface FacebookPixelObject extends FacebookPixelFunction {
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[];
  push: FacebookPixelFunction;
  loaded: boolean;
  version: string;
}

// ============================================================================
// GOOGLE ADS / GTAG TYPES
// ============================================================================

/** Função gtag do Google Ads */
type GtagFunction = (
  command: 'config' | 'event' | 'js' | 'set',
  targetId: string,
  config?: Record<string, unknown>
) => void;

// ============================================================================
// TIKTOK PIXEL TYPES
// ============================================================================

/** Objeto do TikTok Pixel */
interface TikTokPixelObject {
  track: (eventName: string, eventData?: Record<string, unknown>) => void;
  page: () => void;
  load: (pixelId: string) => void;
  identify: (userData: Record<string, unknown>) => void;
}

/** Item da fila do TikTok Pixel */
interface TikTokPixelQueueItem {
  event: string;
  data?: Record<string, unknown>;
}

// ============================================================================
// KWAI PIXEL TYPES
// ============================================================================

/** Função do Kwai Pixel (pode ser função ou objeto) */
interface KwaiPixelFunction {
  (eventName: string, eventData?: Record<string, unknown>): void;
  track?: (eventName: string, eventData?: Record<string, unknown>) => void;
}

/** Item da fila do Kwai Pixel */
interface KwaiPixelQueueItem {
  event: string;
  data?: Record<string, unknown>;
}

// ============================================================================
// MERCADO PAGO SDK TYPES
// ============================================================================

/** Configuração de inicialização do Mercado Pago */
interface MercadoPagoConfig {
  locale?: string;
}

/** Instância do Mercado Pago SDK */
interface MercadoPagoInstance {
  cardForm: (config: Record<string, unknown>) => MercadoPagoCardForm;
  getInstallments: (params: { amount: string; bin: string; locale?: string }) => Promise<unknown[]>;
  getIdentificationTypes: () => Promise<unknown[]>;
  getPaymentMethods: (params: { bin: string }) => Promise<unknown[]>;
}

/** Card Form do Mercado Pago */
interface MercadoPagoCardForm {
  createCardToken: (params: { cardholderEmail: string }) => Promise<{ id?: string; token?: string }>;
  unmount: () => void;
  getCardFormData: () => Record<string, unknown>;
}

/** Construtor do Mercado Pago SDK */
interface MercadoPagoConstructor {
  new (publicKey: string, config?: MercadoPagoConfig): MercadoPagoInstance;
}

// ============================================================================
// WINDOW GLOBAL DECLARATIONS
// ============================================================================

declare global {
  interface Window {
    // ========== FACEBOOK PIXEL ==========
    /** Função principal do Facebook Pixel */
    fbq?: FacebookPixelObject;
    /** Referência de backup do Facebook Pixel */
    _fbq?: FacebookPixelObject;

    // ========== GOOGLE ADS / GTAG ==========
    /** Função gtag do Google Ads */
    gtag?: GtagFunction;
    /** Data Layer do Google Tag Manager */
    dataLayer?: unknown[];

    // ========== TIKTOK PIXEL ==========
    /** Objeto principal do TikTok Pixel */
    ttq?: TikTokPixelObject;
    /** Fila de eventos do TikTok Pixel */
    _tiktok_pixel?: TikTokPixelQueueItem[];

    // ========== KWAI PIXEL ==========
    /** Função do Kwai Pixel */
    kwaiq?: KwaiPixelFunction;
    /** Fila de eventos do Kwai Pixel */
    _kwai_pixel?: KwaiPixelQueueItem[];

    // ========== MERCADO PAGO ==========
    /** Construtor do Mercado Pago SDK */
    MercadoPago?: MercadoPagoConstructor;
  }
}
