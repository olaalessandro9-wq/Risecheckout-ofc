
# Plano de Implementação: Edge Function `email-preview`

## Análise do Relatório da Manus

A proposta da Manus está **100% alinhada** com o RISE ARCHITECT PROTOCOL V3 e com a arquitetura existente do projeto. Concordo com a escolha da **Solução A (Nota 10.0/10)**.

---

## Inventário dos 8 Tipos de Email

Após análise do código, confirmei a existência de 8 tipos de email:

| # | Template Type | Arquivo/Localização | Modularizado? |
|---|--------------|---------------------|---------------|
| 1 | `purchase-standard` | `email-templates-purchase.ts` | Sim |
| 2 | `purchase-members-area` | `email-templates-members-area.ts` | Sim |
| 3 | `purchase-external` | `email-templates-external.ts` | Sim |
| 4 | `new-sale` | `email-templates-seller.ts` | Sim |
| 5 | `pix-pending` | `email-templates-payment.ts` | Sim |
| 6 | `password-reset` | `unified-auth/handlers/password-reset-request.ts` | **Inline** |
| 7 | `student-invite` | `students-invite/index.ts` (inline na action invite) | **Inline** |
| 8 | `gdpr-request` | `gdpr-request/index.ts` (inline) | **Inline** |

---

## Arquitetura Proposta

```text
supabase/functions/
├── email-preview/
│   └── index.ts          # Router + lógica principal (< 300 linhas)
├── _shared/
│   ├── email-templates.ts          # Barrel exports (já existe)
│   ├── email-templates-purchase.ts # Compra standard (já existe)
│   ├── email-templates-members-area.ts # Área de membros (já existe)
│   ├── email-templates-external.ts # Entrega externa (já existe)
│   ├── email-templates-seller.ts   # Nova venda (já existe)
│   ├── email-templates-payment.ts  # PIX pendente (já existe)
│   └── email-mock-data.ts          # NOVO: Dados fictícios centralizados
```

---

## Especificação Técnica

### 1. Edge Function: `email-preview/index.ts`

**Endpoint:** `POST /functions/v1/email-preview`

**Autenticação:** `requireAuthenticatedProducer` (apenas produtores autenticados)

**Request Body:**
```json
{
  "templateType": "purchase-standard" | "purchase-members-area" | "purchase-external" | "new-sale" | "pix-pending" | "password-reset" | "student-invite" | "gdpr-request",
  "recipientEmail": "opcional@email.com"
}
```

**Response:**
```json
{
  "success": true,
  "templateType": "purchase-standard",
  "sentTo": "produtor@email.com",
  "messageId": "<id-do-zeptomail>"
}
```

### 2. Módulo: `email-mock-data.ts`

Dados fictícios realistas para popular os templates:

```typescript
export function getMockPurchaseData(): PurchaseConfirmationData {
  return {
    customerName: "João Silva (PREVIEW)",
    productName: "Curso de Marketing Digital",
    amountCents: 19700, // R$ 197,00
    orderId: "prev-" + crypto.randomUUID().substring(0, 8),
    paymentMethod: "Cartão de Crédito",
    sellerName: "Rise Academy",
    supportEmail: "suporte@riseacademy.com",
    deliveryUrl: "https://risecheckout.com/minha-conta/produtos/preview",
  };
}

export function getMockNewSaleData(): NewSaleData { ... }
export function getMockPaymentPendingData(): PaymentPendingData { ... }
export function getMockPasswordResetData(): { name: string; resetLink: string } { ... }
export function getMockStudentInviteData(): { ... } { ... }
export function getMockGdprData(): { ... } { ... }
```

### 3. Lógica de Processamento

```typescript
async function processEmailPreview(
  templateType: TemplateType,
  recipientEmail: string
): Promise<Response> {
  let subject: string;
  let htmlBody: string;
  let textBody: string;

  switch (templateType) {
    case "purchase-standard":
      const data = getMockPurchaseData();
      subject = "[PREVIEW] Compra Confirmada";
      htmlBody = getPurchaseConfirmationTemplate(data);
      textBody = getPurchaseConfirmationTextTemplate(data);
      break;
    
    case "purchase-members-area":
      // ...
    
    // ... demais casos
  }

  const result = await sendEmail({
    to: { email: recipientEmail },
    subject,
    htmlBody,
    textBody,
    type: "transactional",
    clientReference: `preview_${templateType}_${Date.now()}`,
  });

  return jsonResponse({ success: result.success, ... });
}
```

---

## Arquivos a Criar/Modificar

| Arquivo | Ação | Linhas Estimadas |
|---------|------|------------------|
| `supabase/functions/email-preview/index.ts` | CRIAR | ~180 |
| `supabase/functions/_shared/email-mock-data.ts` | CRIAR | ~120 |

---

## Segurança

1. **Autenticação Obrigatória:** Apenas produtores autenticados (via `requireAuthenticatedProducer`)
2. **Rate Limiting:** Aplicar `RATE_LIMIT_CONFIGS.SEND_EMAIL` para evitar abusos
3. **Assunto Prefixado:** Todos os emails de preview terão `[PREVIEW]` no assunto
4. **Email Padrão:** Se não especificar destinatário, usa o email do produtor logado
5. **Sem Efeitos Colaterais:** Nenhum registro é criado no banco de dados

---

## Uso pelo Arquiteto

Após implementação, você poderá disparar qualquer email via:

1. **Chamada direta à API** (via curl, Postman, ou frontend):
```bash
curl -X POST https://wivbtmtgpsxupfjwwovf.supabase.co/functions/v1/email-preview \
  -H "Content-Type: application/json" \
  -H "Cookie: session_token=SEU_TOKEN" \
  -d '{"templateType": "purchase-standard"}'
```

2. **(Opcional) Script helper** para facilitar o uso:
```bash
deno run --allow-net scripts/send-email-preview.ts purchase-standard
```

---

## Benefícios

| Benefício | Descrição |
|-----------|-----------|
| **Iteração Rápida** | Visualize alterações de template em segundos |
| **Zero Poluição** | Nenhum dado falso criado no banco |
| **Isolamento** | Teste um template específico sem dependências |
| **Seguro** | Apenas produtores autenticados podem usar |
| **Expansível** | Fácil adicionar novos templates no futuro |

---

## Cronograma de Implementação

1. **Fase 1 (30 min):** Criar `email-mock-data.ts` com dados fictícios
2. **Fase 2 (60 min):** Criar `email-preview/index.ts` com router e lógica
3. **Fase 3 (15 min):** Deploy e teste inicial
4. **Fase 4 (Paralelo - Manus):** Você pode começar a ajustar templates enquanto trabalho em outras tarefas

---

## Verificação RISE V3

| Critério | Nota | Justificativa |
|----------|------|---------------|
| Manutenibilidade | 10/10 | Helper centralizado, templates modulares |
| Zero DT | 10/10 | Nenhum código duplicado ou inline desnecessário |
| Arquitetura | 10/10 | Segue padrão Router + Helpers do projeto |
| Escalabilidade | 10/10 | Novos templates = novo case no switch |
| Segurança | 10/10 | Auth obrigatória, rate limiting, prefix [PREVIEW] |
| **NOTA FINAL** | **10.0/10** | Alinhado 100% com RISE Protocol V3 |

---

## Próximos Passos Após Aprovação

1. Implementar a Edge Function `email-preview`
2. Criar o módulo de mock data
3. Deploy automático
4. Você poderá testar imediatamente via chamada à API
5. A Manus poderá começar a trabalhar nos templates em paralelo
