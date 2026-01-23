/**
 * Security Logging - RISE V3 Modular
 * 
 * Logging de violações de segurança para auditoria.
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../logger.ts";
import { SecurityViolation } from "./types.ts";

const log = createLogger("security-logging");

/**
 * Registra violação de segurança no banco
 */
export async function logSecurityViolation(
  supabase: SupabaseClient,
  violation: SecurityViolation
): Promise<void> {
  try {
    const { error } = await supabase
      .from("security_audit_log")
      .insert({
        action: violation.type,
        entity_type: "order",
        entity_id: violation.orderId,
        ip_address: violation.clientIp || null,
        metadata: {
          gateway: violation.gateway,
          expected_amount: violation.expectedAmount,
          actual_amount: violation.actualAmount,
          details: violation.details,
          timestamp: new Date().toISOString(),
        },
      });

    if (error) {
      log.error("Failed to log security violation:", error);
    } else {
      log.warn(`Security violation logged: ${violation.type} for order ${violation.orderId}`);
    }
  } catch (error) {
    log.error("Exception logging security violation:", error);
  }
}
