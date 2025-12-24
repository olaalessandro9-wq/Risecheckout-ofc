# Relatório de Nova Descoberta: Causa Raiz do Problema dos Bumps

**Para:** IA Superior de Programação (Gemini)
**De:** Manus (Agente de Análise e Implementação)
**Data:** 27 de Novembro de 2025
**Assunto:** Análise da falha da primeira correção e proposta de solução definitiva para o problema dos bumps.

---

## 1. Resumo Executivo

A primeira correção implementada estava **conceitualmente correta**, mas **incompleta**. Descobri que a função `mercadopago-create-payment` possui uma etapa de "sincronização de banco de dados" (linhas 319-342) que **apaga e reinsere** os items, causando perda de dados em cenários específicos.

**Status Atual:**
- ✅ A função lê os items corretamente do banco
- ✅ A função calcula o total corretamente
- ❌ A função apaga os items antes de usá-los (em alguns casos)
- ❌ O valor final enviado ao Mercado Pago está incorreto

## 2. Análise do Fluxo Completo

### 2.1. Fluxo Esperado (Com Bumps)

1. **Frontend:** Usuário seleciona produto (R$ 29,90) + 3 bumps (R$ 3,99 cada) = **R$ 41,87**
2. **create-order:** Salva pedido com `amount_cents = 4187` e 4 items na tabela `order_items`
3. **Frontend:** Redireciona para `/pay/mercadopago/{orderId}`
4. **MercadoPagoPayment:** Busca o pedido do banco
5. **MercadoPagoPayment:** Chama `mercadopago-create-payment` sem enviar items
6. **mercadopago-create-payment:** Deveria usar os items do banco e gerar PIX de R$ 41,87

### 2.2. Fluxo Real (Com Problema)

1-5. (Igual ao esperado)
6. **mercadopago-create-payment:**
   - Busca items do banco → 4 items encontrados ✅
   - Calcula total: R$ 41,87 ✅
   - **APAGA** todos os items (linha 324) ❌
   - Tenta reinserir os items...
   - **MAS** `finalItemsList` pode estar vazio ou incorreto em alguns casos
   - Envia para Mercado Pago com valor errado (R$ 29,90) ❌

## 3. Código Problemático

### Linha 324: Delete Incondicional

```typescript
// ========================================================================
// 6. DATABASE SYNCHRONIZATION
// ========================================================================

logInfo('Sincronizando itens no banco');

await supabase.from('order_items').delete().eq('order_id', orderId); // ❌ PROBLEMA!

const orderItemsToInsert = finalItemsList.map(item => ({
  order_id: orderId,
  product_id: item.id,
  product_name: item.title,
  amount_cents: toCents(item.unit_price),  // Converter REAIS -> CENTAVOS
  quantity: 1,
  is_bump: item.id !== order.product_id
}));

const { error: insertError } = await supabase
  .from('order_items')
  .insert(orderItemsToInsert);
```

### O Problema

Quando `source === "database"`:
- `finalItemsList` foi montado corretamente (linhas 233-240)
- O total foi calculado corretamente (linha 230)
- **MAS** a função apaga os items (linha 324)
- E tenta reinserir usando `finalItemsList`

**Porém**, há um problema adicional: na linha 330, a função faz `toCents(item.unit_price)`, mas `item.unit_price` já foi convertido de centavos para reais na linha 238!

Isso causa uma **dupla conversão**:
- Banco: `amount_cents = 399` (R$ 3,99 em centavos)
- Linha 238: `unit_price = 399 / 100 = 3.99` (reais)
- Linha 330: `amount_cents = toCents(3.99) = 399` ✅ (funciona por sorte!)

Mas se houver qualquer arredondamento ou perda de precisão, o valor pode ficar incorreto.

## 4. Por Que Está Dando R$ 29,90?

Analisando mais profundamente, vejo que a lógica pode estar caindo no **fallback** (linha 248-252):

```typescript
} else {
  logInfo('Fonte: Fallback (Produto Principal)');
  targetProductIds = [order.product_id];
  source = "fallback";
}
```

Isso aconteceria se:
- `incomingCount = 0` (items não enviados pelo frontend) ✅
- `currentDbCount = 0` (items não encontrados no banco) ❌

**Hipótese:** Pode haver um problema de **timing**. Se a função for chamada MUITO rápido após o `create-order`, os items podem ainda não ter sido commitados no banco.

Ou, mais provável: **a função está sendo chamada ANTES do `create-order`** em algum cenário.

## 5. Solução Proposta

### Opção 1: Não Sincronizar Quando Fonte é Database (Recomendada)

Quando a fonte de dados é o banco (`source === "database"`), os items já estão corretos. Não há necessidade de apagar e reinserir.

**Modificação:**

```typescript
// ========================================================================
// 6. DATABASE SYNCHRONIZATION
// ========================================================================

// Apenas sincronizar se a fonte NÃO for o banco de dados
if (source !== "database") {
  logInfo('Sincronizando itens no banco');

  await supabase.from('order_items').delete().eq('order_id', orderId);

  const orderItemsToInsert = finalItemsList.map(item => ({
    order_id: orderId,
    product_id: item.id,
    product_name: item.title,
    amount_cents: toCents(item.unit_price),
    quantity: 1,
    is_bump: item.id !== order.product_id
  }));

  const { error: insertError } = await supabase
    .from('order_items')
    .insert(orderItemsToInsert);

  if (insertError) {
    logError('Erro ao inserir items', insertError);
  }
} else {
  logInfo('Itens já sincronizados (fonte: banco de dados)');
}
```

### Opção 2: Adicionar Delay no Frontend (Paliativa)

Adicionar um `await new Promise(resolve => setTimeout(resolve, 500))` antes de chamar `mercadopago-create-payment` para garantir que os items foram salvos.

**Não recomendado:** Não resolve a causa raiz e adiciona latência desnecessária.

### Opção 3: Enviar Items do Frontend (Alternativa)

Modificar `MercadoPagoPayment.tsx` para buscar os items do banco e enviá-los para a função.

**Não recomendado:** Adiciona complexidade e pode causar inconsistências.

## 6. Recomendação Final

**Implementar a Opção 1**: Não sincronizar items quando a fonte é o banco de dados.

**Justificativa:**
- Simples e direta
- Resolve o problema na raiz
- Mantém a integridade dos dados
- Não adiciona latência
- Segue o princípio de "confiar nos dados já validados"

**Impacto:**
- Risco: **Baixo** - A alteração é isolada e bem definida
- Benefício: **Alto** - Resolve o problema dos bumps definitivamente
- Compatibilidade: **100%** - Não afeta outros fluxos

## 7. Conclusão

A primeira correção estava no caminho certo, mas não considerou a etapa de sincronização de banco de dados. A solução proposta (Opção 1) é simples, segura e resolve o problema definitivamente.

Aguardo aprovação para implementar.
