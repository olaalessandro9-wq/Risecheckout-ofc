/**
 * Step Two - Tipo de Entrega (3 opções)
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Componente Puro
 * @version 1.1.0 - Restrição de Área de Membros por role
 */

import { Mail, Webhook, GraduationCap, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { usePermissions } from "@/hooks/usePermissions";
import { cn } from "@/lib/utils";
import type { DeliveryType } from "@/modules/products/types/product.types";
import type { AddProductFormData } from "./types";

interface StepTwoProps {
  formData: AddProductFormData;
  deliveryType: DeliveryType;
  deliveryUrlError: string;
  onDeliveryTypeChange: (type: DeliveryType) => void;
  onDeliveryUrlChange: (value: string) => void;
  onValidateUrl: (url: string) => boolean;
}

const DELIVERY_OPTIONS: Array<{
  id: DeliveryType;
  icon: typeof Mail;
  label: string;
  description: string;
}> = [
  {
    id: 'standard',
    icon: Mail,
    label: 'Entrega Padrão',
    description: 'Rise envia email com link de acesso personalizado',
  },
  {
    id: 'members_area',
    icon: GraduationCap,
    label: 'Área de Membros',
    description: 'Rise envia email com acesso à área de membros do produto',
  },
  {
    id: 'external',
    icon: Webhook,
    label: 'Entrega Externa',
    description: 'Meu sistema faz a entrega (webhook, N8N, automação)',
  },
];

export function StepTwo({
  formData,
  deliveryType,
  deliveryUrlError,
  onDeliveryTypeChange,
  onDeliveryUrlChange,
  onValidateUrl,
}: StepTwoProps) {
  const { canAccessMembersArea } = usePermissions();

  return (
    <div className="space-y-4 py-4">
      {/* Seletor de tipo de entrega */}
      <div className="space-y-3">
        <Label className="text-foreground">Como será a entrega deste produto?</Label>
        <div className="grid grid-cols-1 gap-3">
          {DELIVERY_OPTIONS.map((option) => {
            const isSelected = deliveryType === option.id;
            const Icon = option.icon;
            const isDisabled = option.id === 'members_area' && !canAccessMembersArea;
            
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => !isDisabled && onDeliveryTypeChange(option.id)}
                disabled={isDisabled}
                className={cn(
                  "flex items-start gap-3 p-4 rounded-lg border-2 text-left transition-all relative",
                  isSelected && !isDisabled && "border-primary bg-primary/5",
                  !isSelected && !isDisabled && "border-border hover:border-muted-foreground/50",
                  isDisabled && "opacity-50 cursor-not-allowed border-border"
                )}
              >
                {isDisabled && (
                  <Badge 
                    variant="secondary" 
                    className="absolute top-2 right-2 text-[10px] px-1.5 py-0 h-4"
                  >
                    Em Breve
                  </Badge>
                )}
                <div className={cn(
                  "p-2 rounded-lg",
                  isSelected && !isDisabled ? "bg-primary/10" : "bg-muted"
                )}>
                  <Icon className={cn(
                    "h-5 w-5",
                    isSelected && !isDisabled ? "text-primary" : "text-muted-foreground"
                  )} />
                </div>
                <div className="flex-1">
                  <p className={cn(
                    "font-medium",
                    isSelected && !isDisabled ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {option.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {option.description}
                  </p>
                </div>
                <div className={cn(
                  "h-4 w-4 rounded-full border-2 flex items-center justify-center",
                  isSelected && !isDisabled ? "border-primary" : "border-muted-foreground/50"
                )}>
                  {isSelected && !isDisabled && <div className="h-2 w-2 rounded-full bg-primary" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Conteúdo condicional por tipo */}
      {deliveryType === 'standard' && (
        <div className="space-y-2">
          <Label htmlFor="delivery_url" className="text-foreground">
            Link de acesso ao produto
          </Label>
          <Input
            id="delivery_url"
            type="url"
            value={formData.delivery_url}
            onChange={(e) => onDeliveryUrlChange(e.target.value)}
            onBlur={() => onValidateUrl(formData.delivery_url)}
            className={`bg-background border-border text-foreground ${deliveryUrlError ? 'border-destructive' : ''}`}
            placeholder="https://exemplo.com/seu-produto"
          />
          {deliveryUrlError ? (
            <p className="text-xs text-destructive">{deliveryUrlError}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Este link será enviado por email após confirmação do pagamento.
            </p>
          )}
        </div>
      )}

      {deliveryType === 'members_area' && (
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <GraduationCap className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Área de Membros</p>
              <p className="text-sm text-muted-foreground mt-1">
                O cliente receberá um email com instruções para acessar a área de membros.
                O link será gerado automaticamente para <code className="bg-muted px-1 rounded text-xs">/minha-conta/produtos/[id]</code>
              </p>
            </div>
          </div>
        </div>
      )}

      {deliveryType === 'external' && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Entrega Externa</p>
              <p className="text-sm text-muted-foreground mt-1">
                O Rise <strong>enviará email confirmando a compra</strong>, mas informará que o vendedor fará a entrega.
                Configure webhooks após criar o produto para receber notificações de venda.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Resumo */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mt-4">
        <p className="text-sm text-foreground">
          <strong>Resumo:</strong>
        </p>
        <ul className="text-sm text-muted-foreground mt-2 space-y-1">
          <li className="flex items-start gap-1">
            <span className="flex-shrink-0">•</span>
            <span className="min-w-0">
              <strong>Produto:</strong>{" "}
              {formData.name.length > 40 ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="truncate inline-block max-w-[280px] align-bottom cursor-help">
                      {formData.name}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[300px] break-words">
                    {formData.name}
                  </TooltipContent>
                </Tooltip>
              ) : (
                formData.name
              )}
            </span>
          </li>
          <li className="flex items-start gap-1">
            <span className="flex-shrink-0">•</span>
            <span><strong>Preço:</strong> {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(formData.price / 100)}</span>
          </li>
          <li className="flex items-start gap-1">
            <span className="flex-shrink-0">•</span>
            <span>
              <strong>Entrega:</strong>{" "}
              {deliveryType === 'standard' && 'Padrão (Rise envia email com link)'}
              {deliveryType === 'members_area' && 'Área de Membros (link automático)'}
              {deliveryType === 'external' && 'Externa (seu sistema)'}
            </span>
          </li>
          {deliveryType === 'standard' && formData.delivery_url && (
            <li className="flex items-start gap-1">
              <span className="flex-shrink-0">•</span>
              <span className="min-w-0 truncate">
                <strong>Link:</strong> {formData.delivery_url.length > 40 ? formData.delivery_url.substring(0, 40) + '...' : formData.delivery_url}
              </span>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
