/**
 * Edge Function: email-preview
 * 
 * Endpoint para disparo de emails de preview/teste.
 * Permite visualizar qualquer template sem criar registros no banco.
 * 
 * Features (v2.0.0):
 * - Subject único por envio (timestamp) para evitar thread/consolidation no Gmail
 * - Email Size Guard: minifica e valida tamanho antes de enviar
 * - Rejeita emails que excedam limite de 95KB (Gmail clipa em ~102KB)
 * 
 * @version 2.0.0 - RISE V3 Compliance
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { getSupabaseClient } from "../_shared/supabase-client.ts";
import { handleCorsV2 } from "../_shared/cors-v2.ts";
import { requireAuthenticatedProducer } from "../_shared/unified-auth.ts";
import { rateLimitMiddleware, RATE_LIMIT_CONFIGS, getClientIP } from "../_shared/rate-limiting/index.ts";
import { sendEmail } from "../_shared/zeptomail.ts";
import { createLogger } from "../_shared/logger.ts";
import { processEmailHtml } from "../_shared/email-rendering.ts";

// Templates
import {
  getPurchaseConfirmationTemplate,
  getPurchaseConfirmationTextTemplate,
  getMembersAreaConfirmationTemplate,
  getMembersAreaConfirmationTextTemplate,
  getExternalDeliveryConfirmationTemplate,
  getExternalDeliveryConfirmationTextTemplate,
  getNewSaleTemplate,
  getNewSaleTextTemplate,
  getPaymentPendingTemplate,
  getPaymentPendingTextTemplate,
} from "../_shared/email-templates.ts";

import {
  getPasswordResetTemplate,
  getPasswordResetTextTemplate,
} from "../_shared/email-templates-password-reset.ts";

import {
  getStudentInviteTemplate,
  getStudentInviteTextTemplate,
} from "../_shared/email-templates-student-invite.ts";

// Mock Data
import {
  getMockPurchaseData,
  getMockMembersAreaData,
  getMockExternalData,
  getMockNewSaleData,
  getMockPaymentPendingData,
  getMockPasswordResetData,
  getMockStudentInviteData,
  getMockGdprData,
} from "../_shared/email-mock-data.ts";

const log = createLogger("EmailPreview");

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Generates a unique timestamp suffix for preview subjects.
 * Format: "HH:mm:ss" to differentiate emails in Gmail threads.
 */
