/**
 * Edge Function: gdpr-forget
 * 
 * Processa o Direito ao Esquecimento (LGPD Art. 18).
 * Anonimiza dados pessoais em todas as tabelas relevantes.
 * 
 * @endpoint POST /gdpr-forget
 * @public Requer token de verificação válido
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCorsV2 } from "../_shared/cors-v2.ts";
import { rateLimitMiddleware, getClientIP } from "../_shared/rate-limiting/index.ts";
import { sendEmail } from "../_shared/zeptomail.ts";

// ============================================================================
// TYPES
// ============================================================================

interface GdprForgetBody {
  token: string;
  confirm: boolean;
}

interface AnonymizationResult {
  table: string;
  records_affected: number;
  fields_anonymized: string[];
}

interface GdprForgetResponse {
  success: boolean;
  message: string;
  summary?: {
    total_records: number;
    tables_affected: AnonymizationResult[];
  };
}

// ============================================================================
// CONSTANTS
// ============================================================================

const ANONYMIZED_EMAIL_DOMAIN = "@anonimizado.lgpd";
const ANONYMIZED_NAME = "Usuário Anonimizado";
const ANONYMIZED_IP = "0.0.0.0";

// Rate limit específico para forget (muito restritivo)
const GDPR_FORGET_RATE_LIMIT = {
  action: "gdpr_forget",
  maxAttempts: 5,
  windowMinutes: 60,
  blockDurationMinutes: 120
};

// ============================================================================
// ANONYMIZATION FUNCTIONS
// ============================================================================

/**
 * Gera email anonimizado único
 */
function generateAnonymizedEmail(originalEmail: string): string {
  const hash = Array.from(
    new Uint8Array(
      new TextEncoder().encode(originalEmail + Date.now().toString())
    )
  ).slice(0, 8).map(b => b.toString(16).padStart(2, '0')).join('');
  
  return `anon_${hash}${ANONYMIZED_EMAIL_DOMAIN}`;
}

/**
 * Anonimiza registros na tabela orders
 */
async function anonymizeOrders(
  supabase: SupabaseClient,
  email: string,
  anonymizedEmail: string
): Promise<AnonymizationResult> {
  const { data: orders, error: fetchError } = await supabase
    .from("orders")
    .select("id")
    .eq("customer_email", email);

  if (fetchError || !orders || orders.length === 0) {
    return { table: "orders", records_affected: 0, fields_anonymized: [] };
  }

  const orderIds = orders.map(o => o.id);

  const { error: updateError } = await supabase
    .from("orders")
    .update({
      customer_email: anonymizedEmail,
      customer_name: ANONYMIZED_NAME,
      customer_phone: null,
      customer_document: null,
      customer_ip: ANONYMIZED_IP
    })
    .in("id", orderIds);

  if (updateError) {
    console.error("[gdpr-forget] Erro ao anonimizar orders:", updateError);
    throw new Error(`Falha ao anonimizar orders: ${updateError.message}`);
  }

  return {
    table: "orders",
    records_affected: orders.length,
    fields_anonymized: ["customer_email", "customer_name", "customer_phone", "customer_document", "customer_ip"]
  };
}

/**
 * Anonimiza registros na tabela buyer_profiles
 */
async function anonymizeBuyerProfiles(
  supabase: SupabaseClient,
  email: string,
  anonymizedEmail: string
): Promise<AnonymizationResult> {
  const { data: profiles, error: fetchError } = await supabase
    .from("buyer_profiles")
    .select("id")
    .eq("email", email);

  if (fetchError || !profiles || profiles.length === 0) {
    return { table: "buyer_profiles", records_affected: 0, fields_anonymized: [] };
  }

  const profileIds = profiles.map(p => p.id);

  const { error: updateError } = await supabase
    .from("buyer_profiles")
    .update({
      email: anonymizedEmail,
      name: ANONYMIZED_NAME,
      phone: null,
      document_hash: null,
      document_encrypted: null,
      password_hash: "ANONYMIZED",
      is_active: false
    })
    .in("id", profileIds);

  if (updateError) {
    console.error("[gdpr-forget] Erro ao anonimizar buyer_profiles:", updateError);
    throw new Error(`Falha ao anonimizar buyer_profiles: ${updateError.message}`);
  }

  // Invalidar todas as sessões do buyer
  await supabase
    .from("buyer_sessions")
    .update({ is_valid: false })
    .in("buyer_id", profileIds);

  return {
    table: "buyer_profiles",
    records_affected: profiles.length,
    fields_anonymized: ["email", "name", "phone", "document_hash", "document_encrypted", "password_hash"]
  };
}

/**
 * Anonimiza registros na tabela buyer_sessions
 */
