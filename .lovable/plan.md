
# Plano: Adicionar Aba de Preview de Emails no Painel Admin

## Resumo

Adicionar uma nova aba "Emails" no Painel de Administração que permite ao Owner visualizar e testar todos os 8 templates de email do sistema. A aba será visível apenas para usuários com role `owner`.

---

## Análise de Soluções (RISE V3)

### Solução A: Componente Inline no AdminDashboard
- Adicionar toda a lógica diretamente no `AdminDashboard.tsx`
- **Manutenibilidade**: 6/10 - Aumenta complexidade do arquivo principal
- **Zero DT**: 6/10 - Código misturado
- **Arquitetura**: 5/10 - Viola Single Responsibility
- **Escalabilidade**: 5/10 - Difícil manter
- **Segurança**: 10/10 - Mesma verificação de role
- **NOTA FINAL: 6.4/10**

### Solução B: Componente Modular Separado + Integration
- Criar `AdminEmailPreviewTab.tsx` seguindo padrão das outras tabs
- Integrar no `AdminDashboard.tsx` com verificação `role === "owner"`
- Adicionar tipo `"emails"` ao `AdminTabId`
- **Manutenibilidade**: 10/10 - Componente isolado e testável
- **Zero DT**: 10/10 - Segue padrão existente das outras tabs
- **Arquitetura**: 10/10 - Modular, Clean Architecture
- **Escalabilidade**: 10/10 - Fácil adicionar novos templates
- **Segurança**: 10/10 - Verificação de role owner
- **NOTA FINAL: 10.0/10**

### DECISÃO: Solução B (Nota 10.0/10)

---

## Arquivos a Criar/Modificar

| Arquivo | Ação | Linhas |
|---------|------|--------|
| `src/components/admin/AdminEmailPreviewTab.tsx` | CRIAR | ~180 |
| `src/pages/admin/AdminDashboard.tsx` | MODIFICAR | +15 |
| `src/modules/admin/types/admin.types.ts` | MODIFICAR | +1 |

---

## Especificação Técnica

### 1. AdminEmailPreviewTab.tsx

**Funcionalidades:**
- Select para escolher o tipo de email (8 opções)
- Botão para enviar email de preview
- Indicador de loading durante envio
- Toast de sucesso/erro após envio
- Descrição de cada template

**Templates disponíveis:**
| ID | Label | Descrição |
|----|-------|-----------|
| `purchase-standard` | Compra Confirmada | Email padrão de confirmação |
| `purchase-members-area` | Acesso Liberado | Para produtos com área de membros |
| `purchase-external` | Entrega Externa | Para produtos sem área de membros |
| `new-sale` | Nova Venda | Notificação para o produtor |
| `pix-pending` | Pagamento Pendente | Aguardando PIX |
| `password-reset` | Redefinir Senha | Link de reset de senha |
| `student-invite` | Convite de Aluno | Acesso liberado manualmente |
| `gdpr-request` | Solicitação LGPD | Confirmação de exclusão |

**Interface:**
```typescript
// Card com:
// - Header: "📧 Preview de Emails" + descrição
// - Select: Dropdown com os 8 templates
// - Descrição dinâmica do template selecionado
// - Botão: "Enviar Email de Teste" (disabled enquanto loading)
// - Info: "Email será enviado para: {email do owner}"
```

### 2. AdminDashboard.tsx (Modificações)

```typescript
// Adicionar import
import { AdminEmailPreviewTab } from "@/components/admin/AdminEmailPreviewTab";
import { Mail } from "lucide-react";

// Na TabsList, após security, adicionar:
{role === "owner" && (
  <TabsTrigger value="emails" className="gap-2">
    <Mail className="h-4 w-4" />
    Emails
  </TabsTrigger>
)}

// No conteúdo das tabs, adicionar:
{role === "owner" && (
  <TabsContent value="emails">
    <AdminEmailPreviewTab />
  </TabsContent>
)}
```

### 3. admin.types.ts (Modificação)

```typescript
export type AdminTabId = 
  | "finance" 
  | "traffic" 
  | "overview" 
  | "users" 
  | "products" 
  | "orders" 
  | "system" 
  | "security" 
  | "logs"
  | "emails";  // ADICIONAR
```

---

## Layout Visual do Componente

