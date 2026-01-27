
# Plano: Correção do Status do Link de Pagamento na UI

## Diagnóstico

### Erro Identificado
- **Sintoma**: Após desativar um link, a UI continua mostrando "Ativo" mesmo após F5
- **Comportamento real**: O link está desativado no banco (a página pública mostra "Produto não disponível")
- **Problema**: Dessincronia entre banco de dados e exibição na UI

### Causa Raiz

No arquivo `src/modules/products/machines/productFormMachine.actors.ts`, linha 198:

```typescript
// CÓDIGO ATUAL (INCORRETO)
status: (pl.active !== false ? "active" : "inactive") as "active" | "inactive",
```

O mapeamento verifica a propriedade `pl.active`, mas o BFF (`fetchProductPaymentLinksWithRelations`) retorna a propriedade `pl.status`!

**Fluxo do Bug:**

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                          FLUXO DO BUG                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. Edge Function checkout-crud/toggle-link-status                          │
│     ├── Atualiza DB: payment_links.status = 'inactive'                      │
│     └── Retorna: { success: true, newStatus: 'inactive' }                   │
│                                                                              │
│  2. Frontend: LinksTab.tsx                                                   │
│     ├── Toast: "Link desativado com sucesso"                               │
│     └── Chama: refreshPaymentLinks() → send({ type: "REFRESH" })            │
│                                                                              │
│  3. State Machine: productFormMachine.ts                                     │
│     └── REFRESH → target: "loading" → invoke: loadProductActor              │
│                                                                              │
│  4. BFF: product-full-loader                                                 │
│     └── fetchProductPaymentLinksWithRelations()                             │
│         └── Retorna: { status: "inactive", ... }  ← Campo CORRETO          │
│                                                                              │
│  5. Actor: productFormMachine.actors.ts (linha 198)  ← BUG AQUI             │
│     └── Mapeia: pl.active !== false ? "active" : "inactive"                 │
│         └── pl.active = undefined                                           │
│         └── undefined !== false = true                                      │
│         └── Resultado: SEMPRE "active" ❌                                   │
│                                                                              │
│  6. UI: LinksTab.tsx                                                         │
│     └── Exibe: "Ativo" (incorreto)                                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Solução

### Correção no Mapeamento

Alterar a linha 198 de `productFormMachine.actors.ts` para usar `pl.status` ao invés de `pl.active`:

```typescript
// ANTES (INCORRETO)
status: (pl.active !== false ? "active" : "inactive") as "active" | "inactive",

// DEPOIS (CORRETO)
status: (pl.status === "active" ? "active" : "inactive") as "active" | "inactive",
```

### Também limpar a interface

Remover a propriedade `active` não utilizada da interface `PaymentLinks` (linha 89):

```typescript
// ANTES
paymentLinks: Array<{
  id: string;
  slug: string;
  url?: string;
  status?: string;
  active?: boolean;  // ← REMOVER (nunca foi usado, causa confusão)
  ...
}>;

// DEPOIS
paymentLinks: Array<{
  id: string;
  slug: string;
  url?: string;
  status?: string;  // Campo real do banco
  ...
}>;
```

---

## Alterações Necessárias

### Arquivo: `src/modules/products/machines/productFormMachine.actors.ts`

| Linha | Mudança |
|-------|---------|
| 89 | Remover `active?: boolean;` da interface |
| 198 | Trocar `pl.active !== false` por `pl.status === "active"` |

---

## Fluxo Corrigido

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                          FLUXO CORRIGIDO                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. DB: payment_links.status = 'inactive'                                   │
│                                                                              │
│  2. BFF retorna: { status: "inactive", ... }                                │
│                                                                              │
│  3. Actor mapeia: pl.status === "active" ? ... : "inactive"                 │
│     └── pl.status = "inactive"                                              │
│     └── "inactive" === "active" = false                                     │
│     └── Resultado: "inactive" ✅                                            │
│                                                                              │
│  4. UI exibe: Badge "Desativado" ✅                                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Conformidade RISE V3

| Critério | Status |
|----------|--------|
| Resolve causa raiz | Corrige mapeamento incorreto de propriedade |
| Zero workarounds | Usa campo correto do banco |
| Mantém arquivos < 300 linhas | Arquivo tem 296 linhas |
| Zero breaking changes | Apenas corrige lógica interna |
| Remove código morto | Remove propriedade `active` não utilizada |

---

## Testes Esperados

Após implementação:
1. Ir para aba Links de um produto
2. Clicar em ações → Desativar no menu de um link
3. Toast "Link desativado com sucesso"
4. UI deve mostrar badge "Desativado" imediatamente
5. Após F5, badge deve continuar mostrando "Desativado"
6. Clicar em Ativar deve voltar para "Ativo"
