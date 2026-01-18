/**
 * Edge Function: gdpr-request
 * 
 * Inicia o processo de Direito ao Esquecimento (LGPD Art. 18).
 * Gera token de verificação e envia email de confirmação.
 * 
 * @endpoint POST /gdpr-request
 * @public Não requer autenticação (qualquer pessoa pode solicitar)
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors } from "../_shared/cors.ts";
import { rateLimitMiddleware, getClientIP } from "../_shared/rate-limiting/index.ts";
import { sendEmail } from "../_shared/zeptomail.ts";

// ============================================================================
// TYPES
// ============================================================================

interface GdprRequestBody {
  email: string;
}

interface GdprRequestResponse {
  success: boolean;
  message: string;
  request_id?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Gera token seguro de 32 caracteres
 */
function generateSecureToken(): string {
  const array = new Uint8Array(24);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Valida formato de email
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Gera HTML do email de confirmação
 */
function generateConfirmationEmailHtml(verificationUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmação de Exclusão de Dados - LGPD</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 32px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">
        ⚠️ Solicitação de Exclusão de Dados
      </h1>
    </div>
    
    <!-- Content -->
    <div style="padding: 32px;">
      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-top: 0;">
        Recebemos uma solicitação de <strong>exclusão permanente</strong> de todos os seus dados pessoais em nossa plataforma, conforme previsto na Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018).
      </p>
      
      <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin: 24px 0; border-radius: 0 4px 4px 0;">
        <p style="color: #991b1b; font-size: 14px; margin: 0; font-weight: 600;">
          ⚠️ ATENÇÃO: Esta ação é IRREVERSÍVEL
        </p>
        <p style="color: #991b1b; font-size: 14px; margin: 8px 0 0 0;">
          Após a confirmação, seus dados pessoais serão permanentemente anonimizados e não poderão ser recuperados.
        </p>
      </div>
      
      <h2 style="color: #111827; font-size: 18px; margin: 24px 0 12px 0;">
        O que será anonimizado:
      </h2>
      <ul style="color: #374151; font-size: 14px; line-height: 1.8; padding-left: 20px;">
        <li>Seu nome e email em todos os registros</li>
        <li>Telefone e CPF/CNPJ</li>
        <li>Endereço IP e dados de navegação</li>
        <li>Histórico de acesso à área de membros</li>
      </ul>
      
      <h2 style="color: #111827; font-size: 18px; margin: 24px 0 12px 0;">
        O que será mantido (obrigação legal):
      </h2>
      <ul style="color: #374151; font-size: 14px; line-height: 1.8; padding-left: 20px;">
        <li>Registros fiscais de transações (por 5 anos)</li>
        <li>Valores e datas de compras (anonimizados)</li>
      </ul>
      
      <!-- CTA Button -->
      <div style="text-align: center; margin: 32px 0;">
        <a href="${verificationUrl}" 
           style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(220, 38, 38, 0.3);">
          Confirmar Exclusão de Dados
        </a>
      </div>
      
      <p style="color: #6b7280; font-size: 14px; text-align: center;">
        Este link expira em <strong>24 horas</strong>.
      </p>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
      
      <p style="color: #6b7280; font-size: 12px; text-align: center; margin: 0;">
        Se você não solicitou esta exclusão, ignore este email. Seus dados permanecerão seguros.
      </p>
    </div>
    
    <!-- Footer -->
    <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">
        Rise Checkout - Proteção de Dados Pessoais (LGPD)
      </p>
    </div>
  </div>
</body>
</html>
`;
}

// ============================================================================
// RATE LIMIT CONFIG
// ============================================================================

const GDPR_REQUEST_RATE_LIMIT = {
  action: "gdpr_request",
  maxAttempts: 3,          // Máximo 3 solicitações
  windowMinutes: 60,       // Por hora
  blockDurationMinutes: 60 // Bloqueia por 1 hora se exceder
};

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req: Request) => {
  // 1. CORS
  const corsResult = handleCors(req);
  if (corsResult instanceof Response) {
    return corsResult;
  }
  const corsHeaders = corsResult.headers;

  // 2. Only POST
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // 3. Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 4. Rate limiting
    const rateLimitResult = await rateLimitMiddleware(
      supabase,
      req,
      GDPR_REQUEST_RATE_LIMIT,
      corsHeaders
    );
    if (rateLimitResult) {
      return rateLimitResult;
    }

    // 5. Parse body
    const body: GdprRequestBody = await req.json();

    // 6. Validação
    if (!body.email) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Email é obrigatório" 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const email = body.email.trim().toLowerCase();

    if (!isValidEmail(email)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Formato de email inválido" 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 7. Verificar limite de solicitações para este email
    const { data: limitCheck, error: limitError } = await supabase
      .rpc("check_gdpr_request_limit", { p_email: email });

    if (limitError) {
      console.error("[gdpr-request] Erro ao verificar limite:", limitError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Erro interno. Tente novamente mais tarde." 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (limitCheck && limitCheck.length > 0 && !limitCheck[0].can_request) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: limitCheck[0].reason || "Limite de solicitações atingido" 
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 8. Gerar token e criar solicitação
    const verificationToken = generateSecureToken();
    const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    const { data: gdprRequest, error: insertError } = await supabase
      .from("gdpr_requests")
      .insert({
        email: email,
        verification_token: verificationToken,
        token_expires_at: tokenExpiresAt.toISOString(),
        ip_address: getClientIP(req),
        user_agent: req.headers.get("user-agent") || "unknown",
        status: "pending"
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("[gdpr-request] Erro ao criar solicitação:", insertError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Erro ao processar solicitação. Tente novamente." 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 9. Construir URL de verificação
    const publicSiteUrl = Deno.env.get("PUBLIC_SITE_URL") || "https://risecheckout.com";
    const verificationUrl = `${publicSiteUrl}/lgpd/confirmar?token=${verificationToken}`;

    // 10. Enviar email de confirmação
    const emailResult = await sendEmail({
      to: { email: email },
      subject: "⚠️ Confirmação de Exclusão de Dados - LGPD",
      htmlBody: generateConfirmationEmailHtml(verificationUrl),
      textBody: `
Confirmação de Exclusão de Dados - LGPD

Recebemos uma solicitação de exclusão permanente de todos os seus dados pessoais em nossa plataforma.

ATENÇÃO: Esta ação é IRREVERSÍVEL. Após a confirmação, seus dados serão permanentemente anonimizados.

Para confirmar, acesse: ${verificationUrl}

Este link expira em 24 horas.

Se você não solicitou esta exclusão, ignore este email.

Rise Checkout - Proteção de Dados Pessoais
      `.trim(),
      type: "transactional"
    });

    if (!emailResult.success) {
      console.error("[gdpr-request] Erro ao enviar email:", emailResult.error);
      
      // Marcar solicitação como rejeitada
      await supabase
        .from("gdpr_requests")
        .update({ 
          status: "rejected",
          rejection_reason: "Falha no envio do email de confirmação"
        })
        .eq("id", gdprRequest.id);

      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Não foi possível enviar o email de confirmação. Verifique se o email está correto." 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 11. Log de auditoria
    await supabase
      .from("gdpr_audit_log")
      .insert({
        gdpr_request_id: gdprRequest.id,
        action: "REQUEST_CREATED",
        ip_address: getClientIP(req),
        metadata: {
          email_sent: true,
          expires_at: tokenExpiresAt.toISOString()
        }
      });

    console.log(`[gdpr-request] Solicitação criada: ${gdprRequest.id} para ${email}`);

    // 12. Resposta de sucesso
    const response: GdprRequestResponse = {
      success: true,
      message: "Email de confirmação enviado. Verifique sua caixa de entrada (e spam).",
      request_id: gdprRequest.id
    };

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("[gdpr-request] Erro inesperado:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        message: "Erro interno. Tente novamente mais tarde." 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
