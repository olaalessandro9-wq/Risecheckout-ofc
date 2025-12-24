import { Link } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, Settings } from "lucide-react";

/**
 * Alert exibido quando o usuário não possui conta de pagamento conectada
 * para receber comissões de afiliação.
 */
export function PaymentAccountAlert() {
  return (
    <Alert variant="destructive" className="max-w-2xl mx-auto mb-6">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Conta de Pagamento Necessária</AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-3">
          Para receber suas comissões automaticamente, você precisa conectar uma conta 
          de pagamento (Mercado Pago ou Stripe) antes de solicitar afiliação.
        </p>
        <Button asChild variant="outline" size="sm">
          <Link to="/dashboard/configuracoes" className="gap-2">
            <Settings className="w-4 h-4" />
            Ir para Configurações
          </Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
}
