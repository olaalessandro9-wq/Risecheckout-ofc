import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Package, User, Mail, Phone, CreditCard, Calendar, CheckCircle2, Clock, XCircle, FileText, Eye, Loader2, AlertCircle } from "lucide-react";
import { useDecryptCustomerData } from "@/hooks/useDecryptCustomerData";
import { useAuth } from "@/hooks/useAuth";
import { isEncryptedValue } from "./recent-customers/utils/customerUtils";
import type { CustomerDisplayStatus } from "@/modules/dashboard/types";

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

const getStatusConfig = (status: CustomerDisplayStatus) => {
  switch (status) {
    case "Pago":
      return {
        color: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
        icon: CheckCircle2,
        iconColor: "text-emerald-600",
        gradient: "from-emerald-500/5 to-transparent"
      };
    case "Pendente":
      return {
        color: "bg-amber-500/10 text-amber-700 border-amber-500/20",
        icon: Clock,
        iconColor: "text-amber-600",
        gradient: "from-amber-500/5 to-transparent"
      };
    case "Reembolso":
      return {
        color: "bg-blue-500/10 text-blue-700 border-blue-500/20",
        icon: XCircle,
        iconColor: "text-blue-600",
        gradient: "from-blue-500/5 to-transparent"
      };
    case "Chargeback":
      return {
        color: "bg-red-500/10 text-red-700 border-red-500/20",
        icon: XCircle,
        iconColor: "text-red-600",
        gradient: "from-red-500/5 to-transparent"
      };
  }
};

// Máscara para dados sensíveis não revelados
const MASKED_VALUE = "••••••••••••";

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
  const StatusIcon = statusConfig.icon;

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
  
  // Mostrar botão apenas se:
  // 1. Há dados criptografados
  // 2. Ainda não descriptografou
  // 3. NÃO é o produtor do produto (produtor tem auto-decrypt)
  const showDecryptButton = needsDecryption && !isDecrypted && !isProductOwner;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] p-0 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header simplificado e profissional */}
        <div className="relative bg-muted/30 p-4 pb-5">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="w-4 h-4 text-muted-foreground" />
              <span>Detalhes da Compra</span>
            </DialogTitle>
          </DialogHeader>

          {/* ID da Compra em destaque */}
          <div className="mt-3 space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">ID da Compra</label>
            <p className="text-xs font-mono bg-background/50 backdrop-blur-sm p-2 rounded-lg border border-border/50 break-all">
              {orderData.id}
            </p>
          </div>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* Produto - Card destacado */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <Package className="w-3.5 h-3.5" />
              <span>Produto</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
              <div className="relative">
                <img 
                  src={orderData.productImageUrl} 
                  alt={orderData.productName}
                  className="w-14 h-14 rounded-md object-cover border border-border shadow-sm"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder.svg';
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground truncate">{orderData.productName}</p>
                <p className="text-xs text-muted-foreground">Produto digital</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Cliente - Grid organizado */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <User className="w-3.5 h-3.5" />
                <span>Informações do Cliente</span>
              </div>
              
              {/* Botão Ver Dados - só aparece para NÃO produtores com dados criptografados */}
              {showDecryptButton && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDecrypt}
                  disabled={isLoading}
                  className="h-7 text-xs gap-1.5"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Carregando...
                    </>
                  ) : (
                    <>
                      <Eye className="w-3 h-3" />
                      Ver dados sensíveis
                    </>
                  )}
                </Button>
              )}
              
              {/* Loading para produtor (auto-decrypt) */}
              {isProductOwner && isLoading && needsDecryption && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Carregando dados...</span>
                </div>
              )}
            </div>

            {error && (
              <p className="text-xs text-destructive bg-destructive/10 p-2 rounded-md">
                {error}
              </p>
            )}

            <div className="grid gap-2">
              <div className="flex items-center gap-2 p-2 rounded-md bg-muted/30">
                <div className="p-1.5 rounded-md bg-background">
                  <User className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Nome</p>
                  <p className="text-sm font-medium text-foreground truncate">{orderData.customerName}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-2 rounded-md bg-muted/30">
                <div className="p-1.5 rounded-md bg-background">
                  <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-xs font-medium text-foreground break-all">{orderData.customerEmail}</p>
                </div>
              </div>

              {phoneDisplay && phoneDisplay !== 'N/A' && (
                <div className="flex items-center gap-2 p-2 rounded-md bg-muted/30">
                  <div className="p-1.5 rounded-md bg-background">
                    <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Telefone</p>
                    <p className="text-sm font-medium text-foreground font-mono">{phoneDisplay}</p>
                  </div>
                </div>
              )}

              {documentDisplay && documentDisplay !== 'N/A' && (
                <div className="flex items-center gap-2 p-2 rounded-md bg-muted/30">
                  <div className="p-1.5 rounded-md bg-background">
                    <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">CPF/CNPJ</p>
                    <p className="text-sm font-medium text-foreground font-mono">{documentDisplay}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Pagamento - Destaque para o valor */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <CreditCard className="w-3.5 h-3.5" />
              <span>Informações de Pagamento</span>
            </div>
            <div className="space-y-2">
              {/* Valor Total - cor padrão profissional */}
              <div className="p-3 rounded-lg border-2 border-border bg-background">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Valor Total</span>
                  <span className="text-xl font-bold text-foreground">{orderData.amount}</span>
                </div>
              </div>

              {/* Status do Pagamento - único elemento com cores dinâmicas */}
              <div className="flex items-center justify-between p-2 rounded-md bg-muted/30">
                <span className="text-xs text-muted-foreground">Status do Pagamento</span>
                <Badge 
                  className={`${statusConfig.color} border px-2 py-0.5 text-xs font-semibold`}
                >
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {orderData.status}
                </Badge>
              </div>

              {/* Data */}
              <div className="flex items-center justify-between p-2 rounded-md bg-muted/30">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Data da Compra</span>
                </div>
                <span className="text-xs font-medium text-foreground">{orderData.createdAt}</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
