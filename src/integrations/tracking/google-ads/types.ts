/**
 * Tipos e Interfaces para Google Ads
 * Módulo: src/integrations/tracking/google-ads
 * 
 * Este arquivo define todas as interfaces e tipos utilizados
 * pela integração do Google Ads no RiseCheckout.
 */

/**
 * Configuração de Label para um evento específico
 */
export interface GoogleAdsEventLabel {
  /** Tipo de evento (ex: "purchase", "lead", "pageview") */
  eventType: string;

  /** Label de conversão para este evento */
  label: string;

  /** Se este evento está habilitado */
  enabled?: boolean;
}

/**
 * Configuração do Google Ads
 * Armazenada em vendor_integrations.config
 */
export interface GoogleAdsConfig {
  /** ID de conversão do Google Ads (ex: AW-123456789) */
  conversion_id: string;

  /** Label de conversão global (usado como fallback) */
  conversion_label?: string;

  /** Labels específicos por evento */
  event_labels?: GoogleAdsEventLabel[];

  /** Lista de IDs de produtos que ativam este rastreamento */
  selected_products?: string[];

  /** Se o rastreamento está ativado */
  enabled: boolean;

  /** Propriedades customizadas adicionais */
  [key: string]: any;
}

/**
 * Dados do cliente para envio ao Google Ads
 */
export interface GoogleAdsCustomer {
  /** Email do cliente (opcional, para remarketing) */
  email?: string;

  /** Telefone do cliente (opcional, para remarketing) */
  phone?: string;

  /** Endereço do cliente (opcional, para remarketing) */
  address?: string;

  /** Cidade do cliente (opcional, para remarketing) */
  city?: string;

  /** Estado do cliente (opcional, para remarketing) */
  state?: string;

  /** CEP do cliente (opcional, para remarketing) */
  zip_code?: string;

  /** País do cliente (opcional, para remarketing) */
  country?: string;

  /** Hash SHA256 do email (Google Ads usa isso) */
  email_hash?: string;

  /** Hash SHA256 do telefone */
  phone_hash?: string;
}

/**
 * Dados de um item/produto para conversão
 */
export interface GoogleAdsItem {
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
 * Dados de conversão para envio ao Google Ads
 */
export interface GoogleAdsConversionData {
  /** ID único da conversão */
  conversionId: string;

  /** Timestamp da conversão (em segundos desde epoch) */
  conversionTimestamp: number;

  /** Valor da conversão em reais */
  conversionValue: number;

  /** Moeda (ex: BRL) */
  currencyCode: string;

  /** Label de conversão */
  conversionLabel: string;

  /** Dados do cliente (para remarketing) */
  customer?: GoogleAdsCustomer;

  /** Items/produtos da conversão */
  items?: GoogleAdsItem[];

  /** ID do pedido (opcional) */
  orderId?: string;

  /** Tipo de evento (ex: "purchase", "lead") */
  eventType?: string;

  /** Se é um evento de teste */
  isTest?: boolean;
}

/**
 * Resposta da integração do Google Ads
 */
export interface GoogleAdsResponse {
  /** Se a operação foi bem-sucedida */
  success: boolean;

  /** Mensagem de resposta */
  message?: string;

  /** Dados adicionais */
  data?: any;
}

/**
 * Integração Google Ads do vendedor
 */
export interface GoogleAdsIntegration {
  /** ID da integração */
  id: string;

  /** ID do vendedor */
  vendor_id: string;

  /** Configuração da integração */
  config: GoogleAdsConfig;

  /** Se a integração está ativa */
  active: boolean;

  /** Data de criação */
  created_at?: string;

  /** Data de última atualização */
  updated_at?: string;
}

/**
 * Parâmetros globais do Google Ads (window.gtag)
 */
export interface GoogleAdsGlobalParams {
  /** Permite rastreamento de conversão */
  allow_google_signals?: boolean;

  /** Permite rastreamento de remarketing */
  allow_ad_personalization_signals?: boolean;

  /** Configurações de privacidade */
  [key: string]: any;
}
