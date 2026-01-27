/**
 * ============================================================================
 * RLS Documentation Generator
 * ============================================================================
 * 
 * Edge Function que gera documentação automática de todas as políticas RLS
 * do schema public em formato Markdown.
 * 
 * Endpoints:
 * - GET /rls-documentation-generator → Retorna Markdown da documentação
 * 
 * ============================================================================
 * @version 1.0.0 - RISE Protocol V3 Compliant
 * ============================================================================
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCorsV2 } from "../_shared/cors-v2.ts";
import { createLogger } from "../_shared/logger.ts";

const log = createLogger("rls-documentation-generator");

// ============================================================================
// TYPES
// ============================================================================

interface RlsDocSection {
  section: string;
  content: string;
}

// ============================================================================
// HANDLER
// ============================================================================

Deno.serve(async (req: Request) => {
  // CORS
  const corsResult = handleCorsV2(req);
  
  // Se for Response (preflight ou origin bloqueado), retorna direto
  if (corsResult instanceof Response) {
    return corsResult;
  }
  
  const corsHeaders = corsResult.headers;

  try {
    // Criar cliente Supabase com service_role
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    log.info("Generating RLS documentation...");

    // Chamar função SQL que gera a documentação
    const { data, error } = await supabase.rpc("generate_rls_documentation");

    if (error) {
      log.error("Database error", { error: error.message });
      return new Response(
        JSON.stringify({ 
          error: "Failed to generate documentation", 
          details: error.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Montar documento Markdown a partir das seções
    const sections = data as RlsDocSection[];
    let markdown = "";

    // Ordenar seções: header, summary, details_header, tables, footer
    const orderedSections = sections.sort((a, b) => {
      const order = ["header", "summary", "details_header"];
      const aOrder = order.indexOf(a.section);
      const bOrder = order.indexOf(b.section);
      
      if (aOrder !== -1 && bOrder !== -1) return aOrder - bOrder;
      if (aOrder !== -1) return -1;
      if (bOrder !== -1) return 1;
      if (a.section === "footer") return 1;
      if (b.section === "footer") return -1;
      return a.section.localeCompare(b.section);
    });

    for (const section of orderedSections) {
      markdown += section.content;
    }

    log.info("Documentation generated", { chars: markdown.length });

    // Verificar se quer JSON ou Markdown
    const acceptHeader = req.headers.get("Accept") || "";
    const wantsJson = acceptHeader.includes("application/json");

    if (wantsJson) {
      return new Response(
        JSON.stringify({
          success: true,
          generatedAt: new Date().toISOString(),
          sections: sections.length,
          markdown,
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Retornar Markdown puro
    return new Response(markdown, {
      headers: { 
        ...corsHeaders, 
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": 'inline; filename="RLS_PERMISSIONS_MATRIX.md"'
      }
    });

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    log.error("Exception", { error: errorMessage });

    return new Response(
      JSON.stringify({ error: "Internal server error", details: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
