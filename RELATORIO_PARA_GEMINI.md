# Relatório Técnico: Problema com Webhooks de Order Bumps

## Contexto

Sistema de checkout com integração Mercado Pago que deve disparar webhooks para múltiplos produtos (produto principal + order bumps) quando uma compra é aprovada.

## Problema Atual

**Apenas o webhook do produto principal está sendo disparado.** Os webhooks dos order bumps (produtos adicionais) não estão chegando no N8N, mesmo que os logs mostrem que foram "disparados com sucesso".

---

## Análise dos Logs (18:16:49 - Pedido `1a360275`)

### ✅ O que ESTÁ funcionando:

1. **`order_items` salvos corretamente** no banco de dados:
   - Produto principal: `2ad650b6-8961-430d-aff6-e087d2028437` (is_bump: false)
   - Bump 1: `719b2505-7d6e-4f5b-9e90-8d449c338032` (is_bump: true)
   - Bump 2: `8746314e-d9be-4a2c-ad11-abe7472deee9` (is_bump: true)
   - Bump 3: `2dea07af-36f4-4a37-96b6-55e78168f467` (is_bump: true)

2. **`mercadopago-webhook` executou corretamente**:
   ```
   📦 Encontrados 5 produto(s) no pedido
   🔔 Disparando webhook para produto: Rise community (Cópia 3) (Cópia) (2ad650b6...) - Bump: false
   🔔 Disparando webhook para produto: Pack Exclusivo +1000 Grupos WhatsApp (719b2505...) - Bump: true
   🔔 Disparando webhook para produto: 6.000 Fluxos (8746314e...) - Bump: true
   🔔 Disparando webhook para produto: Drives Oculto (2dea07af...) - Bump: true
   ```

3. **`trigger-webhooks` foi chamada 4 vezes** (uma para cada produto):
   - 18:16:49 → Produto `2ad650b6` (principal)
   - 18:16:52 → Produto `719b2505` (bump 1)
   - 18:16:53 → Produto `8746314e` (bump 2)
   - 18:16:54 → Produto `2dea07af` (bump 3)

4. **Todos retornaram "Concluído: 1/1 webhooks disparados com sucesso"**

---

## ❌ O que NÃO está funcionando:

**Apenas 1 webhook chegou no N8N** (do produto principal), mas os logs dizem que os 4 foram disparados com sucesso.

### Evidências dos Logs:

Para **TODOS os 4 produtos**, os logs mostram:

```
✅ Webhook f877a634-e722-4aa0-8bd1-52a56b3643f6 (TESTE N8N) disparado com sucesso
✅ Concluído: 1/1 webhooks disparados com sucesso
```

**URL de destino (sempre a mesma):**
```
http://72.60.249.53:5678/webhook/7eddf273-3a35-4283-b598-19c757262c18
```

---

## 🔍 Hipóteses do Problema

### Hipótese 1: Webhook está configurado apenas para o produto principal

**Verificação necessária:**
- Consultar a tabela `webhook_products` para confirmar se o webhook `f877a634-e722-4aa0-8bd1-52a56b3643f6` está vinculado aos 4 produtos
- Se não estiver, a função `trigger-webhooks` está encontrando o webhook apenas para o produto principal usando o campo legado `product_id`

**Evidência que CONTRADIZ esta hipótese:**
- Os logs mostram "1 webhook(s) correspondem ao produto" para TODOS os 4 produtos
- Isso significa que a função encontrou o webhook para todos

### Hipótese 2: A função `trigger-webhooks` está disparando, mas o N8N não está recebendo

**Possíveis causas:**
- A requisição HTTP está falhando silenciosamente para os bumps
- O N8N está rejeitando/ignorando webhooks duplicados (mesmo order_id)
- Há algum filtro ou validação no N8N que só aceita o primeiro webhook

**Verificação necessária:**
- Adicionar logs detalhados na função `trigger-webhooks` para capturar:
  - Status HTTP da resposta do webhook
  - Corpo da requisição enviada
  - Corpo da resposta recebida
  - Tempo de resposta

### Hipótese 3: Bug na lógica de filtragem da função `trigger-webhooks`

**Evidência:**
- A função diz que encontrou "1 webhook(s) cadastrados" para cada produto
- Mas pode estar **disparando sempre o mesmo webhook** (do produto principal) em vez de verificar corretamente a relação produto-webhook

**Verificação necessária:**
- Revisar o código da função `trigger-webhooks` versão 46
- Verificar se a lógica de filtragem está correta após a correção do `.contains()`

---

## 📊 Dados Confirmados do Banco

### Tabela `webhook_products`:
```sql
SELECT * FROM webhook_products 
WHERE webhook_id = 'f877a634-e722-4aa0-8bd1-52a56b3643f6'
```

**Resultado esperado:** Deve ter 6 registros (produtos vinculados ao webhook)

