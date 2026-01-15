/**
 * Tipos de Pagamento - Mercado Pago Gateway
 * 
 * Módulo: src/integrations/gateways/mercadopago/types/payment.ts
 * RISE ARCHITECT PROTOCOL V2 - Single Responsibility
 */

import { GatewayPropertyValue } from './connection';

/**
 * Dados do cliente para pagamento
 */
export interface MercadoPagoCustomer {
  /** Email do cliente */
  email: string;

  /** Telefone do cliente (opcional) */
  phone?: string;

  /** Nome do cliente */
  name: string;

  /** CPF/CNPJ do cliente (opcional) */
  document?: string;

  /** Endereço do cliente (opcional) */
  address?: string;

  /** Cidade do cliente (opcional) */
  city?: string;

  /** Estado do cliente (opcional) */
  state?: string;

  /** CEP do cliente (opcional) */
  zip_code?: string;

  /** País do cliente (opcional) */
  country?: string;
}

/**
 * Dados de um item/produto para pagamento
 */
export interface MercadoPagoItem {
  /** ID do produto */
  id: string;

  /** Nome do produto */
  title: string;

  /** Descrição do produto (opcional) */
  description?: string;

  /** Quantidade */
  quantity: number;

  /** Preço unitário em reais */
  unit_price: number;

  /** Categoria do produto (opcional) */
  category_id?: string;
}

/**
 * Configuração de métodos de pagamento
 */
export interface MercadoPagoPaymentMethodsConfig {
  excluded_payment_methods?: Array<{ id: string }>;
  excluded_payment_types?: Array<{ id: string }>;
  installments?: number;
}

/**
 * Dados de preferência/pagamento para Mercado Pago
 */
export interface MercadoPagoPreference {
  /** ID da preferência (retornado pelo Mercado Pago) */
  id?: string;

  /** Items/produtos do pagamento */
  items: MercadoPagoItem[];

  /** Dados do cliente */
  payer: MercadoPagoCustomer;

  /** Valor total em reais */
  total_amount: number;

  /** Moeda (ex: BRL) */
  currency_id: string;

  /** ID do pedido (para rastreamento) */
  external_reference: string;

  /** URL de retorno após pagamento aprovado */
  success_url?: string;

  /** URL de retorno após pagamento pendente */
  pending_url?: string;

  /** URL de retorno após pagamento falho */
  failure_url?: string;

  /** Notificação de webhook */
  notification_url?: string;

  /** Método de pagamento (credit_card, debit_card, pix, etc) */
  payment_methods?: MercadoPagoPaymentMethodsConfig;

  /** Metadados adicionais */
  metadata?: Record<string, GatewayPropertyValue>;
}

/**
 * Resposta de criação de preferência
 */
export interface MercadoPagoPreferenceResponse {
  /** ID da preferência */
  id: string;

  /** URL de checkout do Mercado Pago */
  init_point: string;

  /** Status da preferência */
  status: string;

  /** Dados adicionais */
  [key: string]: GatewayPropertyValue;
}

/**
 * Resposta de pagamento
 */
export interface MercadoPagoPaymentResponse {
  /** ID do pagamento */
  id: number;

  /** Status do pagamento (approved, pending, rejected, etc) */
  status: string;

  /** Status detalhado do pagamento */
  status_detail: string;

  /** Valor do pagamento */
  transaction_amount: number;

  /** ID da preferência */
  preference_id?: string;

  /** ID do pedido externo */
  external_reference?: string;

  /** Dados adicionais */
  [key: string]: GatewayPropertyValue;
}

/**
 * Erro de resposta do Mercado Pago
 */
export interface MercadoPagoError {
  code: string;
  message: string;
  details?: unknown;
}

/**
 * Resposta da integração Mercado Pago
 */
export interface MercadoPagoResponse {
  /** Se a operação foi bem-sucedida */
  success: boolean;

  /** Mensagem de resposta */
  message?: string;

  /** Dados da resposta */
  data?: unknown;

  /** Erro (se houver) */
  error?: MercadoPagoError;
}