```text
┌─────────────────────────────────────────────────────────────────┐
│  📧 Preview de Emails                                           │
│  Teste os templates de email do sistema                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Template                                                       │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Selecione um template...                                  ▼ ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ ℹ️ Descrição do template selecionado aparece aqui          ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  📨 O email será enviado para: owner@example.com                │
│                                                                 │
│  ┌────────────────────────────────────┐                         │
│  │ 📤 Enviar Email de Teste           │                         │
│  └────────────────────────────────────┘                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Fluxo de Execução

```text
1. Owner acessa Painel Admin
2. Clica na aba "Emails"
3. Seleciona template no dropdown
4. Vê descrição do template
5. Clica "Enviar Email de Teste"
6. Sistema chama /functions/v1/email-preview
7. Email enviado para o email do owner
8. Toast de sucesso/erro
```

---

## Segurança

| Medida | Implementação |
|--------|---------------|
| Acesso restrito | `role === "owner"` para exibir tab |
| Backend validation | Edge Function valida auth via `requireAuthenticatedProducer` |
| Rate limiting | `RATE_LIMIT_CONFIGS.SEND_EMAIL` já aplicado |
| Prefix [PREVIEW] | Todos os emails já têm prefixo no assunto |

---

## Código Detalhado

### AdminEmailPreviewTab.tsx

```typescript
/**
 * AdminEmailPreviewTab - Preview de Templates de Email
 * 
 * RISE Protocol V3 - Exclusivo para Owner
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, Send, Loader2, Info } from "lucide-react";
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

const TEMPLATES: { value: TemplateType; label: string; description: string }[] = [
  { value: "purchase-standard", label: "Compra Confirmada", description: "Email padrão enviado ao cliente após pagamento aprovado." },
  { value: "purchase-members-area", label: "Acesso Liberado (Área de Membros)", description: "Email com link de acesso à área de membros do produto." },
  { value: "purchase-external", label: "Entrega Externa", description: "Email para produtos com entrega externa (sem área de membros)." },
  { value: "new-sale", label: "Nova Venda (Produtor)", description: "Notificação enviada ao produtor quando realiza uma venda." },
  { value: "pix-pending", label: "Pagamento Pendente (PIX)", description: "Email com QR Code PIX aguardando pagamento." },
  { value: "password-reset", label: "Redefinir Senha", description: "Link para redefinição de senha do usuário." },
  { value: "student-invite", label: "Convite de Aluno", description: "Convite para aluno acessar produto liberado manualmente." },
  { value: "gdpr-request", label: "Solicitação LGPD", description: "Confirmação de solicitação de exclusão de dados (LGPD)." },
];

export function AdminEmailPreviewTab() {
  const { user } = useUnifiedAuth();
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType | "">("");
  const [isLoading, setIsLoading] = useState(false);

  const currentTemplate = TEMPLATES.find(t => t.value === selectedTemplate);

  const handleSendPreview = async () => {
    if (!selectedTemplate) {
      toast.error("Selecione um template primeiro");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await api.call("email-preview", {
        templateType: selectedTemplate,
      });

      if (error) throw new Error(error);

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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Preview de Emails
        </CardTitle>
        <CardDescription>
          Teste os templates de email do sistema. Os emails serão enviados para seu endereço cadastrado.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Template</label>
          <Select value={selectedTemplate} onValueChange={(v) => setSelectedTemplate(v as TemplateType)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um template..." />
            </SelectTrigger>
            <SelectContent>
              {TEMPLATES.map((template) => (
                <SelectItem key={template.value} value={template.value}>
                  {template.label}
                </SelectItem>
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

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Mail className="h-4 w-4" />
          O email será enviado para: <strong>{user?.email || "..."}</strong>
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
```

---

## Verificação RISE V3

| Critério | Nota | Justificativa |
|----------|------|---------------|
| Manutenibilidade | 10/10 | Componente isolado, segue padrão existente |
| Zero DT | 10/10 | Nenhum workaround ou código duplicado |
| Arquitetura | 10/10 | Modular, Clean Architecture |
| Escalabilidade | 10/10 | Fácil adicionar novos templates |
| Segurança | 10/10 | Verificação owner + backend auth |
| **NOTA FINAL** | **10.0/10** | Alinhado com RISE Protocol V3 |

---

## Resultado Esperado

Após implementação:
1. Owner verá nova aba "Emails" no painel admin
2. Poderá selecionar qualquer um dos 8 templates
3. Clicar em "Enviar Email de Teste" 
4. Receber o email de preview em sua caixa
5. Manus poderá usar essa interface para ajustar templates em paralelo

---

## Tempo Estimado
**30 minutos**
