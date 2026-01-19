/**
 * Stripe PIX Component
 * 
 * Exibe QR Code PIX gerado via Stripe.
 * 
 * MIGRATED: Uses api.publicCall() instead of supabase.functions.invoke()
 * @see RISE Protocol V2 - Zero database access from frontend
 */

import { useState, useEffect } from "react";
import { Loader2, Copy, CheckCircle2, Clock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { SUPABASE_URL } from "@/config/supabase";
import { createLogger } from "@/lib/logger";

const log = createLogger("StripePix");

interface OrderPaymentStatusResponse {
  status?: string;
  pix_status?: string;
}

interface StripePixProps {
  orderId: string;
  amount: number; // centavos
  onPaymentConfirmed?: () => void;
  onError?: (error: Error) => void;
}

interface PixData {
  qr_code: string;
  qr_code_text: string;
  expires_at?: number;
  payment_intent_id: string;
}

export function StripePix({ orderId, amount, onPaymentConfirmed, onError }: StripePixProps) {
  const [pixData, setPixData] = useState<PixData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<"pending" | "paid" | "expired">("pending");
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Criar PIX
  useEffect(() => {
    createPixPayment();
  }, [orderId]);

  /**
   * Polling via Edge Function (public endpoint)
   * MIGRATED: Uses api.publicCall() instead of supabase.functions.invoke()
   */
  useEffect(() => {
    if (status !== "pending" || !pixData) return;

    const interval = setInterval(async () => {
      try {
        const { data, error } = await api.publicCall<OrderPaymentStatusResponse>('checkout-public-data', {
          action: 'check-order-payment-status',
          orderId,
        });

        if (error) {
          log.error("Polling error:", error);
          return;
        }

        if (data?.status === "PAID" || data?.pix_status === "paid") {
          setStatus("paid");
          onPaymentConfirmed?.();
          clearInterval(interval);
        }
      } catch (err) {
        log.error("Polling error:", err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [status, pixData, orderId, onPaymentConfirmed]);

  // Countdown timer
  useEffect(() => {
    if (!pixData?.expires_at) return;

    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = pixData.expires_at! - now;
      
      if (remaining <= 0) {
        setStatus("expired");
        setTimeLeft(0);
        clearInterval(interval);
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [pixData?.expires_at]);

  const createPixPayment = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/stripe-create-payment`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            order_id: orderId,
            payment_method: "pix",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao criar PIX");
      }

      setPixData({
        qr_code: data.qr_code,
        qr_code_text: data.qr_code_text,
        expires_at: data.expires_at,
        payment_intent_id: data.payment_intent_id,
      });
    } catch (err) {
      log.error("Error:", err);
      onError?.(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!pixData?.qr_code_text) return;

    try {
      await navigator.clipboard.writeText(pixData.qr_code_text);
      setCopied(true);
      toast.success("Código PIX copiado!");
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error("Erro ao copiar código");
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const formatAmount = (cents: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(cents / 100);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Gerando PIX...</p>
      </div>
    );
  }

  if (status === "paid") {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <div className="text-center">
          <h3 className="font-semibold text-lg text-green-600">Pagamento Confirmado!</h3>
          <p className="text-sm text-muted-foreground">Seu pagamento foi processado com sucesso.</p>
        </div>
      </div>
    );
  }

  if (status === "expired" || !pixData) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
          <Clock className="h-10 w-10 text-orange-600" />
        </div>
        <div className="text-center">
          <h3 className="font-semibold text-lg text-orange-600">PIX Expirado</h3>
          <p className="text-sm text-muted-foreground">Gere um novo código para continuar.</p>
        </div>
        <Button onClick={createPixPayment} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Gerar Novo PIX
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Timer */}
      {timeLeft !== null && (
        <div className="flex items-center justify-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Expira em:</span>
          <span className="font-mono font-semibold">{formatTime(timeLeft)}</span>
        </div>
      )}

      {/* Valor */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">Valor a pagar</p>
        <p className="text-2xl font-bold">{formatAmount(amount)}</p>
      </div>

      {/* QR Code */}
      <Card>
        <CardContent className="p-4 flex justify-center">
          {pixData.qr_code ? (
            <img 
              src={pixData.qr_code} 
              alt="QR Code PIX" 
              className="w-48 h-48 object-contain"
            />
          ) : (
            <div className="w-48 h-48 bg-muted flex items-center justify-center rounded">
              <p className="text-sm text-muted-foreground">QR Code indisponível</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Código Copia e Cola */}
      <div className="space-y-2">
        <p className="text-sm text-center text-muted-foreground">
          Ou copie o código PIX:
        </p>
        <div className="relative">
          <input
            type="text"
            value={pixData.qr_code_text}
            readOnly
            className="w-full p-3 pr-12 text-xs font-mono bg-muted rounded-lg border truncate"
          />
          <Button
            size="sm"
            variant="ghost"
            className="absolute right-1 top-1/2 -translate-y-1/2"
            onClick={copyToClipboard}
          >
            {copied ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Instruções */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p>1. Abra o app do seu banco</p>
        <p>2. Escolha pagar via PIX</p>
        <p>3. Escaneie o QR Code ou cole o código</p>
      </div>
    </div>
  );
}

export default StripePix;
