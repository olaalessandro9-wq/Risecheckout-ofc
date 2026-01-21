/**
 * Security Region - Parallel State for Admin Security Tab
 * 
 * RISE Protocol V3 - XState Parallel Region
 * 
 * Manages: alerts, blocked IPs, stats, auto-refresh, block/unblock actions
 * 
 * @version 1.0.0
 */

import { assign } from "xstate";
import type { AdminMachineContext, SecurityEvent, LoadSecurityOutput } from "../adminMachine.types";
import type { SecurityAlert, BlockedIP, AlertFilters } from "../../types/admin.types";

// ============================================================================
// ACTIONS
// ============================================================================

export const securityActions = {
  assignSecurityData: assign(({ context }, params: { output: LoadSecurityOutput }) => ({
    security: {
      ...context.security,
      alerts: params.output.alerts,
      blockedIPs: params.output.blockedIPs,
      stats: params.output.stats,
      error: null,
    },
  })),

  assignSecurityError: assign(({ context }, params: { error: unknown }) => ({
    security: {
      ...context.security,
      error: params.error instanceof Error ? params.error.message : "Erro ao carregar dados de segurança",
    },
  })),

  assignSelectedAlert: assign(({ context }, params: { alert: SecurityAlert }) => ({
    security: {
      ...context.security,
      selectedAlert: params.alert,
    },
  })),

  clearSelectedAlert: assign(({ context }) => ({
    security: {
      ...context.security,
      selectedAlert: null,
    },
  })),

  assignSecurityFilters: assign(({ context }, params: { filters: AlertFilters }) => ({
    security: {
      ...context.security,
      filters: params.filters,
    },
  })),

  openBlockDialog: assign(({ context }, params: { ip?: string }) => ({
    security: {
      ...context.security,
      blockDialogOpen: true,
      blockDialogIP: params.ip ?? "",
    },
  })),

  closeBlockDialog: assign(({ context }) => ({
    security: {
      ...context.security,
      blockDialogOpen: false,
      blockDialogIP: "",
    },
  })),

  openUnblockDialog: assign(({ context }, params: { blocked: BlockedIP }) => ({
    security: {
      ...context.security,
      unblockDialogOpen: true,
      unblockDialogIP: params.blocked,
    },
  })),

  closeUnblockDialog: assign(({ context }) => ({
    security: {
      ...context.security,
      unblockDialogOpen: false,
      unblockDialogIP: null,
    },
  })),

  toggleAutoRefresh: assign(({ context }) => ({
    security: {
      ...context.security,
      autoRefresh: !context.security.autoRefresh,
    },
  })),
};

// ============================================================================
// REGION STATE
// ============================================================================

export const securityRegion = {
  initial: "idle" as const,
  states: {
    idle: {
      on: {
        LOAD_SECURITY: { target: "loading" },
      },
    },
    loading: {
      invoke: {
        id: "loadSecurity",
        src: "loadSecurityActor",
        input: ({ context }: { context: AdminMachineContext }) => ({
          period: context.period,
        }),
        onDone: {
          target: "ready",
          actions: {
            type: "assignSecurityData",
            params: ({ event }: { event: { output: LoadSecurityOutput } }) => ({
              output: event.output,
            }),
          },
        },
        onError: {
          target: "error",
          actions: {
            type: "assignSecurityError",
            params: ({ event }: { event: { error: unknown } }) => ({
              error: event.error,
            }),
          },
        },
      },
    },
    ready: {
      on: {
        SELECT_ALERT: {
          actions: {
            type: "assignSelectedAlert",
            params: ({ event }: { event: Extract<SecurityEvent, { type: "SELECT_ALERT" }> }) => ({
              alert: event.alert,
            }),
          },
        },
        DESELECT_ALERT: {
          actions: "clearSelectedAlert",
        },
        SET_SECURITY_FILTERS: {
          actions: {
            type: "assignSecurityFilters",
            params: ({ event }: { event: Extract<SecurityEvent, { type: "SET_SECURITY_FILTERS" }> }) => ({
              filters: event.filters,
            }),
          },
        },
        OPEN_BLOCK_DIALOG: {
          actions: {
            type: "openBlockDialog",
            params: ({ event }: { event: Extract<SecurityEvent, { type: "OPEN_BLOCK_DIALOG" }> }) => ({
              ip: event.ip,
            }),
          },
        },
        CLOSE_BLOCK_DIALOG: {
          actions: "closeBlockDialog",
        },
        OPEN_UNBLOCK_DIALOG: {
          actions: {
            type: "openUnblockDialog",
            params: ({ event }: { event: Extract<SecurityEvent, { type: "OPEN_UNBLOCK_DIALOG" }> }) => ({
              blocked: event.blocked,
            }),
          },
        },
        CLOSE_UNBLOCK_DIALOG: {
          actions: "closeUnblockDialog",
        },
        ACKNOWLEDGE_ALERT: { target: "acknowledgingAlert" },
        CONFIRM_BLOCK_IP: { target: "blockingIP" },
        CONFIRM_UNBLOCK_IP: { target: "unblockingIP" },
        TOGGLE_AUTO_REFRESH: {
          actions: "toggleAutoRefresh",
        },
        REFRESH_SECURITY: { target: "loading" },
      },
    },
    acknowledgingAlert: {
      invoke: {
        id: "acknowledgeAlert",
        src: "acknowledgeAlertActor",
        input: ({ context, event }: { context: AdminMachineContext; event: SecurityEvent }) => ({
          alertId: (event as Extract<SecurityEvent, { type: "ACKNOWLEDGE_ALERT" }>).alertId,
        }),
        onDone: { target: "loading" },
        onError: {
          target: "ready",
          actions: {
            type: "assignSecurityError",
            params: ({ event }: { event: { error: unknown } }) => ({
              error: event.error,
            }),
          },
        },
      },
    },
    blockingIP: {
      invoke: {
        id: "blockIP",
        src: "blockIPActor",
        input: ({ event }: { event: SecurityEvent }) => {
          const blockEvent = event as Extract<SecurityEvent, { type: "CONFIRM_BLOCK_IP" }>;
          return {
            ip: blockEvent.ip,
            reason: blockEvent.reason,
            expiresInDays: blockEvent.expiresInDays,
          };
        },
        onDone: {
          target: "loading",
          actions: "closeBlockDialog",
        },
        onError: {
          target: "ready",
          actions: [
            {
              type: "assignSecurityError",
              params: ({ event }: { event: { error: unknown } }) => ({
                error: event.error,
              }),
            },
            "closeBlockDialog",
          ],
        },
      },
    },
    unblockingIP: {
      invoke: {
        id: "unblockIP",
        src: "unblockIPActor",
        input: ({ context }: { context: AdminMachineContext }) => ({
          ip: context.security.unblockDialogIP?.ip_address ?? "",
        }),
        onDone: {
          target: "loading",
          actions: "closeUnblockDialog",
        },
        onError: {
          target: "ready",
          actions: [
            {
              type: "assignSecurityError",
              params: ({ event }: { event: { error: unknown } }) => ({
                error: event.error,
              }),
            },
            "closeUnblockDialog",
          ],
        },
      },
    },
    error: {
      on: {
        RETRY_SECURITY: { target: "loading" },
        LOAD_SECURITY: { target: "loading" },
      },
    },
  },
};
