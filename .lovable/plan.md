
# Plano: Corrigir exibição de checkouts sem oferta associada

## RISE Protocol V3 - Análise de Soluções

### Solução A: Ajustar apenas o mapper para retornar string vazia
- Manutenibilidade: 6/10 (confunde string vazia com "não carregado")
- Zero DT: 5/10 (precisa de tratamento especial em cada componente)
- Arquitetura: 4/10 (não segue princípio de clareza semântica)
- Escalabilidade: 5/10 (cada novo componente precisa saber tratar "")
- Segurança: 10/10 (sem impacto)
- **NOTA FINAL: 5.6/10**
- Tempo estimado: 15 minutos

### Solução B: Sinalização explícita com valores claros + tratamento visual unificado
- Manutenibilidade: 10/10 (semântica clara: null = sem oferta)
- Zero DT: 10/10 (tratamento único e consistente)
- Arquitetura: 10/10 (Single Source of Truth no mapper, UI apenas renderiza)
- Escalabilidade: 10/10 (qualquer componente sabe interpretar null/0)
- Segurança: 10/10 (sem impacto)
- **NOTA FINAL: 10.0/10**
- Tempo estimado: 40 minutos

### DECISÃO: Solução B (10.0/10)

A Solução A é inferior porque força cada componente da UI a "adivinhar" se uma string vazia significa "sem oferta" ou "dados não carregados". A Solução B implementa semântica clara: `offer = null` e `price = null` indicam explicitamente ausência de oferta.

---

## Fases de Execução

### Fase 1: Ajustar tipo Checkout para suportar valores nulos

**Arquivo:** `src/modules/products/types/product.types.ts`

Atualizar a interface `Checkout` para que `offer` e `price` possam ser `null`:

```typescript
export interface Checkout {
  id: string;
  name: string;
  price: number | null;        // null = sem oferta associada
  visits: number;
  offer: string | null;        // null = sem oferta associada
  isDefault: boolean;
  linkId: string;
  product_id: string;
  status: string;
  created_at: string;
}
```

### Fase 2: Ajustar o mapper para retornar null quando não há oferta

**Arquivo:** `src/modules/products/context/helpers/productDataMapper.ts`

Modificar `mapCheckoutRecords` para retornar valores semânticos claros:

```typescript
export function mapCheckoutRecords(records: CheckoutRecord[]): Checkout[] {
  return records.map((record) => {
    const checkoutLink = record.checkout_links?.[0];
    const paymentLink = checkoutLink?.payment_links;
    const offer = paymentLink?.offers;
    
    // RISE V3: Sem fallback para product - null indica "sem oferta"
    const hasOffer = !!offer;
    
    return {
      id: record.id,
      name: record.name,
      price: hasOffer ? offer.price : null,
      visits: record.visits_count ?? 0,
      offer: hasOffer ? offer.name : null,
      isDefault: record.is_default,
      linkId: checkoutLink?.link_id ?? "",
      product_id: record.product_id,
      status: record.status ?? "active",
      created_at: record.created_at,
    };
  });
}
```

### Fase 3: Atualizar a CheckoutTable para exibir placeholders visuais

**Arquivo:** `src/components/products/CheckoutTable.tsx`

Atualizar a interface para refletir tipos nulláveis:

```typescript
export interface Checkout {
  id: string;
  name: string;
  price: number | null;       // null = sem oferta
  visits: number;
  offer: string | null;       // null = sem oferta
  isDefault: boolean;
  linkId: string;
}
```

Atualizar o JSX para tratar valores nulos:

```typescript
// Coluna Preço
<TableCell className="text-primary font-semibold">
  {checkout.price !== null ? (
    formatBRL(checkout.price)
  ) : (
    <span className="text-muted-foreground italic">—</span>
  )}
</TableCell>

// Coluna Oferta
<TableCell className="text-muted-foreground max-w-[200px]">
  {checkout.offer !== null ? (
    // Truncação com tooltip para nomes longos
    checkout.offer.length > 25 ? (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="block truncate cursor-help">
            {checkout.offer}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[300px] break-words">
          {checkout.offer}
        </TooltipContent>
      </Tooltip>
    ) : (
      checkout.offer
    )
  ) : (
    <span className="text-yellow-500 italic text-sm flex items-center gap-1">
      <AlertCircle className="w-3 h-3" />
      Selecione uma oferta
    </span>
  )}
</TableCell>
```

