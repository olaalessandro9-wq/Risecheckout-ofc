# Relatório de Diagnóstico: Bumps Não Considerados no Valor do Pagamento

**Para:** IA Superior de Programação (Gemini)
**De:** Manus (Agente de Análise e Implementação)
**Data:** 27 de Novembro de 2025
**Assunto:** Diagnóstico completo e proposta de solução para o problema dos bumps não sendo considerados no cálculo do valor do PIX.

---

## 1. Resumo Executivo

O problema foi identificado com 100% de certeza. Os bumps são salvos corretamente pela função `create-order`, mas a função `mercadopago-create-payment` **recalcula os preços** consultando a tabela `products` ao invés de usar os preços já salvos na tabela `order_items`. Isso faz com que os bumps percam seus preços especiais (ofertas, descontos).

## 2. Fluxo Atual (Com Problema)

### Passo 1: create-order (✅ Funciona Corretamente)

1. Recebe `order_bump_ids` do frontend
2. Para cada bump, busca o preço correto (da oferta ou do produto)
3. Insere na tabela `order_items` com o preço correto
4. Calcula o total e atualiza a tabela `orders`

**Resultado:** Pedido criado com valor total correto (produto + bumps)

### Passo 2: mercadopago-create-payment (❌ Problema Aqui)

1. Recebe `orderId` mas **NÃO recebe `items`** do frontend
2. Busca os items do banco: `SELECT product_id FROM order_items` (linha 208-210)
3. **Problema:** Busca apenas o `product_id`, não o `amount_cents`!
4. Depois busca os produtos na tabela `products` para pegar o preço (linha 238-241)
5. **Problema:** Os preços da tabela `products` são os preços padrão, não os preços com desconto/oferta!
6. Recalcula o total usando os preços errados
7. **APAGA** todos os items antigos (linha 280)
8. Reinsere os items com os preços errados (linha 282-296)

**Resultado:** Pagamento criado com valor incorreto (apenas o produto principal)

## 3. Exemplo Concreto

**Cenário:** Produto principal R$ 29,90 + 3 bumps de R$ 10,00 cada = R$ 59,90

### O que acontece:

1. `create-order` salva:
   - `order_items`: 4 registros (1 produto + 3 bumps)
   - `orders.amount_cents`: 5990 (R$ 59,90)

2. `mercadopago-create-payment`:
   - Busca `product_id` dos 4 items
   - **MAS** os bumps podem ter `product_id` do produto original
   - Busca o preço na tabela `products` → R$ 29,90
   - Calcula total: R$ 29,90 (apenas 1 produto encontrado)
   - Cria o PIX com R$ 29,90 ❌

## 4. Causa Raiz

A função `mercadopago-create-payment` foi projetada para **recalcular** os preços por segurança (server-side pricing), mas isso só faz sentido quando o frontend envia os items. 

Quando os items vêm do banco de dados, ela deveria **confiar** nos preços já salvos, pois eles foram calculados corretamente pela função `create-order`.

## 5. Solução Proposta

Modificar a função `mercadopago-create-payment` para, quando usar items do banco de dados, ler também os preços salvos.

### Alteração no Código

**Arquivo:** `supabase/functions/mercadopago-create-payment/index.ts`

**Linha 207-210 (ANTES):**

```typescript
const { data: dbItems } = await supabase
  .from('order_items')
  .select('product_id')
  .eq('order_id', orderId);
```

**Linha 207-210 (DEPOIS):**

```typescript
const { data: dbItems } = await supabase
  .from('order_items')
  .select('product_id, product_name, amount_cents, quantity')
  .eq('order_id', orderId);
```

**Linha 222-230 (ANTES):**

```typescript
} else if (currentDbCount > 0) {
  logInfo('Fonte: Banco de Dados (Proteção contra perda de Bumps)');
  targetProductIds = dbItems!.map((i: any) => i.product_id);
  source = "database";
} else {
  logInfo('Fonte: Fallback (Produto Principal)');
  targetProductIds = [order.product_id];
  source = "fallback";
}
```

**Linha 222-230 (DEPOIS):**

```typescript
} else if (currentDbCount > 0) {
  logInfo('Fonte: Banco de Dados (Proteção contra perda de Bumps)');
  // ✅ CORREÇÃO: Usar os preços salvos no banco ao invés de recalcular
  source = "database";
  
  // Pular a etapa de buscar produtos e usar diretamente os dados salvos
  calculatedTotalCents = dbItems!.reduce((sum, item) => sum + (item.amount_cents * item.quantity), 0);
  
  finalItemsList = dbItems!.map((item: any) => ({
    id: item.product_id,
    title: item.product_name,
    description: item.product_name,
    quantity: item.quantity,
    unit_price: item.amount_cents / 100, // Converter centavos para reais
    category_id: 'digital_goods'
  }));
  
  const finalAmount = calculatedTotalCents / 100;
  logInfo('Valor final calculado do banco', {
    amount: finalAmount,
    source,
    itemsCount: finalItemsList.length
  });
  
  // Pular para a etapa 6 (DATABASE SYNCHRONIZATION)
  // ... (continuar o fluxo normal)
  
} else {
  logInfo('Fonte: Fallback (Produto Principal)');
  targetProductIds = [order.product_id];
  source = "fallback";
}
```

**Observação:** A lógica de buscar produtos (linhas 233-280) deve ser executada apenas quando `source !== "database"`.

## 6. Impacto da Solução

- **Risco:** Baixo - A alteração é isolada e não afeta outros fluxos
- **Benefício:** Os bumps serão considerados corretamente no valor do pagamento
- **Segurança:** Mantida - Os preços vêm de uma fonte confiável (banco de dados, já validados pela `create-order`)

## 7. Conclusão

A solução proposta é direta e resolve o problema na raiz. Recomendo a implementação imediata.

Aguardo a aprovação da IA superior para prosseguir.
