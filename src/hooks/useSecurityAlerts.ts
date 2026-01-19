/**
 * useSecurityAlerts - Hook para gerenciamento de alertas de segurança
 * 
 * MIGRATED: Uses api.call() - Unified API Client
 * @see RISE Protocol V3 - Zero console.log
 * 
 * Fornece acesso a:
 * - Lista de alertas de segurança
 * - Estatísticas de segurança
 * - IP Blocklist
 * - Ações de reconhecimento e bloqueio
 */

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { createLogger } from "@/lib/logger";

const log = createLogger("SecurityAlerts");

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

interface AlertsResponse {
  alerts?: SecurityAlert[];
  error?: string;
}

interface BlockedIPsResponse {
  blockedIPs?: BlockedIP[];
  error?: string;
}

interface StatsResponse {
  stats?: SecurityStats;
  error?: string;
}

interface ActionResponse {
  success: boolean;
  error?: string;
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
   * MIGRATED: Uses api.call() - Unified API Client
   */
  const fetchAlerts = useCallback(async (filters?: AlertFilters) => {
    try {
      const { data, error } = await api.call<AlertsResponse>("admin-data", {
        action: "security-alerts",
        filters,
      });

      if (error) throw error;
      setAlerts((data?.alerts || []) as SecurityAlert[]);
    } catch (err: unknown) {
      log.error("Erro ao buscar alertas:", err);
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    }
  }, []);

  /**
   * Fetch blocked IPs via Edge Function
   * MIGRATED: Uses api.call() - Unified API Client
   */
  const fetchBlockedIPs = useCallback(async () => {
    try {
      const { data, error } = await api.call<BlockedIPsResponse>("admin-data", {
        action: "security-blocked-ips",
      });

      if (error) throw error;
      setBlockedIPs((data?.blockedIPs || []) as BlockedIP[]);
    } catch (err: unknown) {
      log.error("Erro ao buscar IPs bloqueados:", err);
    }
  }, []);

  /**
   * Fetch security stats via Edge Function
   * MIGRATED: Uses api.call() - Unified API Client
   */
  const fetchStats = useCallback(async () => {
    try {
      const { data, error } = await api.call<StatsResponse>("admin-data", {
        action: "security-stats",
      });

      if (error) throw error;
      setStats(data?.stats as SecurityStats);
    } catch (err: unknown) {
      log.error("Erro ao calcular estatísticas:", err);
    }
  }, []);

  // Reconhecer um alerta - via Edge Function
  const acknowledgeAlert = useCallback(async (alertId: string) => {
    try {
      const { data, error } = await api.call<ActionResponse>("security-management", {
        action: "acknowledge-alert",
        alertId,
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Erro desconhecido");

      toast.success("Alerta reconhecido");
      await fetchAlerts();
      await fetchStats();
    } catch (err: unknown) {
      log.error("Erro ao reconhecer alerta:", err);
      toast.error(err instanceof Error ? err.message : "Erro ao reconhecer alerta");
    }
  }, [fetchAlerts, fetchStats]);

  // Bloquear um IP manualmente - via Edge Function
  const blockIP = useCallback(async (ipAddress: string, reason: string, expiresInDays?: number) => {
    try {
      const { data, error } = await api.call<ActionResponse>("security-management", {
        action: "block-ip",
        ipAddress,
        reason,
        expiresInDays,
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Erro desconhecido");

      toast.success(`IP ${ipAddress} bloqueado`);
      await fetchBlockedIPs();
      await fetchStats();
    } catch (err: unknown) {
      log.error("Erro ao bloquear IP:", err);
      toast.error(err instanceof Error ? err.message : "Erro ao bloquear IP");
    }
  }, [fetchBlockedIPs, fetchStats]);

  // Desbloquear um IP - via Edge Function
  const unblockIP = useCallback(async (ipAddress: string) => {
    try {
      const { data, error } = await api.call<ActionResponse>("security-management", {
        action: "unblock-ip",
        ipAddress,
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Erro desconhecido");

      toast.success(`IP ${ipAddress} desbloqueado`);
      await fetchBlockedIPs();
      await fetchStats();
    } catch (err: unknown) {
      log.error("Erro ao desbloquear IP:", err);
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
