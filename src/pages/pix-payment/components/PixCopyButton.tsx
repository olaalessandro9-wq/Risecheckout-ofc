/**
 * PixCopyButton - Input com botão de copiar código PIX
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
          className="flex-1 rounded-md border border-gray-300 bg-green-50 px-4 py-3 text-sm font-mono text-gray-900"
        />
        <Button
          onClick={onCopy}
          className="gap-2 bg-green-600 hover:bg-green-700 text-white px-6"
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
