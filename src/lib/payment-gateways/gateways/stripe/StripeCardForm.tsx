/**
 * Stripe Card Form Component
 * 
 * Formulário de cartão de crédito usando Stripe Elements.
 * PCI Compliant via iframes seguros.
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { loadStripe, Stripe, StripeElements } from "@stripe/stripe-js";
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateInstallments } from "@/lib/payment-gateways/installments";
import type { Installment } from "@/types/payment-types";

// ============================================================================
// TYPES
// ============================================================================

interface StripeCardFormProps {
  publicKey: string;
  amount: number; // em centavos
  onSubmit: (result: { paymentMethodId: string; installments: number }) => void | Promise<void>;
  onError?: (error: Error) => void;
  onReady?: () => void;
  onMount?: (submitFn: () => void) => void;
  isProcessing?: boolean;
  colors?: {
    text?: string;
    placeholder?: string;
    background?: string;
    border?: string;
    focusBorder?: string;
  };
}

interface InnerFormProps extends Omit<StripeCardFormProps, 'publicKey'> {}

// ============================================================================
// INNER FORM (Usa hooks do Stripe)
// ============================================================================

function StripeCardFormInner({
  amount,
  onSubmit,
  onError,
  onReady,
  onMount,
  isProcessing,
  colors,
}: InnerFormProps) {
  const stripe = useStripe();
  const elements = useElements();

  const [holderName, setHolderName] = useState("");
  const [holderDocument, setHolderDocument] = useState("");
  const [selectedInstallments, setSelectedInstallments] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [cardComplete, setCardComplete] = useState({
    cardNumber: false,
    cardExpiry: false,
    cardCvc: false,
  });

  // Gerar parcelas
  const installments = useMemo(() => {
    return generateInstallments(amount, {
      interestRate: 0.0199, // 1.99% Stripe
      maxInstallments: 12,
    });
  }, [amount]);

  // Notificar quando pronto
  useEffect(() => {
    if (stripe && elements) {
      onReady?.();
    }
  }, [stripe, elements, onReady]);

  // Função de submit
  const handleSubmit = useCallback(async () => {
    if (!stripe || !elements) {
      onError?.(new Error("Stripe não carregado"));
      return;
    }

    // Validar campos locais
    const newErrors: Record<string, string> = {};
    if (!holderName.trim()) newErrors.holderName = "Obrigatório";
    if (!holderDocument.trim()) newErrors.holderDocument = "Obrigatório";
    if (!cardComplete.cardNumber) newErrors.cardNumber = "Obrigatório";
    if (!cardComplete.cardExpiry) newErrors.cardExpiry = "Obrigatório";
    if (!cardComplete.cardCvc) newErrors.cardCvc = "Obrigatório";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const cardNumberElement = elements.getElement(CardNumberElement);
      if (!cardNumberElement) {
        throw new Error("Card element not found");
      }

      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card: cardNumberElement,
        billing_details: {
          name: holderName,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!paymentMethod) {
        throw new Error("Falha ao criar método de pagamento");
      }

      await onSubmit({
        paymentMethodId: paymentMethod.id,
        installments: selectedInstallments,
      });
    } catch (err) {
      onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  }, [stripe, elements, holderName, holderDocument, cardComplete, selectedInstallments, onSubmit, onError]);

  // Registrar função de submit
  useEffect(() => {
    onMount?.(handleSubmit);
  }, [handleSubmit, onMount]);

  // Estilos para Stripe Elements - usando cores sólidas (não CSS vars que o iframe não entende)
  const stripeTextColor = colors?.text || "#1a1a1a";
  const stripePlaceholderColor = colors?.placeholder || "#9ca3af";
  
  const elementStyle = {
    base: {
      fontSize: "14px",
      color: stripeTextColor,
      fontFamily: "inherit",
      "::placeholder": {
        color: stripePlaceholderColor,
      },
    },
    invalid: {
      color: "#ef4444",
    },
  };

  // Cores com fallback sólido
  const textColor = colors?.text || "#1a1a1a";
  const bgColor = colors?.background || "#ffffff";
  const borderColorDefault = colors?.border || "#e5e7eb";

  const inputStyle: React.CSSProperties = {
    backgroundColor: bgColor,
    borderColor: errors.holderName || errors.holderDocument ? "#ef4444" : borderColorDefault,
    color: textColor,
  };

  // Handlers para card elements
  const handleCardChange = (field: keyof typeof cardComplete) => (event: any) => {
    setCardComplete(prev => ({ ...prev, [field]: event.complete }));
    if (event.complete) {
      setErrors(prev => {
        const { [field]: _, ...rest } = prev;
        return rest;
      });
    }
    if (event.error) {
      setErrors(prev => ({ ...prev, [field]: event.error.message }));
    }
  };

  return (
    <div className="space-y-3">
      {/* Número do Cartão */}
      <div className="space-y-1">
        <Label className="text-[11px] font-normal opacity-70">
          Número do cartão <span className="text-destructive">*</span>
        </Label>
        <div
          className={`h-9 px-3 rounded-xl border flex items-center ${
            errors.cardNumber ? "border-destructive" : ""
          }`}
          style={{ 
            backgroundColor: bgColor,
            borderColor: errors.cardNumber ? undefined : borderColorDefault,
          }}
        >
          <div className="flex-1 w-full">
            <CardNumberElement
              options={{ 
                style: elementStyle, 
                placeholder: "1234 1234 1234 1234",
                disableLink: true, // Remove "Salvar com link"
              }}
              onChange={handleCardChange("cardNumber")}
            />
          </div>
        </div>
        {errors.cardNumber && (
          <p className="text-[10px] text-destructive mt-0.5">{errors.cardNumber}</p>
        )}
      </div>

      {/* Nome do Titular */}
      <div className="space-y-1">
        <Label className="text-[11px] font-normal opacity-70">
          Nome no cartão <span className="text-destructive">*</span>
        </Label>
        <Input
          value={holderName}
          onChange={(e) => {
            setHolderName(e.target.value.toUpperCase());
            if (errors.holderName) {
              setErrors(prev => {
                const { holderName: _, ...rest } = prev;
                return rest;
              });
            }
          }}
          placeholder="NOME COMO ESTÁ NO CARTÃO"
          className={`h-9 px-3 rounded-xl text-sm ${errors.holderName ? "border-destructive" : ""}`}
          style={inputStyle}
        />
        {errors.holderName && (
          <p className="text-[10px] text-destructive mt-0.5">{errors.holderName}</p>
        )}
      </div>

      {/* Validade e CVV */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="space-y-1">
          <Label className="text-[11px] font-normal opacity-70">
            Validade <span className="text-destructive">*</span>
          </Label>
          <div
            className={`h-9 px-3 rounded-xl border flex items-center ${
              errors.cardExpiry ? "border-destructive" : ""
            }`}
            style={{ 
              backgroundColor: bgColor,
              borderColor: errors.cardExpiry ? undefined : borderColorDefault,
            }}
          >
            <div className="flex-1 w-full">
              <CardExpiryElement
                options={{ style: elementStyle, placeholder: "MM/AA" }}
                onChange={handleCardChange("cardExpiry")}
              />
            </div>
          </div>
          {errors.cardExpiry && (
            <p className="text-[10px] text-destructive mt-0.5">{errors.cardExpiry}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label className="text-[11px] font-normal opacity-70">
            CVV <span className="text-destructive">*</span>
          </Label>
          <div
            className={`h-9 px-3 rounded-xl border flex items-center ${
              errors.cardCvc ? "border-destructive" : ""
            }`}
            style={{ 
              backgroundColor: bgColor,
              borderColor: errors.cardCvc ? undefined : borderColorDefault,
            }}
          >
            <div className="flex-1 w-full">
              <CardCvcElement
                options={{ style: elementStyle, placeholder: "123" }}
                onChange={handleCardChange("cardCvc")}
              />
            </div>
          </div>
          {errors.cardCvc && (
            <p className="text-[10px] text-destructive mt-0.5">{errors.cardCvc}</p>
          )}
        </div>
      </div>

      {/* CPF */}
      <div className="space-y-1">
        <Label className="text-[11px] font-normal opacity-70">
          CPF do titular <span className="text-destructive">*</span>
        </Label>
        <Input
          value={holderDocument}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, "");
            const formatted = value
              .replace(/(\d{3})(\d)/, "$1.$2")
              .replace(/(\d{3})(\d)/, "$1.$2")
              .replace(/(\d{3})(\d{1,2})/, "$1-$2")
              .slice(0, 14);
            setHolderDocument(formatted);
            if (errors.holderDocument) {
              setErrors(prev => {
                const { holderDocument: _, ...rest } = prev;
                return rest;
              });
            }
          }}
          placeholder="000.000.000-00"
          className={`h-9 px-3 rounded-xl text-sm ${errors.holderDocument ? "border-destructive" : ""}`}
          style={inputStyle}
        />
        {errors.holderDocument && (
          <p className="text-[10px] text-destructive mt-0.5">{errors.holderDocument}</p>
        )}
      </div>

      {/* Parcelas */}
      <div className="space-y-1">
        <Label className="text-[11px] font-normal opacity-70">
          Parcelas <span className="text-destructive">*</span>
        </Label>
        <Select
          value={String(selectedInstallments)}
          onValueChange={(value) => setSelectedInstallments(Number(value))}
        >
          <SelectTrigger 
            className="h-9 px-3 rounded-xl text-sm"
            style={{ 
              backgroundColor: bgColor,
              borderColor: borderColorDefault,
              color: textColor,
            }}
          >
            <SelectValue asChild>
              <span style={{ color: textColor }}>
                {installments.find(i => i.value === selectedInstallments)?.label || 'Selecione o parcelamento'}
              </span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent 
            className="z-50"
            style={{ backgroundColor: "#ffffff" }}
          >
            {installments.map((inst) => (
              <SelectItem key={inst.value} value={String(inst.value)}>
                {inst.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

// ============================================================================
// WRAPPER COMPONENT (Carrega Stripe)
// ============================================================================

export function StripeCardForm({ publicKey, ...props }: StripeCardFormProps) {
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);

  useEffect(() => {
    if (publicKey) {
      setStripePromise(loadStripe(publicKey));
    }
  }, [publicKey]);

  if (!stripePromise) {
    return (
      <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
        Carregando Stripe...
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <StripeCardFormInner {...props} />
    </Elements>
  );
}

export default StripeCardForm;
