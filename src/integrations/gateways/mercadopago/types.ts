/**
 * Tipos e Interfaces para Mercado Pago Gateway
 * Módulo: src/integrations/gateways/mercadopago
 * 
 * Este arquivo define todas as interfaces e tipos utilizados
 * pela integração do Mercado Pago no RiseCheckout.
 */

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

/**
 * Parâmetros globais do Mercado Pago (window.MercadoPago)
 */
export interface MercadoPagoGlobalParams {
  /** Public Key */
  publicKey?: string;

  /** Configurações adicionais */
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
