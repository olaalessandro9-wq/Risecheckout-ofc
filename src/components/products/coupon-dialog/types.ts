/**
 * CouponDialog Types
 * 
 * @module coupon-dialog
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import type { UseFormReturn } from "react-hook-form";
import type { CouponFormData } from "@/schemas/coupon.schema";

// Re-export para manter compatibilidade
export type { CouponFormData } from "@/schemas/coupon.schema";

export interface CouponSaveResult {
  success: boolean;
  error?: string;
  field?: string; // Campo com erro (ex: "code")
}

export interface CouponDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (coupon: CouponFormData) => Promise<CouponSaveResult>;
  coupon: CouponFormData | null;
}

export interface ServerError {
  field?: string;
  message: string;
}

export interface CouponFormFieldsProps {
  form: UseFormReturn<CouponFormData>;
  serverError: ServerError | null;
  setServerError: (error: ServerError | null) => void;
  codeFieldRef: React.RefObject<HTMLDivElement>;
  discountValueRaw: string;
  setDiscountValueRaw: (value: string) => void;
}

export interface CouponLimitsFieldsProps {
  form: UseFormReturn<CouponFormData>;
  maxUsesRaw: string;
  setMaxUsesRaw: (value: string) => void;
  maxUsesPerCustomerRaw: string;
  setMaxUsesPerCustomerRaw: (value: string) => void;
}

export interface CouponDateFieldsProps {
  form: UseFormReturn<CouponFormData>;
}
