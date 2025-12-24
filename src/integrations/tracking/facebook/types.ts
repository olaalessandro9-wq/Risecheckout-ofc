/**
 * Tipos e Interfaces para o Facebook Pixel
 * Módulo: src/integrations/tracking/facebook
 * 
 * Este arquivo define todas as interfaces e tipos utilizados
 * pela integração do Facebook Pixel no RiseCheckout.
 */

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
  [key: string]: any;
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
