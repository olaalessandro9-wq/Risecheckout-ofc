/**
 * students-list Edge Function
 * 
 * Handles student listing and details:
 * - list: List students with pagination, search, filters
 * - get: Get detailed student info
 * 
 * @version 2.0.0
 */

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors, PUBLIC_CORS_HEADERS } from "../_shared/cors.ts";
import { rateLimitMiddleware, RATE_LIMIT_CONFIGS } from "../_shared/rate-limiting/index.ts";
import { requireAuthenticatedProducer } from "../_shared/unified-auth.ts";

const corsHeaders = PUBLIC_CORS_HEADERS;

// ============================================
// INTERFACES
// ============================================

interface JsonResponseData {
  students?: StudentResponse[];
  student?: StudentDetail;
  total?: number;
  page?: number;
  limit?: number;
  stats?: StudentStats;
  success?: boolean;
  error?: string;
  producer_info?: ProducerInfo;
}

interface ProducerInfo {
  id: string;
  name: string | null;
  email: string | null;
}

interface StudentStats {
  totalStudents: number;
  averageProgress: number;
  completionRate: number;
}

interface AccessRecord {
  id: string;
  buyer_id: string;
  granted_at: string;
  expires_at: string | null;
  access_type: string;
  order_id: string | null;
  is_active: boolean;
}

interface BuyerRecord {
  id: string;
  name: string | null;
  email: string;
  last_login_at: string | null;
  password_hash: string | null;
}

interface BuyerGroupRecord {
  id: string;
  buyer_id: string;
  group_id: string;
  is_active: boolean;
  granted_at: string;
  expires_at: string | null;
}

interface ProgressRecord {
  buyer_id: string;
  progress_percent: number | null;
}

interface StudentResponse {
  buyer_id: string;
  buyer_email: string;
  buyer_name: string | null;
  groups: BuyerGroupRecord[];
  access_type: string;
  last_access_at: string | null;
  status: "pending" | "active";
  invited_at: string;
  progress_percent: number;
}

interface StudentDetail {
  id: string;
  email: string;
  name: string | null;
  access: unknown[];
  groups: unknown[];
  progress: unknown[];
}

// ============================================
// HELPERS
// ============================================

