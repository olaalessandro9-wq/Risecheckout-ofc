/**
 * CouponFormFields Component
 * 
 * Renders basic form fields: name, code, description, discount type/value.
 * 
 * @module coupon-dialog
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { CouponFormFieldsProps } from "./types";

export function CouponFormFields({
  form,
  serverError,
  setServerError,
  codeFieldRef,
  discountValueRaw,
  setDiscountValueRaw,
}: CouponFormFieldsProps) {
  const { register, control, setValue, formState: { errors } } = form;

  // Handler para formatar código em tempo real
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = e.target.value
      .toUpperCase()
      .replace(/\s+/g, '-')
      .replace(/[^A-Z0-9-]/g, '');
    setValue("code", formatted, { shouldValidate: true });
  };

  return (
    <>
      {/* SEÇÃO: BÁSICO */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Básico</h3>
        
        {/* Nome */}
        <div className="space-y-2">
          <Label htmlFor="name" className="text-foreground">Nome</Label>
          <Input
            id="name"
            {...register("name")}
            placeholder="Ex: Black Friday 10%"
            className={cn(
              "bg-background border-border",
              errors.name && "border-destructive"
            )}
          />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>

        {/* Código */}
        <div className="space-y-2" ref={codeFieldRef}>
          <Label htmlFor="code" className="text-foreground">
            Código do Cupom
          </Label>
          <Controller
            name="code"
            control={control}
            render={({ field }) => (
              <Input
                id="code"
                value={field.value}
                onChange={(e) => {
                  handleCodeChange(e);
                  // Limpar erro do servidor ao digitar
                  if (serverError?.field === "code") {
                    setServerError(null);
                  }
                }}
                placeholder="Ex: VERAO25 ou BLACK-FRIDAY (mín. 3 caracteres)"
                className={cn(
                  "bg-background border-border uppercase",
                  (errors.code || serverError?.field === "code") && "border-destructive"
                )}
              />
            )}
          />
          {errors.code ? (
            <p className="text-xs text-destructive">{errors.code.message}</p>
          ) : serverError?.field === "code" ? (
            <p className="text-xs text-destructive">{serverError.message}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Apenas letras, números e hífen. Espaços serão convertidos em hífen.
            </p>
          )}
        </div>

        {/* Descrição */}
        <div className="space-y-2">
          <Label htmlFor="description" className="text-foreground">Descrição</Label>
          <Textarea
            id="description"
            {...register("description")}
            placeholder="Detalhes e observações"
            className="bg-background border-border resize-none"
            rows={3}
          />
        </div>
      </div>

      {/* SEÇÃO: VALOR DO DESCONTO */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Valor do desconto</h3>
        
        <div className="space-y-2">
          <Label htmlFor="discountValue" className="text-foreground">Porcentagem</Label>
          <div className="relative">
            <Controller
              name="discountValue"
              control={control}
              render={({ field }) => (
                <Input
                  id="discountValue"
                  type="text"
                  inputMode="decimal"
                  value={discountValueRaw}
                  onChange={(e) => {
                    const raw = e.target.value;

                    // Permite apagar tudo e digitar livremente (sem o input "voltar").
                    setDiscountValueRaw(raw);

                    // Aceita apenas formato numérico simples (seguro) durante digitação.
                    const isNumericLike = /^-?\d*(?:[.,]\d*)?$/.test(raw);
                    if (!isNumericLike) return;

                    const normalized = raw.replace(",", ".");
                    const isIncomplete =
                      normalized === "" ||
                      normalized === "-" ||
                      normalized.endsWith(".");

                    if (isIncomplete) {
                      field.onChange(undefined);
                      return;
                    }

                    const n = Number(normalized);
                    if (Number.isNaN(n)) return;
                    field.onChange(n);
                  }}
                  onBlur={() => {
                    field.onBlur();

                    const raw = discountValueRaw;
                    const normalized = raw.replace(",", ".");
                    const n = Number(normalized);

                    if (raw.trim() === "") {
                      field.onChange(undefined);
                      setDiscountValueRaw("");
                      return;
                    }

                    if (Number.isNaN(n)) return;

                    // Ao sair do campo, padroniza visualmente para número válido.
                    setDiscountValueRaw(String(n));
                    field.onChange(n);
                  }}
                  placeholder="10"
                  className={cn(
                    "bg-background border-border pr-8",
                    errors.discountValue && "border-destructive"
                  )}
                />
              )}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              %
            </span>
          </div>
          {errors.discountValue && (
            <p className="text-xs text-destructive">{errors.discountValue.message}</p>
          )}
        </div>
      </div>
    </>
  );
}
