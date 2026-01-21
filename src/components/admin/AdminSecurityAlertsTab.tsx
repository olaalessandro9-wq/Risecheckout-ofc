/**
 * AdminSecurityAlertsTab - Gerenciamento de Segurança
 * 
 * RISE Protocol V3 Compliant - XState via AdminContext
 * 
 * @version 3.0.0
 */

import { useEffect, useCallback, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ShieldAlert, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useAdmin } from "@/modules/admin/context";
import {
  SecurityStats,
  AlertsList,
  BlockedIPsList,
  BlockIPDialog,
  AlertDetailDialog,
  type SecurityAlert,
} from "@/modules/admin/components/security";

export function AdminSecurityAlertsTab() {
  const {
    context,
    isSecurityLoading,
    loadSecurity,
    refreshSecurity,
    acknowledgeAlert,
    confirmBlockIP,
    confirmUnblockIP,
    setSecurityFilters,
    toggleAutoRefresh,
    openBlockDialog,
    closeBlockDialog,
    selectAlert,
    deselectAlert,
    openUnblockDialog,
  } = useAdmin();

  const {
    alerts,
    blockedIPs,
    stats,
    filters,
    autoRefresh,
    blockDialogOpen,
    selectedAlert,
  } = context.security;

  // Local tab state (UI only)
  const [activeTab, setActiveTab] = useState<"alerts" | "blocked">("alerts");

  // Load security data on mount
  useEffect(() => {
    loadSecurity();
  }, [loadSecurity]);

  // Handlers
  const handleFilterChange = useCallback((key: "severity" | "type" | "acknowledged", value: string) => {
    setSecurityFilters({ ...filters, [key]: value });
  }, [setSecurityFilters, filters]);

  const handleRefreshAlerts = useCallback(() => {
    refreshSecurity();
  }, [refreshSecurity]);

  const handleRefreshBlockedIPs = useCallback(() => {
    refreshSecurity();
  }, [refreshSecurity]);

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
      await confirmBlockIP(ipAddress, reason, expiresInDays);
      toast.success(`IP ${ipAddress} bloqueado com sucesso`);
      closeBlockDialog();
    } catch {
      toast.error("Erro ao bloquear IP");
    }
  }, [confirmBlockIP, closeBlockDialog]);

  const handleUnblockIP = useCallback(async (ipAddress: string) => {
    try {
      // Find the blocked IP and open unblock dialog, then confirm
      const blocked = blockedIPs.find(b => b.ip_address === ipAddress);
      if (blocked) {
        openUnblockDialog(blocked);
        await confirmUnblockIP();
        toast.success(`IP ${ipAddress} desbloqueado com sucesso`);
      }
    } catch {
      toast.error("Erro ao desbloquear IP");
    }
  }, [blockedIPs, openUnblockDialog, confirmUnblockIP]);

  const handleViewDetails = useCallback((alert: SecurityAlert) => {
    selectAlert(alert);
  }, [selectAlert]);

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
    criticalAlerts24h: stats?.criticalAlerts24h ?? 0,
    blockedIPsActive: stats?.blockedIPsActive ?? 0,
    bruteForceAttempts: stats?.bruteForceAttempts ?? 0,
    rateLimitExceeded: stats?.rateLimitExceeded ?? 0,
    unacknowledgedAlerts: stats?.unacknowledgedAlerts ?? 0,
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
              onCheckedChange={toggleAutoRefresh}
            />
            <Label htmlFor="auto-refresh" className="text-sm">
              Auto-refresh
            </Label>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefreshAlerts} disabled={isSecurityLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isSecurityLoading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>
      </div>

      <SecurityStats stats={statsData} isLoading={isSecurityLoading} />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "alerts" | "blocked")}>
        <TabsList>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
          <TabsTrigger value="blocked">IPs Bloqueados</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="mt-4">
          <AlertsList
            alerts={transformedAlerts}
            filters={filters}
            isLoading={isSecurityLoading}
            onFilterChange={handleFilterChange}
            onRefresh={handleRefreshAlerts}
            onAcknowledge={handleAcknowledge}
            onViewDetails={handleViewDetails}
          />
        </TabsContent>

        <TabsContent value="blocked" className="mt-4">
          <BlockedIPsList
            blockedIPs={blockedIPs}
            isLoading={isSecurityLoading}
            onUnblock={handleUnblockIP}
            onOpenBlockDialog={() => openBlockDialog()}
            onRefresh={handleRefreshBlockedIPs}
          />
        </TabsContent>
      </Tabs>

      <BlockIPDialog
        open={blockDialogOpen}
        onOpenChange={(open) => open ? openBlockDialog() : closeBlockDialog()}
        onBlock={handleBlockIP}
        isLoading={isSecurityLoading}
      />

      <AlertDetailDialog
        alert={selectedAlert}
        open={!!selectedAlert}
        onOpenChange={(open) => !open && deselectAlert()}
      />
    </div>
  );
}
