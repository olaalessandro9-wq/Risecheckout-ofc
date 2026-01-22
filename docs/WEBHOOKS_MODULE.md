# Webhooks Module

> **Versão:** 3.0.0  
> **Data:** 22 de Janeiro de 2026  
> **Status:** ✅ RISE Protocol V3 Compliant (10.0/10)  
> **Mantenedor:** Lead Architect

---

## Visão Geral

O módulo Webhooks permite que vendors configurem endpoints HTTP para receber notificações em tempo real sobre eventos do sistema (vendas, reembolsos, etc.).

## Arquitetura

### Frontend (src/modules/webhooks/)

```
src/modules/webhooks/
├── index.ts                     # Exports públicos
├── types.ts                     # Tipos e interfaces
├── constants/
│   ├── events.ts               # WEBHOOK_EVENTS disponíveis
│   └── index.ts
├── machines/
│   ├── webhooksMachine.types.ts
│   ├── webhooksMachine.actors.ts
│   ├── webhooksMachine.ts      # XState machine (SSOT)
│   └── index.ts
├── context/
│   ├── WebhooksContext.tsx     # Provider + useWebhooks hook
│   └── index.ts
└── components/
    ├── WebhooksManager.tsx     # Container principal
    ├── WebhooksHeader.tsx      # Header com botão criar
    ├── WebhooksList.tsx        # Lista de webhooks
    ├── WebhookFormSheet.tsx    # Sheet do formulário
    ├── WebhookForm.tsx         # Formulário de criação/edição
    ├── WebhookDeleteDialog.tsx # Confirmação de exclusão
    ├── TestWebhookDialog.tsx   # Envio de evento teste
    ├── WebhookLogsDialog.tsx   # Visualização de logs
    └── index.ts
```

### Backend (supabase/functions/webhook-crud/)

```
supabase/functions/webhook-crud/
├── index.ts                     # Router puro (~80 linhas)
├── types.ts                     # Interfaces centralizadas
└── handlers/
    ├── list-handlers.ts         # list, listProducts, getWebhookProducts
    ├── crud-handlers.ts         # create, update, delete
    └── logs-handler.ts          # getWebhookLogs
```

---

## State Machine

O módulo utiliza XState como Single Source of Truth (SSOT) para gerenciamento de estado.

### Diagrama de Estados

```
                    ┌──────────┐
                    │  idle    │
                    └────┬─────┘
                         │ LOAD
                         ▼
                    ┌──────────┐
            ┌───────│ loading  │───────┐
            │       └────┬─────┘       │
            │ error      │ done        │
            ▼            ▼             │
       ┌──────────┐ ┌──────────┐       │
       │  error   │ │  ready   │◄──────┘
       └────┬─────┘ └────┬─────┘
            │            │
            │ RETRY      │ OPEN_FORM / DELETE / TEST / VIEW_LOGS
            │            ▼
            │       ┌──────────┐
            └──────►│ children │
                    │ states   │
                    └──────────┘
```

### Estados Principais

| Estado | Descrição |
|--------|-----------|
| `idle` | Estado inicial, aguardando LOAD |
| `loading` | Carregando webhooks e produtos |
| `ready` | Lista carregada, pronto para interações |
| `ready.saving` | Salvando webhook (create/update) |
| `ready.deleting` | Excluindo webhook |
| `ready.testingWebhook` | Enviando evento de teste |
| `ready.loadingLogs` | Carregando logs de entrega |
| `error` | Erro ocorreu, permite RETRY |

### Eventos

| Evento | Descrição |
|--------|-----------|
| `LOAD` | Inicia carregamento de dados |
| `OPEN_FORM` | Abre formulário (criar/editar) |
| `CLOSE_FORM` | Fecha formulário |
| `SAVE_WEBHOOK` | Salva webhook |
| `DELETE_WEBHOOK` | Inicia exclusão |
| `CONFIRM_DELETE` | Confirma exclusão |
| `CANCEL_DELETE` | Cancela exclusão |
| `TEST_WEBHOOK` | Abre modal de teste |
| `VIEW_LOGS` | Abre modal de logs |
| `RETRY` | Tenta novamente após erro |

---

## Edge Functions

### webhook-crud (SSOT - Single Source of Truth)

Centraliza **TODAS** as operações de webhooks. Esta é a única Edge Function que deve ser usada para gerenciamento de webhooks.

| Action | Método | Descrição |
|--------|--------|-----------|
| `list` / `list-with-products` | POST | Lista webhooks com produtos |
| `list-products` / `list-user-products` | POST | Lista produtos do vendor |
| `get-webhook-products` | POST | Busca produtos vinculados |
| `get-logs` | POST | Busca logs de entrega |
| `create` | POST | Cria novo webhook |
| `update` | POST | Atualiza webhook |
| `delete` | POST | Exclui webhook |

