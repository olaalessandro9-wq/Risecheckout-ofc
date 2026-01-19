/**
 * QRCanvas - Componente de QR Code em Canvas
 * Módulo: src/integrations/gateways/pushinpay
 * 
 * @version 2.0.0 - RISE Protocol V3 Compliant - Zero console.log
 * Renderiza QR Code PIX usando canvas HTML5.
 */

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { createLogger } from "@/lib/logger";

const log = createLogger("QRCanvas");

interface QRCanvasProps {
  value: string;
  size?: number;
  className?: string;
}

export const QRCanvas = ({ value, size = 256, className = "" }: QRCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!canvasRef.current || !value) {
      setError(true);
      return;
    }

    log.trace("Gerando QR Code", {
      valueLength: value.length,
      valuePreview: value.substring(0, 50),
    });

    QRCode.toCanvas(
      canvasRef.current,
      value,
      {
        width: size,
        margin: 2,
        errorCorrectionLevel: "M",
      },
      (err) => {
        if (err) {
          log.error("Erro ao gerar QR", err);
          setError(true);
        } else {
          log.debug("QR gerado com sucesso");
          setError(false);
        }
      }
    );
  }, [value, size]);

  if (error || !value) {
    return (
      <div 
        className={`flex items-center justify-center bg-muted text-muted-foreground rounded-lg ${className}`}
        style={{ width: size, height: size }}
      >
        <div className="text-center p-4">
          <p className="text-sm">QR Code indisponível</p>
          <p className="text-xs mt-1">Use o código PIX abaixo</p>
        </div>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className={`rounded-lg ${className}`}
      width={size}
      height={size}
      style={{ width: size, height: size }}
    />
  );
};
