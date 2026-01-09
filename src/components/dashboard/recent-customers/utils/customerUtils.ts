/**
 * Utilitários para a tabela de clientes recentes
 * 
 * RISE ARCHITECT PROTOCOL:
 * - Single Responsibility: Cada função faz UMA coisa
 * - Reutilização: Funções compartilhadas entre componentes
 */

import type { CustomerExportData } from "../types";

/**
 * Verifica se um valor parece estar criptografado (base64 longo)
 */
export function isEncryptedValue(value: string | null | undefined): boolean {
  if (!value || value.trim() === "") return false;
  // Valores criptografados são base64 com pelo menos 24 caracteres (IV + ciphertext)
  return value.length > 24 && /^[A-Za-z0-9+/=]+$/.test(value);
}

/**
 * Formata telefone para exibição no padrão brasileiro
 */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return "—";
  // Remove caracteres não numéricos
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

/**
 * Exporta dados de clientes para CSV
 */
export function exportCustomersToCSV(customers: CustomerExportData[]): void {
  const headers = ['ID', 'Oferta', 'Cliente', 'Email', 'Telefone', 'Criado em', 'Valor', 'Status'];
  const rows = customers.map(customer => [
    customer.id,
    customer.offer,
    customer.client,
    customer.email,
    customer.phone,
    customer.createdAt,
    customer.value,
    customer.status
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `clientes_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
