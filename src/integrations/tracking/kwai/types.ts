/**
 * Tipos e Interfaces para Kwai Pixel
 * Módulo: src/integrations/tracking/kwai
 * 
 * Este arquivo define todas as interfaces e tipos utilizados
 * pela integração do Kwai Pixel no RiseCheckout.
 */

/**
 * Tipo para propriedades dinâmicas de tracking
 * Mais específico que `any`
 */
export type TrackingPropertyValue = string | number | boolean | null | undefined;

/**
 * Configuração do Kwai Pixel
 * Armazenada em vendor_integrations.config
 */
export interface KwaiConfig {
  /** ID do Pixel do Kwai (ex: "1234567890") */
  pixel_id: string;

  /** Lista de IDs de produtos que ativam este rastreamento */
  selected_products?: string[];

  /** Se o rastreamento está ativado */
  enabled: boolean;

  /** Propriedades customizadas adicionais */
  [key: string]: TrackingPropertyValue | string[];
}

/**
 * Dados do cliente para envio ao Kwai Pixel
 */
export interface KwaiCustomer {
  /** Email do cliente (opcional) */
  email?: string;

  /** Telefone do cliente (opcional) */
  phone?: string;

  /** Nome do cliente (opcional) */
  name?: string;

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
 * Dados de um item/produto para conversão
 */
export interface KwaiItem {
  /** ID do produto */
  id: string;

  /** Nome do produto */
  name: string;

  /** Categoria do produto (opcional) */
  category?: string;

  /** Quantidade */
  quantity: number;

  /** Preço unitário em reais */
  price: number;
}

/**
 * Dados de conversão para envio ao Kwai Pixel
 */
export interface KwaiConversionData {
  /** ID único da conversão */
  event_id: string;

  /** Timestamp da conversão (em milissegundos) */
  timestamp: number;

  /** Valor da conversão em reais */
  value: number;

  /** Moeda (ex: BRL) */
  currency: string;

  /** Dados do cliente */
  customer?: KwaiCustomer;

  /** Items/produtos da conversão */
  items?: KwaiItem[];

  /** ID do pedido (opcional) */
  order_id?: string;

  /** Tipo de evento (ex: "PlaceOrder", "ViewContent", "AddToCart") */
  event_type?: string;

  /** Se é um evento de teste */
  is_test?: boolean;
}

/**
 * Resposta da integração do Kwai Pixel
 */
export interface KwaiResponse {
  /** Se a operação foi bem-sucedida */
  success: boolean;

  /** Mensagem de resposta */
  message?: string;

  /** Dados adicionais */
  data?: unknown;
}

/**
 * Integração Kwai Pixel do vendedor
 */
export interface KwaiIntegration {
  /** ID da integração */
  id: string;

  /** ID do vendedor */
  vendor_id: string;

  /** Configuração da integração */
  config: KwaiConfig;

  /** Se a integração está ativa */
  active: boolean;

  /** Data de criação */
  created_at?: string;

  /** Data de última atualização */
  updated_at?: string;
}

/**
 * Parâmetros globais do Kwai Pixel (window.kwaiq)
 */
export interface KwaiGlobalParams {
  /** Permite rastreamento de conversão */
  track?: boolean;

  /** Configurações de privacidade */
  [key: string]: TrackingPropertyValue;
}
