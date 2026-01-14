/**
 * PixQrCodeDisplay - Exibição do QR Code PIX
 */

import * as PushinPay from "@/integrations/gateways/pushinpay";

interface PixQrCodeDisplayProps {
  qrCode: string;
  qrCodeImageBase64: string | null;
}

export function PixQrCodeDisplay({ qrCode, qrCodeImageBase64 }: PixQrCodeDisplayProps) {
  return (
    <div className="flex justify-center mb-8">
      <div className="p-6 bg-white border-2 border-gray-200 rounded-lg shadow-md">
        {qrCodeImageBase64 ? (
          // Se temos imagem base64 (Asaas, Mercado Pago), renderizar diretamente
          <img 
            src={`data:image/png;base64,${qrCodeImageBase64}`}
            alt="QR Code PIX"
            width={280}
            height={280}
            className="rounded-lg"
          />
        ) : (
          // Se não temos imagem, gerar QR a partir do texto (PushinPay, etc)
          <PushinPay.QRCanvas value={qrCode} size={280} />
        )}
      </div>
    </div>
  );
}
