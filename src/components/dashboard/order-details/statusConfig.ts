/**
 * Status configuration for order statuses
 * Extracted from OrderDetailsDialog for reusability
 */

import { CheckCircle2, Clock, XCircle } from "lucide-react";
import type { CustomerDisplayStatus } from "@/modules/dashboard/types";
import type { StatusConfig } from "./types";

/** Máscara para dados sensíveis não revelados */
export const MASKED_VALUE = "••••••••••••";

export function getStatusConfig(status: CustomerDisplayStatus): StatusConfig {
  switch (status) {
    case "Pago":
      return {
        color: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
        icon: CheckCircle2,
        iconColor: "text-emerald-600",
        gradient: "from-emerald-500/5 to-transparent"
      };
    case "Pendente":
      return {
        color: "bg-amber-500/10 text-amber-700 border-amber-500/20",
        icon: Clock,
        iconColor: "text-amber-600",
        gradient: "from-amber-500/5 to-transparent"
      };
    case "Reembolso":
      return {
        color: "bg-blue-500/10 text-blue-700 border-blue-500/20",
        icon: XCircle,
        iconColor: "text-blue-600",
        gradient: "from-blue-500/5 to-transparent"
      };
    case "Chargeback":
      return {
        color: "bg-red-500/10 text-red-700 border-red-500/20",
        icon: XCircle,
        iconColor: "text-red-600",
        gradient: "from-red-500/5 to-transparent"
      };
  }
}