**Exemplo de uso:**

```typescript
// Listar webhooks
const { data } = await supabase.functions.invoke("webhook-crud", {
  body: { action: "list-with-products" }
});

// Buscar logs de entrega
const { data } = await supabase.functions.invoke("webhook-crud", {
  body: { action: "get-logs", webhookId: "uuid" }
});
```

### send-webhook-test

Envia evento de teste para um webhook.

```typescript
await supabase.functions.invoke("send-webhook-test", {
  body: { 
    webhookId: "uuid",
    eventType: "purchase_approved"
  }
});
```

### trigger-webhooks

Dispara webhooks para um evento real (chamado internamente).

---

## Edge Functions Consolidadas (Histórico)

| Função Original | Status | Motivo |
|-----------------|--------|--------|
| `get-webhook-logs` | ❌ **DELETADA** (2026-01-21) | Consolidada em `webhook-crud` action=`get-logs` |
| `dispatch-webhook` | ❌ **DELETADA** (2026-01-22) | Código morto - usava tabela `webhook_configs` inexistente |
| `send-webhook` | ❌ **DELETADA** (2026-01-22) | Stub genérico sem uso identificado |
| `test-webhook-dispatch` | ❌ **DELETADA** (2026-01-22) | Duplicava `send-webhook-test` |
| `trigger-webhooks-internal` | ❌ **DELETADA** (2026-01-22) | Código morto - usava tabela `webhook_configs` inexistente |

> **IMPORTANTE:** Todas as operações de webhooks passam exclusivamente por `webhook-crud`. Não criar novas Edge Functions para webhooks.

---

## Tipos

```typescript
// Webhook principal
interface Webhook {
  id: string;
  name: string;
  url: string;
  events: WebhookEventType[];
  product_id: string | null;
  product?: { name: string };
  created_at: string;
}

// Tipos de eventos suportados
type WebhookEventType =
  | 'pix_generated'
  | 'purchase_approved'
  | 'purchase_refused'
  | 'refund'
  | 'chargeback'
  | 'checkout_abandoned';

// Dados do formulário
interface WebhookFormData {
  name: string;
  url: string;
  events: WebhookEventType[];
  product_ids: string[];
}

// Log de entrega
interface WebhookDeliveryLog {
  id: string;
  webhook_id: string;
  event_type: string;
  payload: unknown;
  response_status: number | null;
  response_body: string | null;
  success: boolean;
  created_at: string;
}
```

---

## Eventos Disponíveis

| Evento | Descrição |
|--------|-----------|
| `pix_generated` | Código PIX gerado |
| `purchase_approved` | Compra aprovada |
| `purchase_refused` | Compra recusada |
| `refund` | Reembolso processado |
| `chargeback` | Chargeback recebido |
| `checkout_abandoned` | Checkout abandonado |

---

## Uso

### Importação

```typescript
import { WebhooksManager } from "@/modules/webhooks";
```

### Na página

```tsx
const WebhooksPage = () => (
  <div className="space-y-6">
    <h1>Webhooks</h1>
    <WebhooksManager />
  </div>
);
```

### Acesso ao contexto (componentes internos)

```typescript
import { useWebhooks } from "@/modules/webhooks";

function MyComponent() {
  const { state, send } = useWebhooks();
  
  const webhooks = state.context.webhooks;
  const isLoading = state.matches('loading');
  
  return (
    <button onClick={() => send({ type: 'OPEN_FORM' })}>
      Novo Webhook
    </button>
  );
}
```

---

## Tabelas do Banco

| Tabela | Descrição |
|--------|-----------|
| `outbound_webhooks` | Configuração dos webhooks |
| `webhook_deliveries` | Logs de entrega |
| `webhook_products` | Relação webhook-produto |

---

## Conformidade RISE V3

| Critério | Status |
|----------|--------|
| XState SSOT | ✅ webhooksMachine |
| Localização | ✅ src/modules/webhooks/ |
| Limite 300 linhas | ✅ Todos os arquivos |
| Zero useState para dados globais | ✅ |
| Zero console.log | ✅ |
| Zero any | ✅ |
| Documentação | ✅ Este arquivo |

---

## Histórico

| Versão | Data | Alterações |
|--------|------|------------|
| 3.0.0 | 2026-01-22 | Modularização de `webhook-crud` em handlers, deleção de 4 Edge Functions mortas/duplicadas |
| 2.0.0 | 2026-01-21 | Consolidação em `webhook-crud`, remoção de `get-webhook-logs` legado |
| 1.0.0 | 2026-01-21 | Criação do módulo com arquitetura XState |

---

**Desenvolvido seguindo o RISE Architect Protocol V3 (Score: 10.0/10)**
