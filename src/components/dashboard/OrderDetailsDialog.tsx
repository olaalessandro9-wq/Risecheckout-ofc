/**
 * OrderDetailsDialog - Refactored orchestrator component
 * 
 * @see RISE Protocol V3 - 300-line limit compliance
 */

import { useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useDecryptCustomerData } from "@/hooks/useDecryptCustomerData";
import { useAuth } from "@/hooks/useAuth";
import { isEncryptedValue } from "./recent-customers/utils/customerUtils";
import type { CustomerDisplayStatus } from "@/modules/dashboard/types";
import {
  OrderHeader,
  OrderProductSection,
  OrderCustomerSection,
  OrderPaymentSection,
  getStatusConfig,
  MASKED_VALUE,
} from "./order-details";

interface OrderDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderData: {
    id: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    customerDocument: string;
    productName: string;
    productImageUrl: string;
    amount: string;
    status: CustomerDisplayStatus;
    createdAt: string;
  } | null;
  /** ID do dono do produto (products.user_id) - usado para auto-decrypt */
  productOwnerId?: string;
}

export function OrderDetailsDialog({ open, onOpenChange, orderData, productOwnerId }: OrderDetailsDialogProps) {
  const { user } = useAuth();
  
  // Determinar se o usuário é o produtor do produto
  const isProductOwner = user?.id === productOwnerId;
  
  // Verificar se precisa descriptografar
  const needsDecryption = orderData ? (
    isEncryptedValue(orderData.customerPhone) || isEncryptedValue(orderData.customerDocument)
  ) : false;
  
  // Hook de descriptografia com auto-decrypt para produtores
  const { decryptedData, isLoading, error, decrypt, reset } = useDecryptCustomerData({
    autoDecrypt: open && isProductOwner && needsDecryption,
    orderId: orderData?.id,
  });

  // Reset ao fechar o modal
  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  if (!orderData) return null;

  const statusConfig = getStatusConfig(orderData.status);

  const handleDecrypt = () => {
    decrypt(orderData.id);
  };

  // Determina qual valor mostrar para telefone
  const getPhoneDisplay = () => {
    if (decryptedData?.customer_phone) {
      return decryptedData.customer_phone;
    }
    if (isEncryptedValue(orderData.customerPhone)) {
      return MASKED_VALUE;
    }
    return orderData.customerPhone;
  };

  // Determina qual valor mostrar para CPF
  const getDocumentDisplay = () => {
    if (decryptedData?.customer_document) {
      return decryptedData.customer_document;
    }
    if (isEncryptedValue(orderData.customerDocument)) {
      return MASKED_VALUE;
    }
    return orderData.customerDocument;
  };

  const phoneDisplay = getPhoneDisplay();
  const documentDisplay = getDocumentDisplay();
  const isDecrypted = !!decryptedData;
  
  // Mostrar botão apenas se há dados criptografados, não descriptografou, e não é produtor
  const showDecryptButton = needsDecryption && !isDecrypted && !isProductOwner;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] p-0 overflow-hidden max-h-[90vh] flex flex-col">
        <OrderHeader orderId={orderData.id} />

        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          <OrderProductSection 
            productName={orderData.productName} 
            productImageUrl={orderData.productImageUrl} 
          />

          <Separator />

          <OrderCustomerSection
            customerName={orderData.customerName}
            customerEmail={orderData.customerEmail}
            phoneDisplay={phoneDisplay}
            documentDisplay={documentDisplay}
            showDecryptButton={showDecryptButton}
            isLoading={isLoading}
            isProductOwner={isProductOwner}
            needsDecryption={needsDecryption}
            error={error}
            onDecrypt={handleDecrypt}
          />

          <Separator />

          <OrderPaymentSection
            amount={orderData.amount}
            status={orderData.status}
            statusConfig={statusConfig}
            createdAt={orderData.createdAt}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
