import { useEffect, useState, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { couponSchema, CouponFormData, defaultCouponValues } from "@/schemas/coupon.schema";

// Re-export para manter compatibilidade com imports existentes
export type { CouponFormData } from "@/schemas/coupon.schema";

export interface CouponSaveResult {
  success: boolean;
  error?: string;
  field?: string; // Campo com erro (ex: "code")
}

interface CouponDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (coupon: CouponFormData) => Promise<CouponSaveResult>;
  coupon: CouponFormData | null;
}

export const CouponDialog = ({
  open,
  onOpenChange,
  onSave,
  coupon,
}: CouponDialogProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const [serverError, setServerError] = useState<{ field?: string; message: string } | null>(null);
  const codeFieldRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CouponFormData>({
    resolver: zodResolver(couponSchema),
    defaultValues: defaultCouponValues,
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const hasExpiration = watch("hasExpiration");
  const discountType = watch("discountType");
  const startDate = watch("startDate");

  // Estados "raw" para permitir apagar/editar sem o input voltar pro valor anterior.
  const [discountValueRaw, setDiscountValueRaw] = useState<string>("");
  const [maxUsesRaw, setMaxUsesRaw] = useState<string>("");
  const [maxUsesPerCustomerRaw, setMaxUsesPerCustomerRaw] = useState<string>("");

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

  const onSubmit = async (data: CouponFormData) => {
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
  };

  const onError = () => {
    // Mostrar primeiro erro encontrado
    const firstError = Object.values(errors)[0];
    if (firstError?.message) {
      toast.error(firstError.message as string);
    }
  };

  // Handler para formatar código em tempo real
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = e.target.value
      .toUpperCase()
      .replace(/\s+/g, '-')
      .replace(/[^A-Z0-9-]/g, '');
    setValue("code", formatted, { shouldValidate: true });
  };

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

        <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-8 py-6">
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
              <Label htmlFor="code" className="text-foreground flex items-center justify-between">
                Código do Cupom
                <span className="text-xs text-muted-foreground">(opcional)</span>
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
                    placeholder="Ex: BF10 ou BLACK-FRIDAY"
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

          {/* SEÇÃO: TIPO E VALOR */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Tipo e valor</h3>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Tipo */}
              <div className="space-y-2">
                <Label className="text-foreground">Tipo</Label>
                <Controller
                  name="discountType"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="bg-background border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Porcentagem</SelectItem>
                        <SelectItem value="fixed">Valor fixo</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {/* Valor */}
              <div className="space-y-2">
                <Label htmlFor="discountValue" className="text-foreground">Valor</Label>
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

                          // Permite apagar tudo e digitar livremente (sem o input “voltar”).
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
                          "bg-background border-border",
                          errors.discountValue && "border-destructive"
                        )}
                      />
                    )}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    {discountType === "percentage" ? "%" : "R$"}
                  </span>
                </div>
                {errors.discountValue && (
                  <p className="text-xs text-destructive">{errors.discountValue.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* SEÇÃO: PERÍODO E LIMITES */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Período e limites</h3>
            
            {/* Switch de expiração */}
            <div className="flex items-center justify-between p-4 bg-muted/30 border border-border rounded-lg">
              <Label htmlFor="hasExpiration" className="text-foreground font-medium cursor-pointer">
                Tem expiração
              </Label>
              <Controller
                name="hasExpiration"
                control={control}
                render={({ field }) => (
                  <Switch
                    id="hasExpiration"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>

            {/* Datas (condicional) */}
            {hasExpiration && (
              <div className="grid grid-cols-2 gap-4">
                {/* Data início */}
                <div className="space-y-2">
                  <Label className="text-foreground">Início</Label>
                  <Controller
                    name="startDate"
                    control={control}
                    render={({ field }) => (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal bg-background border-border",
                              !field.value && "text-muted-foreground",
                              errors.startDate && "border-destructive"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, "dd/MM/yyyy") : "dd/mm/aaaa"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-card border-border" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                  />
                  {errors.startDate && (
                    <p className="text-xs text-destructive">{errors.startDate.message}</p>
                  )}
                </div>

                {/* Data fim */}
                <div className="space-y-2">
                  <Label className="text-foreground">Fim</Label>
                  <Controller
                    name="endDate"
                    control={control}
                    render={({ field }) => (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal bg-background border-border",
                              !field.value && "text-muted-foreground",
                              errors.endDate && "border-destructive"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, "dd/MM/yyyy") : "dd/mm/aaaa"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-card border-border" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => startDate ? date < startDate : false}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                  />
                  {errors.endDate && (
                    <p className="text-xs text-destructive">{errors.endDate.message}</p>
                  )}
                </div>
              </div>
            )}

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
};