**Verificar se inclui:**
- ✅ `2ad650b6-8961-430d-aff6-e087d2028437` (produto principal)
- ❓ `719b2505-7d6e-4f5b-9e90-8d449c338032` (bump 1)
- ❓ `8746314e-d9be-4a2c-ad11-abe7472deee9` (bump 2)
- ❓ `2dea07af-36f4-4a37-96b6-55e78168f467` (bump 3)

---

## 🎯 Plano de Ação Recomendado

### Passo 1: Verificar configuração do webhook
```sql
SELECT wp.*, p.name as product_name
FROM webhook_products wp
JOIN products p ON p.id = wp.product_id
WHERE wp.webhook_id = 'f877a634-e722-4aa0-8bd1-52a56b3643f6'
ORDER BY wp.created_at;
```

### Passo 2: Adicionar logs detalhados na função `trigger-webhooks`

Modificar a seção que dispara o webhook para incluir:

```typescript
console.log(`[trigger-webhooks] 🚀 Disparando webhook ${webhook.id} para produto ${product_id}`);
console.log(`[trigger-webhooks] 📤 Payload:`, JSON.stringify(payload, null, 2));

const response = await fetch(webhook.url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});

console.log(`[trigger-webhooks] 📥 Status HTTP: ${response.status}`);
const responseBody = await response.text();
console.log(`[trigger-webhooks] 📥 Resposta:`, responseBody);

if (!response.ok) {
  console.error(`[trigger-webhooks] ❌ Erro ao disparar webhook: ${response.status} - ${responseBody}`);
}
```

### Passo 3: Revisar a lógica de filtragem

Verificar se após a correção do `.contains()`, a filtragem está realmente funcionando:

```typescript
// Código atual (versão 46)
const filteredWebhooks = allWebhooks.filter(webhook => {
  // Verifica se o evento está na lista
  if (!webhook.events.includes(event_type)) return false;
  
  // Verifica se o produto está na relação
  const hasProduct = webhook.webhook_products?.some(
    (wp: any) => wp.product_id === product_id
  );
  
  // OU se está no campo legado
  const isLegacyProduct = webhook.product_id === product_id;
  
  return hasProduct || isLegacyProduct;
});
```

**Possível bug:** Se `webhook.webhook_products` não está sendo populado corretamente pelo `.select()`, a filtragem pode estar falhando.

### Passo 4: Testar manualmente o webhook

Fazer uma requisição POST manual para o N8N com payloads diferentes para ver se ele aceita múltiplas requisições:

```bash
# Webhook 1 (produto principal)
curl -X POST http://72.60.249.53:5678/webhook/7eddf273-3a35-4283-b598-19c757262c18 \
  -H "Content-Type: application/json" \
  -d '{"event": "purchase_approved", "product": {"id": "2ad650b6", "name": "Principal"}}'

# Webhook 2 (bump)
curl -X POST http://72.60.249.53:5678/webhook/7eddf273-3a35-4283-b598-19c757262c18 \
  -H "Content-Type: application/json" \
  -d '{"event": "purchase_approved", "product": {"id": "719b2505", "name": "Bump 1"}}'
```

---

## 🔧 Correção Proposta

Se a hipótese 3 estiver correta, modificar a query do Supabase para garantir que `webhook_products` seja populado:

```typescript
const { data: allWebhooks, error } = await supabaseClient
  .from('outbound_webhooks')
  .select(`
    *,
    webhook_products!inner (
      product_id
    )
  `)
  .eq('vendor_id', vendor_id)
  .eq('active', true);
```

O `!inner` força um JOIN que garante que apenas webhooks com produtos vinculados sejam retornados.

---

## 📝 Resumo para o Gemini

**Problema:** Webhooks estão sendo "disparados com sucesso" segundo os logs, mas apenas 1 (produto principal) chega no N8N.

**Dados confirmados:**
- ✅ `order_items` salvos corretamente (4 produtos)
- ✅ `mercadopago-webhook` chamou `trigger-webhooks` 4 vezes
- ✅ `trigger-webhooks` retornou sucesso para os 4
- ❌ N8N recebeu apenas 1 webhook

**Próximos passos:**
1. Verificar se os produtos dos bumps estão na tabela `webhook_products`
2. Adicionar logs detalhados para ver o payload e resposta HTTP
3. Revisar a lógica de filtragem da função `trigger-webhooks`
4. Testar manualmente o endpoint do N8N

**Arquivos relevantes:**
- `/home/ubuntu/risecheckout-84776/supabase/functions/trigger-webhooks/index.ts` (versão 46)
- `/home/ubuntu/risecheckout-84776/supabase/functions/mercadopago-webhook/index.ts` (versão 90)
- `/home/ubuntu/risecheckout-84776/supabase/functions/mercadopago-create-payment/index.ts` (versão 86)
