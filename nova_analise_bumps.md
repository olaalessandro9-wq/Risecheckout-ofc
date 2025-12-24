# Nova Análise: Por que a Correção Não Funcionou

## Problema Identificado

A correção anterior foi implementada corretamente, MAS há um problema de **timing** ou de **lógica de fallback**.

### O Fluxo Atual

1. Usuário seleciona produto + bumps no checkout
2. Frontend chama `create-order` com os `order_bump_ids`
3. `create-order` salva o pedido e os items (produto + bumps) na tabela `order_items`
4. Frontend redireciona para `/pay/mercadopago/{orderId}`
5. `MercadoPagoPayment` busca o pedido do banco
6. `MercadoPagoPayment` chama `mercadopago-create-payment` SEM enviar items
7. `mercadopago-create-payment` deveria ler os items do banco...

### Por que Não Está Funcionando?

Analisando o código da nossa correção (linhas 224-247), vejo que:

```typescript
} else if (currentDbCount > 0) {
  // ✅ CORREÇÃO: Usar preços salvos no banco ao invés de recalcular
  logInfo('Fonte: Banco de Dados (Proteção contra perda de Bumps)');
  source = "database";
  
  // Calcular total usando os preços salvos
  calculatedTotalCents = dbItems!.reduce((sum, item) => sum + (item.amount_cents * item.quantity), 0);
  
  // Montar lista de items usando os dados salvos
  finalItemsList = dbItems!.map((item: any) => ({
    id: item.product_id,
    title: item.product_name,
    description: item.product_name,
    quantity: item.quantity,
    unit_price: item.amount_cents / 100,
    category_id: 'digital_goods'
  }));
  
  const finalAmount = calculatedTotalCents / 100;
  logInfo('Valor final calculado do banco', {
    amount: finalAmount,
    source,
    itemsCount: finalItemsList.length
  });
}
```

**O problema:** A lógica está correta, MAS pode estar caindo no `else` (fallback) ao invés do `else if`.

### Hipóteses

1. **Timing:** A função é chamada ANTES dos items serem salvos → `currentDbCount` = 0 → cai no fallback
2. **Lógica de Prioridade:** A condição `if (incomingCount >= currentDbCount && incomingCount > 0)` pode estar sendo verdadeira quando não deveria

Vou verificar qual das duas está acontecendo.
