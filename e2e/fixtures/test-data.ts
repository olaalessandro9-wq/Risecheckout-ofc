/**
 * E2E Test Data - Centralized Test Fixtures (Mercado Pago Only)
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Provides consistent, isolated test data across all E2E tests.
 * 
 * ARQUITETURA CONSOLIDADA (02/02/2026):
 * - Testes E2E usam APENAS Mercado Pago como gateway de referência
 * - Gateways são "infraestrutura" - implementa e pronto, não precisa testar cada um
 * - Foco em FUNCIONALIDADES (cupons, order bumps, fluxos) não em gateways
 * - Escalabilidade: adicionar 100 gateways ≠ adicionar 100 testes
 * 
 * REQUISITOS PARA EXECUTAR TESTES:
 * 1. Conta com role ADMIN (única que pode configurar Sandbox)
 * 2. Mercado Pago configurado em modo SANDBOX
 * 3. Checkout com slug "test-checkout-mercadopago"
 * 4. Cupons VALID10 e EXPIRED2020 criados
 * 
 * @module e2e/fixtures/test-data
 * @version 2.0.0
 */

// ============================================================================
// Test User Factories
// ============================================================================

/**
 * Generate unique test email with timestamp
 * Format: e2e-test-{timestamp}@test.risecheckout.com
 */
export function generateTestEmail(prefix = "user"): string {
  const timestamp = Date.now();
  return `e2e-test-${prefix}-${timestamp}@test.risecheckout.com`;
}

/**
 * Generate unique test name
 */
export function generateTestName(prefix = "Test"): string {
  const timestamp = Date.now();
  return `${prefix} User ${timestamp}`;
}

// ============================================================================
// Static Test Data
// ============================================================================

/**
 * Test credentials for various scenarios
 * These are used for UI interaction tests only (not real auth)
 */
export const TEST_CREDENTIALS = {
  // Invalid credentials for error testing
  invalid: {
    email: "invalid@nonexistent-domain.test",
    password: "wrongpassword123",
  },
  
  // Format validation tests
  malformed: {
    email: "not-an-email",
    password: "123", // Too short
  },
  
  // Producer test account (for smoke tests)
  producer: {
    email: "producer@test.risecheckout.com",
    password: "TestPassword123!",
    name: "Producer Test User",
  },
  
  // Buyer test account
  buyer: {
    email: "buyer@test.risecheckout.com",
    password: "BuyerPass123!",
    name: "Buyer Test User",
  },
} as const;

// ============================================================================
// Checkout Test Data
// ============================================================================

export const TEST_CHECKOUT = {
  // Slugs for testing (will 404 in test env, which is expected)
  validSlug: "test-checkout-mercadopago",
  invalidSlug: "non-existent-checkout-slug-12345",
  
  // Coupon codes for testing
  coupons: {
    valid: "VALID10",
    invalid: "INVALIDCOUPON999",
    expired: "EXPIRED2020",
  },
  
  // Customer form data
  customer: {
    name: "Cliente E2E Teste",
    email: generateTestEmail("customer"),
    phone: "(11) 99999-9999",
    cpf: "123.456.789-09",
  },
} as const;

// ============================================================================
// UI Selectors (data-testid strategy)
// ============================================================================

/**
 * Centralized test selectors for critical elements
 * These should match data-testid attributes in components
 */
export const TEST_SELECTORS = {
  // Auth forms
  auth: {
    emailInput: '[data-testid="auth-email-input"]',
    passwordInput: '[data-testid="auth-password-input"]',
    submitButton: '[data-testid="auth-submit-button"]',
    errorMessage: '[data-testid="auth-error-message"]',
    registerLink: '[data-testid="auth-register-link"]',
    forgotPasswordLink: '[data-testid="auth-forgot-password-link"]',
  },
  
  // Checkout
  checkout: {
    productCard: '[data-testid="checkout-product-card"]',
    customerForm: '[data-testid="checkout-customer-form"]',
    paymentMethodPix: '[data-testid="payment-method-pix"]',
    paymentMethodCard: '[data-testid="payment-method-card"]',
    couponInput: '[data-testid="coupon-input"]',
    couponApplyButton: '[data-testid="coupon-apply-button"]',
    orderBumpCheckbox: '[data-testid="order-bump-checkbox"]',
    submitPaymentButton: '[data-testid="submit-payment-button"]',
    totalPrice: '[data-testid="checkout-total-price"]',
  },
  
  // Landing page
  landing: {
    heroSection: '[data-testid="landing-hero"]',
    ctaButton: '[data-testid="landing-cta-button"]',
    featuresSection: '[data-testid="landing-features"]',
    pricingSection: '[data-testid="landing-pricing"]',
    footerLinks: '[data-testid="landing-footer"]',
  },
  
  // Buyer area
  buyer: {
    courseList: '[data-testid="buyer-course-list"]',
    moduleAccordion: '[data-testid="buyer-module-accordion"]',
    lessonItem: '[data-testid="buyer-lesson-item"]',
    progressIndicator: '[data-testid="buyer-progress"]',
  },
  
  // Members area (advanced features)
  membersArea: {
    certificateButton: '[data-testid="certificate-button"]',
    certificatePreview: '[data-testid="certificate-preview"]',
    certificateDownload: '[data-testid="certificate-download"]',
    quizContainer: '[data-testid="quiz-container"]',
    quizQuestion: '[data-testid="quiz-question"]',
    quizOption: '[data-testid="quiz-option"]',
    quizSubmit: '[data-testid="quiz-submit"]',
    quizResults: '[data-testid="quiz-results"]',
    progressBar: '[data-testid="progress-bar"]',
    progressPercentage: '[data-testid="progress-percentage"]',
    lockedLesson: '[data-testid="locked-lesson"]',
    completedLesson: '[data-testid="completed-lesson"]',
  },
} as const;

