/**
 * AdminEmailPreviewTab - Preview de Templates de Email
 * 
 * RISE Protocol V3 - Exclusivo para Owner
 * 
 * Permite testar todos os 8 templates de email do sistema
 * sem criar registros no banco de dados.
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, Send, Loader2, Info, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";

type TemplateType = 
  | "purchase-standard"
  | "purchase-members-area"
  | "purchase-external"
  | "new-sale"
  | "pix-pending"
  | "password-reset"
  | "student-invite"
  | "gdpr-request";

interface TemplateOption {
  value: TemplateType;
  label: string;
  description: string;
  category: "compra" | "produtor" | "sistema";
}

const TEMPLATES: TemplateOption[] = [
  { 
    value: "purchase-standard", 
    label: "Compra Confirmada", 
    description: "Email padrão enviado ao cliente após pagamento aprovado.",
    category: "compra"
  },
  { 
    value: "purchase-members-area", 
    label: "Acesso Liberado (Área de Membros)", 
    description: "Email com link de acesso à área de membros do produto.",
    category: "compra"
  },
  { 
    value: "purchase-external", 
    label: "Entrega Externa", 
    description: "Email para produtos com entrega externa (sem área de membros).",
    category: "compra"
  },
  { 
    value: "pix-pending", 
    label: "Pagamento Pendente (PIX)", 
    description: "Email com QR Code PIX aguardando pagamento.",
    category: "compra"
  },
  { 
    value: "new-sale", 
    label: "Nova Venda (Produtor)", 
    description: "Notificação enviada ao produtor quando realiza uma venda.",
    category: "produtor"
  },
  { 
    value: "password-reset", 
    label: "Redefinir Senha", 
    description: "Link para redefinição de senha do usuário.",
    category: "sistema"
  },
  { 
    value: "student-invite", 
    label: "Convite de Aluno", 
    description: "Convite para aluno acessar produto liberado manualmente.",
    category: "sistema"
  },
  { 
    value: "gdpr-request", 
    label: "Solicitação LGPD", 
    description: "Confirmação de solicitação de exclusão de dados (LGPD).",
    category: "sistema"
  },
];

const CATEGORY_LABELS: Record<string, string> = {
  compra: "📦 Emails de Compra",
  produtor: "👨‍💻 Emails do Produtor",
  sistema: "⚙️ Emails do Sistema",
};

interface EmailPreviewResponse {
  success: boolean;
  sentTo: string;
  templateType: string;
  messageId?: string;
}

export function AdminEmailPreviewTab() {
  const { user } = useUnifiedAuth();
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType | "">("");
  const [isLoading, setIsLoading] = useState(false);
  const [lastSent, setLastSent] = useState<string | null>(null);

  const currentTemplate = TEMPLATES.find(t => t.value === selectedTemplate);

  const handleSendPreview = async () => {
    if (!selectedTemplate) {
      toast.error("Selecione um template primeiro");
      return;
    }

    setIsLoading(true);
    setLastSent(null);
    
    try {
      const { data, error } = await api.call<EmailPreviewResponse>("email-preview", {
        templateType: selectedTemplate,
      });

      if (error) {
        throw new Error(typeof error === "string" ? error : error.message || "Erro desconhecido");
      }

      setLastSent(selectedTemplate);
      toast.success(`Email "${currentTemplate?.label}" enviado com sucesso!`, {
        description: `Enviado para: ${data?.sentTo || user?.email}`,
      });
    } catch (err) {
      toast.error("Erro ao enviar email de preview", {
        description: err instanceof Error ? err.message : "Erro desconhecido",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Group templates by category
  const templatesByCategory = TEMPLATES.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, TemplateOption[]>);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Preview de Emails
        </CardTitle>
        <CardDescription>
          Teste os templates de email do sistema. Os emails serão enviados para seu endereço cadastrado com o prefixo [PREVIEW] no assunto.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Template</label>
          <Select 
            value={selectedTemplate} 
            onValueChange={(v) => {
              setSelectedTemplate(v as TemplateType);
              setLastSent(null);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione um template..." />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(templatesByCategory).map(([category, templates]) => (
                <div key={category}>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    {CATEGORY_LABELS[category]}
                  </div>
                  {templates.map((template) => (
                    <SelectItem key={template.value} value={template.value}>
                      {template.label}
                    </SelectItem>
                  ))}
                </div>
              ))}
            </SelectContent>
          </Select>
        </div>

        {currentTemplate && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>{currentTemplate.description}</AlertDescription>
          </Alert>
        )}

        {lastSent === selectedTemplate && (
          <Alert className="border-green-500/20 bg-green-500/10">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-600 dark:text-green-400">
              Email enviado com sucesso! Verifique sua caixa de entrada.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Mail className="h-4 w-4" />
          O email será enviado para: <strong className="text-foreground">{user?.email || "..."}</strong>
        </div>

        <Button 
          onClick={handleSendPreview} 
          disabled={!selectedTemplate || isLoading}
          className="w-full sm:w-auto"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          Enviar Email de Teste
        </Button>
      </CardContent>
    </Card>
  );
}
