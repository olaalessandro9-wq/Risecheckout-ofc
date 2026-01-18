/**
 * Producer Auth Helpers
 * 
 * Funções utilitárias extraídas do producer-auth para manter o arquivo principal
 * abaixo do limite de 300 linhas (RISE Protocol).
 * 
 * RISE Protocol Compliant - Zero `any` (exceto auditLog para flexibilidade)
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { genSaltSync, hashSync, compareSync } from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

// ============================================
// CONSTANTS
// ============================================

export const CURRENT_HASH_VERSION = 2;
export const BCRYPT_COST = 10;

// ============================================
// PASSWORD FUNCTIONS
// ============================================

/**
 * Hash password using bcrypt
 */
export function hashPassword(password: string): string {
  const salt = genSaltSync(BCRYPT_COST);
  return hashSync(password, salt);
}

/**
 * Verify password against bcrypt hash
 */
export function verifyPassword(password: string, hash: string): boolean {
  return compareSync(password, hash);
}

// ============================================
// TOKEN GENERATION
// ============================================

/**
 * Generate secure session token (64 hex chars)
 */
export function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Generate secure reset token (64 hex chars)
 */
export function generateResetToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, "0")).join("");
}

// ============================================
// AUDIT LOGGING
// ============================================

/**
 * Log audit event to producer_audit_log table
 */
export async function logAuditEvent(
  supabase: SupabaseClient,
  producerId: string | null,
  action: string,
  success: boolean,
  ipAddress: string | null,
  userAgent: string | null,
  details?: Record<string, unknown>
): Promise<void> {
  try {
    await supabase.from("producer_audit_log").insert({
      producer_id: producerId,
      action,
      success,
      ip_address: ipAddress,
      user_agent: userAgent,
      details,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[producer-auth] Audit log error:", errorMessage);
  }
}

// ============================================
// EMAIL TEMPLATES
// ============================================

/**
 * Generate password reset email HTML
 */
export function getPasswordResetEmailHtml(
  producerName: string | null,
  resetLink: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #0a0a0b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0b; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #141416; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
              <!-- Header -->
              <tr>
                <td style="padding: 40px 40px 20px 40px; text-align: center;">
                  <div style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #8b5cf6); width: 50px; height: 50px; border-radius: 12px; line-height: 50px; color: white; font-weight: bold; font-size: 24px;">R</div>
                  <h1 style="color: white; margin: 20px 0 0 0; font-size: 24px; font-weight: 600;">RiseCheckout</h1>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 20px 40px;">
                  <h2 style="color: white; margin: 0 0 20px 0; font-size: 20px;">Olá${producerName ? `, ${producerName}` : ''}!</h2>
                  <p style="color: #94a3b8; margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
                    Recebemos uma solicitação para redefinir sua senha. Clique no botão abaixo para criar uma nova senha:
                  </p>
                  
                  <!-- Button -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                    <tr>
                      <td align="center">
                        <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                          Redefinir Senha
                        </a>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="color: #64748b; margin: 20px 0; font-size: 14px;">
                    Este link expira em <strong style="color: #94a3b8;">1 hora</strong>.
                  </p>
                  
                  <p style="color: #64748b; margin: 20px 0 0 0; font-size: 14px;">
                    Se você não solicitou esta alteração, ignore este email. Sua senha permanecerá a mesma.
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding: 20px 40px 40px 40px; border-top: 1px solid rgba(255,255,255,0.1);">
                  <p style="color: #64748b; margin: 0; font-size: 12px; text-align: center;">
                    © 2025 RiseCheckout Inc. Todos os direitos reservados.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

/**
 * Generate password reset email plain text
 */
export function getPasswordResetEmailText(
  producerName: string | null,
  resetLink: string
): string {
  return `
Olá${producerName ? `, ${producerName}` : ''}!

Recebemos uma solicitação para redefinir sua senha.

Clique no link abaixo para criar uma nova senha:
${resetLink}

Este link expira em 1 hora.

Se você não solicitou esta alteração, ignore este email.

Atenciosamente,
Equipe RiseCheckout
  `.trim();
}

// ============================================
// RESPONSE HELPERS
// ============================================

/**
 * Create JSON response with CORS headers
 */
export function jsonResponse(
  data: object,
  corsHeaders: Record<string, string>,
  status = 200
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/**
 * Create error response with CORS headers
 */
export function errorResponse(
  error: string,
  corsHeaders: Record<string, string>,
  status = 400
): Response {
  return jsonResponse({ error }, corsHeaders, status);
}
