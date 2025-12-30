/**
 * Installments Calculator
 * 
 * Calcula parcelas com taxa fixa, sem precisar do BIN do cartão.
 * Usado por todos os gateways para exibir parcelas imediatamente.
 * 
 * Regra: parcela mínima de R$ 5,00 (COM JUROS)
 */

import type { Installment } from '@/types/payment-types';

interface InstallmentConfig {
  interestRate: number;     // Taxa mensal (ex: 0.0299 = 2.99%)
  maxInstallments?: number;  // Limite opcional (se não definido, calcula dinamicamente)
  minInstallmentValue: number; // Valor mínimo da parcela em centavos
}

const DEFAULT_CONFIG: InstallmentConfig = {
  interestRate: 0.0299,      // 2.99% ao mês (taxa padrão)
  minInstallmentValue: 500,  // R$ 5,00 mínimo por parcela
};

// Limite técnico de segurança para evitar listas infinitas
const ABSOLUTE_MAX_INSTALLMENTS = 60;

/**
 * Gera lista de parcelas com cálculo de juros
 * 
 * A quantidade de parcelas é determinada pela regra:
 * - Parcela COM JUROS >= R$ 5,00
 * - Até maxInstallments se definido, senão até o limite técnico (60)
 */
export function generateInstallments(
  amountCents: number,
  config: Partial<InstallmentConfig> = {}
): Installment[] {
  // Filtrar propriedades undefined para não sobrescrever defaults
  const cleanConfig = Object.fromEntries(
    Object.entries(config).filter(([_, v]) => v !== undefined)
  );

  const { interestRate, maxInstallments, minInstallmentValue } = {
    ...DEFAULT_CONFIG,
    ...cleanConfig,
  };

  // Limite efetivo: usa o menor entre maxInstallments (se definido) e o limite técnico
  const effectiveMaxInstallments = maxInstallments !== undefined 
    ? Math.min(maxInstallments, ABSOLUTE_MAX_INSTALLMENTS)
    : ABSOLUTE_MAX_INSTALLMENTS;

  const installments: Installment[] = [];
  const amountReais = amountCents / 100;

  for (let i = 1; i <= effectiveMaxInstallments; i++) {
    let totalAmount: number;
    let installmentAmount: number;
    let hasInterest: boolean;

    if (i === 1) {
      // À vista - sem juros
      totalAmount = amountReais;
      installmentAmount = amountReais;
      hasInterest = false;
    } else {
      // Com juros - taxa composta simplificada
      totalAmount = amountReais * (1 + interestRate * i);
      installmentAmount = totalAmount / i;
      hasInterest = true;
    }

    // Verificar valor mínimo da parcela com base no VALOR FINAL (com juros)
    if (installmentAmount * 100 < minInstallmentValue) {
      break;
    }

    const label = `${i}x de R$ ${installmentAmount.toFixed(2).replace('.', ',')}`;

    installments.push({
      value: i,
      label,
      installmentAmount,
      totalAmount,
      hasInterest,
    });
  }

  return installments;
}

/**
 * Formata valor em centavos para BRL
 */
export function formatCurrency(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}
