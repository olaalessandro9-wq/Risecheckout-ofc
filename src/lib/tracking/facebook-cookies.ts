/**
 * Facebook Cookie Reader
 * 
 * @module lib/tracking/facebook-cookies
 * @version 1.0.0 - RISE Protocol V3
 * 
 * Reads _fbc (Facebook Click ID) and _fbp (Facebook Browser ID)
 * cookies set by the Facebook Pixel SDK (fbevents.js).
 * 
 * These cookies are critical for Facebook CAPI Event Match Quality (EMQ).
 * They bridge browser-side Pixel events with server-side CAPI events,
 * enabling Facebook to attribute conversions even across devices.
 * 
 * Cookie formats (Meta specification):
 * - _fbp: "fb.1.{timestamp}.{random}" (Browser ID)
 * - _fbc: "fb.1.{timestamp}.{fbclid}" (Click ID from ad click)
 */

/**
 * Reads a specific cookie value by name.
 * Returns null if cookie not found or running in SSR.
 */
function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;

  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const [key, ...valueParts] = cookie.split("=");
    if (key.trim() === name) {
      return decodeURIComponent(valueParts.join("=").trim());
    }
  }
  return null;
}

/**
 * Facebook identity data captured from browser cookies and environment.
 * All fields are optional since cookies may not be present
 * (e.g., user has AdBlock, first visit, or cookies expired).
 */
export interface FacebookBrowserIdentity {
  /** Facebook Browser ID (_fbp cookie) */
  fbp: string | null;
  /** Facebook Click ID (_fbc cookie, set when user clicks a Facebook ad) */
  fbc: string | null;
  /** Browser User-Agent string */
  userAgent: string | null;
  /** Full URL of the current page */
  eventSourceUrl: string | null;
}

/**
 * Captures all Facebook-relevant browser identity data.
 * 
 * Should be called at the moment of order creation (checkout submission)
 * to ensure the most up-to-date cookie values are captured.
 * 
 * @returns FacebookBrowserIdentity with all available identity signals
 */
export function captureFacebookBrowserIdentity(): FacebookBrowserIdentity {
  if (typeof window === "undefined") {
    return {
      fbp: null,
      fbc: null,
      userAgent: null,
      eventSourceUrl: null,
    };
  }

  return {
    fbp: getCookie("_fbp"),
    fbc: getCookie("_fbc") ?? extractFbcFromUrl(),
    userAgent: navigator.userAgent || null,
    eventSourceUrl: window.location.href || null,
  };
}

/**
 * Extracts fbc from URL's fbclid parameter.
 * 
 * When a user clicks a Facebook ad, the URL contains ?fbclid=xxx.
 * If the _fbc cookie hasn't been set yet (e.g., cookies blocked),
 * we can construct the fbc value manually following Meta's format:
 * "fb.1.{timestamp}.{fbclid}"
 * 
 * @returns Constructed fbc string or null
 */
function extractFbcFromUrl(): string | null {
  if (typeof window === "undefined") return null;

  try {
    const params = new URLSearchParams(window.location.search);
    const fbclid = params.get("fbclid");

    if (!fbclid) return null;

    // Meta's _fbc format: fb.{subdomainIndex}.{creationTime}.{fbclid}
    const timestamp = Date.now();
    return `fb.1.${timestamp}.${fbclid}`;
  } catch {
    return null;
  }
}
