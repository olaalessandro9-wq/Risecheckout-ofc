/**
 * Security Handlers for admin-data
 * 
 * Handles: security-logs, security-alerts, security-blocked-ips, security-stats
 * 
 * @see RISE Protocol V3 - Limite 300 linhas por arquivo
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsonResponse, errorResponse } from "../types.ts";

// ==========================================
// SECURITY LOGS
// ==========================================

export async function getSecurityLogs(
  supabase: SupabaseClient,
  producerId: string,
  limit: number,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { data: role, error: roleError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", producerId)
    .maybeSingle();

  if (roleError || role?.role !== "owner") {
    console.warn(`[admin-data] User ${producerId} tried to access security logs without owner role`);
    return errorResponse("Acesso negado", "FORBIDDEN", corsHeaders, 403);
  }

  const { data, error } = await supabase
    .from("security_audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[admin-data] Security logs error:", error);
    return errorResponse("Erro ao buscar logs", "DB_ERROR", corsHeaders, 500);
  }

  return jsonResponse({ logs: data || [] }, corsHeaders);
}

// ==========================================
// SECURITY ALERTS
// ==========================================

export async function getSecurityAlerts(
  supabase: SupabaseClient,
  producerId: string,
  filters: { type?: string; severity?: string; acknowledged?: boolean } | undefined,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { data: role } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", producerId)
    .maybeSingle();

  if (role?.role !== "owner" && role?.role !== "admin") {
    return errorResponse("Acesso negado", "FORBIDDEN", corsHeaders, 403);
  }

  let query = supabase
    .from("security_alerts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (filters?.type) query = query.eq("alert_type", filters.type);
  if (filters?.severity) query = query.eq("severity", filters.severity);
  if (filters?.acknowledged !== undefined) query = query.eq("acknowledged", filters.acknowledged);

  const { data, error } = await query;

  if (error) {
    console.error("[admin-data] Security alerts error:", error);
    return errorResponse("Erro ao buscar alertas", "DB_ERROR", corsHeaders, 500);
  }

  return jsonResponse({ alerts: data || [] }, corsHeaders);
}

// ==========================================
// BLOCKED IPS
// ==========================================

export async function getSecurityBlockedIPs(
  supabase: SupabaseClient,
  producerId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { data: role } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", producerId)
    .maybeSingle();

  if (role?.role !== "owner" && role?.role !== "admin") {
    return errorResponse("Acesso negado", "FORBIDDEN", corsHeaders, 403);
  }

  const { data, error } = await supabase
    .from("ip_blocklist")
    .select("*")
    .eq("is_active", true)
    .order("blocked_at", { ascending: false });

  if (error) {
    console.error("[admin-data] Blocked IPs error:", error);
    return errorResponse("Erro ao buscar IPs bloqueados", "DB_ERROR", corsHeaders, 500);
  }

  return jsonResponse({ blockedIPs: data || [] }, corsHeaders);
}

// ==========================================
// SECURITY STATS
// ==========================================

export async function getSecurityStats(
  supabase: SupabaseClient,
  producerId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { data: role } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", producerId)
    .maybeSingle();

  if (role?.role !== "owner" && role?.role !== "admin") {
    return errorResponse("Acesso negado", "FORBIDDEN", corsHeaders, 403);
  }

  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  const [criticalResult, blockedResult, bruteForceResult, rateLimitResult, unackResult] = await Promise.all([
    supabase.from("security_alerts").select("*", { count: "exact", head: true }).eq("severity", "critical").gte("created_at", last24h),
    supabase.from("ip_blocklist").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("security_alerts").select("*", { count: "exact", head: true }).eq("alert_type", "brute_force").gte("created_at", last24h),
    supabase.from("buyer_rate_limits").select("*", { count: "exact", head: true }).not("blocked_until", "is", null).gte("last_attempt_at", last24h),
    supabase.from("security_alerts").select("*", { count: "exact", head: true }).eq("acknowledged", false),
  ]);

  return jsonResponse({
    stats: {
      criticalAlerts24h: criticalResult.count || 0,
      blockedIPsActive: blockedResult.count || 0,
      bruteForceAttempts: bruteForceResult.count || 0,
      rateLimitExceeded: rateLimitResult.count || 0,
      unacknowledgedAlerts: unackResult.count || 0,
    }
  }, corsHeaders);
}
