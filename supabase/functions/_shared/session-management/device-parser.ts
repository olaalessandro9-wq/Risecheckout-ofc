/**
 * ============================================================================
 * Device Parser - User Agent Analysis
 * ============================================================================
 * 
 * Analisa User-Agent strings para extrair informações de dispositivo.
 * 
 * @version 1.0.0 - RISE Protocol V3 Compliant
 * ============================================================================
 */

import type { DeviceInfo } from "./types.ts";

// ============================================================================
// BROWSER DETECTION
// ============================================================================

const BROWSER_PATTERNS: Array<{ name: string; pattern: RegExp }> = [
  { name: "Chrome", pattern: /Chrome\/[\d.]+/ },
  { name: "Firefox", pattern: /Firefox\/[\d.]+/ },
  { name: "Safari", pattern: /Safari\/[\d.]+/ },
  { name: "Edge", pattern: /Edg\/[\d.]+/ },
  { name: "Opera", pattern: /OPR\/[\d.]+|Opera\/[\d.]+/ },
  { name: "Samsung Internet", pattern: /SamsungBrowser\/[\d.]+/ },
  { name: "UC Browser", pattern: /UCBrowser\/[\d.]+/ },
  { name: "Brave", pattern: /Brave\/[\d.]+/ },
];

function detectBrowser(userAgent: string): string {
  // Edge case: Edge uses Chrome engine but should be detected as Edge
  if (userAgent.includes("Edg/")) return "Edge";
  
  // Check for Chrome last since many browsers include "Chrome" in UA
  for (const { name, pattern } of BROWSER_PATTERNS) {
    if (pattern.test(userAgent)) {
      // Avoid false positive: Safari in Chrome UA
      if (name === "Safari" && userAgent.includes("Chrome")) continue;
      return name;
    }
  }
  
  return "Unknown Browser";
}

// ============================================================================
// OS DETECTION
// ============================================================================

const OS_PATTERNS: Array<{ name: string; pattern: RegExp }> = [
  { name: "Windows 11", pattern: /Windows NT 10\.0.*Win64/ },
  { name: "Windows 10", pattern: /Windows NT 10\.0/ },
  { name: "Windows 8.1", pattern: /Windows NT 6\.3/ },
  { name: "Windows 8", pattern: /Windows NT 6\.2/ },
  { name: "Windows 7", pattern: /Windows NT 6\.1/ },
  { name: "macOS", pattern: /Mac OS X|Macintosh/ },
  { name: "iOS", pattern: /iPhone|iPad|iPod/ },
  { name: "Android", pattern: /Android/ },
  { name: "Linux", pattern: /Linux/ },
  { name: "Chrome OS", pattern: /CrOS/ },
];

function detectOS(userAgent: string): string {
  for (const { name, pattern } of OS_PATTERNS) {
    if (pattern.test(userAgent)) {
      return name;
    }
  }
  return "Unknown OS";
}

// ============================================================================
// DEVICE TYPE DETECTION
// ============================================================================

function detectDeviceType(userAgent: string): DeviceInfo["type"] {
  const ua = userAgent.toLowerCase();
  
  // Mobile patterns
  if (/mobile|android.*mobile|iphone|ipod|blackberry|opera mini|opera mobi/i.test(ua)) {
    return "mobile";
  }
  
  // Tablet patterns
  if (/tablet|ipad|android(?!.*mobile)|kindle|silk/i.test(ua)) {
    return "tablet";
  }
  
  // Desktop patterns (or anything else)
  if (/windows|macintosh|linux|cros/i.test(ua)) {
    return "desktop";
  }
  
  return "unknown";
}

// ============================================================================
// MAIN EXPORT
// ============================================================================

/**
 * Parses a User-Agent string to extract device information.
 * 
 * @param userAgent - Raw User-Agent header string
 * @returns DeviceInfo with type, browser, and OS
 */
export function parseUserAgent(userAgent: string | null): DeviceInfo {
  if (!userAgent) {
    return {
      type: "unknown",
      browser: "Unknown",
      os: "Unknown",
    };
  }

  return {
    type: detectDeviceType(userAgent),
    browser: detectBrowser(userAgent),
    os: detectOS(userAgent),
  };
}

/**
 * Creates a human-readable device description.
 * 
 * @param device - DeviceInfo object
 * @returns Formatted string like "Chrome on Windows 10 (desktop)"
 */
export function formatDeviceDescription(device: DeviceInfo): string {
  return `${device.browser} on ${device.os} (${device.type})`;
}
