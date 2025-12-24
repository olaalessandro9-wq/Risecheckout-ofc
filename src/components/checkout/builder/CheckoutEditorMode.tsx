/**
 * CheckoutEditorMode
 * 
 * ✅ REFATORADO: Agora usa CheckoutMasterLayout (Single Source of Truth)
 * - Removida duplicação de estrutura de página
 * - Mantém funcionalidade de drag-and-drop intacta
 * - Garantia de consistência visual com Preview e Public
 * 
 * 🔧 REFATORAÇÃO FINAL (08/12/2025):
 * - Removida toda lógica de rows (selectedRowId, onSelectRow, RowManager)
 * - Apenas topComponents e bottomComponents são editáveis
 */

import React from "react";
import { CheckoutCustomization, ViewMode } from "@/hooks/useCheckoutEditor";
import { ThemePreset } from "@/types/theme";
import { CheckoutDataProvider } from "@/contexts/CheckoutDataContext";
import { CheckoutMasterLayout } from "@/components/checkout/unified";
import { SharedCheckoutLayout } from "@/components/checkout/shared";

interface CheckoutEditorModeProps {
  design: ThemePreset;
  customization: CheckoutCustomization;
  viewMode: ViewMode;
  selectedComponentId: string | null;
  onSelectComponent: (id: string | null) => void;
  productData?: any;
  orderBumps?: any[];
  selectedPayment: "pix" | "credit_card";
  onPaymentChange: (payment: "pix" | "credit_card") => void;
  selectedBumps: Set<string>;
  onToggleBump: (bumpId: string) => void;
  isPreviewMode?: boolean;
}

export const CheckoutEditorMode = ({
  design,
  customization,
  viewMode,
  selectedComponentId,
  onSelectComponent,
  productData,
  orderBumps = [],
  selectedPayment,
  onPaymentChange,
  selectedBumps,
  onToggleBump,
  isPreviewMode = false,
}: CheckoutEditorModeProps) => {
  return (
    <CheckoutDataProvider
      design={design}
      customization={customization}
      productData={productData}
      orderBumps={orderBumps}
    >
      <CheckoutMasterLayout
        mode="editor"
        design={design}
        customization={customization}
        viewMode={viewMode}
        isPreviewMode={isPreviewMode}
        selectedComponentId={selectedComponentId}
        onSelectComponent={onSelectComponent}
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
          mode="editor"
        />
      </CheckoutMasterLayout>
    </CheckoutDataProvider>
  );
};
