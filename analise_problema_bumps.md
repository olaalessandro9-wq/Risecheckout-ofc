# Análise do Problema: Bumps Não Considerados no Valor do PIX

## Observações dos Logs do Console

**Valor exibido no QR Code:** R$ 29,90 (valor do produto principal sem os bumps)

**Logs relevantes:**

1. `[DEBUG] Bumps carregados do banco: Array(3)` - Os bumps existem no banco
2. `DEBUG BUMPS: Array(3)` - Os bumps foram carregados
3. `[PublicCheckout] Bumps Ref Atualizado: Array(0)` - O ref foi atualizado mas está vazio
4. `[handlePIxPayment] logic.selectedBumps (state): Array(0)` - Estado vazio
5. `[handlePIxPayment] bumpsRef.current: Array(0)` - Ref vazio
6. `[handlePIxPayment] bumpsRef.current no PIX: Array(0)` - Bumps não chegam ao fluxo PIX
7. `[DEBUG PIX] Enviando para create-order: {..., selectedBumps: Set(3), bumpIds: Array(3), bumpCount: 3}` - Os bumps SÃO enviados para create-order!

## Análise Inicial

### Contradição nos Logs

Há uma contradição interessante:
- Os logs mostram `bumpsRef.current: Array(0)` (vazio)
- Mas também mostram `selectedBumps: Set(3), bumpIds: Array(3), bumpCount: 3` sendo enviados

Isso sugere que:
1. Os bumps ESTÃO sendo enviados para a função `create-order`
2. O pedido é criado COM os bumps
3. Mas quando o pagamento é criado, os bumps não são considerados

### Hipótese

O problema pode estar em um destes pontos:

1. **A função `create-order` não está salvando os bumps corretamente** no banco
2. **A função `mercadopago-create-payment` não está lendo os bumps** da tabela `order_items`
3. **Há um problema de timing** - o pagamento é criado antes dos bumps serem salvos

## Próximos Passos

1. Verificar o código da função `create-order` para ver como os bumps são salvos
2. Verificar o código da função `mercadopago-create-payment` para ver como os items são lidos
3. Verificar se há logs da Edge Function que mostrem o que está acontecendo


## Descoberta: Lógica de Seleção de Items

Encontrei a causa raiz! Na função `mercadopago-create-payment/index.ts`, linhas 204-226, há uma lógica defensiva que decide qual fonte de items usar:

```typescript
// 4. DEFENSIVE ITEM SELECTION LOGIC
const { data: dbItems } = await supabase
  .from('order_items')
  .select('product_id')
  .eq('order_id', orderId);

const currentDbCount = dbItems?.length || 0;
const incomingCount = items?.length || 0;

let targetProductIds: string[] = [];
let source = "";

if (incomingCount >= currentDbCount && incomingCount > 0) {
  logInfo('Fonte: Request (Atualização/Confiança)');
  targetProductIds = items!.map((i: any) => i.id);
  source = "request";
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

### O Problema

O parâmetro `items` vem do frontend no corpo da requisição. Se o frontend NÃO enviar os items (ou enviar vazio), a função deveria usar o banco de dados.

**Mas o frontend `MercadoPagoPayment.tsx` não está enviando o parâmetro `items`!**

Veja a chamada na linha 74-82:

```typescript
const { data, error } = await supabase.functions.invoke("mercadopago-create-payment", {
  body: { 
    orderId,
    amount: orderData.amount_cents / 100,
    payerEmail: orderData.customer_email,
    payerName: orderData.customer_name,
    paymentMethod: orderData.payment_method || 'pix'
  },
});
```

**Falta o parâmetro `items`!**

Como `items` não é enviado (undefined), `incomingCount` é 0, e a lógica cai no `else if (currentDbCount > 0)`, que DEVERIA usar o banco de dados.

Mas preciso verificar se essa lógica está funcionando corretamente.


## DESCOBERTA CRÍTICA: A Função APAGA os Items!

Encontrei o problema real! Na função `mercadopago-create-payment/index.ts`, linhas 280-296:

```typescript
// 6. DATABASE SYNCHRONIZATION
logInfo('Sincronizando itens no banco');

await supabase.from('order_items').delete().eq('order_id', orderId); // ❌ APAGA TUDO!

const orderItemsToInsert = finalItemsList.map((item) => ({
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
```

### O Fluxo Completo do Problema

1. **create-order** salva o pedido com os bumps ✅
2. **create-order** insere os items (produto + bumps) na tabela `order_items` ✅
3. **create-order** atualiza o total do pedido ✅
4. **Frontend** chama `mercadopago-create-payment` SEM enviar o parâmetro `items`
5. **mercadopago-create-payment** lê os items do banco (deveria ter 4 items: 1 produto + 3 bumps)
6. **MAS** como `items` não foi enviado, `incomingCount` = 0
7. A lógica cai em `else if (currentDbCount > 0)` e usa o banco ✅
8. **PORÉM** a função busca apenas `product_id` dos items, não o preço!
9. Depois busca os produtos na tabela `products` para pegar o preço
10. **MAS** os bumps podem ter preços diferentes (ofertas, descontos)!
11. A função APAGA todos os items antigos
12. E reinsere apenas com base nos preços da tabela `products`
13. **Resultado:** Os preços dos bumps são perdidos!

### A Solução

A função `mercadopago-create-payment` precisa:

**Opção 1:** Ler os items com os preços do banco (`order_items.amount_cents`)
**Opção 2:** O frontend deve enviar os items corretamente

A Opção 1 é mais robusta, pois garante que o valor já calculado e salvo seja respeitado.
