
# Plano: Corrigir Mapeamento de Checkouts sem Oferta

## RISE Protocol V3 - Análise de Soluções

### Solução A: Fix pontual no mapeamento
- Manutenibilidade: 10/10 (código claro, single source of truth)
- Zero DT: 10/10 (resolve a causa raiz sem workarounds)
- Arquitetura: 10/10 (alinha `productFormMachine.actors.ts` com `productDataMapper.ts`)
- Escalabilidade: 10/10 (padrão consistente em todo o codebase)
- Segurança: 10/10 (sem impacto)
- **NOTA FINAL: 10.0/10**
- Tempo estimado: 10 minutos

### DECISÃO: Solução A (10.0/10)

Não existem outras soluções viáveis - esta é a única forma correta de corrigir o bug.

---

## Diagnóstico Root Cause

### Problema Identificado

No arquivo `src/modules/products/machines/productFormMachine.actors.ts`, a função `mapBffToMachine` (linhas 171-188) usa fallback **incorreto** para dados do produto quando não há oferta:

```typescript
// ❌ CÓDIGO ATUAL - INCORRETO
const checkouts = data.checkouts.map(c => {
  const firstLink = c.checkout_links?.[0];
  const offerName = firstLink?.payment_links?.offers?.name ?? c.products?.name ?? "";  // Fallback errado!
  const offerPrice = firstLink?.payment_links?.offers?.price ?? c.products?.price ?? 0; // Fallback errado!
  
  return {
    // ...
    price: offerPrice,  // Mostra preço do produto mesmo sem oferta
    offer: offerName,   // Mostra nome do produto mesmo sem oferta
  };
});
```

### Comportamento Observado

Quando um checkout é duplicado via RPC `duplicate_checkout_shallow`:
1. O novo checkout é criado **sem** `checkout_links` (correto)
2. O BFF retorna `checkout_links: []` (correto)
3. O mapeamento faz fallback para `products.name` e `products.price` (INCORRETO)
4. A UI exibe preço e nome do produto como se fossem da oferta (BUG)

### Evidência do Banco

```sql
-- Checkout duplicado recente SEM oferta
id: dbb07fb2-c798-46d1-b2e5-f246a264078e
name: Checkout Principal (Cópia) (Cópia)
link_id: NULL       -- Sem link de pagamento
offer_name: NULL    -- Sem oferta
offer_price: NULL   -- Sem preço
```

### Solução Correta

Usar a mesma lógica já implementada em `productDataMapper.ts`:

```typescript
// ✅ CÓDIGO CORRETO (de productDataMapper.ts, linhas 139-162)
const hasOffer = !!offer;
return {
  // ...
  price: hasOffer ? offer.price : null,
  offer: hasOffer ? offer.name : null,
};
```

---

## Execução

### Arquivo a Modificar

`src/modules/products/machines/productFormMachine.actors.ts` (linhas 171-188)

### Código Atual (Incorreto)

```typescript
// Map checkouts
const checkouts = data.checkouts.map(c => {
  const firstLink = c.checkout_links?.[0];
  const offerName = firstLink?.payment_links?.offers?.name ?? c.products?.name ?? "";
  const offerPrice = firstLink?.payment_links?.offers?.price ?? c.products?.price ?? 0;
  
  return {
    id: c.id,
    name: c.name,
    price: offerPrice,
    visits: c.visits_count,
    offer: offerName,
    isDefault: c.is_default,
    linkId: firstLink?.link_id ?? "",
    product_id: c.product_id,
    status: c.status ?? undefined,
    created_at: c.created_at,
  };
});
```

### Código Corrigido

```typescript
// Map checkouts
// RISE V3: Sem fallback para product - null indica "sem oferta associada"
const checkouts = data.checkouts.map(c => {
  const firstLink = c.checkout_links?.[0];
  const offer = firstLink?.payment_links?.offers;
  const hasOffer = !!offer;
  
  return {
    id: c.id,
    name: c.name,
    price: hasOffer ? offer.price : null,
    visits: c.visits_count,
    offer: hasOffer ? offer.name : null,
    isDefault: c.is_default,
    linkId: firstLink?.link_id ?? "",
    product_id: c.product_id,
    status: c.status ?? undefined,
    created_at: c.created_at,
  };
});
```

---

## Validação Pós-Implementação

| Verificação | Resultado Esperado |
|-------------|-------------------|
| Checkout duplicado na tabela | Preço: "—", Oferta: "Selecione uma oferta" (amarelo) |
| Checkout com oferta na tabela | Preço: R$ XX,XX, Oferta: nome da oferta |
| Diálogo de configuração | Nenhuma oferta selecionada |
| TypeScript build | Zero erros |

---

## Conformidade RISE V3

| Critério | Status |
|----------|--------|
| Root Cause Only | Resolve a causa raiz no mapeamento de dados |
| Zero Dívida Técnica | Alinha `actors.ts` com `productDataMapper.ts` |
| Single Source of Truth | Ambos mappers usam a mesma lógica |
| Arquitetura Correta | Tipos nullable são respeitados |
| Segurança | Sem impacto |

**NOTA FINAL: 10.0/10** - Correção de bug seguindo RISE Protocol V3.
