/**
 * Declaração de tipos globais para o Mercado Pago SDK
 * 
 * Este arquivo elimina a necessidade de @ts-ignore ao usar window.MercadoPago
 */

interface MercadoPagoInstallmentOption {
  installments: number;
  installment_rate: number;
  discount_rate: number;
  installment_rate_collector: string[];
  min_allowed_amount: number;
  max_allowed_amount: number;
  recommended_message: string;
  installment_amount: number;
  total_amount: number;
  payment_method_option_id: string;
}

interface MercadoPagoInstallmentResult {
  payment_method_id: string;
  payment_type_id: string;
  issuer: {
    id: string;
    name: string;
    secure_thumbnail: string;
    thumbnail: string;
  };
  processing_mode: string;
  merchant_account_id: string | null;
  payer_costs: MercadoPagoInstallmentOption[];
  agreements: unknown[];
}

interface MercadoPagoCardFormCallbacks {
  onFormMounted?: (error?: Error) => void;
  onFormUnmounted?: (error?: Error) => void;
  onIdentificationTypesReceived?: (error?: Error, data?: unknown[]) => void;
  onPaymentMethodsReceived?: (error?: Error, data?: unknown[]) => void;
  onInstallmentsReceived?: (error?: Error, data?: unknown) => void;
  onCardTokenReceived?: (error?: Error, token?: string) => void;
  onSubmit?: (event: Event) => void;
  onFetching?: (resource: string) => () => void;
  onReady?: () => void;
  onError?: (error: Error) => void;
  onValidityChange?: (error?: Error, field?: string) => void;
  onBinChange?: (bin: string) => void;
}

interface MercadoPagoCardFormOptions {
  amount: string;
  iframe?: boolean;
  form: {
    id: string;
    cardNumber?: { id: string; placeholder?: string };
    expirationDate?: { id: string; placeholder?: string };
    securityCode?: { id: string; placeholder?: string };
    cardholderName?: { id: string; placeholder?: string };
    issuer?: { id: string; placeholder?: string };
    installments?: { id: string; placeholder?: string };
    identificationType?: { id: string; placeholder?: string };
    identificationNumber?: { id: string; placeholder?: string };
    cardholderEmail?: { id: string; placeholder?: string };
  };
  callbacks: MercadoPagoCardFormCallbacks;
}

interface MercadoPagoCardFormInstance {
  mount: () => Promise<void>;
  unmount: () => void;
  createCardToken: () => Promise<{ id: string }>;
  getCardFormData: () => unknown;
  update: (field: string, value: string) => void;
}

interface MercadoPagoBrickController {
  unmount: () => void;
}

interface MercadoPagoBricksBuilder {
  create: (brickName: string, config: unknown) => Promise<MercadoPagoBrickController>;
}

interface MercadoPagoInstance {
  getInstallments: (options: { amount: string; bin?: string }) => Promise<MercadoPagoInstallmentResult[]>;
  getIdentificationTypes: () => Promise<unknown[]>;
  getPaymentMethods: (options: { bin: string }) => Promise<unknown>;
  getIssuers: (options: { paymentMethodId: string; bin?: string }) => Promise<unknown[]>;
  createCardToken: (cardData: {
    cardNumber: string;
    cardholderName: string;
    cardExpirationMonth: string;
    cardExpirationYear: string;
    securityCode: string;
    identificationType: string;
    identificationNumber: string;
  }) => Promise<{ id: string }>;
  cardForm: (options: MercadoPagoCardFormOptions) => MercadoPagoCardFormInstance;
  bricks: () => MercadoPagoBricksBuilder;
}

interface MercadoPagoConstructor {
  new (publicKey: string, options?: { locale?: string }): MercadoPagoInstance;
  setPublishableKey?: (publicKey: string) => void;
}

declare global {
  interface Window {
    MercadoPago: MercadoPagoConstructor;
  }
}

export {};