async function anonymizeBuyerSessions(
  supabase: SupabaseClient,
  email: string
): Promise<AnonymizationResult> {
  // Primeiro buscar buyer_ids pelo email
  const { data: profiles } = await supabase
    .from("buyer_profiles")
    .select("id")
    .eq("email", email);

  if (!profiles || profiles.length === 0) {
    return { table: "buyer_sessions", records_affected: 0, fields_anonymized: [] };
  }

  const buyerIds = profiles.map(p => p.id);

  const { data: sessions, error: fetchError } = await supabase
    .from("buyer_sessions")
    .select("id")
    .in("buyer_id", buyerIds);

  if (fetchError || !sessions || sessions.length === 0) {
    return { table: "buyer_sessions", records_affected: 0, fields_anonymized: [] };
  }

  const { error: updateError } = await supabase
    .from("buyer_sessions")
    .update({
      ip_address: ANONYMIZED_IP,
      user_agent: "ANONYMIZED",
      is_valid: false
    })
    .in("id", sessions.map(s => s.id));

  if (updateError) {
    console.error("[gdpr-forget] Erro ao anonimizar buyer_sessions:", updateError);
  }

  return {
    table: "buyer_sessions",
    records_affected: sessions.length,
    fields_anonymized: ["ip_address", "user_agent"]
  };
}

/**
 * Anonimiza registros na tabela checkout_visits (por IP)
 */
async function anonymizeCheckoutVisits(
  supabase: SupabaseClient,
  ipAddress: string | null
): Promise<AnonymizationResult> {
  if (!ipAddress || ipAddress === "unknown") {
    return { table: "checkout_visits", records_affected: 0, fields_anonymized: [] };
  }

  const { data: visits, error: fetchError } = await supabase
    .from("checkout_visits")
    .select("id")
    .eq("ip_address", ipAddress);

  if (fetchError || !visits || visits.length === 0) {
    return { table: "checkout_visits", records_affected: 0, fields_anonymized: [] };
  }

  const { error: updateError } = await supabase
    .from("checkout_visits")
    .update({
      ip_address: ANONYMIZED_IP,
      user_agent: "ANONYMIZED"
    })
    .in("id", visits.map(v => v.id));

  if (updateError) {
    console.error("[gdpr-forget] Erro ao anonimizar checkout_visits:", updateError);
  }

  return {
    table: "checkout_visits",
    records_affected: visits.length,
    fields_anonymized: ["ip_address", "user_agent"]
  };
}

/**
 * Gera email de confirmação de anonimização
 */
function generateCompletionEmailHtml(summary: { total_records: number; tables_affected: AnonymizationResult[] }): string {
  const tableRows = summary.tables_affected
    .filter(t => t.records_affected > 0)
    .map(t => `
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">${t.table}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${t.records_affected}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">${t.fields_anonymized.join(", ")}</td>
      </tr>
    `).join("");

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dados Anonimizados com Sucesso - LGPD</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 32px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">
        ✅ Dados Anonimizados com Sucesso
      </h1>
    </div>
    
    <!-- Content -->
    <div style="padding: 32px;">
      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-top: 0;">
        Sua solicitação de exclusão de dados foi processada com sucesso, conforme previsto na Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018).
      </p>
      
      <div style="background-color: #ecfdf5; border-left: 4px solid #059669; padding: 16px; margin: 24px 0; border-radius: 0 4px 4px 0;">
        <p style="color: #047857; font-size: 16px; margin: 0; font-weight: 600;">
          Total de registros anonimizados: ${summary.total_records}
        </p>
      </div>
      
      <h2 style="color: #111827; font-size: 18px; margin: 24px 0 12px 0;">
        Resumo da Anonimização:
      </h2>
      
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <thead>
          <tr style="background-color: #f9fafb;">
            <th style="padding: 8px 12px; text-align: left; font-size: 14px; color: #6b7280;">Tabela</th>
            <th style="padding: 8px 12px; text-align: center; font-size: 14px; color: #6b7280;">Registros</th>
            <th style="padding: 8px 12px; text-align: left; font-size: 14px; color: #6b7280;">Campos</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows || '<tr><td colspan="3" style="padding: 8px 12px; text-align: center; color: #6b7280;">Nenhum registro encontrado</td></tr>'}
        </tbody>
      </table>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
      
      <p style="color: #6b7280; font-size: 14px;">
        <strong>Importante:</strong> Os dados foram permanentemente anonimizados e não podem ser recuperados. 
        Registros fiscais foram mantidos conforme obrigação legal, mas sem dados pessoais identificáveis.
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
// MAIN HANDLER
// ============================================================================

