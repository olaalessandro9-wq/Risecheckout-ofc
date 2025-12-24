# Análise da Estrutura do Banco de Dados - Sistema de Webhooks

## Data: 2025-11-19

## Resumo Executivo

A análise do banco de dados revelou que **ambas as tabelas existem** (`outbound_webhooks` e `vendor_integrations`), mas têm **propósitos diferentes**. O problema identificado no `mercadopago-webhook` é que ele está consultando a tabela **errada** para o sistema de webhooks do vendedor.

---

## Tabelas Relacionadas a Webhooks

### 1. `outbound_webhooks` ✅ (TABELA CORRETA)

**Propósito:** Armazena configurações de webhooks que o RiseCheckout envia para os vendedores quando eventos ocorrem (pagamento aprovado, PIX gerado, etc.)

**Estrutura:**
```
- id (uuid) - Identificador único do webhook
- vendor_id (uuid) - ID do vendedor
- url (text) - URL de destino do webhook
- secret (text) - Segredo para assinatura HMAC
- secret_encrypted (text) - Versão criptografada do segredo
- events (ARRAY) - Lista de eventos que disparam o webhook
- active (boolean) - Se o webhook está ativo
- name (text) - Nome descritivo do webhook
- product_id (uuid) - ID do produto (opcional)
- created_at (timestamp)
- updated_at (timestamp)
```

**Registros Existentes:** 3 webhooks configurados
- Webhook 1: vendor_id `ccff612c-93e6-4acc-85d9-7c9d978a7e4e` → URL n8n
- Webhook 2: vendor_id `10339680-6c57-4c99-8d04-b43eea6d60e4` → webhook.site
- Webhook 3: vendor_id `b7b40e20-c035-42d7-8999-9ac4deae9648` → webhook.site

**Eventos Suportados:**
- `purchase_approved` (pagamento aprovado)
- `pix_generated` (PIX gerado)
- `sale_approved` (venda aprovada)
- `refund` (reembolso)
- `cart_abandoned` (carrinho abandonado)
- `chargeback` (chargeback)
- `checkout_abandoned` (checkout abandonado)
- `purchase_refused` (pagamento recusado)

---

### 2. `vendor_integrations` ⚠️ (TABELA DIFERENTE)

**Propósito:** Armazena configurações de integrações de terceiros que o vendedor usa (ex: Mercado Pago, Stripe, etc.)

**Estrutura:**
```
- id (uuid)
- vendor_id (uuid)
- integration_type (text) - Tipo de integração (ex: "mercadopago", "stripe")
- config (jsonb) - Configurações específicas da integração
- active (boolean)
- created_at (timestamp)
- updated_at (timestamp)
```

**Diferença:** Esta tabela é para **integrações RECEBIDAS** pelo vendedor (ex: credenciais do Mercado Pago), não para webhooks **ENVIADOS** para o vendedor.

---

### 3. `webhook_deliveries` ✅ (LOG DE ENTREGAS)

**Propósito:** Registra todas as tentativas de entrega de webhooks para rastreamento e retry

**Estrutura:**
```
- id (uuid)
- webhook_id (uuid) - Referência para outbound_webhooks
- order_id (uuid) - Referência para orders
- event_type (text) - Tipo de evento
- payload (jsonb) - Payload enviado
- status (text) - Status da entrega (pending, success, failed)
- attempts (integer) - Número de tentativas
- last_attempt_at (timestamp)
- next_retry_at (timestamp)
- response_status (integer) - HTTP status code da resposta
- response_body (text) - Corpo da resposta
- created_at (timestamp)
```

---

### 4. `orders` ✅ (PEDIDOS)

**Campos Relevantes:**
```
- id (uuid)
- vendor_id (uuid)
- product_id (uuid)
- gateway_payment_id (text)
- status (text)
```

---

## Problema Identificado no `mercadopago-webhook`

### Código Atual (INCORRETO):
```typescript
const { data: integration } = await supabaseClient
  .from('vendor_integrations')  // ❌ TABELA ERRADA
  .select('*')
  .eq('vendor_id', order.vendor_id)
  .eq('integration_type', 'webhook')
  .eq('active', true)
  .single();
```

### Código Correto (Deveria ser):
```typescript
const { data: webhooks } = await supabaseClient
  .from('outbound_webhooks')  // ✅ TABELA CORRETA
  .select('*')
  .eq('vendor_id', order.vendor_id)
  .eq('active', true)
  .contains('events', ['purchase_approved']);  // Filtrar por evento
```

---

## Comparação: mercadopago-webhook vs trigger-webhooks

### `mercadopago-webhook` (v11) - IMPLEMENTAÇÃO INCORRETA:
- ❌ Consulta `vendor_integrations` em vez de `outbound_webhooks`
- ❌ Usa `fetch()` direto em vez de chamar função padronizada
- ❌ Não registra em `webhook_deliveries`
- ❌ Não implementa retry logic
- ❌ Implementação de HMAC pode estar inconsistente

### `trigger-webhooks` - IMPLEMENTAÇÃO CORRETA:
- ✅ Consulta `outbound_webhooks` corretamente
- ✅ Filtra por `event_type` no array `events`
- ✅ Registra todas as entregas em `webhook_deliveries`
- ✅ Implementa retry logic com backoff exponencial
- ✅ HMAC-SHA256 padronizado
- ✅ Payload completo e estruturado

---

## Recomendações

### 1. **Correção Imediata** (Alta Prioridade)
Atualizar `mercadopago-webhook` para:
- Usar `outbound_webhooks` em vez de `vendor_integrations`
- Chamar `trigger-webhooks` em vez de implementar lógica própria

### 2. **Refatoração** (Média Prioridade)
Simplificar `mercadopago-webhook` para apenas:
1. Receber notificação do Mercado Pago
2. Atualizar status do pedido
3. Chamar `trigger-webhooks` com o evento apropriado

### 3. **Validação** (Alta Prioridade)
Testar fluxo completo:
1. Criar webhook de teste em `outbound_webhooks`
2. Fazer pagamento de teste
3. Verificar se webhook foi disparado
4. Verificar log em `webhook_deliveries`

---

## Próximos Passos

1. ✅ Análise do banco de dados concluída
2. ⏭️ Corrigir `mercadopago-webhook` para usar `outbound_webhooks`
3. ⏭️ Refatorar para chamar `trigger-webhooks`
4. ⏭️ Criar webhook de teste
5. ⏭️ Testar fluxo end-to-end
6. ⏭️ Documentar correções

---

## Conclusão

O sistema de webhooks do vendedor está **corretamente estruturado** no banco de dados com a tabela `outbound_webhooks`. O problema é apenas uma **inconsistência de implementação** no `mercadopago-webhook` que consulta a tabela errada. A correção é simples e não requer mudanças no schema do banco.
