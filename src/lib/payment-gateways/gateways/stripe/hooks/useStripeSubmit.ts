/**
 * useStripeSubmit
 * 
 * Lógica de validação e submit do formulário Stripe
 */

import { useCallback } from "react";
import type { Stripe, StripeElements } from "@stripe/stripe-js";
import { CardNumberElement } from "@stripe/react-stripe-js";

interface CardCompleteState {
  cardNumber: boolean;
  cardExpiry: boolean;
  cardCvc: boolean;
}

interface UseStripeSubmitParams {
  stripe: Stripe | null;
  elements: StripeElements | null;
  holderName: string;
  holderDocument: string;
  cardComplete: CardCompleteState;
  selectedInstallments: number;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onSubmit: (result: { paymentMethodId: string; installments: number }) => void | Promise<void>;
  onError?: (error: Error) => void;
}

interface UseStripeSubmitResult {
  handleSubmit: () => Promise<void>;
}

export function useStripeSubmit({
  stripe,
  elements,
  holderName,
  holderDocument,
  cardComplete,
  selectedInstallments,
  setErrors,
  onSubmit,
  onError,
}: UseStripeSubmitParams): UseStripeSubmitResult {
  
  const handleSubmit = useCallback(async () => {
    if (!stripe || !elements) {
      onError?.(new Error("Stripe não carregado"));
      return;
    }

    // Validar campos locais
    const newErrors: Record<string, string> = {};
    if (!holderName.trim()) newErrors.holderName = "Obrigatório";
    if (!holderDocument.trim()) newErrors.holderDocument = "Obrigatório";
    if (!cardComplete.cardNumber) newErrors.cardNumber = "Obrigatório";
    if (!cardComplete.cardExpiry) newErrors.cardExpiry = "Obrigatório";
    if (!cardComplete.cardCvc) newErrors.cardCvc = "Obrigatório";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const cardNumberElement = elements.getElement(CardNumberElement);
      if (!cardNumberElement) {
        throw new Error("Card element not found");
      }

      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card: cardNumberElement,
        billing_details: {
          name: holderName,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!paymentMethod) {
        throw new Error("Falha ao criar método de pagamento");
      }

      await onSubmit({
        paymentMethodId: paymentMethod.id,
        installments: selectedInstallments,
      });
    } catch (err) {
      onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  }, [stripe, elements, holderName, holderDocument, cardComplete, selectedInstallments, setErrors, onSubmit, onError]);

  return { handleSubmit };
}
