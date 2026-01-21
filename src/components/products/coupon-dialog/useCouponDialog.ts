/**
 * useCouponDialog Hook
 * 
 * Encapsulates all form logic for CouponDialog.
 * 
 * @module coupon-dialog
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { useEffect, useState, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { couponSchema, defaultCouponValues, type CouponFormData } from "@/schemas/coupon.schema";
import type { CouponDialogProps, ServerError, CouponSaveResult } from "./types";

interface UseCouponDialogParams {
  open: boolean;
  coupon: CouponFormData | null;
  onSave: (coupon: CouponFormData) => Promise<CouponSaveResult>;
  onOpenChange: (open: boolean) => void;
}

export function useCouponDialog({ open, coupon, onSave, onOpenChange }: UseCouponDialogParams) {
  const [isSaving, setIsSaving] = useState(false);
  const [serverError, setServerError] = useState<ServerError | null>(null);
  const codeFieldRef = useRef<HTMLDivElement>(null);

  // Estados "raw" para permitir apagar/editar sem o input voltar pro valor anterior.
  const [discountValueRaw, setDiscountValueRaw] = useState<string>("");
  const [maxUsesRaw, setMaxUsesRaw] = useState<string>("");
  const [maxUsesPerCustomerRaw, setMaxUsesPerCustomerRaw] = useState<string>("");

  const form = useForm<CouponFormData>({
    resolver: zodResolver(couponSchema),
    defaultValues: defaultCouponValues,
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const { reset, formState: { errors } } = form;

  // Sincronizar com prop coupon
  useEffect(() => {
    if (!open) return;

    if (coupon) {
      reset({
        ...coupon,
        discountValue: coupon.discountValue,
        maxUses: coupon.maxUses,
        maxUsesPerCustomer: coupon.maxUsesPerCustomer,
      });

      setDiscountValueRaw(
        coupon.discountValue === undefined || coupon.discountValue === null
          ? ""
          : String(coupon.discountValue),
      );
      setMaxUsesRaw(coupon.maxUses ? String(coupon.maxUses) : "");
      setMaxUsesPerCustomerRaw(coupon.maxUsesPerCustomer ? String(coupon.maxUsesPerCustomer) : "");
    } else {
      reset(defaultCouponValues);
      setDiscountValueRaw("");
      setMaxUsesRaw("");
      setMaxUsesPerCustomerRaw("");
    }
  }, [coupon, open, reset]);

  const handleSubmit = useCallback(async (data: CouponFormData) => {
    setIsSaving(true);
    setServerError(null);

    try {
      // Limpar datas se não tem expiração
      const cleanedData: CouponFormData = {
        ...data,
        id: coupon?.id,
        startDate: data.hasExpiration ? data.startDate : undefined,
        endDate: data.hasExpiration ? data.endDate : undefined,
        usageCount: coupon?.usageCount ?? 0,
      };

      const result = await onSave(cleanedData);

      if (!result.success) {
        // Mostrar erro no campo específico ou geral
        setServerError({ field: result.field, message: result.error || "Erro ao salvar" });
        
        // Scroll até o campo com erro
        if (result.field === "code" && codeFieldRef.current) {
          setTimeout(() => {
            codeFieldRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
          }, 100);
        }
        return;
      }

      onOpenChange(false);
      toast.success(coupon ? "Cupom atualizado!" : "Cupom criado!");
    } finally {
      setIsSaving(false);
    }
  }, [coupon, onSave, onOpenChange]);

  const onError = useCallback(() => {
    // Mostrar primeiro erro encontrado
    const firstError = Object.values(errors)[0];
    if (firstError?.message) {
      toast.error(firstError.message as string);
    }
  }, [errors]);

  return {
    form,
    isSaving,
    serverError,
    setServerError,
    codeFieldRef,
    discountValueRaw,
    setDiscountValueRaw,
    maxUsesRaw,
    setMaxUsesRaw,
    maxUsesPerCustomerRaw,
    setMaxUsesPerCustomerRaw,
    handleSubmit: form.handleSubmit(handleSubmit, onError),
  };
}
