/**
 * Tipos de Conexão e Configuração - Mercado Pago Gateway
 * 
 * Módulo: src/integrations/gateways/mercadopago/types/connection.ts
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

// ========== Connection Types ==========

export type ConnectionMode = 'none' | 'production' | 'sandbox';

export interface IntegrationData {
  id: string;
  mode: ConnectionMode;
  isTest: boolean;
  email?: string;
  userId?: string;
}

/**
 * Tipo para propriedades dinâmicas de gateway
 * Mais específico que `any`
 */
export type GatewayPropertyValue = string | number | boolean | null | undefined;

/**
 * Configuração do Mercado Pago
 * Armazenada em vendor_integrations.config
 */
export interface MercadoPagoConfig {
  /** Public Key do Mercado Pago (ex: "APP_USR-1234567890...") */
  public_key: string;

  /** Access Token do Mercado Pago (backend only) */
  access_token?: string;

  /** Se o gateway está ativado */
  enabled: boolean;

  /** Propriedades customizadas adicionais */
  [key: string]: GatewayPropertyValue;
}

/**
 * Integração Mercado Pago do vendedor
 */
export interface MercadoPagoIntegration {
  /** ID da integração */
  id: string;

  /** ID do vendedor */
  vendor_id: string;

  /** Configuração da integração */
  config: MercadoPagoConfig;

  /** Se a integração está ativa */
  active: boolean;

  /** Data de criação */
  created_at?: string;

  /** Data de última atualização */
  updated_at?: string;
}

/**
 * Parâmetros globais do Mercado Pago (window.MercadoPago)
 */
export interface MercadoPagoGlobalParams {
  /** Public Key */
  publicKey?: string;

  /** Configurações adicionais */
  [key: string]: GatewayPropertyValue;
}
