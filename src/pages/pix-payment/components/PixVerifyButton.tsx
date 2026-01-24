/**
 * PixVerifyButton - Botão para verificar status do pagamento manualmente
 */

import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { createLogger } from "@/lib/logger";

const log = createLogger("PixVerifyButton");

interface PixVerifyButtonProps {
  checkingPayment: boolean;
  onCheckStatus: () => Promise<{ paid: boolean }>;
}

export function PixVerifyButton({ checkingPayment, onCheckStatus }: PixVerifyButtonProps) {
  const handleClick = async () => {
    log.debug("Botão verificar agora clicado");
    
    try {
      const result = await onCheckStatus();
      
      if (!result.paid) {
        log.debug("Pagamento ainda não confirmado");
        toast.info(
          "Pagamento ainda não confirmado. Aguarde alguns segundos após pagar.",
          { duration: 4000 }
        );
      }
    } catch (err: unknown) {
      log.error("Erro ao verificar pagamento", err);
      const errorMsg = err instanceof Error ? err.message : "Erro ao verificar pagamento. Tente novamente.";
      toast.error(errorMsg, { duration: 5000 });
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={checkingPayment}
      variant="outline"
      className="w-full mb-6 disabled:opacity-50"
      size="lg"
    >
      {checkingPayment ? (
        <>
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[hsl(var(--payment-card-text-primary))] mr-2" />
          Verificando...
        </>
      ) : (
        <>
          <CheckCircle2 className="w-5 h-5 mr-2" />
          Verificar agora
        </>
      )}
    </Button>
  );
}
