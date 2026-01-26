/**
 * Edge Function: email-preview
 * 
 * Endpoint para disparo de emails de preview/teste.
 * Permite visualizar qualquer template sem criar registros no banco.
 * 
 * @version 1.0.0 - RISE V3 Compliance
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCorsV2 } from "../_shared/cors-v2.ts";
import { requireAuthenticatedProducer } from "../_shared/unified-auth.ts";
import { rateLimitMiddleware, RATE_LIMIT_CONFIGS, getClientIP } from "../_shared/rate-limiting/index.ts";
import { sendEmail } from "../_shared/zeptomail.ts";
import { createLogger } from "../_shared/logger.ts";

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

function getPasswordResetTemplate(data: { name: string; resetLink: string }): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><title>[PREVIEW] Redefinir Senha</title></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #6366f1;">Redefinir Senha</h1>
  <p>Olá, ${data.name}!</p>
  <p>Você solicitou a redefinição da sua senha. Clique no botão abaixo:</p>
  <a href="${data.resetLink}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">Redefinir Senha</a>
  <p style="color: #666; margin-top: 20px;">Este link expira em 1 hora.</p>
  <hr style="margin-top: 30px; border: none; border-top: 1px solid #eee;">
  <p style="color: #999; font-size: 12px;">Rise Checkout</p>
</body>
</html>`;
}

function getStudentInviteTemplate(data: { studentName: string; productName: string; producerName: string; accessLink: string }): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><title>[PREVIEW] Convite de Acesso</title></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #10b981;">Você Foi Convidado!</h1>
  <p>Olá, ${data.studentName}!</p>
  <p><strong>${data.producerName}</strong> liberou seu acesso ao produto <strong>"${data.productName}"</strong>.</p>
  <a href="${data.accessLink}" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">Acessar Agora</a>
  <hr style="margin-top: 30px; border: none; border-top: 1px solid #eee;">
  <p style="color: #999; font-size: 12px;">Rise Checkout</p>
</body>
</html>`;
}

function getGdprRequestTemplate(data: { email: string; confirmationLink: string }): string {
  return `
<!DOCTYPE html>
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
  switch (templateType) {
    case "purchase-standard": {
      const data = getMockPurchaseData();
      return {
        subject: "[PREVIEW] Compra Confirmada - Rise Checkout",
        htmlBody: getPurchaseConfirmationTemplate(data),
        textBody: getPurchaseConfirmationTextTemplate(data),
      };
    }
    case "purchase-members-area": {
      const data = getMockMembersAreaData();
      return {
        subject: "[PREVIEW] Acesso Liberado - Área de Membros",
        htmlBody: getMembersAreaConfirmationTemplate(data),
        textBody: getMembersAreaConfirmationTextTemplate(data),
      };
    }
    case "purchase-external": {
      const data = getMockExternalData();
      return {
        subject: "[PREVIEW] Compra Confirmada - Entrega Externa",
        htmlBody: getExternalDeliveryConfirmationTemplate(data),
        textBody: getExternalDeliveryConfirmationTextTemplate(data),
      };
    }
    case "new-sale": {
      const data = getMockNewSaleData();
      return {
        subject: "[PREVIEW] 💰 Nova Venda Realizada!",
        htmlBody: getNewSaleTemplate(data),
        textBody: getNewSaleTextTemplate(data),
      };
    }
    case "pix-pending": {
      const data = getMockPaymentPendingData();
      return {
        subject: "[PREVIEW] Aguardando Pagamento PIX",
        htmlBody: getPaymentPendingTemplate(data),
        textBody: getPaymentPendingTextTemplate(data),
      };
    }
    case "password-reset": {
      const data = getMockPasswordResetData();
      return {
        subject: "[PREVIEW] Redefinir Sua Senha",
        htmlBody: getPasswordResetTemplate(data),
        textBody: `Olá ${data.name}, clique no link para redefinir sua senha: ${data.resetLink}`,
      };
    }
    case "student-invite": {
      const data = getMockStudentInviteData();
      return {
        subject: "[PREVIEW] Você Foi Convidado!",
        htmlBody: getStudentInviteTemplate(data),
        textBody: `Olá ${data.studentName}, ${data.producerName} liberou seu acesso ao ${data.productName}. Acesse: ${data.accessLink}`,
      };
    }
    case "gdpr-request": {
      const data = getMockGdprData();
      return {
        subject: "[PREVIEW] Confirme Sua Solicitação LGPD",
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    // Determine recipient (use producer email if not specified)
    const finalRecipient = recipientEmail || producer.email;

    // Send email
    const result = await sendEmail({
      to: { email: finalRecipient },
      subject,
      htmlBody,
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

    log.info(`Preview email sent: ${templateType} -> ${finalRecipient}`);

    return new Response(JSON.stringify({
      success: true,
      templateType,
      sentTo: finalRecipient,
      messageId: result.messageId,
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
