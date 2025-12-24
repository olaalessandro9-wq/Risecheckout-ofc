/**
 * Global type declarations for tracking pixels and external libraries
 */

export {};

declare global {
  interface Window {
    // Google Tag (gtag.js)
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
    
    // TikTok Pixel
    ttq?: {
      track: (eventName: string, eventData?: any) => void;
    };
    _tiktok_pixel?: any[];
    
    // Kwai Pixel - can be a function or object with track method
    kwaiq?: ((eventName: string, eventData?: any) => void) & {
      track?: (eventName: string, eventData?: any) => void;
    };
    _kwai_pixel?: any[];
    
    // Facebook Pixel
    fbq?: any;
    _fbq?: any;
    
    // Mercado Pago SDK
    MercadoPago?: any;
  }
}
