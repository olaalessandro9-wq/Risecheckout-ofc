/**
 * Admin Handlers - Action Handler Functions
 * 
 * RISE Protocol V3 - Modularized from AdminContext
 * 
 * @version 1.0.0
 */

import { api } from "@/lib/api";
import type { 
  AdminMachineContext,
} from "../machines/adminMachine.types";
import type { PeriodFilter } from "../types/admin.types";
import { fetchUsers, fetchProducts, fetchSecurity } from "./adminFetchers";
import type { AppRole } from "@/hooks/usePermissions";

// Send function type (generic to avoid circular dependency)
type SendFn = (event: { type: string; [key: string]: unknown }) => void;

// ============================================================================
// ROLE CHANGE HANDLER
// ============================================================================

export async function handleConfirmRoleChange(
  context: AdminMachineContext,
  send: SendFn,
  role: AppRole
): Promise<void> {
  const dialog = context.users.roleChangeDialog;
  if (!dialog) return;

  send({ type: "CONFIRM_ROLE_CHANGE" });

  try {
    const { error, data } = await api.call<{ error?: string }>("manage-user-role", {
      targetUserId: dialog.userId,
      newRole: dialog.newRole,
    });

    if (error || data?.error) throw new Error(data?.error || error?.message);

    send({ type: "ROLE_CHANGE_SUCCESS" });
    send({ type: "REFRESH_USERS" });
    await fetchUsers(role, send);
  } catch (error) {
    send({ type: "ROLE_CHANGE_ERROR", error: error instanceof Error ? error.message : "Erro ao alterar role" });
  }
}

// ============================================================================
// PRODUCT ACTION HANDLER
// ============================================================================

export async function handleConfirmProductAction(
  context: AdminMachineContext,
  send: SendFn,
  period: PeriodFilter
): Promise<void> {
  const dialog = context.products.actionDialog;
  if (!dialog) return;

  send({ type: "CONFIRM_PRODUCT_ACTION" });

  try {
    const { error, data } = await api.call<{ error?: string }>("admin-product-management", {
      action: dialog.action,
      productId: dialog.productId,
    });

    if (error || data?.error) throw new Error(data?.error || error?.message);

    send({ type: "PRODUCT_ACTION_SUCCESS" });
    send({ type: "REFRESH_PRODUCTS" });
    await fetchProducts(period, send);
  } catch (error) {
    send({ type: "PRODUCT_ACTION_ERROR", error: error instanceof Error ? error.message : "Erro na ação" });
  }
}

// ============================================================================
// SECURITY HANDLERS
// ============================================================================

export async function handleAcknowledgeAlert(
  alertId: string,
  send: SendFn
): Promise<void> {
  send({ type: "ACKNOWLEDGE_ALERT", alertId });

  try {
    const { error, data } = await api.call<{ error?: string }>("security-management", {
      action: "acknowledge-alert",
      alertId,
    });

    if (error || data?.error) throw new Error(data?.error || error?.message);

    send({ type: "ALERT_ACKNOWLEDGED" });
    send({ type: "REFRESH_SECURITY" });
    await fetchSecurity(send);
  } catch (error) {
    send({ type: "SECURITY_ERROR", error: error instanceof Error ? error.message : "Erro ao confirmar alerta" });
  }
}

export async function handleConfirmBlockIP(
  ip: string,
  reason: string,
  expiresInDays: number | undefined,
  send: SendFn
): Promise<void> {
  send({ type: "CONFIRM_BLOCK_IP", ip, reason, expiresInDays });

  try {
    const { error, data } = await api.call<{ error?: string }>("security-management", {
      action: "block-ip",
      ipAddress: ip,
      reason,
      expiresInDays,
    });

    if (error || data?.error) throw new Error(data?.error || error?.message);

    send({ type: "BLOCK_IP_SUCCESS" });
    send({ type: "REFRESH_SECURITY" });
    await fetchSecurity(send);
  } catch (error) {
    send({ type: "SECURITY_ERROR", error: error instanceof Error ? error.message : "Erro ao bloquear IP" });
  }
}

export async function handleConfirmUnblockIP(
  context: AdminMachineContext,
  send: SendFn
): Promise<void> {
  const blocked = context.security.unblockDialogIP;
  if (!blocked) return;

  send({ type: "CONFIRM_UNBLOCK_IP" });

  try {
    const { error, data } = await api.call<{ error?: string }>("security-management", {
      action: "unblock-ip",
      ipAddress: blocked.ip_address,
    });

    if (error || data?.error) throw new Error(data?.error || error?.message);

    send({ type: "UNBLOCK_IP_SUCCESS" });
    send({ type: "REFRESH_SECURITY" });
    await fetchSecurity(send);
  } catch (error) {
    send({ type: "SECURITY_ERROR", error: error instanceof Error ? error.message : "Erro ao desbloquear IP" });
  }
}
