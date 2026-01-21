/**
 * Security Actors - Data Fetching for Security Region
 * 
 * RISE Protocol V3 - XState Actors
 * 
 * @version 1.0.0
 */

import { fromPromise } from "xstate";
import { api } from "@/lib/api";
import { createLogger } from "@/lib/logger";
import type { 
  LoadSecurityInput, 
  LoadSecurityOutput,
  AcknowledgeAlertInput,
  BlockIPInput,
  UnblockIPInput,
} from "../adminMachine.types";
import type { SecurityAlert, BlockedIP, SecurityStats } from "../../types/admin.types";

const log = createLogger("AdminSecurityActors");

// ============================================================================
// LOAD SECURITY DATA ACTOR
// ============================================================================

export const loadSecurityActor = fromPromise<LoadSecurityOutput, LoadSecurityInput>(
  async ({ input }) => {
    log.info("Loading security data", { period: input.period });

    const [alertsRes, blockedRes, statsRes] = await Promise.all([
      api.call<{ alerts: SecurityAlert[] }>("admin-data", { 
        action: "security-alerts",
        period: input.period,
      }),
      api.call<{ blockedIPs: BlockedIP[] }>("admin-data", { 
        action: "security-blocked-ips" 
      }),
      api.call<{ stats: SecurityStats }>("admin-data", { 
        action: "security-stats" 
      }),
    ]);

    if (alertsRes.error) {
      log.error("Failed to load security alerts", { error: alertsRes.error.message });
      throw new Error(alertsRes.error.message || "Erro ao carregar alertas");
    }

    const alerts = alertsRes.data?.alerts ?? [];
    const blockedIPs = blockedRes.data?.blockedIPs ?? [];
    const stats = statsRes.data?.stats ?? null;

    log.info("Security data loaded", { 
      alertsCount: alerts.length, 
      blockedIPsCount: blockedIPs.length 
    });

    return { alerts, blockedIPs, stats };
  }
);

// ============================================================================
// ACKNOWLEDGE ALERT ACTOR
// ============================================================================

export const acknowledgeAlertActor = fromPromise<void, AcknowledgeAlertInput>(
  async ({ input }) => {
    log.info("Acknowledging alert", { alertId: input.alertId });

    const { error, data } = await api.call<{ success: boolean; error?: string }>(
      "security-management",
      {
        action: "acknowledge-alert",
        alertId: input.alertId,
      }
    );

    if (error) {
      log.error("Failed to acknowledge alert", { error: error.message });
      throw new Error(error.message || "Erro ao confirmar alerta");
    }

    if (data?.error) {
      throw new Error(data.error);
    }

    log.info("Alert acknowledged", { alertId: input.alertId });
  }
);

// ============================================================================
// BLOCK IP ACTOR
// ============================================================================

export const blockIPActor = fromPromise<void, BlockIPInput>(
  async ({ input }) => {
    log.info("Blocking IP", { ip: input.ip, reason: input.reason });

    const { error, data } = await api.call<{ success: boolean; error?: string }>(
      "security-management",
      {
        action: "block-ip",
        ipAddress: input.ip,
        reason: input.reason,
        expiresInDays: input.expiresInDays,
      }
    );

    if (error) {
      log.error("Failed to block IP", { error: error.message });
      throw new Error(error.message || "Erro ao bloquear IP");
    }

    if (data?.error) {
      throw new Error(data.error);
    }

    log.info("IP blocked successfully", { ip: input.ip });
  }
);

// ============================================================================
// UNBLOCK IP ACTOR
// ============================================================================

export const unblockIPActor = fromPromise<void, UnblockIPInput>(
  async ({ input }) => {
    log.info("Unblocking IP", { ip: input.ip });

    const { error, data } = await api.call<{ success: boolean; error?: string }>(
      "security-management",
      {
        action: "unblock-ip",
        ipAddress: input.ip,
      }
    );

    if (error) {
      log.error("Failed to unblock IP", { error: error.message });
      throw new Error(error.message || "Erro ao desbloquear IP");
    }

    if (data?.error) {
      throw new Error(data.error);
    }

    log.info("IP unblocked successfully", { ip: input.ip });
  }
);
