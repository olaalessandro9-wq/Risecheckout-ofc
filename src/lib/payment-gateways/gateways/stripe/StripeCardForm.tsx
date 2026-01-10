/**
 * Stripe Card Form Component
 * 
 * Formulário de cartão de crédito usando Stripe Elements.
 * PCI Compliant via iframes seguros.
 * 
 * REFATORADO: Lógica extraída para hooks (< 200 linhas)
 */

import { useEffect, useCallback } from "react";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { useState } from "react";
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
import { useStripeFormState, useStripeSubmit } from "./hooks";

// ============================================================================
// TYPES
// ============================================================================

interface StripeCardFormProps {
  publicKey: string;
  amount: number;
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
// INNER FORM
// ============================================================================

function StripeCardFormInner({ amount, onSubmit, onError, onReady, onMount, colors }: InnerFormProps) {
  const stripe = useStripe();
  const elements = useElements();

  const {
    holderName, holderDocument, selectedInstallments, cardComplete, errors, installments,
    setHolderName, setHolderDocument, setSelectedInstallments, setCardComplete, setErrors,
    clearError, formatCPF,
  } = useStripeFormState(amount);

  const { handleSubmit } = useStripeSubmit({
    stripe, elements, holderName, holderDocument, cardComplete,
    selectedInstallments, setErrors, onSubmit, onError,
  });

  useEffect(() => {
    if (stripe && elements) onReady?.();
  }, [stripe, elements, onReady]);

  useEffect(() => {
    onMount?.(handleSubmit);
  }, [handleSubmit, onMount]);

  // Cores
  const textColor = colors?.text || "#1a1a1a";
  const bgColor = colors?.background || "#ffffff";
  const borderColorDefault = colors?.border || "#e5e7eb";
  const stripePlaceholderColor = colors?.placeholder || "#9ca3af";

  const elementStyle = {
    base: { fontSize: "14px", color: textColor, fontFamily: "inherit", "::placeholder": { color: stripePlaceholderColor } },
    invalid: { color: "#ef4444" },
  };

  const inputStyle: React.CSSProperties = {
    backgroundColor: bgColor,
    borderColor: errors.holderName || errors.holderDocument ? "#ef4444" : borderColorDefault,
    color: textColor,
  };

  const handleCardChange = (field: keyof typeof cardComplete) => (event: any) => {
    setCardComplete(prev => ({ ...prev, [field]: event.complete }));
    if (event.complete) clearError(field);
    if (event.error) setErrors(prev => ({ ...prev, [field]: event.error.message }));
  };

  return (
    <div className="space-y-3">
      {/* Número do Cartão */}
      <div className="space-y-1">
        <Label className="text-[11px] font-normal opacity-70">Número do cartão <span className="text-destructive">*</span></Label>
        <div className={`h-9 px-3 rounded-xl border flex items-center ${errors.cardNumber ? "border-destructive" : ""}`}
          style={{ backgroundColor: bgColor, borderColor: errors.cardNumber ? undefined : borderColorDefault }}>
          <div className="flex-1 w-full">
            <CardNumberElement options={{ style: elementStyle, placeholder: "1234 1234 1234 1234", disableLink: true }} onChange={handleCardChange("cardNumber")} />
          </div>
        </div>
        {errors.cardNumber && <p className="text-[10px] text-destructive mt-0.5">{errors.cardNumber}</p>}
      </div>

      {/* Nome do Titular */}
      <div className="space-y-1">
        <Label className="text-[11px] font-normal opacity-70">Nome no cartão <span className="text-destructive">*</span></Label>
        <Input value={holderName} onChange={(e) => { setHolderName(e.target.value.toUpperCase()); clearError('holderName'); }}
          placeholder="NOME COMO ESTÁ NO CARTÃO" className={`h-9 px-3 rounded-xl text-sm ${errors.holderName ? "border-destructive" : ""}`} style={inputStyle} />
        {errors.holderName && <p className="text-[10px] text-destructive mt-0.5">{errors.holderName}</p>}
      </div>

      {/* Validade e CVV */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="space-y-1">
          <Label className="text-[11px] font-normal opacity-70">Validade <span className="text-destructive">*</span></Label>
          <div className={`h-9 px-3 rounded-xl border flex items-center ${errors.cardExpiry ? "border-destructive" : ""}`}
            style={{ backgroundColor: bgColor, borderColor: errors.cardExpiry ? undefined : borderColorDefault }}>
            <div className="flex-1 w-full">
              <CardExpiryElement options={{ style: elementStyle, placeholder: "MM/AA" }} onChange={handleCardChange("cardExpiry")} />
            </div>
          </div>
          {errors.cardExpiry && <p className="text-[10px] text-destructive mt-0.5">{errors.cardExpiry}</p>}
        </div>
        <div className="space-y-1">
          <Label className="text-[11px] font-normal opacity-70">CVV <span className="text-destructive">*</span></Label>
          <div className={`h-9 px-3 rounded-xl border flex items-center ${errors.cardCvc ? "border-destructive" : ""}`}
            style={{ backgroundColor: bgColor, borderColor: errors.cardCvc ? undefined : borderColorDefault }}>
            <div className="flex-1 w-full">
              <CardCvcElement options={{ style: elementStyle, placeholder: "123" }} onChange={handleCardChange("cardCvc")} />
            </div>
          </div>
          {errors.cardCvc && <p className="text-[10px] text-destructive mt-0.5">{errors.cardCvc}</p>}
        </div>
      </div>

      {/* CPF */}
      <div className="space-y-1">
        <Label className="text-[11px] font-normal opacity-70">CPF do titular <span className="text-destructive">*</span></Label>
        <Input value={holderDocument} onChange={(e) => { setHolderDocument(formatCPF(e.target.value)); clearError('holderDocument'); }}
          placeholder="000.000.000-00" className={`h-9 px-3 rounded-xl text-sm ${errors.holderDocument ? "border-destructive" : ""}`} style={inputStyle} />
        {errors.holderDocument && <p className="text-[10px] text-destructive mt-0.5">{errors.holderDocument}</p>}
      </div>

      {/* Parcelas */}
      <div className="space-y-1">
        <Label className="text-[11px] font-normal opacity-70">Parcelas <span className="text-destructive">*</span></Label>
        <Select value={String(selectedInstallments)} onValueChange={(value) => setSelectedInstallments(Number(value))}>
          <SelectTrigger className="h-9 px-3 rounded-xl text-sm" style={{ backgroundColor: bgColor, borderColor: borderColorDefault, color: textColor }}>
            <SelectValue asChild>
              <span style={{ color: textColor }}>{installments.find(i => i.value === selectedInstallments)?.label || 'Selecione o parcelamento'}</span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="z-50" style={{ backgroundColor: "#ffffff" }}>
            {installments.map((inst) => <SelectItem key={inst.value} value={String(inst.value)}>{inst.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

// ============================================================================
// WRAPPER COMPONENT
// ============================================================================

export function StripeCardForm({ publicKey, ...props }: StripeCardFormProps) {
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);

  useEffect(() => {
    if (publicKey) setStripePromise(loadStripe(publicKey));
  }, [publicKey]);

  if (!stripePromise) {
    return <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">Carregando Stripe...</div>;
  }

  return (
    <Elements stripe={stripePromise}>
      <StripeCardFormInner {...props} />
    </Elements>
  );
}

export default StripeCardForm;
