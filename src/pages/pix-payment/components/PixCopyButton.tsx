/**
 * PixCopyButton - Input com botão de copiar código PIX
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Campo de texto readonly com o código PIX e botão para copiar.
 * Usa design tokens semânticos para garantir visibilidade e contraste.
 * 
 * @module pix-payment/components
 */

import { Copy, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PixCopyButtonProps {
  qrCode: string;
  copied: boolean;
  onCopy: () => Promise<void>;
}

export function PixCopyButton({ qrCode, copied, onCopy }: PixCopyButtonProps) {
  return (
    <div className="mb-6">
      <div className="flex gap-2">
        <input
          type="text"
          value={qrCode}
          readOnly
          className="flex-1 rounded-md border border-[hsl(var(--payment-input-border))] bg-[hsl(var(--payment-input-bg))] px-4 py-3 text-sm font-mono text-[hsl(var(--payment-text-dark))]"
        />
        <Button
          onClick={onCopy}
          className="gap-2 bg-[hsl(var(--payment-success))] hover:bg-[hsl(var(--payment-success-hover))] text-white px-6"
          size="lg"
        >
          {copied ? (
            <>
              <CheckCircle2 className="w-5 h-5" />
              Copiado!
            </>
          ) : (
            <>
              <Copy className="w-5 h-5" />
              Copiar
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
