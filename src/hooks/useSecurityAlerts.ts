/**
 * useSecurityAlerts - Hook para gerenciamento de alertas de segurança
 * 
 * MIGRATED: Uses Edge Function instead of supabase.from()
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
import { useAuth } from "@/hooks/useAuth";
import { getProducerSessionToken } from "@/hooks/useProducerAuth";

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
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([]);
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch alerts via Edge Function
   * MIGRATED: Uses supabase.functions.invoke instead of supabase.from()
   */
  const fetchAlerts = useCallback(async (filters?: AlertFilters) => {
    try {
      const sessionToken = getProducerSessionToken();
      const { data, error } = await supabase.functions.invoke("admin-data", {
        body: { action: "security-alerts", filters },
        headers: { "x-producer-session-token": sessionToken || "" },
      });

      if (error) throw error;
      setAlerts((data?.alerts || []) as SecurityAlert[]);
    } catch (err: unknown) {
      console.error("[useSecurityAlerts] Erro ao buscar alertas:", err);
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    }
  }, []);

  /**
   * Fetch blocked IPs via Edge Function
   * MIGRATED: Uses supabase.functions.invoke instead of supabase.from()
   */
  const fetchBlockedIPs = useCallback(async () => {
    try {
      const sessionToken = getProducerSessionToken();
      const { data, error } = await supabase.functions.invoke("admin-data", {
        body: { action: "security-blocked-ips" },
        headers: { "x-producer-session-token": sessionToken || "" },
      });

      if (error) throw error;
      setBlockedIPs((data?.blockedIPs || []) as BlockedIP[]);
    } catch (err: unknown) {
      console.error("[useSecurityAlerts] Erro ao buscar IPs bloqueados:", err);
    }
  }, []);

  /**
   * Fetch security stats via Edge Function
   * MIGRATED: Uses supabase.functions.invoke instead of supabase.from()
   */
  const fetchStats = useCallback(async () => {
    try {
      const sessionToken = getProducerSessionToken();
      const { data, error } = await supabase.functions.invoke("admin-data", {
        body: { action: "security-stats" },
        headers: { "x-producer-session-token": sessionToken || "" },
      });

      if (error) throw error;
      setStats(data?.stats as SecurityStats);
    } catch (err: unknown) {
      console.error("[useSecurityAlerts] Erro ao calcular estatísticas:", err);
    }
  }, []);

  // Reconhecer um alerta - via Edge Function
  const acknowledgeAlert = useCallback(async (alertId: string) => {
    try {
      const sessionToken = getProducerSessionToken();
      const { data, error } = await supabase.functions.invoke("security-management", {
        body: { action: "acknowledge-alert", alertId },
        headers: { "x-producer-session-token": sessionToken || "" },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Erro desconhecido");

      toast.success("Alerta reconhecido");
      await fetchAlerts();
      await fetchStats();
    } catch (err: unknown) {
      console.error("[useSecurityAlerts] Erro ao reconhecer alerta:", err);
      toast.error(err instanceof Error ? err.message : "Erro ao reconhecer alerta");
    }
  }, [fetchAlerts, fetchStats]);

  // Bloquear um IP manualmente - via Edge Function
  const blockIP = useCallback(async (ipAddress: string, reason: string, expiresInDays?: number) => {
    try {
      const sessionToken = getProducerSessionToken();
      const { data, error } = await supabase.functions.invoke("security-management", {
        body: { action: "block-ip", ipAddress, reason, expiresInDays },
        headers: { "x-producer-session-token": sessionToken || "" },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Erro desconhecido");

      toast.success(`IP ${ipAddress} bloqueado`);
      await fetchBlockedIPs();
      await fetchStats();
    } catch (err: unknown) {
      console.error("[useSecurityAlerts] Erro ao bloquear IP:", err);
      toast.error(err instanceof Error ? err.message : "Erro ao bloquear IP");
    }
  }, [fetchBlockedIPs, fetchStats]);

  // Desbloquear um IP - via Edge Function
  const unblockIP = useCallback(async (ipAddress: string) => {
    try {
      const sessionToken = getProducerSessionToken();
      const { data, error } = await supabase.functions.invoke("security-management", {
        body: { action: "unblock-ip", ipAddress },
        headers: { "x-producer-session-token": sessionToken || "" },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Erro desconhecido");

      toast.success(`IP ${ipAddress} desbloqueado`);
      await fetchBlockedIPs();
      await fetchStats();
    } catch (err: unknown) {
      console.error("[useSecurityAlerts] Erro ao desbloquear IP:", err);
      toast.error(err instanceof Error ? err.message : "Erro ao desbloquear IP");
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
