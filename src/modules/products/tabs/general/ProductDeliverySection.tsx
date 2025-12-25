/**
 * ProductDeliverySection - Seção de entrega digital
 * 
 * Campo para configurar o link de entrega do produto
 * que será enviado ao cliente após pagamento aprovado.
 */

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link as LinkIcon, Copy, Check, ExternalLink } from "lucide-react";
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

      <div className="bg-muted/30 border border-border rounded-lg p-4">
        <p className="text-sm text-muted-foreground mb-4">
          Configure o link de acesso ao seu produto digital. Este link será enviado automaticamente 
          para o cliente por e-mail assim que o pagamento for confirmado.
        </p>

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
      </div>
    </section>
  );
}
