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

    // Verificar valor mínimo da parcela com base no VALOR FINAL (com juros)
    // Isso permite mais opções de parcelamento, similar ao comportamento Cakto/Kiwify
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
 * Formata exibição de parcelas para UI
 * 
 * 1x → "R$ 49,90"
 * 9x → "9x de R$ 7,01"
 */
export function formatInstallmentDisplay(
  amountCents: number,
  installments: number
): string {
  if (installments <= 1) {
    return `R$ ${(amountCents / 100).toFixed(2).replace('.', ',')}`;
  }

  const allInstallments = generateInstallments(amountCents, { maxInstallments: installments });
  const match = allInstallments.find(i => i.value === installments);

  if (match) {
    return `${installments}x de R$ ${match.installmentAmount.toFixed(2).replace('.', ',')}`;
  }

  // Fallback: divisão simples
  const simpleValue = amountCents / 100 / installments;
  return `${installments}x de R$ ${simpleValue.toFixed(2).replace('.', ',')}`;
}

// NOTA: formatCurrency foi removido - usar formatCentsToBRL de @/lib/money
export { formatCentsToBRL as formatCurrency } from "@/lib/money";
