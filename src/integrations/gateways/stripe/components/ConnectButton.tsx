/**
 * Stripe Connect Button Component
 * 
 * @module integrations/gateways/stripe/components
 * @version 1.0.0 - RISE Protocol V3 Compliant
 * 
 * Botão para iniciar conexão OAuth com Stripe.
 */

import { Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConnectButtonProps {
  isConnecting: boolean;
  onConnect: () => void;
}

export function ConnectButton({ isConnecting, onConnect }: ConnectButtonProps) {
  return (
    <Button onClick={onConnect} disabled={isConnecting}>
      {isConnecting ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : (
        <ExternalLink className="h-4 w-4 mr-2" />
      )}
      Conectar com Stripe
    </Button>
  );
}
