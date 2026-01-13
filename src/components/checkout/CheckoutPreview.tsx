import { CheckoutCustomization, ViewMode } from "@/hooks/useCheckoutEditor";
import { useMemo } from "react";
import { normalizeDesign } from "@/lib/checkout/normalizeDesign";
import { CheckoutPreviewLayout } from "@/components/checkout/preview/CheckoutPreviewLayout";
import { CheckoutEditorMode } from "@/components/checkout/builder/CheckoutEditorMode";
import { useCheckoutState } from "@/hooks/useCheckoutState";
import type { ProductData, OrderBump } from "@/types/checkout";

interface CheckoutPreviewProps {
  customization: CheckoutCustomization;
  viewMode: ViewMode;
  selectedComponentId: string | null;
  onSelectComponent: (id: string | null) => void;
  isPreviewMode?: boolean;
  productData?: ProductData;
  orderBumps?: OrderBump[];
}

const CheckoutPreviewComponent = ({
  customization,
  viewMode,
  selectedComponentId,
  onSelectComponent,
  isPreviewMode = false,
  productData,
  orderBumps = [],
}: CheckoutPreviewProps) => {
  // ✅ Normalizar design para garantir cores consistentes com o checkout público
  const design = useMemo(() => 
    normalizeDesign({ design: customization.design }),
    [customization.design]
  );

  // ✅ Usar hook centralizado para gerenciar estado do checkout
  const checkoutState = useCheckoutState(productData, orderBumps, 'pix');

  // ✅ PREVIEW MODE: Usa CheckoutPreviewLayout (UI pura)
  if (isPreviewMode) {
    return (
      <CheckoutPreviewLayout
        design={design}
        customization={customization}
        productData={productData}
        orderBumps={orderBumps}
        viewMode={viewMode}
        selectedPayment={checkoutState.selectedPayment}
        onPaymentChange={checkoutState.setSelectedPayment}
        selectedBumps={checkoutState.selectedBumps}
        onToggleBump={checkoutState.toggleBump}
        isPreviewMode={true}
      />
    );
  }

  // ✅ EDITOR MODE: Usa CheckoutEditorMode (drag-and-drop)
  return (
    <CheckoutEditorMode
      design={design}
      customization={customization}
      viewMode={viewMode}
      selectedComponentId={selectedComponentId}
      onSelectComponent={onSelectComponent}
      productData={productData}
      orderBumps={orderBumps}
      selectedPayment={checkoutState.selectedPayment}
      onPaymentChange={checkoutState.setSelectedPayment}
      selectedBumps={checkoutState.selectedBumps}
      onToggleBump={checkoutState.toggleBump}
    />
  );
};

export const CheckoutPreview = CheckoutPreviewComponent;
