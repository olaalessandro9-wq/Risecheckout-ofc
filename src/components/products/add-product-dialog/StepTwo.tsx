/**
 * Step Two - Link de entrega
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Componente Puro
 */

import { Mail, Webhook } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { AddProductFormData } from "./types";

interface StepTwoProps {
  formData: AddProductFormData;
  externalDelivery: boolean;
  deliveryUrlError: string;
  onDeliveryTypeChange: (external: boolean) => void;
  onDeliveryUrlChange: (value: string) => void;
  onValidateUrl: (url: string) => boolean;
}

export function StepTwo({
  formData,
  externalDelivery,
  deliveryUrlError,
  onDeliveryTypeChange,
  onDeliveryUrlChange,
  onValidateUrl,
}: StepTwoProps) {
  return (
    <div className="space-y-4 py-4">
      {/* Seletor de tipo de entrega */}
      <div className="space-y-3">
        <Label className="text-foreground">Como será a entrega deste produto?</Label>
        <div className="grid grid-cols-1 gap-3">
          {/* Opção: Entrega Interna */}
          <button
            type="button"
            onClick={() => onDeliveryTypeChange(false)}
            className={`flex items-start gap-3 p-4 rounded-lg border-2 text-left transition-all ${
              !externalDelivery 
                ? 'border-primary bg-primary/5' 
                : 'border-border hover:border-muted-foreground/50'
            }`}
          >
            <div className={`p-2 rounded-lg ${!externalDelivery ? 'bg-primary/10' : 'bg-muted'}`}>
              <Mail className={`h-5 w-5 ${!externalDelivery ? 'text-primary' : 'text-muted-foreground'}`} />
            </div>
            <div className="flex-1">
              <p className={`font-medium ${!externalDelivery ? 'text-foreground' : 'text-muted-foreground'}`}>
                Entrega Interna
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Rise envia email com link de acesso ao cliente automaticamente
              </p>
            </div>
            <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
              !externalDelivery ? 'border-primary' : 'border-muted-foreground/50'
            }`}>
              {!externalDelivery && <div className="h-2 w-2 rounded-full bg-primary" />}
            </div>
          </button>

          {/* Opção: Entrega Externa */}
          <button
            type="button"
            onClick={() => onDeliveryTypeChange(true)}
            className={`flex items-start gap-3 p-4 rounded-lg border-2 text-left transition-all ${
              externalDelivery 
                ? 'border-primary bg-primary/5' 
                : 'border-border hover:border-muted-foreground/50'
            }`}
          >
            <div className={`p-2 rounded-lg ${externalDelivery ? 'bg-primary/10' : 'bg-muted'}`}>
              <Webhook className={`h-5 w-5 ${externalDelivery ? 'text-primary' : 'text-muted-foreground'}`} />
            </div>
            <div className="flex-1">
              <p className={`font-medium ${externalDelivery ? 'text-foreground' : 'text-muted-foreground'}`}>
                Entrega Externa
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Meu sistema faz a entrega (webhook, N8N, automação)
              </p>
            </div>
            <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
              externalDelivery ? 'border-primary' : 'border-muted-foreground/50'
            }`}>
              {externalDelivery && <div className="h-2 w-2 rounded-full bg-primary" />}
            </div>
          </button>
        </div>
      </div>

      {/* Conteúdo condicional */}
      {externalDelivery ? (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Webhook className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Entrega Externa</p>
              <p className="text-sm text-muted-foreground mt-1">
                O Rise <strong>não enviará</strong> email de confirmação para este produto.
                Configure webhooks após criar o produto para receber notificações de venda.
              </p>
            </div>
          </div>
        </div>
      ) : (
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
            <span><strong>Entrega:</strong> {externalDelivery ? 'Externa (seu sistema)' : 'Interna (Rise envia email)'}</span>
          </li>
          {!externalDelivery && formData.delivery_url && (
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
