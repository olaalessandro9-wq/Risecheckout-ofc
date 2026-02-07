/**
 * Tipos e Interfaces para o Facebook Pixel
 * Módulo: src/integrations/tracking/facebook
 * 
 * Este arquivo define todas as interfaces e tipos utilizados
 * pela integração do Facebook Pixel no RiseCheckout.
 */

/**
 * Tipo para propriedades dinâmicas de tracking
 * Mais específico que `any`
 */
export type TrackingPropertyValue = string | number | boolean | null | undefined;

/**
 * Configuração do Facebook Pixel
 * Armazenada em vendor_integrations.config
 */
export interface FacebookPixelConfig {
  /** ID único do pixel do Facebook */
  pixel_id: string;

  /** Token de acesso para API do Facebook (opcional, para futuras funcionalidades) */
  access_token?: string;

  /** Se o pixel está ativado ou desativado */
  enabled: boolean;

  /** Lista de IDs de produtos que ativam este pixel (vazio = todos os produtos) */
  selected_products?: string[];

  /** Se true, dispara evento 'Purchase' quando o PIX é gerado (antes do pagamento) */
  fire_purchase_on_pix?: boolean;
}

/**
 * User data for Facebook Advanced Matching (Manual Mode).
 * When provided to fbq("init", pixelId, userData), the Pixel SDK
 * automatically hashes these values and sends them to Meta for
 * improved Event Match Quality (EMQ).
 * 
 * IMPORTANT: Values must be sent in PLAIN TEXT — the Pixel SDK
 * handles SHA-256 hashing automatically for Advanced Matching.
 */
export interface FacebookAdvancedMatchingData {
  /** Customer email (plain text — SDK hashes it) */
  em?: string;
  /** Customer phone with country code, digits only (e.g., "5511999999999") */
  ph?: string;
  /** Customer first name (lowercase) */
  fn?: string;
  /** Customer last name (lowercase) */
  ln?: string;
}

/**
 * Parâmetros de eventos do Facebook
 * Utilizados ao disparar eventos como ViewContent, Purchase, etc
 */
export interface FacebookEventParams {
  /** Nome do conteúdo (ex: nome do produto) */
  content_name?: string;

  /** IDs dos produtos (ex: [product_id, bump_id]) */
  content_ids?: string[];

  /** Tipo de conteúdo (ex: 'product', 'product_group') */
  content_type?: string;

  /** Valor do evento em unidades monetárias */
  value?: number;

  /** Código da moeda (ex: 'BRL', 'USD') */
  currency?: string;

  /** Número de itens */
  num_items?: number;

  /** ID da transação */
  transaction_id?: string;

  /** Propriedades customizadas adicionais */
  [key: string]: TrackingPropertyValue | string[];
}

/**
 * Resposta da query ao banco de dados
 * Estrutura de vendor_integrations
 */
export interface VendorIntegrationData {
  /** Configuração armazenada em JSON */
  config: FacebookPixelConfig;

  /** Se a integração está ativa */
  active: boolean;

  /** Tipo de integração (sempre 'FACEBOOK_PIXEL') */
  integration_type: string;

  /** ID do vendedor proprietário */
  vendor_id: string;

  /** Data de criação */
  created_at: string;

  /** Data de última atualização */
  updated_at: string;
}

// Types declared in src/types/global.d.ts

export {};
