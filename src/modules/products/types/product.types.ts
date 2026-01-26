/**
 * Tipos e Interfaces para o Módulo de Produtos
 * 
 * Este arquivo centraliza todas as definições de tipos usadas
 * no sistema de edição de produtos.
 */

// ============================================================================
// PRODUTO BASE
// ============================================================================

export interface MembersAreaSettings {
  cover_url?: string;
  logo_url?: string;
  primary_color?: string;
}

/**
 * Tipo de entrega do produto
 * - standard: Entrega interna com link customizado
 * - members_area: Entrega via área de membros (link automático)
 * - external: Entrega externa (webhook/N8N, sem email de acesso)
 */
export type DeliveryType = 'standard' | 'members_area' | 'external';

export interface ProductData {
  id?: string;
  name: string;
  description: string;
  price: number; // Centavos (inteiro)
  image_url: string | null;
  support_name: string;
  support_email: string;
  status: "active" | "blocked";
  user_id?: string;
  created_at?: string;
  updated_at?: string;
  delivery_url?: string | null; // Link de entrega do produto digital (usado quando delivery_type = 'standard')
  delivery_type?: DeliveryType; // Tipo de entrega (novo campo ENUM)
  external_delivery?: boolean; // @deprecated - Usar delivery_type em vez disso
  members_area_enabled?: boolean;
  members_area_settings?: MembersAreaSettings | null;
}

// ============================================================================
// OFERTAS (UPSELL/DOWNSELL)
// ============================================================================

export interface Offer {
  id: string;
  product_id: string;
  name: string;
  price: number; // Centavos
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
}

// ============================================================================
// ORDER BUMPS
// Campos mapeados do banco: custom_title, custom_description, discount_price
// ============================================================================

export interface OrderBump {
  id: string;
  name: string;               // Mapeado de custom_title ou product.name
  description: string | null; // Mapeado de custom_description
  price: number;              // Mapeado de discount_price ou product.price
  image_url: string | null;   // Mapeado de product.image_url (se show_image=true)
  bump_product_id: string | null; // Mapeado de product_id
  created_at?: string;
}

// ============================================================================
// CHECKOUTS
// ============================================================================

export interface Checkout {
  id: string;
  name: string;
  price: number; // Centavos
  visits: number;
  offer: string;
  isDefault: boolean;
  linkId: string;
  product_id?: string;
  status?: string;
  created_at?: string;
}

// ============================================================================
// CUPONS
// ============================================================================

export interface Coupon {
  id: string;
  code: string;
  discount: number; // Valor do desconto em porcentagem (1-99)
  discount_type: "percentage";
  startDate: Date;
  endDate: Date;
  usageCount: number;
  max_uses?: number | null;
  applyToOrderBumps: boolean;
  created_at?: string;
  expires_at?: string;
}

// ============================================================================
// LINKS DE PAGAMENTO
// ============================================================================

export interface PaymentLink {
  id: string;
  slug: string;
  url: string;
  offer_name: string;
  offer_price: number; // Centavos
  is_default: boolean;
  status: "active" | "inactive";
  checkouts: Array<{
    id: string;
    name: string;
  }>;
  created_at?: string;
}

// ============================================================================
// CONFIGURAÇÕES
// ============================================================================

export interface PaymentSettings {
  pixEnabled: boolean;
  creditCardEnabled: boolean;
  defaultPaymentMethod: "pix" | "credit_card";
}

export interface CheckoutFields {
  fullName: boolean;
  phone: boolean;
  email: boolean;
  cpf: boolean;
}

export interface UpsellSettings {
  hasCustomThankYouPage: boolean;
  customPageUrl: string;
  redirectIgnoringOrderBumpFailures: boolean;
}

export interface AffiliateSettings {
  enabled: boolean;
  defaultRate: number; // Percentual de comissão padrão (0-100)
  requireApproval: boolean;
  // allowUpsells: boolean; // ❌ Deprecado (mantido no banco por segurança)
  
  // ✅ Novos Campos
  commissionOnOrderBump?: boolean; // Opcional - compatível com registros existentes
  commissionOnUpsell?: boolean;    // Opcional - compatível com registros existentes
  supportEmail?: string;            // E-mail de suporte para afiliados
  publicDescription?: string;       // Descrição/regras para afiliados
  
  attributionModel: "last_click" | "first_click";
  cookieDuration: number; // Duração do cookie em dias (1-365)
  
  // ✅ Campos de Marketplace
  showInMarketplace?: boolean;           // Exibir no marketplace público
  marketplaceDescription?: string;       // Descrição para o marketplace (50-500 chars)
  marketplaceCategory?: string;          // ID da categoria
}

// ============================================================================
// ESTADO DO CONTEXTO
// ============================================================================

export interface ProductContextState {
  // Dados principais
  product: ProductData | null;
  offers: Offer[];
  orderBumps: OrderBump[];
  checkouts: Checkout[];
  coupons: Coupon[];
  paymentLinks: PaymentLink[];
  
  // Configurações
  paymentSettings: PaymentSettings;
  checkoutFields: CheckoutFields;
  upsellSettings: UpsellSettings;
  affiliateSettings: AffiliateSettings | null;
  
  // Estados de loading
  loading: boolean;
  saving: boolean;
  
  // Estados de modificação (para UnsavedChanges)
  hasUnsavedChanges: boolean;
  
  // Funções de atualização do produto
  updateProduct: (field: keyof ProductData, value: ProductData[keyof ProductData]) => void;
  updateProductBulk: (data: Partial<ProductData>) => void;
  
  // Funções de atualização de configurações
  updateUpsellSettings: (settings: Partial<UpsellSettings>) => void;
  updateAffiliateSettings: (settings: Partial<AffiliateSettings>) => void;
  
  // Funções de salvamento
  saveProduct: () => Promise<void>;
  saveUpsellSettings: (settings?: UpsellSettings) => Promise<void>;
  saveAffiliateSettings: (settings?: AffiliateSettings | null) => Promise<void>;
  saveAll: () => Promise<void>;
  
  // Funções de refresh (recarregar do banco)
  refreshProduct: () => Promise<void>;
  refreshOffers: () => Promise<void>;
  refreshOrderBumps: () => Promise<void>;
  refreshCheckouts: () => Promise<void>;
  refreshCoupons: () => Promise<void>;
  refreshPaymentLinks: () => Promise<void>;
  refreshAll: () => Promise<void>;
  
  // Funções de deleção
  deleteProduct: () => Promise<boolean>;
}

// ============================================================================
// PROPS DOS COMPONENTES
// ============================================================================

export interface ProductProviderProps {
  productId: string | null;
  children: React.ReactNode;
}

export interface TabProps {
  // Abas não precisam receber props, consomem do Context
}

// ============================================================================
// VALIDAÇÃO
// ============================================================================

export interface ValidationErrors {
  name?: string;
  description?: string;
  price?: string;
  support_name?: string;
  support_email?: string;
  image_url?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationErrors;
}
