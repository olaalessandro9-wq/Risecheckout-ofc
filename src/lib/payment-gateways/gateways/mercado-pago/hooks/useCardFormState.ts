/**
 * useCardFormState - Hook para gerenciamento de estado do formulário de cartão
 * 
 * @version 3.0.0 - RISE Protocol V3 - Zero console.log
 * Responsabilidade única: Estado do formulário (Nome, CPF, Parcelas)
 * Limite: < 100 linhas
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import type { Installment } from '@/types/payment-types';
import { generateInstallments } from '../../../installments';
import { createLogger } from "@/lib/logger";

const log = createLogger("CardFormState");

export interface CardFormState {
  cardholderName: string;
  identificationNumber: string;
  selectedInstallment: string;
  installments: Installment[];
}

export interface CardFormStateReturn {
  // Estado
  state: CardFormState;
  
  // Refs para valores atuais (usados no submit sem causar re-render)
  cardholderNameRef: React.RefObject<string>;
  identificationNumberRef: React.RefObject<string>;
  selectedInstallmentRef: React.RefObject<string>;
  
  // Setters
  setCardholderName: (value: string) => void;
  setIdentificationNumber: (value: string) => void;
  setSelectedInstallment: (value: string) => void;
  
  // Utilitários
  formatCPF: (value: string) => string;
}

export function useCardFormState(amount: number): CardFormStateReturn {
  // Estados do formulário local
  const [cardholderName, setCardholderName] = useState('');
  const [identificationNumber, setIdentificationNumber] = useState('');
  const [selectedInstallment, setSelectedInstallment] = useState('1');
  const [installments, setInstallments] = useState<Installment[]>([]);
  
  // Refs para valores atuais (usados no submit sem causar re-render)
  const cardholderNameRef = useRef('');
  const identificationNumberRef = useRef('');
  const selectedInstallmentRef = useRef('1');

  // Manter refs sincronizadas
  useEffect(() => { cardholderNameRef.current = cardholderName; }, [cardholderName]);
  useEffect(() => { identificationNumberRef.current = identificationNumber; }, [identificationNumber]);
  useEffect(() => { selectedInstallmentRef.current = selectedInstallment; }, [selectedInstallment]);

  // Gerar parcelas imediatamente
  useEffect(() => {
    if (amount > 0) {
      const generatedInstallments = generateInstallments(amount, { maxInstallments: 9 });
      setInstallments(generatedInstallments);
      log.trace("Parcelas geradas:", generatedInstallments.length);
    }
  }, [amount]);

  // Formatação de CPF
  const formatCPF = useCallback((value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11);
    return numbers
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }, []);

  return {
    state: {
      cardholderName,
      identificationNumber,
      selectedInstallment,
      installments
    },
    cardholderNameRef,
    identificationNumberRef,
    selectedInstallmentRef,
    setCardholderName,
    setIdentificationNumber,
    setSelectedInstallment,
    formatCPF
  };
}
