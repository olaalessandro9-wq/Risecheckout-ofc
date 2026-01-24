/**
 * PixQrCodeDisplay - Exibição do QR Code PIX
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Componente que exibe o QR Code PIX, seja de uma imagem base64
 * ou gerando dinamicamente via canvas.
 * 
 * IMPORTANTE: Alguns gateways (PushinPay) retornam o base64 já com
 * o prefixo "data:image/png;base64,", outros não. Este componente
 * normaliza o formato antes de renderizar.
 * 
 * @module pix-payment/components
 */

import * as PushinPay from "@/integrations/gateways/pushinpay";

interface PixQrCodeDisplayProps {
  qrCode: string;
  qrCodeImageBase64: string | null;
}

/**
 * Normaliza o base64 para garantir formato correto da URL de dados.
 * PushinPay retorna com prefixo, outros gateways podem não incluir.
 */
function normalizeBase64DataUrl(base64: string): string {
  // Se já começa com data:, usar diretamente
  if (base64.startsWith('data:')) {
    return base64;
  }
  // Senão, adicionar prefixo
  return `data:image/png;base64,${base64}`;
}

export function PixQrCodeDisplay({ qrCode, qrCodeImageBase64 }: PixQrCodeDisplayProps) {
  return (
    <div className="flex justify-center mb-8">
      <div className="p-6 bg-[hsl(var(--payment-qr-bg))] border-2 border-[hsl(var(--payment-qr-border))] rounded-lg shadow-md">
        {qrCodeImageBase64 ? (
          // Se temos imagem base64, renderizar diretamente (normalizado)
          <img 
            src={normalizeBase64DataUrl(qrCodeImageBase64)}
            alt="QR Code PIX"
            width={280}
            height={280}
            className="rounded-lg"
          />
        ) : (
          // Se não temos imagem, gerar QR a partir do texto via canvas
          <PushinPay.QRCanvas value={qrCode} size={280} />
        )}
      </div>
    </div>
  );
}
