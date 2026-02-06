

# Auditoria Completa: Dual-Layout System do Checkout Builder

## Resultado da Auditoria

| Area | Status | Detalhes |
|------|--------|----------|
| **Arquitetura XState** | APROVADA | Machine + Actions + Guards + Actors - Modular, <300 linhas cada |
| **Edge Functions** | APROVADA | `checkout-editor` e `checkout-public-data` salvam/servem mobile components |
| **Documentacao EDGE_FUNCTIONS_REGISTRY** | APROVADA | Linha 92 ja documenta "Dual-Layout: mobile_top/bottom_components" |
| **Database Migration** | APROVADA | Colunas `mobile_top_components` e `mobile_bottom_components` criadas |
| **Checkout Publico** | APROVADA | Deteccao mobile + fallback para desktop implementados |
| **Tipos** | APROVADA | `CheckoutViewport` adicionado a `checkoutEditor.ts` |

---

## PROBLEMAS ENCONTRADOS (Codigo Morto / Legado)

### PROBLEMA 1: `src/hooks/useCheckoutEditor.ts` NAO FOI DELETADO (CRITICO)

Este arquivo e o hook **legado** baseado em `useState` que foi substituido pela state machine XState. Ele continua existindo no projeto com 258 linhas de codigo morto.

**Agravante**: Ele ainda e **importado** por 4 arquivos que usam seus tipos re-exportados:

| Arquivo que importa | O que importa | Status |
|---------------------|---------------|--------|
| `src/types/checkout.ts` (linha 254) | `CheckoutCustomization, ViewMode` | LEGADO - deveria importar de `@/types/checkoutEditor` |
| `src/contexts/CheckoutContext.tsx` (linha 13) | `CheckoutCustomization` | LEGADO - deveria importar de `@/types/checkoutEditor` |
| `src/components/checkout/CheckoutPreview.tsx` (linha 1) | `CheckoutCustomization, ViewMode` | LEGADO - deveria importar de `@/types/checkoutEditor` |
| `src/components/checkout/builder/CheckoutEditorMode.tsx` (linha 15) | `CheckoutCustomization, ViewMode` | LEGADO - deveria importar de `@/types/checkoutEditor` |

**Causa raiz**: O hook legado faz `export type { ViewMode, CheckoutComponent, CheckoutDesign, CheckoutCustomization }` na linha 27, fazendo outros arquivos importarem os tipos DELE em vez de `@/types/checkoutEditor.ts` (que e o SSOT correto para tipos).

### PROBLEMA 2: `src/pages/checkout-customizer/hooks/useCheckoutPersistence.ts` NAO FOI DELETADO (CRITICO)

O hook de persistencia legado (194 linhas) ainda existe. Ele foi absorvido pelos actors XState (`checkoutEditorMachine.actors.ts`). Ninguem mais o importa, mas o arquivo esta presente como codigo morto.

### PROBLEMA 3: `src/hooks/__tests__/useCheckoutEditor.test.ts` TESTE ORFAO (ALTO)

O teste unitario do hook legado ainda existe. Ele testa o `useCheckoutEditor` baseado em `useState` que ja foi substituido. Este teste nunca mais devera passar corretamente pois referencia o hook antigo.

### PROBLEMA 4: Violacao `console.error` em `checkoutEditorMachine.actors.ts` (MEDIO)

Na linha 210 do actors file:
```typescript
}).catch(console.error);
```

O lint script `lint-console.sh` do projeto proibe `console.*` fora de `_shared/logger.ts`. O hook legado `useCheckoutPersistence.ts` tem a mesma violacao na linha 168, mas como esse arquivo sera deletado, nao e relevante.

Porem o novo arquivo `checkoutEditorMachine.actors.ts` copia essa violacao. Deve usar `createLogger` em vez de `console.error`.

### PROBLEMA 5: `CheckoutPersistenceState` em `types.ts` e LEGADO (BAIXO)

O tipo `CheckoutPersistenceState` em `src/pages/checkout-customizer/types.ts` (linhas 38-45) era usado por `useCheckoutPersistence.ts`. Com a absorcao no machine, esse tipo nao e mais necessario. Porem nao causa dano por enquanto.

---

## Plano de Remediacao

### Fase 1: Eliminar Codigo Morto

1. **DELETAR** `src/hooks/useCheckoutEditor.ts` (258 linhas de codigo morto)
2. **DELETAR** `src/pages/checkout-customizer/hooks/useCheckoutPersistence.ts` (194 linhas de codigo morto)
3. **DELETAR** `src/hooks/__tests__/useCheckoutEditor.test.ts` (teste orfao do hook legado)

### Fase 2: Corrigir Imports Legados

4. **EDITAR** `src/types/checkout.ts` - Linha 254:
   - DE: `export type { CheckoutCustomization, ViewMode } from "@/hooks/useCheckoutEditor";`
   - PARA: `export type { CheckoutCustomization, ViewMode } from "@/types/checkoutEditor";`

5. **EDITAR** `src/contexts/CheckoutContext.tsx` - Linha 13:
   - DE: `import type { CheckoutCustomization } from '@/hooks/useCheckoutEditor';`
   - PARA: `import type { CheckoutCustomization } from '@/types/checkoutEditor';`

6. **EDITAR** `src/components/checkout/CheckoutPreview.tsx` - Linha 1:
   - DE: `import { CheckoutCustomization, ViewMode } from "@/hooks/useCheckoutEditor";`
   - PARA: `import type { CheckoutCustomization, ViewMode } from "@/types/checkoutEditor";`

7. **EDITAR** `src/components/checkout/builder/CheckoutEditorMode.tsx` - Linha 15:
   - DE: `import { CheckoutCustomization, ViewMode } from "@/hooks/useCheckoutEditor";`
   - PARA: `import type { CheckoutCustomization, ViewMode } from "@/types/checkoutEditor";`

### Fase 3: Corrigir Violacao de Logging

8. **EDITAR** `src/pages/checkout-customizer/machines/checkoutEditorMachine.actors.ts` - Linha 210:
   - DE: `}).catch(console.error);`
   - PARA: `}).catch((err) => log.error("Failed to cleanup old storage paths", err));`
   (O `log` ja esta importado e instanciado na linha 30 deste arquivo)

### Fase 4: Remover Tipo Orfao

9. **EDITAR** `src/pages/checkout-customizer/types.ts` - Remover `CheckoutPersistenceState` (linhas 38-45) pois era usado exclusivamente pelo hook legado que sera deletado.

---

## Resumo de Impacto

| Metrica | Antes | Depois |
|---------|-------|--------|
| Arquivos mortos | 3 | 0 |
| Imports legados | 4 | 0 |
| Violacoes console.* | 1 (novo codigo) | 0 |
| Tipos orfaos | 1 | 0 |
| Linhas de codigo morto eliminadas | ~500+ | 0 |

## Checkpoint de Qualidade RISE V3

| Pergunta | Resposta |
|----------|----------|
| Restara codigo morto apos remediacoes? | Zero |
| Restara import legado? | Zero |
| Todos os tipos vem do SSOT (`@/types/checkoutEditor`)? | Sim |
| Violacoes de logging corrigidas? | Sim |
| Documentacao EDGE_FUNCTIONS_REGISTRY atualizada? | Ja esta correta |
| O sistema compila sem os arquivos deletados? | Sim, nenhum arquivo ativo os importa |

