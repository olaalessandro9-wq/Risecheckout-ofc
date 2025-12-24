# Análise do Bug: Webhook Duplicado no Cartão de Crédito

**Data:** 29 de Novembro de 2025
**Analista:** Manus AI
**Status:** Bug Identificado

---

## 1. Descrição do Problema

**Sintoma:**
- **PIX:** Funciona corretamente (1 produto principal + 3 bumps = 4 webhooks) ✅
- **Cartão:** Duplica o webhook do produto principal (2x produto principal + 3 bumps = 5 webhooks) ❌

**Comportamento Esperado:**
- Ambos os métodos de pagamento devem disparar exatamente 4 webhooks (1 para cada produto/bump)

---

## 2. Fluxo de Execução Analisado

### 2.1. Criação do Pedido (`create-order`)
1. Recebe `product_id` e `order_bump_ids[]`
2. Busca produto principal
3. Cria array `allOrderItems` começando com o produto principal (linha 98-104)
4. Para cada bump, busca o `product_id` associado ao bump (linha 122-127)
5. **LINHA 146 - PONTO CRÍTICO:**
   ```typescript
   allOrderItems.push({
       product_id: bumpProductId || product_id,  // ⚠️ Fallback problemático
       product_name: bumpName,
       amount_cents: Math.round(bumpPrice * 100),
       quantity: 1,
       is_bump: true
   });
   ```
6. Insere todos os itens na tabela `order_items` (linha 200-202)

### 2.2. Processamento do Pagamento
- **PIX:** `mercadopago-create-payment` ou `pushinpay-create-pix`
- **Cartão:** `mercadopago-create-payment`

### 2.3. Webhook do Mercado Pago (`mercadopago-webhook`)
1. Recebe notificação do MP quando pagamento é aprovado
2. Atualiza status do pedido para `PAID`
3. **NÃO dispara webhooks diretamente** - apenas atualiza o banco

### 2.4. Database Trigger (`trigger_order_webhooks_v9`)
1. Detecta mudança de status para `PAID`
2. Chama Edge Function `trigger-webhooks` **UMA ÚNICA VEZ**
3. Passa apenas `order_id` e `event_type`

### 2.5. Disparo de Webhooks (`trigger-webhooks`)
1. Busca todos os `order_items` do pedido
2. Para cada item, filtra webhooks relevantes
3. Dispara 1 webhook por item que faz match

---

## 3. Causa Raiz Identificada

### Hipótese Principal: Fallback Incorreto na Linha 146

**Código Problemático:**
```typescript
product_id: bumpProductId || product_id
```

**Quando isso causa problema:**
- Se `bumpProductId` for `null`, `undefined`, ou string vazia
- O sistema usa `product_id` (produto principal) como fallback
- Isso cria um `order_item` com `is_bump: true` mas `product_id` do produto principal

**Resultado:**
- 2 itens com o mesmo `product_id` (produto principal):
  - Item 1: `is_bump: false` (correto)
  - Item 2: `is_bump: true` (incorreto - deveria ter outro product_id)

### Por Que Afeta Apenas Cartão?

**Hipóteses a Investigar:**

1. **Diferença no Timing:**
   - PIX: Webhook chega depois (assíncrono)
   - Cartão: Webhook chega imediatamente (síncrono)
   - Possível race condition?

2. **Diferença nos Dados do Bump:**
   - Talvez os bumps estejam configurados diferentemente para cada método
   - Um bump específico pode ter `product_id: null` apenas no fluxo de cartão

3. **Configuração do Webhook:**
   - Webhook pode estar configurado para disparar 2x no evento de cartão
   - Verificar tabela `webhook_products`

---

## 4. Evidências Necessárias

Para confirmar a causa raiz, precisamos:

### 4.1. Consultar `order_items` de um Pedido com Cartão
```sql
SELECT 
    id,
    order_id,
    product_id,
    product_name,
    is_bump,
    amount_cents
FROM order_items
WHERE order_id = '<order_id_do_teste_com_cartao>'
ORDER BY is_bump, created_at;
```

**Resultado Esperado se o Bug for Confirmado:**
| product_id | product_name | is_bump |
|:-----------|:-------------|:--------|
| `2ad650b6...` | Produto Principal | false |
| `2ad650b6...` | Produto Principal | true ⚠️ |
| `719b2505...` | Bump 1 | true |
| `8746314e...` | Bump 2 | true |

### 4.2. Verificar Configuração dos Bumps
```sql
SELECT 
    id,
    product_id,
    custom_title,
    discount_enabled,
    discount_price
FROM order_bumps
WHERE id IN ('<bump_id_1>', '<bump_id_2>', '<bump_id_3>');
```

**Verificar:** Algum bump tem `product_id: NULL`?

### 4.3. Logs do `create-order`
- Verificar se há warnings: `"⚠️ Produto do bump ${bump.id} não encontrado. Ignorando."`
- Isso indicaria que um bump não tem produto associado

---

## 5. Correção Proposta

### Opção 1: Validação Estrita (Recomendado)
```typescript
// Linha 145-151 (create-order/index.ts)
if (!bumpProductId) {
    console.error(`🚨 Bump ${bump.id} não tem product_id associado. ABORTANDO.`);
    throw new Error(`Order Bump "${bumpName}" está mal configurado (sem produto vinculado)`);
}

allOrderItems.push({
    product_id: bumpProductId, // Sem fallback!
    product_name: bumpName,
    amount_cents: Math.round(bumpPrice * 100),
    quantity: 1,
    is_bump: true
});
```

**Vantagem:** Força correção na origem (configuração do bump)
**Desvantagem:** Pode quebrar pedidos existentes

### Opção 2: Skip Silencioso
```typescript
if (!bumpProductId) {
    console.warn(`⚠️ Bump ${bump.id} sem product_id. Pulando item.`);
    continue; // Pula este bump
}
```

**Vantagem:** Não quebra o fluxo
**Desvantagem:** Bump não aparece no pedido (cliente paga mas não recebe)

### Opção 3: Usar ID do Bump como Produto
```typescript
allOrderItems.push({
    product_id: bumpProductId || bump.id, // Usa ID do bump como fallback
    product_name: bumpName,
    amount_cents: Math.round(bumpPrice * 100),
    quantity: 1,
    is_bump: true
});
```

**Vantagem:** Mantém compatibilidade
**Desvantagem:** Pode causar problemas se webhook espera product_id real

---

## 6. Próximos Passos

1. **Validar Hipótese:** Executar as queries SQL acima em um pedido com cartão que teve duplicação
2. **Confirmar Causa:** Verificar se realmente existe um `order_item` com `is_bump: true` e `product_id` do produto principal
3. **Escolher Correção:** Decidir entre Opção 1, 2 ou 3 baseado nos dados reais
4. **Testar:** Fazer deploy da correção e testar com cartão
5. **Validar:** Confirmar que apenas 4 webhooks são disparados

---

## 7. Perguntas para o Usuário

1. **Você tem acesso aos logs do último teste com cartão?** (Para ver se há warning sobre bump sem produto)
2. **Pode executar a query SQL acima?** (Para confirmar duplicação na tabela `order_items`)
3. **Os bumps estão configurados corretamente?** (Todos têm `product_id` associado?)
4. **Qual opção de correção você prefere?** (Estrita, Skip, ou Fallback para bump.id)

---

**Conclusão:** O bug está localizado na linha 146 da função `create-order`, mas precisamos de dados reais para confirmar e escolher a melhor correção.
