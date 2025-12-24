/**
 * RightColumnContent - Conteúdo Completo da Coluna Direita
 * 
 * Agora usa apenas OrderSummarySticky UNIFICADO:
 * - Resumo do pedido
 * - Badges de segurança
 * - Contato do vendedor
 * 
 * TUDO em 1 bloco único!
 * 
 * Usado tanto no CheckoutPreview quanto no PublicCheckout
 * Garante consistência visual entre builder e público
 */

import { OrderSummarySticky } from "./OrderSummarySticky";

interface RightColumnContentProps {
  productData?: {
    name: string;
    price: number;
    image_url?: string | null;
    support_email?: string;
  };
  design: any;
  isPreviewMode?: boolean;
}

export const RightColumnContent = ({
  productData,
  design,
  isPreviewMode = false
}: RightColumnContentProps) => {
  return (
    <OrderSummarySticky
      productData={productData}
      design={design}
      isPreviewMode={isPreviewMode}
    />
  );
};
