/**
 * ProductDeliverySection - Seção de entrega digital
 * 
 * Permite escolher entre 3 tipos de entrega:
 * - Entrega Padrão: Rise envia email com link customizado
 * - Área de Membros: Rise envia email com link para área de membros
 * - Entrega Externa: Rise envia email de confirmação, vendedor faz entrega
 * 
 * @version 2.0.0 - Suporte a delivery_type ENUM
 */

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link as LinkIcon, Copy, Check, ExternalLink, Webhook, Mail, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import type { GeneralFormData, DeliveryType } from "../../types/formData.types";

interface ProductDeliverySectionProps {
  form: GeneralFormData;
  setForm: React.Dispatch<React.SetStateAction<GeneralFormData>>;
}

const DELIVERY_OPTIONS: Array<{
  id: DeliveryType;
  icon: React.ElementType;
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
    description: 'Rise envia email com acesso à área de membros',
  },
  {
    id: 'external',
    icon: Webhook,
    label: 'Entrega Externa',
    description: 'Rise confirma pagamento, você faz a entrega',
  },
];

export function ProductDeliverySection({ 
  form, 
  setForm,
}: ProductDeliverySectionProps) {
  const [copied, setCopied] = useState(false);
  const [urlError, setUrlError] = useState("");

  // Derivar delivery_type do campo deprecated se não existir
  const currentDeliveryType: DeliveryType = form.delivery_type || 
    (form.external_delivery ? 'external' : 'standard');

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

  const handleDeliveryTypeChange = (type: DeliveryType) => {
    setForm(prev => ({ 
      ...prev, 
      delivery_type: type,
      // Sincronizar campo deprecated
      external_delivery: type === 'external',
      // Limpar delivery_url se não for standard
      delivery_url: type === 'standard' ? prev.delivery_url : "" 
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
        {/* Seletor de tipo de entrega - 3 opções */}
        <div className="space-y-3">
          <Label className="text-foreground">Tipo de Entrega</Label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {DELIVERY_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isSelected = currentDeliveryType === option.id;
              
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleDeliveryTypeChange(option.id)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 text-center transition-all ${
                    isSelected 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-muted-foreground/50'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary/10' : 'bg-muted'}`}>
                    <Icon className={`h-5 w-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium text-sm ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {option.label}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {option.description}
                    </p>
                  </div>
                  <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                    isSelected ? 'border-primary' : 'border-muted-foreground/50'
                  }`}>
                    {isSelected && <div className="h-2 w-2 rounded-full bg-primary" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Conteúdo condicional baseado no tipo */}
        {currentDeliveryType === 'standard' && (
          /* Campo de link para entrega padrão */
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

        {currentDeliveryType === 'members_area' && (
          /* Mensagem para área de membros */
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <GraduationCap className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Acesso via Área de Membros</p>
                <p className="text-sm text-muted-foreground mt-1">
                  O cliente receberá um email com botão <strong>"Acessar Área de Membros"</strong> 
                  que o levará diretamente para o conteúdo deste produto.
                </p>
              </div>
            </div>
          </div>
        )}

        {currentDeliveryType === 'external' && (
          /* Mensagem para entrega externa */
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Webhook className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Entrega Externa Configurada</p>
                <p className="text-sm text-muted-foreground mt-1">
                  O cliente receberá um email confirmando o pagamento com a mensagem de que 
                  <strong> o vendedor entrará em contato para fazer a entrega</strong>.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
