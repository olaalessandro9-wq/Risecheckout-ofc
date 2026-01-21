/**
 * CouponLimitsFields Component
 * 
 * Renders usage limits and application rules fields.
 * 
 * @module coupon-dialog
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { CouponLimitsFieldsProps } from "./types";
import type { UseFormReturn } from "react-hook-form";
import type { CouponFormData } from "@/schemas/coupon.schema";

interface CouponLimitsFieldsFullProps extends CouponLimitsFieldsProps {
  form: UseFormReturn<CouponFormData>;
}

export function CouponLimitsFields({
  form,
  maxUsesRaw,
  setMaxUsesRaw,
  maxUsesPerCustomerRaw,
  setMaxUsesPerCustomerRaw,
}: CouponLimitsFieldsFullProps) {
  const { control, formState: { errors } } = form;

  return (
    <>
      {/* Limites */}
      <div className="grid grid-cols-2 gap-4">
        {/* Limite total de usos */}
        <div className="space-y-2">
          <Label htmlFor="maxUses" className="text-foreground">Limite total de usos</Label>
          <Controller
            name="maxUses"
            control={control}
            render={({ field }) => (
              <Input
                id="maxUses"
                type="text"
                inputMode="numeric"
                value={maxUsesRaw}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9]/g, "");
                  setMaxUsesRaw(raw);
                  field.onChange(raw === "" ? null : Number(raw));
                }}
                placeholder="Ilimitado"
                className={cn(
                  "bg-background border-border",
                  errors.maxUses && "border-destructive"
                )}
              />
            )}
          />
          {errors.maxUses ? (
            <p className="text-xs text-destructive">{errors.maxUses.message}</p>
          ) : (
            <p className="text-xs text-muted-foreground">Deixe vazio para ilimitado</p>
          )}
        </div>

        {/* Limite por cliente */}
        <div className="space-y-2">
          <Label htmlFor="maxUsesPerCustomer" className="text-foreground">Limite por cliente</Label>
          <Controller
            name="maxUsesPerCustomer"
            control={control}
            render={({ field }) => (
              <Input
                id="maxUsesPerCustomer"
                type="text"
                inputMode="numeric"
                value={maxUsesPerCustomerRaw}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9]/g, "");
                  setMaxUsesPerCustomerRaw(raw);
                  field.onChange(raw === "" ? null : Number(raw));
                }}
                placeholder="Ilimitado"
                className={cn(
                  "bg-background border-border",
                  errors.maxUsesPerCustomer && "border-destructive"
                )}
              />
            )}
          />
          {errors.maxUsesPerCustomer ? (
            <p className="text-xs text-destructive">{errors.maxUsesPerCustomer.message}</p>
          ) : (
            <p className="text-xs text-muted-foreground">Deixe vazio para ilimitado</p>
          )}
        </div>
      </div>

      {/* SEÇÃO: APLICAÇÃO */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Regras de aplicação</h3>
        
        <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <div>
            <Label htmlFor="applyToOrderBumps" className="text-foreground font-medium cursor-pointer">
              Aplicar desconto aos Order Bumps
            </Label>
            <p className="text-xs text-muted-foreground mt-1">
              O desconto será calculado sobre o valor total (produto + bumps)
            </p>
          </div>
          <Controller
            name="applyToOrderBumps"
            control={control}
            render={({ field }) => (
              <Switch
                id="applyToOrderBumps"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
        </div>
      </div>
    </>
  );
}
