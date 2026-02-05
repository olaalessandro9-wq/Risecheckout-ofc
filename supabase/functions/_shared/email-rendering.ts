/**
 * Email Rendering Guard
 * 
 * RISE Protocol V3 - 10.0/10
 * 
 * Utilities for email HTML processing and size validation.
 * Prevents Gmail clipping by enforcing byte-size limits.
 * 
 * Gmail clips emails at ~102KB. We enforce a conservative limit
 * to ensure no email ever gets truncated.
 * 
 * @version 1.0.0
 */

import { createLogger } from "./logger.ts";

const log = createLogger("EmailRendering");

// ============================================================================
// CONSTANTS
// ============================================================================

/** Gmail clips at ~102KB. We use 95KB as hard limit with 80KB warning. */
const GMAIL_CLIP_LIMIT_BYTES = 102_400;
const WARNING_THRESHOLD_BYTES = 80_000;
const HARD_LIMIT_BYTES = 95_000;

// ============================================================================
// MINIFICATION
// ============================================================================

/**
 * Minifies email HTML by removing safe whitespace.
 * 
 * Conservative approach:
 * - Removes consecutive whitespace between tags
 * - Preserves content inside <style> and <pre> blocks
 * - Does NOT remove spaces between words
 * 
 * @param html - Raw HTML string
 * @returns Minified HTML string
 */
export function minifyEmailHtml(html: string): string {
  // 1. Preserve style and pre blocks
  const styleBlocks: string[] = [];
  const preBlocks: string[] = [];
  
  let result = html
    // Preserve <style> content
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, (match) => {
      styleBlocks.push(match);
      return `___STYLE_${styleBlocks.length - 1}___`;
    })
    // Preserve <pre> content
    .replace(/<pre[^>]*>[\s\S]*?<\/pre>/gi, (match) => {
      preBlocks.push(match);
      return `___PRE_${preBlocks.length - 1}___`;
    });
  
  // 2. Minify
  result = result
    // Remove HTML comments (except conditionals)
    .replace(/<!--(?!\[if)[\s\S]*?-->/g, '')
    // Remove whitespace between tags
    .replace(/>\s+</g, '><')
    // Collapse multiple spaces/newlines into one space
    .replace(/\s{2,}/g, ' ')
    // Remove leading/trailing whitespace per line
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('');
  
  // 3. Restore preserved blocks
  styleBlocks.forEach((block, i) => {
    result = result.replace(`___STYLE_${i}___`, block);
  });
  preBlocks.forEach((block, i) => {
    result = result.replace(`___PRE_${i}___`, block);
  });
  
  return result;
}

// ============================================================================
// SIZE CALCULATION
// ============================================================================

/**
 * Calculates the byte length of an HTML string.
 * Uses UTF-8 encoding (same as email transfer).
 * 
 * @param html - HTML string
 * @returns Byte length
 */
export function getEmailByteLength(html: string): number {
  return new TextEncoder().encode(html).length;
}

/**
 * Formats byte size for human readability.
 * 
 * @param bytes - Number of bytes
 * @returns Formatted string (e.g., "45.2 KB")
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

// ============================================================================
// VALIDATION
// ============================================================================

export interface SizeValidationResult {
  isValid: boolean;
  byteLength: number;
  formattedSize: string;
  percentOfLimit: number;
  warning: string | null;
  error: string | null;
}

/**
 * Validates email HTML size against Gmail clip limits.
 * 
 * @param html - HTML string to validate
 * @param context - Context for logging (template name, subject, etc.)
 * @returns Validation result with size info
 */
export function validateEmailSize(
  html: string,
  context?: { template?: string; subject?: string }
): SizeValidationResult {
  const byteLength = getEmailByteLength(html);
  const percentOfLimit = Math.round((byteLength / GMAIL_CLIP_LIMIT_BYTES) * 100);
  const formattedSize = formatBytes(byteLength);
  
  const result: SizeValidationResult = {
    isValid: true,
    byteLength,
    formattedSize,
    percentOfLimit,
    warning: null,
    error: null,
  };
  
  if (byteLength > HARD_LIMIT_BYTES) {
    result.isValid = false;
    result.error = `Email exceeds size limit: ${formattedSize} (${percentOfLimit}% of Gmail limit). Max: ${formatBytes(HARD_LIMIT_BYTES)}`;
    log.error("Email size validation FAILED", {
      ...context,
      byteLength,
      formattedSize,
      percentOfLimit,
      limit: formatBytes(HARD_LIMIT_BYTES),
    });
  } else if (byteLength > WARNING_THRESHOLD_BYTES) {
    result.warning = `Email approaching size limit: ${formattedSize} (${percentOfLimit}% of Gmail limit)`;
    log.warn("Email size WARNING", {
      ...context,
      byteLength,
      formattedSize,
      percentOfLimit,
    });
  } else {
    log.debug("Email size OK", {
      ...context,
      byteLength,
      formattedSize,
      percentOfLimit,
    });
  }
  
  return result;
}

/**
 * Asserts that email HTML is under Gmail clip limit.
 * Throws if validation fails.
 * 
 * @param html - HTML string to validate
 * @param context - Context for error messages
 * @throws Error if email exceeds size limit
 */
export function assertUnderGmailClipLimit(
  html: string,
  context: { template: string; subject: string }
): void {
  const result = validateEmailSize(html, context);
  
  if (!result.isValid) {
    throw new Error(result.error!);
  }
}

// ============================================================================
// COMBINED PIPELINE
// ============================================================================

export interface ProcessedEmail {
  html: string;
  originalByteLength: number;
  minifiedByteLength: number;
  savedBytes: number;
  validation: SizeValidationResult;
}

/**
 * Processes email HTML: minifies and validates size.
 * 
 * @param html - Raw HTML string
 * @param context - Context for logging
 * @returns Processed email with minified HTML and validation
 */
export function processEmailHtml(
  html: string,
  context?: { template?: string; subject?: string }
): ProcessedEmail {
  const originalByteLength = getEmailByteLength(html);
  const minified = minifyEmailHtml(html);
  const minifiedByteLength = getEmailByteLength(minified);
  const savedBytes = originalByteLength - minifiedByteLength;
  
  const validation = validateEmailSize(minified, context);
  
  log.info("Email processed", {
    ...context,
    originalSize: formatBytes(originalByteLength),
    minifiedSize: formatBytes(minifiedByteLength),
    saved: formatBytes(savedBytes),
    percentSaved: Math.round((savedBytes / originalByteLength) * 100),
  });
  
  return {
    html: minified,
    originalByteLength,
    minifiedByteLength,
    savedBytes,
    validation,
  };
}
