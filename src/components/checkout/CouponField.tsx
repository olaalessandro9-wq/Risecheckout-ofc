/**
 * CouponField - Campo de cupom de desconto
 * 
 * @version 3.0.0 - RISE Protocol V3 - Zero console.log
 */

import { useState } from "react";
import { Check, Tag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { validateCouponRpc } from "@/lib/rpc/rpcProxy";
import { toast } from "sonner";
import { createLogger } from "@/lib/logger";

const log = createLogger("CouponField");

/**
 * Design colors interface para CouponField
 * Usa tipos específicos para garantir type safety enquanto permite
 * propriedades opcionais que podem vir do design dinâmico
 */
interface CouponDesignColors {
  orderSummary?: {
    borderColor?: string;
    labelText?: string;
  };
  input?: {
    background?: string;
    border?: string;
    text?: string;
  };
  button?: {
    background?: string;
    text?: string;
  };
  success?: {
    background?: string;
    border?: string;
    icon?: string;
    text?: string;
    subtext?: string;
  };
}

interface CouponFieldDesign {
  colors: CouponDesignColors;
}

interface CouponFieldProps {
  productId: string;
  design: CouponFieldDesign;
  onCouponApplied: (coupon: AppliedCoupon | null) => void;
}

export interface AppliedCoupon {
  id: string;
  code: string;
  name: string;
  discount_type: "percentage";
  discount_value: number;
  apply_to_order_bumps: boolean;
}

// Type for RPC response
interface ValidateCouponResult {
  valid: boolean;
  error?: string;
  id?: string;
  code?: string;
  name?: string;
  discount_type?: string;
  discount_value?: number;
  apply_to_order_bumps?: boolean;
}

export function CouponField({ productId, design, onCouponApplied }: CouponFieldProps) {
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const validateAndApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error("Digite um código de cupom");
      return;
    }

    setIsValidating(true);

    try {
      log.debug("Validando código via RPC Proxy:", couponCode);

      // Use rpc-proxy Edge Function for secure RPC calls
      const { data, error } = await validateCouponRpc(couponCode.trim(), productId);

      if (error) {
        log.error("Erro na RPC:", error);
        toast.error("Erro ao validar cupom. Tente novamente.");
        return;
      }

      // Cast result to typed interface
      const result = data as unknown as ValidateCouponResult;

      log.debug("Resultado da validação:", result);

      // Check if coupon is valid
      if (!result?.valid) {
        toast.error(result?.error || "Cupom inválido");
        return;
      }

      // Coupon is valid! Apply it
      const appliedCouponData: AppliedCoupon = {
        id: result.id!,
        code: result.code!,
        name: result.name || result.code!,
        discount_type: "percentage" as const,
        discount_value: Number(result.discount_value),
        apply_to_order_bumps: result.apply_to_order_bumps || false,
      };

      setAppliedCoupon(appliedCouponData);
      onCouponApplied(appliedCouponData);
      toast.success(`Cupom "${result.code}" aplicado com sucesso!`);
      log.info("Cupom aplicado:", appliedCouponData);
    } catch (error: unknown) {
      log.error("Erro ao validar cupom:", error);
      toast.error("Erro ao validar cupom. Tente novamente.");
    } finally {
      setIsValidating(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    onCouponApplied(null);
    toast.success("Cupom removido");
  };

  return (
    <div className="mb-3 pb-3 border-b" style={{ borderColor: design.colors.orderSummary?.borderColor || '#D1D5DB' }}>
      {!appliedCoupon ? (
        <div className="space-y-2">
          <label 
            className="text-xs font-medium flex items-center gap-1.5"
            style={{ color: design.colors.orderSummary?.labelText || '#6B7280' }}
          >
            <Tag className="w-3.5 h-3.5" />
            Cupom de desconto
          </label>
          <div className="flex gap-2">
            <Input
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="Digite o código"
              className="flex-1 text-sm uppercase"
              style={{
                backgroundColor: design.colors.input?.background || '#FFFFFF',
                borderColor: design.colors.input?.border || '#D1D5DB',
                color: design.colors.input?.text || '#000000',
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  validateAndApplyCoupon();
                }
              }}
              disabled={isValidating}
            />
            <Button
              onClick={validateAndApplyCoupon}
              disabled={isValidating || !couponCode.trim()}
              size="sm"
              className="px-4"
              style={{
                backgroundColor: design.colors.button?.background || '#000000',
                color: design.colors.button?.text || '#FFFFFF',
              }}
            >
              {isValidating ? "..." : "Aplicar"}
            </Button>
          </div>
        </div>
      ) : (
        <div 
          className="flex items-center justify-between p-3 rounded-lg"
          style={{
            backgroundColor: design.colors.success?.background || '#ECFDF5',
            borderColor: design.colors.success?.border || '#10B981',
            borderWidth: '1px',
            borderStyle: 'solid',
          }}
        >
          <div className="flex items-center gap-2">
            <div 
              className="w-6 h-6 rounded-full flex items-center justify-center"
              style={{ backgroundColor: design.colors.success?.icon || '#10B981' }}
            >
              <Check className="w-4 h-4 text-white" />
            </div>
            <div>
              <p 
                className="text-sm font-semibold"
                style={{ color: design.colors.success?.text || '#065F46' }}
              >
                {appliedCoupon.code}
              </p>
              <p 
                className="text-xs"
                style={{ color: design.colors.success?.subtext || '#047857' }}
              >
                {appliedCoupon.name}
              </p>
            </div>
          </div>
          <Button
            onClick={removeCoupon}
            variant="ghost"
            size="icon"
            className="h-7 w-7"
          >
            <X className="w-4 h-4" style={{ color: design.colors.success?.text || '#065F46' }} />
          </Button>
        </div>
      )}
    </div>
  );
}
