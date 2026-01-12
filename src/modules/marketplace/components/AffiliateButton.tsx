/**
 * AffiliateButton - Botão de Afiliação
 * 
 * Botão inteligente que mostra diferentes estados (Promover, Pendente, Afiliado)
 */

import { Button } from "@/components/ui/button";
import { TrendingUp, Clock, CheckCircle2, Loader2 } from "lucide-react";
import { useAffiliateRequest } from "@/hooks/useAffiliateRequest";
import { useEffect } from "react";
import { toast } from "sonner";

interface AffiliateButtonProps {
  productId: string;
  onSuccess?: () => void;
  className?: string;
}

export function AffiliateButton({ productId, onSuccess, className }: AffiliateButtonProps) {
  const {
    requestAffiliate,
    checkStatus,
    isLoading,
    isCheckingStatus,
    error,
    success,
    affiliationStatus,
  } = useAffiliateRequest();

  // Verificar status ao montar
  useEffect(() => {
    checkStatus(productId);
  }, [productId, checkStatus]);

  // Mostrar toast de erro
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  // Mostrar toast de sucesso
  useEffect(() => {
    if (success) {
      toast.success(success);
      if (onSuccess) {
        onSuccess();
      }
    }
  }, [success, onSuccess]);

  // Solicitar afiliação
  const handleRequest = async () => {
    await requestAffiliate(productId);
    await checkStatus(productId);
  };

  // Loading - mostrar durante verificação inicial OU durante request
  if (isCheckingStatus || (isLoading && !affiliationStatus)) {
    return (
      <Button disabled size="sm" variant="outline" className={className}>
        <Loader2 className="w-4 h-4 animate-spin" />
      </Button>
    );
  }

  // Já é afiliado (status = "active" no banco)
  if (affiliationStatus?.status === "active") {
    return (
      <Button disabled size="sm" variant="outline" className={`gap-2 ${className || ""}`}>
        <CheckCircle2 className="w-4 h-4 text-green-600" />
        <span>Afiliado</span>
      </Button>
    );
  }

  // Pendente de aprovação
  if (affiliationStatus?.status === "pending") {
    return (
      <Button disabled size="sm" variant="outline" className={`gap-2 ${className || ""}`}>
        <Clock className="w-4 h-4 text-yellow-600" />
        <span>Pendente</span>
      </Button>
    );
  }

  // Rejeitado
  if (affiliationStatus?.status === "rejected") {
    return (
      <Button disabled size="sm" variant="destructive" className={`gap-2 ${className || ""}`}>
        <span>Rejeitado</span>
      </Button>
    );
  }

  // Bloqueado
  if (affiliationStatus?.status === "blocked") {
    return (
      <Button disabled size="sm" variant="destructive" className={`gap-2 ${className || ""}`}>
        <span>Bloqueado</span>
      </Button>
    );
  }

  // Botão para solicitar afiliação
  return (
    <Button
      onClick={handleRequest}
      disabled={isLoading}
      size="sm"
      className={`gap-2 ${className || ""}`}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <TrendingUp className="w-4 h-4" />
      )}
      <span>Promover</span>
    </Button>
  );
}