serve(async (req: Request) => {
  // 1. CORS (V2 - environment-aware)
  const corsResult = handleCorsV2(req);
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
      GDPR_FORGET_RATE_LIMIT,
      corsHeaders
    );
    if (rateLimitResult) {
      return rateLimitResult;
    }

    // 5. Parse body
    const body: GdprForgetBody = await req.json();

    // 6. Validação
    if (!body.token) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Token de verificação é obrigatório" 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!body.confirm) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Confirmação é obrigatória para prosseguir" 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 7. Buscar solicitação pelo token
    const { data: gdprRequest, error: fetchError } = await supabase
      .from("gdpr_requests")
      .select("*")
      .eq("verification_token", body.token)
      .single();

    if (fetchError || !gdprRequest) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Token inválido ou expirado" 
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 8. Verificar status
    if (gdprRequest.status === "completed") {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Esta solicitação já foi processada" 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (gdprRequest.status === "rejected") {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Esta solicitação foi rejeitada" 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 9. Verificar expiração
    const tokenExpires = new Date(gdprRequest.token_expires_at);
    if (tokenExpires < new Date()) {
      await supabase
        .from("gdpr_requests")
        .update({ status: "expired" })
        .eq("id", gdprRequest.id);

      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Token expirado. Faça uma nova solicitação." 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 10. Marcar como em processamento
    await supabase
      .from("gdpr_requests")
      .update({ 
        status: "processing",
        verified_at: new Date().toISOString()
      })
      .eq("id", gdprRequest.id);

    // 11. Gerar email anonimizado
    const email = gdprRequest.email;
    const anonymizedEmail = generateAnonymizedEmail(email);

    // 12. Log de início
    await supabase
      .from("gdpr_audit_log")
      .insert({
        gdpr_request_id: gdprRequest.id,
        action: "ANONYMIZATION_STARTED",
        original_email_hash: await supabase.rpc("hash_email", { p_email: email }).then(r => r.data),
        anonymized_email: anonymizedEmail,
        ip_address: getClientIP(req)
      });

    // 13. Executar anonimização em todas as tabelas
    const results: AnonymizationResult[] = [];
    
    try {
      // Orders
      const ordersResult = await anonymizeOrders(supabase, email, anonymizedEmail);
      results.push(ordersResult);

      // Buyer Profiles
      const profilesResult = await anonymizeBuyerProfiles(supabase, email, anonymizedEmail);
      results.push(profilesResult);

      // Buyer Sessions
      const sessionsResult = await anonymizeBuyerSessions(supabase, email);
      results.push(sessionsResult);

      // Checkout Visits (por IP da solicitação original)
      const visitsResult = await anonymizeCheckoutVisits(supabase, gdprRequest.ip_address);
      results.push(visitsResult);

    } catch (anonError: unknown) {
      console.error("[gdpr-forget] Erro durante anonimização:", anonError);
      
      await supabase
        .from("gdpr_requests")
        .update({ 
          status: "rejected",
          rejection_reason: anonError instanceof Error ? anonError.message : "Erro durante processamento"
        })
        .eq("id", gdprRequest.id);

      await supabase
        .from("gdpr_audit_log")
        .insert({
          gdpr_request_id: gdprRequest.id,
          action: "ANONYMIZATION_FAILED",
          ip_address: getClientIP(req),
          metadata: { error: anonError instanceof Error ? anonError.message : "Unknown error" }
        });

      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Erro durante o processo de anonimização. Nossa equipe foi notificada." 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 14. Calcular totais
    const totalRecords = results.reduce((sum, r) => sum + r.records_affected, 0);

    // 15. Atualizar solicitação como concluída
    await supabase
      .from("gdpr_requests")
      .update({ 
        status: "completed",
        processed_at: new Date().toISOString(),
        tables_affected: results,
        records_anonymized: totalRecords
      })
      .eq("id", gdprRequest.id);

    // 16. Log de conclusão
    await supabase
      .from("gdpr_audit_log")
      .insert({
        gdpr_request_id: gdprRequest.id,
        action: "ANONYMIZATION_COMPLETED",
        records_affected: totalRecords,
        ip_address: getClientIP(req),
        metadata: { tables: results }
      });

    // 17. Enviar email de confirmação (para o email original, última vez)
    const summary = { total_records: totalRecords, tables_affected: results };
    
    await sendEmail({
      to: { email: email },
      subject: "✅ Seus dados foram anonimizados com sucesso - LGPD",
      htmlBody: generateCompletionEmailHtml(summary),
      type: "transactional"
    });

    console.log(`[gdpr-forget] Anonimização concluída: ${totalRecords} registros em ${results.filter(r => r.records_affected > 0).length} tabelas`);

    // 18. Resposta de sucesso
    const response: GdprForgetResponse = {
      success: true,
      message: "Seus dados foram anonimizados com sucesso.",
      summary: summary
    };

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("[gdpr-forget] Erro inesperado:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        message: "Erro interno. Tente novamente mais tarde." 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
