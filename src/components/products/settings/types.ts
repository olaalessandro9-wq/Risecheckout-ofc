/**
 * Tipos para o painel de configurações de produto
 */

import type { PaymentMethod } from "@/config/payment-gateways";

export interface RequiredFields {
  name: boolean;
  email: boolean;
  phone: boolean;
  cpf: boolean;
}

export interface ProductSettings {
  required_fields: RequiredFields;
  default_payment_method: PaymentMethod;
  pix_gateway: string;
  credit_card_gateway: string;
}

export interface GatewayCredentialStatus {
  configured: boolean;
  viaSecrets?: boolean;
}

export interface GatewayCredentials {
  mercadopago?: GatewayCredentialStatus;
  pushinpay?: GatewayCredentialStatus;
  stripe?: GatewayCredentialStatus;
  asaas?: GatewayCredentialStatus;
  [key: string]: GatewayCredentialStatus | undefined;
}

export interface SettingsFormProps {
  form: ProductSettings;
  setForm: React.Dispatch<React.SetStateAction<ProductSettings>>;
}
