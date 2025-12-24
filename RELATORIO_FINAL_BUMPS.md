# Relatório de Incidente Final: Webhooks de Order Bumps Não Disparados

**Data:** 25 de novembro de 2025  
**Autor:** Manus AI  
**Sistema:** RiseCheckout - Plataforma de Checkout Transparente

---

## 1. Resumo do Incidente

Mesmo após a implementação da solução de "Race Condition" proposta pelo Gemini (v89), o problema persiste: **os webhooks para os order bumps não são disparados**. Apenas o webhook do produto principal é enviado.

Este relatório detalha a análise final do problema, a descoberta da causa raiz e as recomendações para que o Gemini possa propor a solução definitiva.

---

## 2. Análise Final do Problema

### 2.1. Investigação da Tabela `order_items`

Para os 2 últimos pedidos de teste, a consulta na tabela `order_items` revelou o seguinte:

```sql
SELECT * FROM order_items WHERE order_id IN (
  'f064af41-867f-44d8-950d-cfbdd2c28535',
  'acb629d3-87d3-4666-9b79-169a323fa03d'
);
```

**Resultado:**

| Order ID | Product ID | Product Name | Is Bump | ... |
| :--- | :--- | :--- | :--- | :--- |
| `acb629d3...` | `2ad650b6...` | Rise community (Cópia 3) (Cópia) | `false` | ... |
| `f064af41...` | `2ad650b6...` | Rise community (Cópia 3) (Cópia) | `false` | ... |

**Conclusão da Análise:**

- ✅ A duplicação do produto principal foi **corrigida**.
- ❌ Os **order bumps continuam não sendo salvos** na tabela `order_items`.

### 2.2. Investigação dos Logs da Função `mercadopago-create-payment` (v89)

Os logs da função mostram que ela está caindo no bloco de `else` (fallback):

```
[MP] Nenhum item recebido. Verificando banco...
[MP] Banco vazio. Inserindo fallback (Principal) antes do pagamento.
[MP] ✅ Produto principal inserido como fallback.
```

**Conclusão da Análise:**

- A função `mercadopago-create-payment` **NÃO está recebendo o array `items`** do frontend.

### 2.3. Investigação do Código do Frontend (`PublicCheckout.tsx`)

Analisando o código do frontend, encontramos a causa raiz do problema.

**Código Relevante:**

```typescript
// Linha 683
const { data, error } = await supabase.functions.invoke('mercadopago-create-payment', {
  body: {
    orderId: currentOrderId,
    amount: totalCents / 100,
    // ... (outros dados)
    items: items, // Detalhes dos produtos
  },
});
```

**Problema:**

- O `supabase.functions.invoke` espera que os argumentos sejam passados diretamente no segundo parâmetro.
- O código está passando os argumentos dentro de um objeto `body`, o que faz com que a Edge Function não os receba corretamente.

**Forma Correta:**

```typescript
const { data, error } = await supabase.functions.invoke('mercadopago-create-payment', {
  orderId: currentOrderId,
  amount: totalCents / 100,
  // ... (outros dados)
  items: items, // Detalhes dos produtos
});
```

---

## 3. Causa Raiz Definitiva

O problema não era de race condition, duplicação ou lógica de backend, mas sim um **erro na chamada da Edge Function pelo frontend**.

O `supabase-js` v2 mudou a forma como os argumentos são passados para as Edge Functions. O código do `PublicCheckout.tsx` está usando o formato antigo (com `body`), o que faz com que o payload chegue vazio na função de backend.

---

## 4. Código Relevante

**Arquivo:** `src/pages/PublicCheckout.tsx`

**Código Incorreto (Atual):**

```typescript
// Linha 683
const { data, error } = await supabase.functions.invoke('mercadopago-create-payment', {
  body: { // <--- ERRO AQUI
    orderId: currentOrderId,
    amount: totalCents / 100,
    items: items,
    // ...
  },
});
```

**Código Correto (Proposto):**

```typescript
// Linha 683
const { data, error } = await supabase.functions.invoke('mercadopago-create-payment', {
  // Sem o 'body'
  orderId: currentOrderId,
  amount: totalCents / 100,
  items: items,
  // ...
});
```

---

## 5. Planos de Ação Recomendados

### 5.1. Prioridade MÁXIMA - Correção do Frontend

**Objetivo:** Corrigir a chamada da Edge Function no `PublicCheckout.tsx` para que os `items` sejam enviados corretamente.

**Passos:**

1. **Remover o `body`:** Alterar a chamada do `supabase.functions.invoke` para passar os argumentos diretamente.
2. **Fazer Deploy do Frontend:** Publicar a nova versão do checkout.
3. **Realizar Novo Teste:** Fazer uma nova compra de teste com cartão de crédito e order bumps.
4. **Validar:** Verificar se os `order_items` são salvos corretamente e se todos os webhooks são disparados.

### 5.2. Prioridade BAIXA - Reverter Backend (Opcional)

**Objetivo:** Simplificar o código do backend, já que a solução do race condition não era necessária.

**Passos:**

1. **Reverter a v89:** Voltar para a versão 88 da função `mercadopago-create-payment` (que já tinha a sanitização, mas não a lógica de fallback complexa).

**Recomendação:** Manter a versão 89, pois ela é mais robusta e lida com mais cenários, mesmo que a causa raiz fosse outra.

---

## 6. Questões para Análise do Gemini

1. **Confirmação:** A análise da causa raiz (erro na chamada do `invoke`) está correta?
2. **Solução:** A correção proposta para o frontend é a ideal? Há algum efeito colateral que não previ?
3. **Backend:** Devemos reverter a função `mercadopago-create-payment` para uma versão mais simples (v88) ou manter a versão atual (v89) que é mais robusta?
4. **Prevenção:** Como podemos evitar que erros como este (mudança de API do Supabase) aconteçam no futuro? Há alguma ferramenta de linting ou tipagem que poderia ter pego isso?

---

## 7. Conclusão Final

A investigação revelou que a causa raiz de todos os problemas (duplicação e falta de bumps) era um erro sutil na chamada da Edge Function pelo frontend. As correções no backend, embora bem-intencionadas, estavam tratando os sintomas e não a doença.

A correção agora deve ser focada no frontend, ajustando a forma como os dados são enviados para a função `mercadopago-create-payment`. Após essa correção, o sistema deve funcionar conforme omo-se conforme o esperado.
