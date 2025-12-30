/**
 * ProductDeliverySection - Seção de entrega digital
 * 
 * Permite escolher entre:
 * - Entrega Interna: Rise envia email com link de acesso
 * - Entrega Externa: Sistema próprio do vendedor (webhook/N8N)
 */

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link as LinkIcon, Copy, Check, ExternalLink, Webhook, Mail } from "lucide-react";
import { toast } from "sonner";
import type { GeneralFormData, GeneralFormErrors } from "./types";

interface ProductDeliverySectionProps {
  form: GeneralFormData;
  setForm: React.Dispatch<React.SetStateAction<GeneralFormData>>;
  errors: GeneralFormErrors;
  clearError: (field: keyof GeneralFormErrors) => void;
}

export function ProductDeliverySection({ 
  form, 
  setForm, 
  errors, 
  clearError 
}: ProductDeliverySectionProps) {
  const [copied, setCopied] = useState(false);
  const [urlError, setUrlError] = useState("");

  const isExternalDelivery = form.external_delivery === true;

  const validateUrl = (url: string): boolean => {
    if (!url) {
      setUrlError("");
      return true;
    }
    
    if (!url.startsWith("https://")) {
      setUrlError("O link deve começar com https://");
      return false;
    }
    
    try {
      new URL(url);
      setUrlError("");
      return true;
    } catch {
      setUrlError("Link inválido. Insira uma URL válida.");
      return false;
    }
  };

  const handleUrlChange = (value: string) => {
    setForm(prev => ({ ...prev, delivery_url: value }));
    if (urlError) {
      validateUrl(value);
    }
  };

  const handleDeliveryTypeChange = (external: boolean) => {
    setForm(prev => ({ 
      ...prev, 
      external_delivery: external,
      // Limpar delivery_url se mudar para externo
      delivery_url: external ? "" : prev.delivery_url 
    }));
    setUrlError("");
  };

  const handleCopyLink = async () => {
    if (!form.delivery_url) return;
    
    try {
      await navigator.clipboard.writeText(form.delivery_url);
      setCopied(true);
      toast.success("Link copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Erro ao copiar link");
    }
  };

  const handleOpenLink = () => {
    if (!form.delivery_url) return;
    window.open(form.delivery_url, "_blank", "noopener,noreferrer");
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <LinkIcon className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Entrega Digital</h3>
      </div>

      <div className="bg-muted/30 border border-border rounded-lg p-4 space-y-4">
        {/* Seletor de tipo de entrega */}
        <div className="space-y-3">
          <Label className="text-foreground">Tipo de Entrega</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Opção: Entrega Interna */}
            <button
              type="button"
              onClick={() => handleDeliveryTypeChange(false)}
              className={`flex items-start gap-3 p-4 rounded-lg border-2 text-left transition-all ${
                !isExternalDelivery 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-muted-foreground/50'
              }`}
            >
              <div className={`p-2 rounded-lg ${!isExternalDelivery ? 'bg-primary/10' : 'bg-muted'}`}>
                <Mail className={`h-5 w-5 ${!isExternalDelivery ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <div className="flex-1">
                <p className={`font-medium ${!isExternalDelivery ? 'text-foreground' : 'text-muted-foreground'}`}>
                  Entrega Interna
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Rise envia email com link de acesso ao cliente
                </p>
              </div>
              <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                !isExternalDelivery ? 'border-primary' : 'border-muted-foreground/50'
              }`}>
                {!isExternalDelivery && <div className="h-2 w-2 rounded-full bg-primary" />}
              </div>
            </button>

            {/* Opção: Entrega Externa */}
            <button
              type="button"
              onClick={() => handleDeliveryTypeChange(true)}
              className={`flex items-start gap-3 p-4 rounded-lg border-2 text-left transition-all ${
                isExternalDelivery 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-muted-foreground/50'
              }`}
            >
              <div className={`p-2 rounded-lg ${isExternalDelivery ? 'bg-primary/10' : 'bg-muted'}`}>
                <Webhook className={`h-5 w-5 ${isExternalDelivery ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <div className="flex-1">
                <p className={`font-medium ${isExternalDelivery ? 'text-foreground' : 'text-muted-foreground'}`}>
                  Entrega Externa
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Meu sistema faz a entrega (webhook, N8N, etc)
                </p>
              </div>
              <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                isExternalDelivery ? 'border-primary' : 'border-muted-foreground/50'
              }`}>
                {isExternalDelivery && <div className="h-2 w-2 rounded-full bg-primary" />}
              </div>
            </button>
          </div>
        </div>

        {/* Conteúdo condicional baseado no tipo */}
        {isExternalDelivery ? (
          /* Mensagem para entrega externa */
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Webhook className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Entrega Externa Configurada</p>
                <p className="text-sm text-muted-foreground mt-1">
                  A entrega deste produto será feita pelo seu sistema externo. 
                  O Rise <strong>não enviará</strong> email de confirmação com link de acesso para este produto.
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Configure webhooks em <strong>Integrações → Webhooks</strong> para receber notificações de venda.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Campo de link para entrega interna */
          <div className="space-y-2">
            <Label htmlFor="delivery_url" className="text-foreground">
              Link de acesso enviado ao e-mail
            </Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="delivery_url"
                  type="url"
                  value={form.delivery_url || ""}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  onBlur={() => validateUrl(form.delivery_url || "")}
                  className={`bg-background border-border text-foreground pr-20 ${urlError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                  placeholder="https://exemplo.com/acesso-produto"
                />
                {form.delivery_url && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={handleCopyLink}
                      title="Copiar link"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={handleOpenLink}
                      title="Abrir link"
                    >
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
            {urlError ? (
              <p className="text-xs text-destructive">{urlError}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                O cliente receberá este link no e-mail de confirmação de compra com um botão "Acessar Produto".
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
