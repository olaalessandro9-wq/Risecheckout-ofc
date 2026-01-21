/**
 * CouponDialog Component
 * 
 * Modular coupon creation/editing dialog.
 * 
 * @module coupon-dialog
 * @version 1.0.0 - RISE Protocol V3 Compliant
 * 
 * Architecture:
 * - index.tsx (~90 lines) - Orchestrator
 * - useCouponDialog.ts (~120 lines) - Logic hook
 * - CouponFormFields.tsx (~200 lines) - Basic fields
 * - CouponDateFields.tsx (~130 lines) - Date pickers
 * - CouponLimitsFields.tsx (~115 lines) - Limits & rules
 * - types.ts (~50 lines) - Type definitions
 */

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { useCouponDialog } from "./useCouponDialog";
import { CouponFormFields } from "./CouponFormFields";
import { CouponDateFields } from "./CouponDateFields";
import { CouponLimitsFields } from "./CouponLimitsFields";
import type { CouponDialogProps } from "./types";

// Re-exports for backwards compatibility
export type { CouponFormData, CouponSaveResult, CouponDialogProps } from "./types";

export function CouponDialog({
  open,
  onOpenChange,
  onSave,
  coupon,
}: CouponDialogProps) {
  const {
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
    handleSubmit,
  } = useCouponDialog({ open, coupon, onSave, onOpenChange });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl bg-card border-border overflow-y-auto">
        <SheetHeader className="border-b border-border pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-foreground">
              {coupon ? "Editar Cupom" : "Criar Desconto"}
            </SheetTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground text-left pt-2">
            Configure regras, período, produtos e segmentação do desconto.
          </p>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-8 py-6">
          {/* Banner de erro geral (quando não é erro de campo específico) */}
          {serverError && serverError.field !== "code" && (
            <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
              <p className="text-sm text-destructive font-medium">{serverError.message}</p>
            </div>
          )}

          <CouponFormFields
            form={form}
            serverError={serverError}
            setServerError={setServerError}
            codeFieldRef={codeFieldRef}
            discountValueRaw={discountValueRaw}
            setDiscountValueRaw={setDiscountValueRaw}
          />

          {/* SEÇÃO: PERÍODO E LIMITES */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Período e limites</h3>
            
            <CouponDateFields form={form} />

            <CouponLimitsFields
              form={form}
              maxUsesRaw={maxUsesRaw}
              setMaxUsesRaw={setMaxUsesRaw}
              maxUsesPerCustomerRaw={maxUsesPerCustomerRaw}
              setMaxUsesPerCustomerRaw={setMaxUsesPerCustomerRaw}
            />
          </div>

          {/* Ações */}
          <div className="flex gap-3 border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              {isSaving ? "Salvando..." : (coupon ? "Salvar Alterações" : "Criar Cupom")}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