// ============================================================================
// Route Paths
// ============================================================================

export const ROUTES = {
  // Public routes
  landing: "/",
  auth: "/auth",
  cadastro: "/cadastro",
  recuperarSenha: "/recuperar-senha",
  redefinirSenha: "/redefinir-senha",
  termosDeUso: "/termos-de-uso",
  
  // Checkout routes
  checkout: (slug: string) => `/pay/${slug}`,
  paymentLink: (slug: string) => `/c/${slug}`,
  pixPayment: (orderId: string) => `/pay/pix/${orderId}`,
  mercadoPagoPayment: (orderId: string) => `/pay/mercadopago/${orderId}`,
  paymentSuccess: (orderId: string) => `/success/${orderId}`,
  previewSuccess: "/preview/success",
  
  // Buyer routes
  buyerLogin: "/minha-conta",
  buyerDashboard: "/minha-conta/dashboard",
  buyerHistory: "/minha-conta/historico",
  courseHome: (productId: string) => `/minha-conta/produto/${productId}`,
  lessonViewer: (productId: string, contentId: string) => `/minha-conta/produto/${productId}/aula/${contentId}`,
  setupAccess: (token: string) => `/setup-access/${token}`,
  
  // Dashboard routes (producer)
  dashboard: "/dashboard",
  products: "/dashboard/produtos",
  productEdit: (id: string) => `/dashboard/produtos/editar?id=${id}`,
} as const;

// ============================================================================
// Timeouts
// ============================================================================

export const TIMEOUTS = {
  // Page load expectations
  pageLoad: 10000,
  networkIdle: 5000,
  
  // Animation/transition waits
  animation: 500,
  toast: 3000,
  
  // Form submission
  formSubmit: 15000,
  
  // API responses
  apiResponse: 10000,
} as const;

// ============================================================================
// Error Messages (for assertion matching)
// ============================================================================

export const ERROR_MESSAGES = {
  auth: {
    invalidCredentials: /credenciais inválidas/i,
    emailRequired: /email.*obrigatório/i,
    passwordRequired: /senha.*obrigatória/i,
    invalidEmail: /email.*inválido/i,
    passwordTooShort: /senha.*curta/i,
  },
  
  checkout: {
    invalidCoupon: /cupom.*inválido/i,
    expiredCoupon: /cupom.*expirado/i,
    requiredField: /campo.*obrigatório/i,
    invalidCpf: /cpf.*inválido/i,
    invalidPhone: /telefone.*inválido/i,
  },
  
  payment: {
    declined: /recusado|negado|declined/i,
    insufficientFunds: /saldo.*insuficiente|insufficient.*funds/i,
    invalidCard: /cartão.*inválido|invalid.*card/i,
    expired: /expirado|expired/i,
    generic: /erro.*pagamento|payment.*error/i,
  },
} as const;

// ============================================================================
// Mercado Pago Test Data (Gateway Único de Referência)
// ============================================================================

/**
 * Checkout slug para testes E2E
 * 
 * REQUISITOS PARA CONFIGURAR:
 * 1. Role ADMIN no sistema (owner/user não podem configurar Sandbox)
 * 2. Mercado Pago configurado em modo SANDBOX
 * 3. Checkout criado com PIX + Cartão habilitados
 * 4. Pelo menos 1 Order Bump configurado
 */
export const TEST_CHECKOUT_MERCADOPAGO = {
  slug: "test-checkout-mercadopago",
  pixEnabled: true,
  cardEnabled: true,
} as const;

/**
 * Cartões de teste do Mercado Pago (Sandbox)
 * 
 * Documentação oficial: https://www.mercadopago.com.br/developers/pt/docs/checkout-api/testing/test-cards
 */
export const TEST_CARDS = {
  /** Cartão que será APROVADO */
  approved: {
    number: "5031433215406351",
    expiry: "11/30",
    cvv: "123",
    holder: "APRO",
  },
  /** Cartão que será RECUSADO */
  declined: {
    number: "5031755734530604",
    expiry: "11/30",
    cvv: "123",
    holder: "OTHE",
  },
} as const;

/**
 * Cupons de teste para validação E2E
 * 
 * DEVEM SER CRIADOS NO BANCO:
 * - VALID10: Cupom ativo, 10% de desconto, sem expiração
 * - EXPIRED2020: Cupom com data de expiração no passado
 */
export const TEST_COUPONS = {
  valid: {
    code: "VALID10",
    discountType: "percentage" as const,
    discountValue: 10,
  },
  invalid: {
    code: "INVALIDCOUPON999",
  },
  expired: {
    code: "EXPIRED2020",
  },
} as const;

/**
 * Dados do cliente para formulário de checkout
 */
export const TEST_CUSTOMER = {
  name: "Cliente E2E Teste",
  phone: "(11) 99999-9999",
  cpf: "123.456.789-09",
} as const;
