/**
 * Tipos do Brick SDK - Mercado Pago Gateway
 * 
 * Módulo: src/integrations/gateways/mercadopago/types/brick.ts
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { GatewayPropertyValue } from './connection';
import { MercadoPagoError } from './payment';

/**
 * Dados de pagamento via Brick (Cartão)
 */
export interface MercadoPagoBrickPayment {
  /** Token do cartão gerado pelo Brick */
  token: string;

  /** ID do método de pagamento */
  payment_method_id: string;

  /** Número de parcelas */
  installments: number;

  /** CPF do titular (se disponível) */
  payer_email?: string;

  /** Dados adicionais do Brick */
  [key: string]: GatewayPropertyValue;
}

/**
 * Callbacks do Brick
 */
export interface BrickCallbacks {
  onReady?: () => void;
  onSubmit?: (data: MercadoPagoBrickPayment) => void;
  onError?: (error: MercadoPagoError) => void;
  onFieldChange?: (field: { field: string; error?: string }) => void;
}

/**
 * Customizações do Brick
 */
export interface BrickCustomizations {
  visual?: {
    hideFormTitle?: boolean;
    hidePaymentButton?: boolean;
  };
  paymentMethods?: {
    maxInstallments?: number;
    excluded?: string[];
  };
}

/**
 * Configuração do Brick (Cartão)
 */
export interface BrickConfig {
  /** Public Key do Mercado Pago */
  publicKey: string;

  /** Locale (pt-BR, es-AR, etc) */
  locale?: string;

  /** Tema (default, dark, custom) */
  theme?: {
    colors?: {
      primary?: string;
      secondary?: string;
      error?: string;
    };
  };

  /** Callbacks */
  callbacks?: BrickCallbacks;

  /** Customizações */
  customizations?: BrickCustomizations;
}