### Fase 4: Atualizar CheckoutConfigDialog para não pré-selecionar oferta

**Arquivo:** `src/components/products/CheckoutConfigDialog.tsx`

Atualizar a interface importada para refletir tipos nulláveis:

```typescript
import type { Checkout } from "./CheckoutTable";
```

Modificar o useEffect para não forçar seleção quando `currentOfferId` está vazio:

```typescript
useEffect(() => {
  if (checkout) {
    setName(checkout.name);
    setIsDefault(checkout.isDefault);
    // Se não há oferta associada, manter vazio
    setSelectedOfferId(currentOfferId || "");
  } else {
    setName("");
    setIsDefault(false);
    // Para novos checkouts: pré-selecionar oferta padrão
    const defaultOffer = availableOffers.find(offer => offer.is_default);
    setSelectedOfferId(defaultOffer ? defaultOffer.id : (availableOffers[0]?.id || ""));
  }
}, [checkout, open, currentOfferId, availableOffers]);
```

Adicionar indicador visual quando nenhuma oferta está selecionada:

```typescript
{availableOffers.length > 0 && !selectedOfferId && (
  <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg mb-2 flex items-start gap-2">
    <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
    <p className="text-sm text-yellow-500">
      Este checkout não tem oferta associada. Selecione uma oferta para definir o preço.
    </p>
  </div>
)}
```

### Fase 5: Atualizar CheckoutRecord no useProductLoader

**Arquivo:** `src/modules/products/context/hooks/useProductLoader.ts`

Não requer mudanças - os tipos já suportam `checkout_links?: Array<...>` (opcional).

---

## Arquitetura Visual Final

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                     TABELA DE CHECKOUTS                                 │
├─────────────────┬───────────────┬─────────┬────────────────────────────┤
│ Nome            │ Preço         │ Visitas │ Oferta                     │
├─────────────────┼───────────────┼─────────┼────────────────────────────┤
│ Checkout (Cópia)│ —             │ 0       │ ⚠ Selecione uma oferta    │
│ Checkout Padrão │ R$ 14,90      │ 0       │ OFFER                      │
└─────────────────┴───────────────┴─────────┴────────────────────────────┘
```

---

## Arquivos a Modificar (4 arquivos)

| Arquivo | Alteração |
|---------|-----------|
| `src/modules/products/types/product.types.ts` | Tornar `offer` e `price` nulláveis |
| `src/modules/products/context/helpers/productDataMapper.ts` | Retornar `null` ao invés de fallback para product |
| `src/components/products/CheckoutTable.tsx` | Exibir placeholder visual quando `null` |
| `src/components/products/CheckoutConfigDialog.tsx` | Não pré-selecionar oferta; exibir warning |

---

## Validação Pós-Implementação

| Verificação | Resultado Esperado |
|-------------|-------------------|
| Checkout duplicado na tabela | Mostra "—" em Preço e "⚠ Selecione uma oferta" |
| Abrir dialog do checkout duplicado | Nenhuma oferta selecionada + warning amarelo |
| Checkout original na tabela | Mostra preço e nome da oferta normalmente |
| Abrir dialog do checkout original | Oferta correta pré-selecionada |
| TypeScript build | Zero erros |

---

## Conformidade RISE V3

| Critério | Status |
|----------|--------|
| Root Cause Only | ✅ Corrige no mapper (SSOT) |
| Zero Dívida Técnica | ✅ Tipagem clara com null |
| Arquitetura Correta | ✅ SSOT no mapper, UI apenas renderiza |
| Escalabilidade | ✅ Qualquer componente interpreta null |
| Segurança | ✅ Sem impacto |
| < 300 linhas | ✅ Todos os arquivos permanecem compactos |

**NOTA FINAL: 10.0/10** - Implementação semanticamente correta seguindo RISE Protocol V3.
