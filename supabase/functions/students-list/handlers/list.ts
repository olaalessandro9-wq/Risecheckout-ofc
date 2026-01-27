/**
 * Handler: List students with pagination, search, filters
 * RISE V3 Compliant
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsonResponse } from "../helpers.ts";
import type {
  AccessRecord,
  BuyerRecord,
  BuyerGroupRecord,
  ProgressRecord,
  StudentResponse,
} from "../types.ts";

export async function handleListStudents(
  supabase: SupabaseClient,
  productId: string,
  params: {
    page?: number;
    limit?: number;
    search?: string;
    access_type?: string;
    status?: string;
    group_id?: string;
  },
  corsHeaders: Record<string, string>
): Promise<Response> {
  const pageNum = params.page ?? 1;
  const limitNum = params.limit ?? 20;
  const searchTerm = params.search?.toLowerCase().trim() || "";
  const filterAccessType = params.access_type || null;
  const filterStatus = params.status || null;
  const filterGroupId = params.group_id || null;

  // Fetch all active accesses for this product
  let accessQuery = supabase
    .from("buyer_product_access")
    .select("id, buyer_id, granted_at, expires_at, access_type, order_id, is_active")
    .eq("product_id", productId)
    .eq("is_active", true);

  if (filterAccessType && filterAccessType !== "all") {
    accessQuery = accessQuery.eq("access_type", filterAccessType);
  }

  const { data: accessData, error: accessError } = await accessQuery.order("granted_at", { ascending: false });

  if (accessError) throw accessError;

  if (!accessData || accessData.length === 0) {
    return jsonResponse({ students: [], total: 0, page: pageNum, limit: limitNum }, 200, corsHeaders);
  }

  const buyerIds = [...new Set((accessData as AccessRecord[]).map(a => a.buyer_id))];

  // Fetch users (SSOT - Unified Identity V3)
  const { data: buyers, error: buyersError } = await supabase
    .from("users")
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
    .eq("product_id", productId)
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
  }, 200, corsHeaders);
}
