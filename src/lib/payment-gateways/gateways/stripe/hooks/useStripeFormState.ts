/**
 * useStripeFormState
 * 
 * Gerencia estado local do formulário Stripe:
 * - Nome do titular
 * - CPF do titular
 * - Parcelas selecionadas
 * - Estados de completude dos campos
 */

import { useState, useMemo, useCallback } from "react";
import { generateInstallments } from "@/lib/payment-gateways/installments";

interface CardCompleteState {
  cardNumber: boolean;
  cardExpiry: boolean;
  cardCvc: boolean;
}

interface UseStripeFormStateResult {
  holderName: string;
  holderDocument: string;
  selectedInstallments: number;
  cardComplete: CardCompleteState;
  errors: Record<string, string>;
  installments: ReturnType<typeof generateInstallments>;
  setHolderName: (value: string) => void;
  setHolderDocument: (value: string) => void;
  setSelectedInstallments: (value: number) => void;
  setCardComplete: React.Dispatch<React.SetStateAction<CardCompleteState>>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  clearError: (field: string) => void;
  formatCPF: (value: string) => string;
}

export function useStripeFormState(amount: number): UseStripeFormStateResult {
  const [holderName, setHolderName] = useState("");
  const [holderDocument, setHolderDocument] = useState("");
  const [selectedInstallments, setSelectedInstallments] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [cardComplete, setCardComplete] = useState<CardCompleteState>({
    cardNumber: false,
    cardExpiry: false,
    cardCvc: false,
  });

  // Gerar parcelas
  const installments = useMemo(() => {
    return generateInstallments(amount, {
      interestRate: 0.0199, // 1.99% Stripe
      maxInstallments: 12,
    });
  }, [amount]);

  const clearError = useCallback((field: string) => {
    setErrors(prev => {
      const { [field]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  const formatCPF = useCallback((value: string): string => {
    const numbers = value.replace(/\D/g, "");
    return numbers
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .slice(0, 14);
  }, []);

  return {
    holderName,
    holderDocument,
    selectedInstallments,
    cardComplete,
    errors,
    installments,
    setHolderName,
    setHolderDocument,
    setSelectedInstallments,
    setCardComplete,
    setErrors,
    clearError,
    formatCPF,
  };
}