function jsonResponse(data: JsonResponseData, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ============================================
// MAIN HANDLER
// ============================================

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const rateLimitResult = await rateLimitMiddleware(supabase, req, RATE_LIMIT_CONFIGS.MEMBERS_AREA, corsHeaders);
    if (rateLimitResult) return rateLimitResult;

    const body = await req.json();
    const { action, product_id, buyer_id } = body;

    console.log(`[students-list] Action: ${action}`);

    // Require authentication
    let producer;
    try {
      producer = await requireAuthenticatedProducer(supabase, req);
    } catch {
      return jsonResponse({ error: "Authorization required" }, 401);
    }

    // Verify product ownership
    if (product_id) {
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("id, user_id")
        .eq("id", product_id)
        .single();

      if (productError || !product || product.user_id !== producer.id) {
        return jsonResponse({ error: "Product not found or access denied" }, 403);
      }
    }

    // ========== LIST ==========
    if (action === "list") {
      if (!product_id) {
        return jsonResponse({ error: "product_id required" }, 400);
      }

      const pageNum = body.page ?? 1;
      const limitNum = body.limit ?? 20;
      const searchTerm = body.search?.toLowerCase().trim() || "";
      const filterAccessType = body.access_type || null;
      const filterStatus = body.status || null;
      const filterGroupId = body.group_id || null;

      // Fetch all active accesses for this product
      let accessQuery = supabase
        .from("buyer_product_access")
        .select("id, buyer_id, granted_at, expires_at, access_type, order_id, is_active")
        .eq("product_id", product_id)
        .eq("is_active", true);

      if (filterAccessType && filterAccessType !== "all") {
        accessQuery = accessQuery.eq("access_type", filterAccessType);
      }

      const { data: accessData, error: accessError } = await accessQuery.order("granted_at", { ascending: false });

      if (accessError) throw accessError;

      if (!accessData || accessData.length === 0) {
        return jsonResponse({ students: [], total: 0, page: pageNum, limit: limitNum });
      }

      const buyerIds = [...new Set((accessData as AccessRecord[]).map(a => a.buyer_id))];

      // Fetch buyer profiles
      const { data: buyers, error: buyersError } = await supabase
        .from("buyer_profiles")
        .select("id, name, email, last_login_at, password_hash")
        .in("id", buyerIds);

      if (buyersError) throw buyersError;

      const buyersMap: Record<string, BuyerRecord> = {};
      (buyers as BuyerRecord[] || []).forEach(b => { buyersMap[b.id] = b; });

      // Fetch buyer groups
      const { data: buyerGroupsData } = await supabase
        .from("buyer_groups")
        .select("id, buyer_id, group_id, is_active, granted_at, expires_at")
        .in("buyer_id", buyerIds)
        .eq("is_active", true);

      // If filtering by group, only keep buyers in that group
      let filteredBuyerIds = buyerIds;
      if (filterGroupId) {
        const buyersInGroup = (buyerGroupsData as BuyerGroupRecord[] || [])
          .filter(bg => bg.group_id === filterGroupId)
          .map(bg => bg.buyer_id);
        filteredBuyerIds = buyerIds.filter(id => buyersInGroup.includes(id));
      }

      // Calculate progress per buyer
      const { data: modules } = await supabase
        .from("product_member_modules")
        .select("id")
        .eq("product_id", product_id)
        .eq("is_active", true);

      const moduleIds = (modules as { id: string }[] || []).map(m => m.id);
      let totalContents = 0;
      let contentIds: string[] = [];

      if (moduleIds.length > 0) {
        const { data: contents } = await supabase
          .from("product_member_content")
          .select("id")
          .in("module_id", moduleIds)
          .eq("is_active", true);

        contentIds = (contents as { id: string }[] || []).map(c => c.id);
        totalContents = contentIds.length;
      }

      const progressMap: Record<string, number> = {};
      if (contentIds.length > 0 && filteredBuyerIds.length > 0) {
        const { data: progressData } = await supabase
          .from("buyer_content_progress")
          .select("buyer_id, progress_percent")
          .in("buyer_id", filteredBuyerIds)
          .in("content_id", contentIds);

        const buyerProgressTotals: Record<string, { sum: number; count: number }> = {};
        (progressData as ProgressRecord[] || []).forEach(p => {
          if (!buyerProgressTotals[p.buyer_id]) {
            buyerProgressTotals[p.buyer_id] = { sum: 0, count: 0 };
          }
          buyerProgressTotals[p.buyer_id].sum += (p.progress_percent || 0);
          buyerProgressTotals[p.buyer_id].count += 1;
        });

        Object.keys(buyerProgressTotals).forEach(buyerId => {
          progressMap[buyerId] = totalContents > 0
            ? Math.round(buyerProgressTotals[buyerId].sum / totalContents)
            : 0;
        });
      }

      // Map to response format
      let mappedStudents: StudentResponse[] = (accessData as AccessRecord[])
        .filter(a => filteredBuyerIds.includes(a.buyer_id))
        .map(access => {
          const buyer = buyersMap[access.buyer_id];
          if (!buyer) return null;

          const isPending = !buyer.password_hash || buyer.password_hash === "PENDING_PASSWORD_SETUP";
          const groups = (buyerGroupsData as BuyerGroupRecord[] || [])
            .filter(bg => bg.buyer_id === access.buyer_id)
            .map(bg => ({
              id: bg.id,
              buyer_id: bg.buyer_id,
              group_id: bg.group_id,
              is_active: bg.is_active,
              granted_at: bg.granted_at,
              expires_at: bg.expires_at,
            }));

          return {
            buyer_id: access.buyer_id,
            buyer_email: buyer.email,
            buyer_name: buyer.name,
            groups,
            access_type: access.access_type,
            last_access_at: buyer.last_login_at,
            status: isPending ? "pending" : "active",
            invited_at: access.granted_at,
            progress_percent: progressMap[access.buyer_id] || 0,
          } as StudentResponse;
        })
        .filter((s): s is StudentResponse => s !== null);

      // Apply search filter
      if (searchTerm) {
        mappedStudents = mappedStudents.filter(s =>
          s.buyer_email.toLowerCase().includes(searchTerm) ||
          (s.buyer_name && s.buyer_name.toLowerCase().includes(searchTerm))
        );
      }

      // Apply status filter
      if (filterStatus && filterStatus !== "all") {
        mappedStudents = mappedStudents.filter(s => s.status === filterStatus);
      }

      // Calculate stats
      const total = mappedStudents.length;
      let sumProgress = 0;
      let completedCount = 0;
      mappedStudents.forEach(s => {
        sumProgress += s.progress_percent;
        if (s.progress_percent >= 100) completedCount++;
      });
      const averageProgress = total > 0 ? sumProgress / total : 0;
      const completionRate = total > 0 ? (completedCount / total) * 100 : 0;

      // Paginate
      const startIndex = (pageNum - 1) * limitNum;
      const paginatedStudents = mappedStudents.slice(startIndex, startIndex + limitNum);

      return jsonResponse({
        students: paginatedStudents,
        total,
        page: pageNum,
        limit: limitNum,
        stats: { totalStudents: total, averageProgress, completionRate },
      });
    }

    // ========== GET ==========
    if (action === "get") {
      if (!buyer_id || !product_id) {
        return jsonResponse({ error: "buyer_id and product_id required" }, 400);
      }

      const { data: student, error } = await supabase
        .from("buyer_profiles")
        .select(`
          *,
          access:buyer_product_access(id, is_active, granted_at, expires_at, order:orders(*)),
          groups:buyer_groups(group:product_member_groups(*)),
          progress:buyer_content_progress(content_id, progress_percent, completed_at)
        `)
        .eq("id", buyer_id)
        .single();

      if (error) throw error;

      return jsonResponse({ success: true, student: student as StudentDetail });
    }

    // ========== GET-PRODUCER-INFO ==========
    if (action === "get-producer-info") {
      if (!product_id) {
        return jsonResponse({ error: "product_id required" }, 400);
      }

      // Get product owner
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("user_id")
        .eq("id", product_id)
        .single();

      if (productError || !product) {
        return jsonResponse({ error: "Product not found" }, 404);
      }

      // Get profile info
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, name")
        .eq("id", product.user_id)
        .single();

      // Get email via RPC
      const { data: emailData } = await supabase.rpc("get_user_email", { user_id: product.user_id });

      return jsonResponse({
        success: true,
        producer_info: {
          id: product.user_id,
          name: profile?.name || null,
          email: emailData || null,
        }
      });
    }

    return jsonResponse({ error: "Invalid action" }, 400);

  } catch (error: unknown) {
    console.error("[students-list] Error:", error);
    return jsonResponse({ error: error instanceof Error ? error.message : "Internal server error" }, 500);
  }
});
