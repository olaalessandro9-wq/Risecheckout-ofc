# Relatório de Incidente: Webhooks de Order Bumps Não Disparados

**Data:** 25 de novembro de 2025  
**Autor:** Manus AI  
**Sistema:** RiseCheckout - Plataforma de Checkout Transparente

---

## 1. Resumo do Incidente

Após a implementação da solução de "sanitização" (delete + insert) na função `mercadopago-create-payment` (v88) para corrigir a duplicação de webhooks, um novo problema surgiu: **os webhooks para os order bumps não estão mais sendo disparados**. Apenas o webhook do produto principal é enviado.

Este relatório detalha a análise do problema, as hipóteses levantadas e os planos de ação recomendados para que o Gemini possa analisar e propor uma solução.

---

## 2. Análise do Problema

### 2.1. Teste Realizado

- **Ação:** Foi realizada uma nova compra de teste com 1 produto principal e múltiplos order bumps.
- **Resultado Esperado:** 1 webhook por produto (principal + bumps).
- **Resultado Obtido:** Apenas 1 webhook (do produto principal) foi disparado.

### 2.2. Investigação da Tabela `order_items`

Para o último pedido de teste (`155aae0d-ed33-4134-9f16-be15167f07dc`), a consulta na tabela `order_items` revelou o seguinte:

```sql
SELECT * FROM order_items WHERE order_id = '155aae0d-ed33-4134-9f16-be15167f07dc';
```

**Resultado:**

| ID | Order ID | Product ID | Product Name | Is Bump | ... |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `08ee0d60...` | `155aae0d...` | `2ad650b6...` | Rise community (Cópia 3) (Cópia) | `false` | ... |

**Conclusão da Análise:**

- ✅ A duplicação do produto principal foi **corrigida**.
- ❌ Os **order bumps não foram salvos** na tabela `order_items`.

Isso explica por que os webhooks dos bumps não foram disparados: a função `mercadopago-webhook` busca os itens na tabela `order_items` e, como não encontra os bumps, não tem o que disparar.

---

## 3. Hipóteses sobre a Causa Raiz

O problema está na função `mercadopago-create-payment` (v88). A lógica de sanitização (delete + insert) está funcionando, mas a **lista de itens a ser inserida está incompleta**.

### Hipótese 1: O `is_bump` está sendo calculado incorretamente

A lógica atual para determinar se um item é um bump é:

```typescript
is_bump: item.id !== order.product_id
```

**Problema:**

- `order.product_id` é o ID do produto principal.
- Se o `item.id` do produto principal for igual a `order.product_id`, `is_bump` será `false` (correto).
- Se o `item.id` de um bump for diferente de `order.product_id`, `is_bump` será `true` (correto).

**Análise:** A lógica parece correta. É improvável que este seja o problema.

### Hipótese 2 (MAIS PROVÁVEL): O `product_id` do produto principal está mudando

**Problema:**

A função `create-order` pode estar criando o pedido com um `product_id` temporário ou diferente do que é enviado pelo frontend. Quando a função `mercadopago-create-payment` executa a lógica `item.id !== order.product_id`, ela pode estar comparando com um `product_id` incorreto, fazendo com que todos os itens (incluindo o principal) sejam marcados como `is_bump: true`.

**Evidência:**

- O produto principal foi salvo, mas os bumps não. Isso pode significar que a lógica de fallback está sendo acionada.

### Hipótese 3 (PROVÁVEL): O `items` não está sendo passado corretamente do frontend

**Problema:**

A função `mercadopago-create-payment` depende de um array `items` vindo do frontend. Se este array não estiver sendo enviado corretamente, a função pode estar caindo no bloco de `else` (fallback) e salvando apenas o produto principal.

**Código do Fallback:**

```typescript
} else {
    // Fallback: Se não vier itens, salvamos o principal (mas limpamos antes também)
    console.log("[MP] Fallback: Salvando apenas produto principal");
    
    // Limpa antes para garantir
    await supabaseClient.from("order_items").delete().eq("order_id", orderId);
    
    const { error: fallbackError } = await supabaseClient
        .from("order_items")
        .insert({
            order_id: orderId,
            product_id: order.product_id,
            // ... (salva apenas o produto principal)
        });
}
```

**Análise:**

- Esta hipótese explicaria **exatamente** o comportamento observado: os bumps não são salvos porque o array `items` está vazio ou ausente, e a função executa o fallback que salva apenas o produto principal.

---

## 4. Código Relevante

**Função:** `mercadopago-create-payment` (v88)

