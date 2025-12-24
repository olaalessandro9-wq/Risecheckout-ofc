/**
 * Tipos e Interfaces para UTMify
 * Módulo: src/integrations/tracking/utmify
 * 
 * Este arquivo define todas as interfaces e tipos utilizados
 * pela integração do UTMify no RiseCheckout.
 */

/**
 * Configuração do UTMify
 * Armazenada em vendor_integrations.config
 */
export interface UTMifyConfig {
  /** Token de API do UTMify */
  api_token?: string;

  /** Lista de eventos selecionados para rastreamento */
  selected_events?: string[];

  /** Lista de IDs de produtos que ativam este rastreamento */
  selected_products?: string[];

  /** Se o rastreamento está ativado */
  enabled: boolean;

  /** Propriedades customizadas adicionais */
  [key: string]: any;
}

/**
 * Parâmetros UTM extraídos da URL
 */
export interface UTMParameters {
  /** Source (src) */
  src: string | null;

  /** Session Cookie (sck) */
  sck: string | null;

  /** UTM Source */
  utm_source: string | null;

  /** UTM Campaign */
  utm_campaign: string | null;

  /** UTM Medium */
  utm_medium: string | null;

  /** UTM Content */
  utm_content: string | null;

  /** UTM Term */
  utm_term: string | null;
}

/**
 * Dados do cliente para envio ao UTMify
 */
export interface UTMifyCustomer {
  /** Nome do cliente */
  name: string;

  /** Email do cliente */
  email: string;

  /** Telefone do cliente (opcional) */
  phone?: string | null;

  /** CPF/CNPJ do cliente (opcional) */
  document?: string | null;

  /** País do cliente (opcional) */
  country?: string;

  /** IP do cliente (opcional) */
  ip?: string;
}

/**
 * Dados de um produto para envio ao UTMify
 */
export interface UTMifyProduct {
  /** ID do produto */
  id: string;

  /** Nome do produto */
  name: string;

  /** ID do plano (opcional) */
  planId?: string | null;

  /** Nome do plano (opcional) */
  planName?: string | null;

  /** Quantidade */
  quantity?: number;

  /** Preço em centavos */
  priceInCents: number;
}

/**
 * Dados de comissão para envio ao UTMify
 */
export interface UTMifyCommission {
  /** Preço total em centavos */
  totalPriceInCents?: number;

  /** Taxa do gateway em centavos */
  gatewayFeeInCents?: number;

  /** Comissão do usuário em centavos */
  userCommissionInCents?: number;

  /** Moeda (ex: BRL) */
  currency?: string;
}

/**
 * Dados completos do pedido para envio ao UTMify
 */
export interface UTMifyOrderData {
  /** ID único do pedido */
  orderId: string;

  /** Método de pagamento (pix, credit_card) */
  paymentMethod?: string;

  /** Status do pedido */
  status: string;

  /** Data de criação do pedido */
  createdAt: string;

  /** Data de aprovação (opcional) */
  approvedDate?: string | null;

  /** Data de reembolso (opcional) */
  refundedAt?: string | null;

  /** Dados do cliente */
  customer: UTMifyCustomer;

  /** Lista de produtos */
  products: UTMifyProduct[];

  /** Parâmetros de rastreamento */
  trackingParameters?: UTMParameters;

  /** Dados de comissão */
  commission?: UTMifyCommission;

  /** Preço total em centavos */
  totalPriceInCents: number;

  /** Se é um pedido de teste */
  isTest?: boolean;
}

/**
 * Resposta da integração do UTMify
 */
export interface UTMifyResponse {
  /** Se a operação foi bem-sucedida */
  success: boolean;

  /** Mensagem de resposta */
  message?: string;

  /** Dados adicionais */
  data?: any;
}

/**
 * Integração UTMify do vendedor
 */
export interface UTMifyIntegration {
  /** ID da integração */
  id: string;

  /** ID do vendedor */
  vendor_id: string;

  /** Configuração da integração */
  config: UTMifyConfig;

  /** Se a integração está ativa */
  active: boolean;

  /** Data de criação */
  created_at?: string;

  /** Data de última atualização */
  updated_at?: string;
}
