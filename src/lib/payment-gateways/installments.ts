/**
 * Installments Calculator
 * 
 * Calcula parcelas com taxa fixa, sem precisar do BIN do cartão.
 * Usado por todos os gateways para exibir parcelas imediatamente.
 */

import type { Installment } from '@/types/payment-types';

interface InstallmentConfig {
  interestRate: number;     // Taxa mensal (ex: 0.0299 = 2.99%)
  maxInstallments: number;  // Máximo de parcelas
  minInstallmentValue: number; // Valor mínimo da parcela em centavos
}

const DEFAULT_CONFIG: InstallmentConfig = {
  interestRate: 0.0299,      // 2.99% ao mês (taxa padrão do Mercado Pago)
  maxInstallments: 12,
  minInstallmentValue: 500,  // R$ 5,00 mínimo por parcela
};

/**
 * Gera lista de parcelas com cálculo de juros
 */
export function generateInstallments(
  amountCents: number,
  config: Partial<InstallmentConfig> = {}
): Installment[] {
  const { interestRate, maxInstallments, minInstallmentValue } = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  const installments: Installment[] = [];
  const amountReais = amountCents / 100;

  for (let i = 1; i <= maxInstallments; i++) {
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

    // Verificar valor mínimo da parcela
    if (installmentAmount * 100 < minInstallmentValue) {
      break;
    }

    const label = `${i}x de R$ ${installmentAmount.toFixed(2).replace('.', ',')}${
      hasInterest ? ' (c/ juros)' : ' (à vista)'
    }`;

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