```typescript
// ... (código anterior)

// 5. SALVAR ITENS NO BANCO (COM CORREÇÃO DE DUPLICIDADE - SANITIZAÇÃO)
if (items && items.length > 0) {
  console.log("[MP] Atualizando order_items no banco...");
  
  // 🚨 A CORREÇÃO DE DUPLICIDADE AQUI:
  // Primeiro, removemos quaisquer itens que o 'create-order' possa ter criado duplicado
  const { error: deleteError } = await supabaseClient
    .from("order_items")
    .delete()
    .eq("order_id", orderId);
    
  if (deleteError) {
     console.error("[MP] Erro ao limpar itens antigos:", deleteError);
  }

  // Agora inserimos a lista limpa e oficial vinda do frontend
  const orderItemsToInsert = items.map((item: any) => ({
    order_id: orderId,
    product_id: item.id,
    product_name: item.title,
    amount_cents: Math.round(item.unit_price * 100),
    quantity: item.quantity || 1,
    is_bump: item.id !== order.product_id
  }));

  const { error: itemsInsertError } = await supabaseClient
    .from("order_items")
    .insert(orderItemsToInsert);

  if (itemsInsertError) {
    console.error("[MP] ❌ Erro ao salvar order_items:", itemsInsertError);
  }
} else {
    // Fallback: Se não vier itens, salvamos o principal (mas limpamos antes também)
    console.log("[MP] Fallback: Salvando apenas produto principal");
    
    // Limpa antes para garantir
    await supabaseClient.from("order_items").delete().eq("order_id", orderId);
    
    const { error: fallbackError } = await supabaseClient
        .from("order_items")
        .insert({
            order_id: orderId,
            product_id: order.product_id,
            product_name: mainProduct?.name || "Produto Principal",
            amount_cents: Math.round(amount * 100),
            quantity: 1,
            is_bump: false
        });
}

// ... (código posterior)
```

---

## 5. Planos de Ação Recomendados

### 5.1. Prioridade ALTA - Diagnóstico do Frontend

**Objetivo:** Confirmar se o array `items` está sendo enviado corretamente do frontend para a função `mercadopago-create-payment`.

**Passos:**

1. **Adicionar Logs Detalhados:** Adicionar um `console.log` no início da função para inspecionar o corpo da requisição e o array `items`.

   ```typescript
   const body = await req.json();
   console.log("[MP] Corpo da requisição recebido:", JSON.stringify(body, null, 2));
   const { items, ... } = body;
   ```

2. **Realizar Novo Teste:** Fazer uma nova compra de teste com order bumps.
3. **Analisar os Logs:** Verificar nos logs do Supabase se o array `items` está presente e contém todos os produtos (principal + bumps).

### 5.2. Prioridade MÉDIA - Correção da Lógica de Fallback

**Objetivo:** Se o frontend não estiver enviando os `items`, corrigir a lógica de fallback para que ela não apague os itens existentes.

**Passos:**

1. **Remover o `delete` do bloco `else`:** Se o array `items` não vier, não devemos apagar os itens que já existem no banco (criados pela `create-order`).

   ```typescript
   } else {
       // Fallback: Se não vier itens, não fazemos nada com os order_items
       console.log("[MP] Nenhum item detalhado recebido, mantendo itens existentes.");
   }
   ```

### 5.3. Prioridade BAIXA - Revisão da Função `create-order`

**Objetivo:** Entender como a função `create-order` está criando os `order_items` e se há alguma inconsistência.

**Passos:**

1. Analisar o código da função `create-order`.
2. Verificar se ela salva apenas o produto principal ou todos os itens.
3. Garantir que o `product_id` usado é consistente em todo o fluxo.

---

## 6. Questões para Análise do Gemini

1. **Diagnóstico:** Com base na análise, qual é a causa mais provável para os order bumps não serem salvos? A falha está no frontend ou no backend?
2. **Solução Imediata:** Qual é a forma mais segura de corrigir o problema agora, garantindo que os bumps sejam salvos sem reintroduzir a duplicação?
3. **Melhoria de Longo Prazo:** Como podemos refatorar a interação entre `create-order` e `mercadopago-create-payment` para que a responsabilidade de criar `order_items` seja clara e única?
4. **Segurança:** A lógica de sanitização (delete + insert) é segura? Há risco de race condition ou perda de dados? Como podemos mitigar esses riscos?

---

## 7. Conclusão

A correção da duplicação de webhooks introduziu um novo bug que impede o salvamento de order bumps. A causa mais provável é que o array `items` não está sendo enviado corretamente do frontend, fazendo com que a função `mercadopago-create-payment` execute uma lógica de fallback que salva apenas o produto principal.

Recomendamos focar na investigação do payload enviado pelo frontend para confirmar esta hipótese e, em seguida, ajustar a lógica de backend para lidar com o cenário corretamente.
