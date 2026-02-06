/**
 * members-area-certificates Edge Function
 * 
 * Handles certificate operations for the members area
 * 
 * @version 2.0.0 - RISE V3 Unified Auth
 */

import { getSupabaseClient } from "../_shared/supabase-client.ts";
import { 
  rateLimitMiddleware, 
  RATE_LIMIT_CONFIGS,
  getClientIP 
} from "../_shared/rate-limiting/index.ts";
import { requireAuthenticatedProducer, unauthorizedResponse } from "../_shared/unified-auth.ts";
import { getAuthenticatedUser } from "../_shared/unified-auth-v2.ts";
import { handleCorsV2 } from "../_shared/cors-v2.ts";
import { createLogger } from "../_shared/logger.ts";

const log = createLogger("members-area-certificates");

interface CertificateRequest {
  action: "list-templates" | "get-template" | "create-template" | "update-template" | "delete-template" | "generate" | "verify" | "list-buyer-certificates";
  product_id?: string;
  template_id?: string;
  certificate_id?: string;
  verification_code?: string;
  data?: {
    name?: string;
    template_html?: string;
    primary_color?: string;
    secondary_color?: string;
    logo_url?: string;
    background_image_url?: string;
    is_default?: boolean;
  };
}

function generateVerificationCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 12; i++) {
    if (i > 0 && i % 4 === 0) code += "-";
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

Deno.serve(async (req) => {
  // CORS V2 handler
  const corsResult = handleCorsV2(req);
  if (corsResult instanceof Response) {
    return corsResult;
  }
  const corsHeaders = corsResult.headers;

  try {
    const supabase = getSupabaseClient('general');

    // VULN-002: Rate limiting para members area
    const rateLimitResult = await rateLimitMiddleware(
      supabase, 
      req, 
      RATE_LIMIT_CONFIGS.MEMBERS_AREA,
      corsHeaders
    );
    if (rateLimitResult) {
      log.warn(`Rate limit exceeded for IP: ${getClientIP(req)}`);
      return rateLimitResult;
    }

    const body: CertificateRequest = await req.json();
    const { action, product_id, template_id, verification_code, data } = body;

    log.info(`Action: ${action}`);

    // Ações públicas (verificação)
    if (action === "verify") {
      if (!verification_code) {
        return new Response(
          JSON.stringify({ error: "verification_code required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: certificate, error } = await supabase
        .from("certificates")
        .select(`
          *,
          template:certificate_templates(name)
        `)
        .eq("verification_code", verification_code.toUpperCase())
        .single();

      if (error || !certificate) {
        return new Response(
          JSON.stringify({ success: false, valid: false, message: "Certificate not found" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          valid: true,
          certificate: {
            buyer_name: certificate.buyer_name,
            product_name: certificate.product_name,
            completion_date: certificate.completion_date,
            verification_code: certificate.verification_code,
          }
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // RISE V3: Ações de buyer - usar unified-auth-v2 via cookie
    if (action === "generate" || action === "list-buyer-certificates") {
      const user = await getAuthenticatedUser(supabase, req);
      
      if (!user) {
        return new Response(
          JSON.stringify({ error: "Authentication required" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const buyer_id = user.id;

      if (action === "list-buyer-certificates") {
        const { data: certificates, error } = await supabase
          .from("certificates")
          .select("*")
          .eq("buyer_id", buyer_id)
          .order("created_at", { ascending: false });

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, certificates }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (action === "generate") {
        if (!product_id) {
          return new Response(
            JSON.stringify({ error: "product_id required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Verificar se já existe certificado
        const { data: existing } = await supabase
          .from("certificates")
          .select("id, verification_code")
          .eq("buyer_id", buyer_id)
          .eq("product_id", product_id)
          .single();

        if (existing) {
          return new Response(
            JSON.stringify({ 
              success: true, 
              certificate: existing,
              message: "Certificate already exists"
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Verificar se completou 100% do curso
        const { data: modules } = await supabase
          .from("product_member_modules")
          .select("id")
          .eq("product_id", product_id)
          .eq("is_active", true);

        if (!modules?.length) {
          return new Response(
            JSON.stringify({ error: "No modules found for this product" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const moduleIds = modules.map(m => m.id);

        const { data: contents } = await supabase
          .from("product_member_content")
          .select("id")
          .in("module_id", moduleIds)
          .eq("is_active", true);

        if (!contents?.length) {
          return new Response(
            JSON.stringify({ error: "No content found for this product" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const contentIds = contents.map(c => c.id);

        const { data: progress } = await supabase
          .from("buyer_content_progress")
          .select("content_id, completed_at")
          .eq("buyer_id", buyer_id)
          .in("content_id", contentIds)
          .not("completed_at", "is", null);

        const completedCount = progress?.length || 0;
        const totalCount = contents.length;

        if (completedCount < totalCount) {
          return new Response(
            JSON.stringify({ 
              error: "Course not completed",
              progress: {
                completed: completedCount,
                total: totalCount,
                percent: Math.round((completedCount / totalCount) * 100),
              }
            }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Buscar dados do buyer e produto
        const [userResult, productResult] = await Promise.all([
          supabase.from("users").select("name, email").eq("id", buyer_id).single(),
          supabase.from("products").select("name").eq("id", product_id).single(),
        ]);

        const buyerName = userResult.data?.name || userResult.data?.email || "Aluno";
        const productName = productResult.data?.name || "Curso";

        // Buscar template default
        const { data: template } = await supabase
          .from("certificate_templates")
          .select("id")
          .eq("product_id", product_id)
          .eq("is_default", true)
          .eq("is_active", true)
          .single();

        // Gerar certificado
        const verificationCode = generateVerificationCode();

        const { data: certificate, error: certError } = await supabase
          .from("certificates")
          .insert({
            buyer_id,
            product_id,
            template_id: template?.id || null,
            buyer_name: buyerName,
            product_name: productName,
            verification_code: verificationCode,
            completion_date: new Date().toISOString(),
          })
          .select()
          .single();

        if (certError) throw certError;

        log.info(`Generated certificate ${certificate.id} for buyer ${buyer_id}`);

        return new Response(
          JSON.stringify({ success: true, certificate }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Ações de vendedor (templates) - autenticar via unified-auth
    let producer;
    try {
      producer = await requireAuthenticatedProducer(supabase, req);
    } catch {
      return unauthorizedResponse(corsHeaders);
    }

    // Verificar ownership do produto
    if (product_id) {
      const { data: product } = await supabase
        .from("products")
        .select("user_id")
        .eq("id", product_id)
        .single();

      if (!product || product.user_id !== producer.id) {
        return new Response(
          JSON.stringify({ error: "Access denied" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    switch (action) {
      case "list-templates": {
        if (!product_id) {
          return new Response(
            JSON.stringify({ error: "product_id required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: templates, error } = await supabase
          .from("certificate_templates")
          .select("*")
          .eq("product_id", product_id)
          .order("created_at", { ascending: true });

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, templates }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "get-template": {
        if (!template_id) {
          return new Response(
            JSON.stringify({ error: "template_id required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: template, error } = await supabase
          .from("certificate_templates")
          .select("*")
          .eq("id", template_id)
          .single();

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, template }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "create-template": {
        if (!product_id || !data?.name) {
          return new Response(
            JSON.stringify({ error: "product_id and name required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: template, error } = await supabase
          .from("certificate_templates")
          .insert({
            product_id,
            name: data.name,
            template_html: data.template_html || null,
            primary_color: data.primary_color || "#10B981",
            secondary_color: data.secondary_color || "#1F2937",
            logo_url: data.logo_url || null,
            background_image_url: data.background_image_url || null,
            is_default: data.is_default || false,
            is_active: true,
          })
          .select()
          .single();

        if (error) throw error;

        log.info(`Created template: ${template.id}`);

        return new Response(
          JSON.stringify({ success: true, template }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "update-template": {
        if (!template_id || !data) {
          return new Response(
            JSON.stringify({ error: "template_id and data required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const updateData: Record<string, unknown> = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.template_html !== undefined) updateData.template_html = data.template_html;
        if (data.primary_color !== undefined) updateData.primary_color = data.primary_color;
        if (data.secondary_color !== undefined) updateData.secondary_color = data.secondary_color;
        if (data.logo_url !== undefined) updateData.logo_url = data.logo_url;
        if (data.background_image_url !== undefined) updateData.background_image_url = data.background_image_url;
        if (data.is_default !== undefined) updateData.is_default = data.is_default;

        const { error } = await supabase
          .from("certificate_templates")
          .update(updateData)
          .eq("id", template_id);

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "delete-template": {
        if (!template_id) {
          return new Response(
            JSON.stringify({ error: "template_id required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error } = await supabase
          .from("certificate_templates")
          .update({ is_active: false })
          .eq("id", template_id);

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error: unknown) {
    log.error("Error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
