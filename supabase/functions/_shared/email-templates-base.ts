/**
 * Email Templates - Base Utilities
 * 
 * RISE Protocol V3 - 10.0/10
 * 
 * Types e helpers compartilhados por todos os templates de email.
 * Uses permanent Supabase Storage URL for brand assets.
 * 
 * IMPORTANT: getBaseStyles() and getEmailWrapper() are DEPRECATED.
 * All templates must use their own inline <style> block for Gmail compatibility.
 * 
 * @version 4.0.0
 */

// ============================================================================
// CONSTANTS - Permanent URLs via Supabase Storage CDN
// ============================================================================

/** Permanent logo URL from Supabase Storage - never changes */
const LOGO_STORAGE_URL = "https://wivbtmtgpsxupfjwwovf.supabase.co/storage/v1/object/public/brand-assets/logo/main.jpeg";

/**
 * Gets the logo URL from Supabase Storage.
 * Permanent URL that never changes - no env dependencies.
 */
export function getLogoUrl(): string {
  return LOGO_STORAGE_URL;
}

// ============================================================================
// TYPES - Re-exported for convenience
// ============================================================================

export interface PurchaseConfirmationData {
  customerName: string;
  productName: string;
  amountCents: number;
  orderId: string;
  paymentMethod?: string;
  sellerName?: string;
  supportEmail?: string;
  deliveryUrl?: string;
}

export interface PaymentPendingData {
  customerName: string;
  productName: string;
  amountCents: number;
  orderId: string;
  pixQrCode?: string;
}

export interface NewSaleData {
  sellerName: string;
  customerName: string;
  customerEmail: string;
  productName: string;
  amountCents: number;
  orderId: string;
  paymentMethod?: string;
  gateway?: string;
}

// ============================================================================
// CURRENCY FORMATTER
// ============================================================================

export function formatCurrency(amountCents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amountCents / 100);
}

// ============================================================================
// DEPRECATED FUNCTIONS - DO NOT USE IN NEW TEMPLATES
// ============================================================================

/**
 * @deprecated Use inline <style> block in each template instead.
 * This function exists only for backwards compatibility with tests.
 * Gmail clips emails that use shared wrapper functions.
 * 
 * All new templates MUST define their own <style> block inline.
 * See email-templates-purchase.ts for the correct pattern.
 */
export function getBaseStyles(): string {
  return `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
      
      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        line-height: 1.6;
        color: #1a1a1a;
        margin: 0;
        padding: 0;
        background-color: #f5f5f5;
      }
      
      .email-container {
        max-width: 600px;
        margin: 0 auto;
        background-color: #ffffff;
      }
      
      .header {
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
        padding: 40px 30px;
        text-align: center;
      }
      
      .header h1 {
        color: #ffffff;
        margin: 0;
        font-size: 24px;
        font-weight: 700;
      }
      
      .header .subtitle {
        color: rgba(255, 255, 255, 0.9);
        margin-top: 8px;
        font-size: 14px;
      }
      
      .content {
        padding: 40px 30px;
      }
      
      .greeting {
        font-size: 18px;
        font-weight: 600;
        color: #1a1a1a;
        margin-bottom: 16px;
      }
      
      .message {
        color: #4a4a4a;
        margin-bottom: 24px;
      }
      
      .order-box {
        background-color: #f8f9fa;
        border-radius: 12px;
        padding: 24px;
        margin: 24px 0;
      }
      
      .order-box h3 {
        margin: 0 0 16px 0;
        font-size: 14px;
        font-weight: 600;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .order-row {
        display: flex;
        justify-content: space-between;
        padding: 12px 0;
        border-bottom: 1px solid #e5e7eb;
      }
      
      .order-row:last-child {
        border-bottom: none;
        padding-bottom: 0;
      }
      
      .order-label {
        color: #6b7280;
        font-size: 14px;
      }
      
      .order-value {
        color: #1a1a1a;
        font-weight: 500;
        font-size: 14px;
      }
      
      .total-row {
        background-color: #6366f1;
        color: #ffffff;
        margin: -24px;
        margin-top: 16px;
        padding: 16px 24px;
        border-radius: 0 0 12px 12px;
      }
      
      .total-row .order-label,
      .total-row .order-value {
        color: #ffffff;
        font-weight: 600;
        font-size: 16px;
      }
      
      .success-badge {
        display: inline-block;
        background-color: #10b981;
        color: #ffffff;
        padding: 6px 16px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .footer {
        background-color: #f8f9fa;
        padding: 30px;
        text-align: center;
        border-top: 1px solid #e5e7eb;
      }
      
      .footer p {
        color: #6b7280;
        font-size: 12px;
        margin: 4px 0;
      }
      
      .footer a {
        color: #6366f1;
        text-decoration: none;
      }
      
      .cta-button {
        display: inline-block;
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
        color: #ffffff;
        padding: 14px 32px;
        border-radius: 8px;
        text-decoration: none;
        font-weight: 600;
        font-size: 14px;
        margin: 24px 0;
      }
    </style>
  `;
}

/**
 * @deprecated Use inline HTML structure in each template instead.
 * This function exists only for backwards compatibility with tests.
 * Gmail clips emails that use shared wrapper functions.
 * 
 * All new templates MUST define their own complete HTML structure.
 * See email-templates-purchase.ts for the correct pattern.
 */
export function getEmailWrapper(content: string): string {
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      ${getBaseStyles()}
    </head>
    <body>
      <div class="email-container">
        ${content}
      </div>
    </body>
    </html>
  `;
}
