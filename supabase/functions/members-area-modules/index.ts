/**
 * members-area-modules Edge Function (ROUTER)
 * 
 * RISE Protocol Compliant - Refactored to Router Pattern
 * All logic delegated to _shared handlers
 * 
 * Actions:
 * - list: List modules for a product
 * - create: Create new module
 * - update: Update module
 * - delete: Delete module
 * - reorder: Reorder modules
 * - save-sections: Save builder sections
 * - save-builder-settings: Save builder settings
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCorsV2 } from "../_shared/cors-v2.ts";
import { withSentry } from "../_shared/sentry.ts";
import { requireAuthenticatedProducer, unauthorizedResponse } from "../_shared/unified-auth.ts";
import { createLogger } from "../_shared/logger.ts";

const log = createLogger("members-area-modules");

// Handlers
import {
  handleListModules,
  handleCreateModule,
  handleUpdateModule,
  handleDeleteModule,
  handleReorderModules,
} from "../_shared/members-area-handlers.ts";

import {
  handleSaveSections,
  handleSaveBuilderSettings,
} from "../_shared/members-area-sections-handlers.ts";

// Shared helpers
import { jsonResponse, errorResponse } from "../_shared/edge-helpers.ts";

// ============================================
// TYPES
// ============================================
interface MemberSection {
  id: string;
  type: string;
  title?: string | null;
  position: number;
  settings?: Record<string, unknown>;
  is_active?: boolean;
}

interface ModuleRequest {
  action: "create" | "update" | "delete" | "reorder" | "list" | "save-sections" | "save-builder-settings";
  productId?: string;
  moduleId?: string;
  data?: {
    title?: string;
    description?: string;
    cover_image_url?: string | null;
  };
  orderedIds?: string[];
  sessionToken?: string;
  sections?: unknown[];
  deletedIds?: string[];
  settings?: Record<string, unknown>;
}

// ============================================
// MAIN HANDLER
// ============================================
serve(withSentry("members-area-modules", async (req) => {
  const corsResult = handleCorsV2(req);
  if (corsResult instanceof Response) {
    return corsResult;
  }
  const corsHeaders = corsResult.headers;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let body: ModuleRequest;
    try {
      body = await req.json();
    } catch {
      return errorResponse("Corpo da requisição inválido", corsHeaders, 400);
    }

    const { action, productId, moduleId, data, orderedIds, sections, deletedIds, settings } = body;
    // RISE V3: Session validation via unified-auth (reads from httpOnly cookie)

    log.info(`Action: ${action}`);

    // Auth via unified-auth
    let producerId: string;
    try {
      const producer = await requireAuthenticatedProducer(supabase, req);
      producerId = producer.id;
    } catch {
      return unauthorizedResponse(corsHeaders);
    }

    // ============================================
    // ROUTE TO HANDLERS
    // ============================================
    switch (action) {
      case "list":
        return handleListModules(supabase, productId!, producerId, corsHeaders);

      case "create":
        return handleCreateModule(supabase, productId!, data!, producerId, corsHeaders);

      case "update":
        return handleUpdateModule(supabase, moduleId!, data!, producerId, corsHeaders);

      case "delete":
        return handleDeleteModule(supabase, moduleId!, producerId, corsHeaders);

      case "reorder":
        return handleReorderModules(supabase, productId!, orderedIds!, producerId, corsHeaders);

      case "save-sections":
        return handleSaveSections(supabase, productId!, sections as MemberSection[] || [], deletedIds, producerId, corsHeaders);

      case "save-builder-settings":
        return handleSaveBuilderSettings(supabase, productId!, settings || {}, producerId, corsHeaders);

      default:
        return errorResponse(`Ação não encontrada: ${action}`, corsHeaders, 404);
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.error("Unexpected error:", errorMessage);
    return errorResponse("Erro interno do servidor", corsHeaders, 500);
  }
}));
