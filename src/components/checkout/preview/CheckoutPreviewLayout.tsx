/**
 * CheckoutPreviewLayout
 * 
 * ✅ REFATORADO: Agora usa CheckoutMasterLayout (Single Source of Truth)
 * - Removida duplicação de estrutura de página
 * - Mantém funcionalidade de preview intacta
 * - Garantia de consistência visual com Editor e Public
 * 
 * 🔧 REFATORAÇÃO FINAL (08/12/2025):
 * - Removida lógica de rows (não existe mais)
 * - Apenas topComponents e bottomComponents são renderizados
 */

import React from "react";
import { CheckoutCustomization } from "@/types/checkout";
import { ThemePreset } from "@/types/theme";
import { CheckoutMasterLayout } from "@/components/checkout/unified";
import { SharedCheckoutLayout } from "@/components/checkout/shared";

interface CheckoutPreviewLayoutProps {
  design: ThemePreset;
  customization: CheckoutCustomization;
  productData?: any;
  orderBumps?: any[];
  viewMode: "desktop" | "mobile" | "public";
  selectedPayment: "pix" | "credit_card";
  onPaymentChange: (payment: "pix" | "credit_card") => void;
  selectedBumps: Set<string>;
  onToggleBump: (bumpId: string) => void;
  isPreviewMode?: boolean;
}

export const CheckoutPreviewLayout = ({
  design,
  customization,
  productData,
  orderBumps = [],
  viewMode,
  selectedPayment,
  onPaymentChange,
  selectedBumps,
  onToggleBump,
  isPreviewMode = true,
}: CheckoutPreviewLayoutProps) => {
  return (
    <CheckoutMasterLayout
      mode="preview"
      design={design}
      customization={customization}
      viewMode={viewMode}
      isPreviewMode={isPreviewMode}
    >
      {/* Checkout fixo no meio (formulário, pagamento, resumo) */}
      <SharedCheckoutLayout
        productData={productData}
        orderBumps={orderBumps}
        design={design}
        selectedPayment={selectedPayment}
        onPaymentChange={onPaymentChange}
        selectedBumps={selectedBumps}
        onToggleBump={onToggleBump}
        mode="preview"
      />
    </CheckoutMasterLayout>
  );
};
