/**
 * Financeiro Module Types
 * RISE Protocol V2 Compliant
 */

import type { LucideIcon } from "lucide-react";
import type { PushinPayEnvironment } from "@/integrations/gateways/pushinpay/types";

export type PaymentGateway = "pushinpay" | "mercadopago" | "stripe" | "asaas" | null;

export interface GatewayConfig {
  id: Exclude<PaymentGateway, null>;
  name: string;
  description: string;
  icon: LucideIcon;
  iconColor: string;
  connected: boolean;
}

export interface FinanceiroState {
  apiToken: string;
  hasExistingToken: boolean;
  environment: PushinPayEnvironment;
  loading: boolean;
  loadingData: boolean;
  message: { type: "success" | "error"; text: string } | null;
  selectedGateway: PaymentGateway;
  pushinPayConnected: boolean;
  mercadoPagoConnected: boolean;
  stripeConnected: boolean;
  asaasConnected: boolean;
}

export interface FinanceiroActions {
  setApiToken: (token: string) => void;
  setEnvironment: (env: PushinPayEnvironment) => void;
  setSelectedGateway: (gateway: PaymentGateway) => void;
  setMessage: (message: FinanceiroState["message"]) => void;
  onSave: () => Promise<void>;
  loadAllIntegrationsDebounced: () => Promise<void>;
}
