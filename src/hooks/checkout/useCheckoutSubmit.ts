/**
 * useCheckoutSubmit
 * 
 * Hook para lógica de submit do checkout.
 * Gerencia a interação entre botão de checkout, formulário e cartão.
 */

import { useState, useCallback, useRef } from 'react';

interface UseCheckoutSubmitResult {
  cardSubmitFn: (() => void) | null;
  formRef: React.RefObject<HTMLFormElement | null>;
  handleCardSubmitReady: (fn: () => void) => void;
  handleCheckoutClick: () => void;
}

export function useCheckoutSubmit(selectedPayment: 'pix' | 'credit_card'): UseCheckoutSubmitResult {
  const [cardSubmitFn, setCardSubmitFn] = useState<(() => void) | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  const handleCardSubmitReady = useCallback((fn: () => void) => {
    setCardSubmitFn(() => fn);
  }, []);

  const handleCheckoutClick = useCallback(() => {
    if (selectedPayment === 'credit_card' && cardSubmitFn) {
      // Cartão: dispara a função de submit do CustomCardForm
      cardSubmitFn();
    } else if (selectedPayment === 'pix') {
      // PIX: dispara o submit do formulário programaticamente
      if (formRef.current) {
        formRef.current.requestSubmit();
      } else {
        // Fallback: buscar o form mais próximo e disparar submit
        const form = document.querySelector('form');
        if (form) {
          form.requestSubmit();
        }
      }
    }
  }, [selectedPayment, cardSubmitFn]);

  return {
    cardSubmitFn,
    formRef,
    handleCardSubmitReady,
    handleCheckoutClick,
  };
}