function getTimestampSuffix(): string {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

// ============================================================================
// TYPES
// ============================================================================

type TemplateType = 
  | "purchase-standard"
  | "purchase-members-area"
  | "purchase-external"
  | "new-sale"
  | "pix-pending"
  | "password-reset"
  | "student-invite"
  | "gdpr-request";

interface PreviewRequest {
  templateType: TemplateType;
  recipientEmail?: string;
}

// ============================================================================
// INLINE TEMPLATES (para tipos não modularizados)
// ============================================================================

// Password Reset template agora importado de email-templates-password-reset.ts
// Student Invite template agora importado de email-templates-student-invite.ts

function getGdprRequestTemplate(data: { email: string; confirmationLink: string }): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><title>[PREVIEW] Solicitação LGPD</title></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #f59e0b;">Confirmação de Solicitação LGPD</h1>
  <p>Recebemos uma solicitação de exclusão de dados para o email: <strong>${data.email}</strong></p>
  <p>Para confirmar esta solicitação, clique no botão abaixo:</p>
  <a href="${data.confirmationLink}" style="display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">Confirmar Solicitação</a>
  <p style="color: #666; margin-top: 20px;">Este link expira em 24 horas.</p>
  <hr style="margin-top: 30px; border: none; border-top: 1px solid #eee;">
  <p style="color: #999; font-size: 12px;">Rise Checkout - LGPD Compliance</p>
</body>
</html>`;
}

// ============================================================================
// TEMPLATE PROCESSOR
// ============================================================================

function processTemplate(templateType: TemplateType): { subject: string; htmlBody: string; textBody: string } {
  const timestamp = getTimestampSuffix();
  
  switch (templateType) {
    case "purchase-standard": {
      const data = getMockPurchaseData();
      return {
        subject: `[PREVIEW] Compra Confirmada • ${timestamp}`,
        htmlBody: getPurchaseConfirmationTemplate(data),
        textBody: getPurchaseConfirmationTextTemplate(data),
      };
    }
    case "purchase-members-area": {
      const data = getMockMembersAreaData();
      return {
        subject: `[PREVIEW] Acesso Liberado - Área de Membros • ${timestamp}`,
        htmlBody: getMembersAreaConfirmationTemplate(data),
        textBody: getMembersAreaConfirmationTextTemplate(data),
      };
    }
    case "purchase-external": {
      const data = getMockExternalData();
      return {
        subject: `[PREVIEW] Compra Confirmada - Entrega Externa • ${timestamp}`,
        htmlBody: getExternalDeliveryConfirmationTemplate(data),
        textBody: getExternalDeliveryConfirmationTextTemplate(data),
      };
    }
    case "new-sale": {
      const data = getMockNewSaleData();
      return {
        subject: `[PREVIEW] 💰 Nova Venda Realizada! • ${timestamp}`,
        htmlBody: getNewSaleTemplate(data),
        textBody: getNewSaleTextTemplate(data),
      };
    }
    case "pix-pending": {
      const data = getMockPaymentPendingData();
      return {
        subject: `[PREVIEW] Aguardando Pagamento PIX • ${timestamp}`,
        htmlBody: getPaymentPendingTemplate(data),
        textBody: getPaymentPendingTextTemplate(data),
      };
    }
    case "password-reset": {
      const data = getMockPasswordResetData();
      return {
        subject: `[PREVIEW] Redefinir Sua Senha • ${timestamp}`,
        htmlBody: getPasswordResetTemplate(data),
        textBody: getPasswordResetTextTemplate(data),
      };
    }
    case "student-invite": {
      const data = getMockStudentInviteData();
      return {
        subject: `[PREVIEW] Você Foi Convidado! • ${timestamp}`,
        htmlBody: getStudentInviteTemplate(data),
        textBody: getStudentInviteTextTemplate(data),
      };
    }
    case "gdpr-request": {
      const data = getMockGdprData();
      return {
        subject: `[PREVIEW] Confirme Sua Solicitação LGPD • ${timestamp}`,
        htmlBody: getGdprRequestTemplate(data),
        textBody: `Confirme sua solicitação LGPD para ${data.email}: ${data.confirmationLink}`,
      };
    }
    default:
      throw new Error(`Template não suportado: ${templateType}`);
  }
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req: Request) => {
  // CORS
  const corsResult = handleCorsV2(req);
  if (corsResult instanceof Response) return corsResult;
  const corsHeaders = corsResult.headers;

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = getSupabaseClient('general');

    // Rate Limiting
    const rateLimitResult = await rateLimitMiddleware(supabase, req, RATE_LIMIT_CONFIGS.SEND_EMAIL, corsHeaders);
    if (rateLimitResult) {
      log.warn(`Rate limit exceeded for IP: ${getClientIP(req)}`);
      return rateLimitResult;
    }

    // Auth
    const producer = await requireAuthenticatedProducer(supabase, req);
    log.info(`Preview request from producer ${producer.id}`);

    // Parse body
    const body: PreviewRequest = await req.json();
    const { templateType, recipientEmail } = body;

    if (!templateType) {
      return new Response(JSON.stringify({ error: "templateType é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Process template
    const { subject, htmlBody, textBody } = processTemplate(templateType);

    // Apply Email Size Guard
    const processed = processEmailHtml(htmlBody, { template: templateType, subject });
    
    if (!processed.validation.isValid) {
      log.error("Email size validation failed", {
        templateType,
        error: processed.validation.error,
      });
      return new Response(JSON.stringify({ 
        success: false, 
        error: processed.validation.error,
        sizeInfo: {
          byteLength: processed.minifiedByteLength,
          formattedSize: processed.validation.formattedSize,
          percentOfLimit: processed.validation.percentOfLimit,
        },
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine recipient (use producer email if not specified)
    const finalRecipient = recipientEmail || producer.email;

    // Send email (using minified HTML)
    const result = await sendEmail({
      to: { email: finalRecipient },
      subject,
      htmlBody: processed.html,
      textBody,
      type: "transactional",
      clientReference: `preview_${templateType}_${Date.now()}`,
    });

    if (!result.success) {
      log.error("Failed to send preview email:", result.error);
      return new Response(JSON.stringify({ 
        success: false, 
        error: result.error 
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    log.info(`Preview email sent: ${templateType} -> ${finalRecipient}`, {
      sizeInfo: {
        original: processed.originalByteLength,
        minified: processed.minifiedByteLength,
        saved: processed.savedBytes,
      },
    });

    return new Response(JSON.stringify({
      success: true,
      templateType,
      sentTo: finalRecipient,
      messageId: result.messageId,
      sizeInfo: {
        formattedSize: processed.validation.formattedSize,
        percentOfLimit: processed.validation.percentOfLimit,
        warning: processed.validation.warning,
      },
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro interno";
    log.error("Email preview error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: error instanceof Error && message.includes("não autenticado") ? 401 : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
