/**
 * AdminSecurityAlertsTab - Gerenciamento de Segurança
 * 
 * RISE Protocol V3 Compliant - Refatorado para usar componentes modulares
 * 
 * @version 2.0.0
 */

import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ShieldAlert, RefreshCw } from "lucide-react";
import { useSecurityAlerts } from "@/hooks/useSecurityAlerts";
import { toast } from "sonner";
import {
  SecurityStats,
  AlertsList,
  BlockedIPsList,
  BlockIPDialog,
  AlertDetailDialog,
  type SecurityAlert,
} from "@/modules/admin/components/security";

interface AlertFilters {
  severity: string;
  type: string;
  acknowledged: string;
}

export function AdminSecurityAlertsTab() {
  // State
  const [activeTab, setActiveTab] = useState<"alerts" | "blocked">("alerts");
  const [filters, setFilters] = useState<AlertFilters>({
    severity: "all",
    type: "all",
    acknowledged: "all",
  });
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<SecurityAlert | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Hook de segurança
  const {
    alerts,
    blockedIPs,
    stats,
    isLoading,
    fetchAlerts,
    fetchBlockedIPs,
    refresh,
    acknowledgeAlert,
    blockIP,
    unblockIP,
  } = useSecurityAlerts();

  // Auto-refresh a cada 30 segundos
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      refresh();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, refresh]);

  // Handlers
  const handleFilterChange = useCallback((key: keyof AlertFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    
    const newFilters: { severity?: string; type?: string; acknowledged?: boolean } = {};
    if (key === "severity" && value !== "all") newFilters.severity = value;
    if (key === "type" && value !== "all") newFilters.type = value;
    if (key === "acknowledged") {
      if (value === "pending") newFilters.acknowledged = false;
      if (value === "acknowledged") newFilters.acknowledged = true;
    }
    
    fetchAlerts(Object.keys(newFilters).length > 0 ? newFilters : undefined);
  }, [fetchAlerts]);

  const handleRefreshAlerts = useCallback(() => {
    refresh();
  }, [refresh]);

  const handleRefreshBlockedIPs = useCallback(() => {
    fetchBlockedIPs();
  }, [fetchBlockedIPs]);

  const handleAcknowledge = useCallback(async (alertId: string) => {
    try {
      await acknowledgeAlert(alertId);
      toast.success("Alerta reconhecido com sucesso");
    } catch {
      toast.error("Erro ao reconhecer alerta");
    }
  }, [acknowledgeAlert]);

  const handleBlockIP = useCallback(async (ipAddress: string, reason: string, expiresInDays?: number) => {
    try {
      await blockIP(ipAddress, reason, expiresInDays);
      toast.success(`IP ${ipAddress} bloqueado com sucesso`);
      setBlockDialogOpen(false);
    } catch {
      toast.error("Erro ao bloquear IP");
    }
  }, [blockIP]);

  const handleUnblockIP = useCallback(async (ipAddress: string) => {
    try {
      await unblockIP(ipAddress);
      toast.success(`IP ${ipAddress} desbloqueado com sucesso`);
    } catch {
      toast.error("Erro ao desbloquear IP");
    }
  }, [unblockIP]);

  const handleViewDetails = useCallback((alert: SecurityAlert) => {
    setSelectedAlert(alert);
  }, []);

  // Transform alerts to match component interface
  const transformedAlerts: SecurityAlert[] = alerts.map((alert) => ({
    id: alert.id,
    alert_type: alert.alert_type,
    severity: alert.severity,
    ip_address: alert.ip_address,
    details: alert.details as Record<string, unknown>,
    acknowledged: alert.acknowledged,
    created_at: alert.created_at,
  }));

  // Transform stats
  const statsData = {
    criticalAlerts24h: stats.criticalAlerts24h,
    blockedIPsActive: stats.blockedIPsActive,
    bruteForceAttempts: stats.bruteForceAttempts,
    rateLimitExceeded: stats.rateLimitExceeded,
    unacknowledgedAlerts: stats.unacknowledgedAlerts,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <ShieldAlert className="h-5 w-5" />
            Alertas de Segurança
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Monitoramento de ameaças e atividades suspeitas em tempo real
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              id="auto-refresh"
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
            />
            <Label htmlFor="auto-refresh" className="text-sm">
              Auto-refresh
            </Label>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefreshAlerts} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>
      </div>

      <SecurityStats stats={statsData} isLoading={isLoading} />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "alerts" | "blocked")}>
        <TabsList>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
          <TabsTrigger value="blocked">IPs Bloqueados</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="mt-4">
          <AlertsList
            alerts={transformedAlerts}
            filters={filters}
            isLoading={isLoading}
            onFilterChange={handleFilterChange}
            onRefresh={handleRefreshAlerts}
            onAcknowledge={handleAcknowledge}
            onViewDetails={handleViewDetails}
          />
        </TabsContent>

        <TabsContent value="blocked" className="mt-4">
          <BlockedIPsList
            blockedIPs={blockedIPs}
            isLoading={isLoading}
            onUnblock={handleUnblockIP}
            onOpenBlockDialog={() => setBlockDialogOpen(true)}
            onRefresh={handleRefreshBlockedIPs}
          />
        </TabsContent>
      </Tabs>

      <BlockIPDialog
        open={blockDialogOpen}
        onOpenChange={setBlockDialogOpen}
        onBlock={handleBlockIP}
        isLoading={isLoading}
      />

      <AlertDetailDialog
        alert={selectedAlert}
        open={!!selectedAlert}
        onOpenChange={(open) => !open && setSelectedAlert(null)}
      />
    </div>
  );
}
