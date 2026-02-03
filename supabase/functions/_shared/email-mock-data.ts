/**
 * Email Mock Data
 * 
 * Dados fictícios centralizados para preview de emails.
 * Usado pela Edge Function email-preview para testes.
 * 
 * RISE Protocol V3 Compliant - < 150 linhas
 */

import type { 
  PurchaseConfirmationData, 
  PaymentPendingData, 
  NewSaleData 
} from "./email-templates-base.ts";
import { buildSiteUrl } from "./site-urls.ts";

// ============================================================================
// PURCHASE MOCK DATA
// ============================================================================

export function getMockPurchaseData(): PurchaseConfirmationData {
  return {
    customerName: "João Silva (PREVIEW)",
    productName: "Curso de Marketing Digital Completo",
    amountCents: 19700, // R$ 197,00
    orderId: "prev-" + crypto.randomUUID().substring(0, 8),
    paymentMethod: "Cartão de Crédito",
    sellerName: "Rise Academy",
    supportEmail: "suporte@riseacademy.com",
    deliveryUrl: buildSiteUrl("/minha-conta/produto/preview-product-id"),
  };
}

// ============================================================================
// MEMBERS AREA MOCK DATA
// ============================================================================

export function getMockMembersAreaData(): PurchaseConfirmationData {
  return {
    customerName: "Maria Oliveira (PREVIEW)",
    productName: "Mentoria Premium 2025",
    amountCents: 99700, // R$ 997,00
    orderId: "prev-" + crypto.randomUUID().substring(0, 8),
    paymentMethod: "PIX",
    sellerName: "Rise Academy",
    supportEmail: "suporte@riseacademy.com",
    deliveryUrl: buildSiteUrl("/minha-conta/produto/preview-product-123"),
  };
}

// ============================================================================
// EXTERNAL DELIVERY MOCK DATA
// ============================================================================

export function getMockExternalData(): PurchaseConfirmationData {
  return {
    customerName: "Carlos Santos (PREVIEW)",
    productName: "E-book: 101 Estratégias de Vendas",
    amountCents: 4700, // R$ 47,00
    orderId: "prev-" + crypto.randomUUID().substring(0, 8),
    paymentMethod: "Cartão de Crédito",
    sellerName: "Rise Academy",
    supportEmail: "contato@riseacademy.com",
  };
}

// ============================================================================
// NEW SALE MOCK DATA
// ============================================================================

export function getMockNewSaleData(): NewSaleData {
  return {
    sellerName: "Produtor Rise (PREVIEW)",
    customerName: "João Silva",
    customerEmail: "joao.silva@email.com",
    productName: "Curso de Marketing Digital Completo",
    amountCents: 19700, // R$ 197,00
    orderId: "prev-" + crypto.randomUUID().substring(0, 8),
    paymentMethod: "PIX",
    gateway: "Mercado Pago",
  };
}

// ============================================================================
// PAYMENT PENDING MOCK DATA
// ============================================================================

export function getMockPaymentPendingData(): PaymentPendingData {
  return {
    customerName: "Ana Costa (PREVIEW)",
    productName: "Curso de Finanças Pessoais",
    amountCents: 29700, // R$ 297,00
    orderId: "prev-" + crypto.randomUUID().substring(0, 8),
    // QR Code placeholder (small valid base64)
    pixQrCode: undefined, // Não incluir QR para preview
  };
}

// ============================================================================
// PASSWORD RESET MOCK DATA
// ============================================================================

export interface PasswordResetMockData {
  name: string;
  resetLink: string;
}

export function getMockPasswordResetData(): PasswordResetMockData {
  return {
    name: "Usuário Teste (PREVIEW)",
    resetLink: buildSiteUrl("/reset-password?token=preview-token-123"),
  };
}

// ============================================================================
// STUDENT INVITE MOCK DATA
// ============================================================================

export interface StudentInviteMockData {
  studentName: string;
  productName: string;
  producerName: string;
  accessLink: string;
}

export function getMockStudentInviteData(): StudentInviteMockData {
  return {
    studentName: "Aluno Convidado (PREVIEW)",
    productName: "Curso de Programação Web",
    producerName: "Rise Academy",
    accessLink: buildSiteUrl("/convite/preview-token-456"),
  };
}

// ============================================================================
// GDPR REQUEST MOCK DATA
// ============================================================================

export interface GdprRequestMockData {
  email: string;
  confirmationLink: string;
}

export function getMockGdprData(): GdprRequestMockData {
  return {
    email: "usuario@email.com",
    confirmationLink: buildSiteUrl("/gdpr/confirm?token=preview-gdpr-789"),
  };
}
