/**
 * usePaymentGateway - Wrapper de Compatibilidade
 * 
 * Este arquivo mantém compatibilidade com o código existente
 * enquanto delega para a nova arquitetura modular.
 * 
 * DEPRECATED: Use usePaymentOrchestrator diretamente em código novo.
 * 
 * Nova arquitetura:
 * - src/hooks/checkout/payment/usePaymentOrchestrator.ts
 * - src/hooks/checkout/payment/useOrderCreation.ts
 * - src/hooks/checkout/payment/usePixPayment.ts
 * - src/hooks/checkout/payment/useCardPayment.ts
 */

import { usePaymentOrchestrator } from "./payment/usePaymentOrchestrator";
import type { PixGateway, CreditCardGateway, AppliedCoupon } from "./payment/types";
import type { PaymentMethod, CheckoutFormData } from "@/types/checkout";

// Re-exportar tipos para compatibilidade
export type { PixGateway, CreditCardGateway, AppliedCoupon };

// Interface de props mantida para compatibilidade
interface UsePaymentGatewayProps {
  vendorId: string | null;
  checkoutId: string | null;
  productId: string | null;
  offerId?: string | null;
  productName: string | null;
  productPrice: number;
  publicKey: string | null;
  amount: number;
  formData: CheckoutFormData;
  selectedBumps: Set<string>;
  orderBumps: any[];
  cardFieldsStyle?: any;
  appliedCoupon?: AppliedCoupon | null;
  pixGateway?: PixGateway;
  creditCardGateway?: CreditCardGateway;
}

interface ValidationResult {
  isValid: boolean;
  errors: any[];
}

interface UsePaymentGatewayReturn {
  selectedPayment: PaymentMethod;
  setSelectedPayment: (method: PaymentMethod) => void;
  isSDKLoaded: boolean;
  showPixPayment: boolean;
  orderId: string | null;
  submitPayment: (
    token?: string, 
    installments?: number, 
    paymentMethodId?: string, 
    issuerId?: string, 
    holderDocument?: string
  ) => Promise<void>;
  validateOnly: () => Promise<ValidationResult>;
  isProcessing: boolean;
}

/**
 * @deprecated Use usePaymentOrchestrator de @/hooks/checkout/payment
 */
export function usePaymentGateway(props: UsePaymentGatewayProps): UsePaymentGatewayReturn {
  // Delegar 100% para o novo hook
  return usePaymentOrchestrator({
    vendorId: props.vendorId,
    checkoutId: props.checkoutId,
    productId: props.productId,
    offerId: props.offerId,
    productName: props.productName,
    productPrice: props.productPrice,
    publicKey: props.publicKey,
    amount: props.amount,
    formData: props.formData,
    selectedBumps: props.selectedBumps,
    orderBumps: props.orderBumps,
    appliedCoupon: props.appliedCoupon,
    pixGateway: props.pixGateway,
    creditCardGateway: props.creditCardGateway,
  });
}
