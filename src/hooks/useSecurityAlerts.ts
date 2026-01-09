/**
 * useSecurityAlerts - Hook para gerenciamento de alertas de segurança
 * 
 * Fornece acesso a:
 * - Lista de alertas de segurança
 * - Estatísticas de segurança
 * - IP Blocklist
 * - Ações de reconhecimento e bloqueio
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SecurityAlert {
  id: string;
  alert_type: string;
  severity: string;
  ip_address: string | null;
  user_id: string | null;
  buyer_id: string | null;
  details: Record<string, unknown> | null;
  acknowledged: boolean;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  created_at: string;
}

export interface BlockedIP {
  id: string;
  ip_address: string;
  reason: string;
  blocked_at: string;
  expires_at: string | null;
  is_active: boolean;
  block_count: number;
  metadata: Record<string, unknown> | null;
}

export interface SecurityStats {
  criticalAlerts24h: number;
  blockedIPsActive: number;
  bruteForceAttempts: number;
  rateLimitExceeded: number;
  unacknowledgedAlerts: number;
}

export interface AlertFilters {
  type?: string;
  severity?: string;
  acknowledged?: boolean;
}

export function useSecurityAlerts() {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([]);
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Buscar alertas com filtros
  const fetchAlerts = useCallback(async (filters?: AlertFilters) => {
    try {
      let query = supabase
        .from("security_alerts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (filters?.type) {
        query = query.eq("alert_type", filters.type);
      }
      if (filters?.severity) {
        query = query.eq("severity", filters.severity);
      }
      if (filters?.acknowledged !== undefined) {
        query = query.eq("acknowledged", filters.acknowledged);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAlerts((data || []) as SecurityAlert[]);
    } catch (err: any) {
      console.error("[useSecurityAlerts] Erro ao buscar alertas:", err);
      setError(err.message);
    }
  }, []);

  // Buscar IPs bloqueados
  const fetchBlockedIPs = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("ip_blocklist")
        .select("*")
        .eq("is_active", true)
        .order("blocked_at", { ascending: false });

      if (error) throw error;
      setBlockedIPs((data || []) as BlockedIP[]);
    } catch (err: any) {
      console.error("[useSecurityAlerts] Erro ao buscar IPs bloqueados:", err);
    }
  }, []);

  // Calcular estatísticas
  const fetchStats = useCallback(async () => {
    try {
      const now = new Date();
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

      // Alertas críticos nas últimas 24h
      const { count: criticalCount } = await supabase
        .from("security_alerts")
        .select("*", { count: "exact", head: true })
        .eq("severity", "critical")
        .gte("created_at", last24h);

      // IPs bloqueados ativos
      const { count: blockedCount } = await supabase
        .from("ip_blocklist")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      // Brute force attempts
      const { count: bruteForceCount } = await supabase
        .from("security_alerts")
        .select("*", { count: "exact", head: true })
        .eq("alert_type", "brute_force")
        .gte("created_at", last24h);

      // Rate limit exceeded
      const { count: rateLimitCount } = await supabase
        .from("buyer_rate_limits")
        .select("*", { count: "exact", head: true })
        .not("blocked_until", "is", null)
        .gte("last_attempt_at", last24h);

      // Alertas não reconhecidos
      const { count: unacknowledgedCount } = await supabase
        .from("security_alerts")
        .select("*", { count: "exact", head: true })
        .eq("acknowledged", false);

      setStats({
        criticalAlerts24h: criticalCount || 0,
        blockedIPsActive: blockedCount || 0,
        bruteForceAttempts: bruteForceCount || 0,
        rateLimitExceeded: rateLimitCount || 0,
        unacknowledgedAlerts: unacknowledgedCount || 0,
      });
    } catch (err: any) {
      console.error("[useSecurityAlerts] Erro ao calcular estatísticas:", err);
    }
  }, []);

  // Reconhecer um alerta
  const acknowledgeAlert = useCallback(async (alertId: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("security_alerts")
        .update({
          acknowledged: true,
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: userData.user?.id,
        })
        .eq("id", alertId);

      if (error) throw error;

      toast.success("Alerta reconhecido");
      await fetchAlerts();
      await fetchStats();
    } catch (err: any) {
      console.error("[useSecurityAlerts] Erro ao reconhecer alerta:", err);
      toast.error("Erro ao reconhecer alerta");
    }
  }, [fetchAlerts, fetchStats]);

  // Bloquear um IP manualmente
  const blockIP = useCallback(async (ipAddress: string, reason: string, expiresInDays?: number) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const expiresAt = expiresInDays 
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const { error } = await supabase
        .from("ip_blocklist")
        .upsert({
          ip_address: ipAddress,
          reason,
          expires_at: expiresAt,
          is_active: true,
          created_by: userData.user?.id,
          metadata: { manual_block: true },
        }, { onConflict: "ip_address" });

      if (error) throw error;

      toast.success(`IP ${ipAddress} bloqueado`);
      await fetchBlockedIPs();
      await fetchStats();
    } catch (err: any) {
      console.error("[useSecurityAlerts] Erro ao bloquear IP:", err);
      toast.error("Erro ao bloquear IP");
    }
  }, [fetchBlockedIPs, fetchStats]);

  // Desbloquear um IP
  const unblockIP = useCallback(async (ipAddress: string) => {
    try {
      const { error } = await supabase
        .from("ip_blocklist")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("ip_address", ipAddress);

      if (error) throw error;

      toast.success(`IP ${ipAddress} desbloqueado`);
      await fetchBlockedIPs();
      await fetchStats();
    } catch (err: any) {
      console.error("[useSecurityAlerts] Erro ao desbloquear IP:", err);
      toast.error("Erro ao desbloquear IP");
    }
  }, [fetchBlockedIPs, fetchStats]);

  // Carregar dados iniciais
  const loadAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        fetchAlerts(),
        fetchBlockedIPs(),
        fetchStats(),
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [fetchAlerts, fetchBlockedIPs, fetchStats]);

  // Carregar na montagem
  useEffect(() => {
    loadAll();
  }, [loadAll]);

  return {
    // Estado
    alerts,
    blockedIPs,
    stats,
    isLoading,
    error,
    
    // Ações
    fetchAlerts,
    fetchBlockedIPs,
    fetchStats,
    acknowledgeAlert,
    blockIP,
    unblockIP,
    refresh: loadAll,
  };
}
