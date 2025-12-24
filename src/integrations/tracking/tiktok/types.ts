/**
 * Tipos e Interfaces para TikTok Pixel
 * Módulo: src/integrations/tracking/tiktok
 * 
 * Este arquivo define todas as interfaces e tipos utilizados
 * pela integração do TikTok Pixel no RiseCheckout.
 */

/**
 * Configuração do TikTok Pixel
 * Armazenada em vendor_integrations.config
 */
export interface TikTokConfig {
  /** ID do Pixel do TikTok (ex: "1234567890123456") */
  pixel_id: string;

  /** Lista de IDs de produtos que ativam este rastreamento */
  selected_products?: string[];

  /** Se o rastreamento está ativado */
  enabled: boolean;

  /** Propriedades customizadas adicionais */
  [key: string]: any;
}

/**
 * Dados do cliente para envio ao TikTok Pixel
 */
export interface TikTokCustomer {
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
export interface TikTokItem {
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
 * Dados de conversão para envio ao TikTok Pixel
 */
export interface TikTokConversionData {
  /** ID único da conversão */
  event_id: string;

  /** Timestamp da conversão (em milissegundos) */
  timestamp: number;

  /** Valor da conversão em reais */
  value: number;

  /** Moeda (ex: BRL) */
  currency: string;

  /** Dados do cliente */
  customer?: TikTokCustomer;

  /** Items/produtos da conversão */
  items?: TikTokItem[];

  /** ID do pedido (opcional) */
  order_id?: string;

  /** Tipo de evento (ex: "Purchase", "ViewContent", "AddToCart") */
  event_type?: string;

  /** Se é um evento de teste */
  is_test?: boolean;
}

/**
 * Resposta da integração do TikTok Pixel
 */
export interface TikTokResponse {
  /** Se a operação foi bem-sucedida */
  success: boolean;

  /** Mensagem de resposta */
  message?: string;

  /** Dados adicionais */
  data?: any;
}

/**
 * Integração TikTok Pixel do vendedor
 */
export interface TikTokIntegration {
  /** ID da integração */
  id: string;

  /** ID do vendedor */
  vendor_id: string;

  /** Configuração da integração */
  config: TikTokConfig;

  /** Se a integração está ativa */
  active: boolean;

  /** Data de criação */
  created_at?: string;

  /** Data de última atualização */
  updated_at?: string;
}

/**
 * Parâmetros globais do TikTok Pixel (window.ttq)
 */
export interface TikTokGlobalParams {
  /** Permite rastreamento de conversão */
  track?: boolean;

  /** Configurações de privacidade */
  [key: string]: any;
}
