# RISE V3 COMPLIANCE - Plano de Execução

**Data de Início:** 31 de Janeiro de 2026  
**Status:** EM ANDAMENTO  
**Branch:** `main`
**Auditor:** Lovable AI (Agent 7)

---

## PROGRESSO ATUAL

### ✅ FASE 1: Infraestrutura de Factories Type-Safe (CONCLUÍDA)
**Data:** 31/01/2026  
**Status:** CONCLUÍDA ✅

Criadas 7 novas factories type-safe em `src/test/factories/`:

| Arquivo | Factories Exportadas | Status |
|---------|---------------------|--------|
| `xstate.ts` | `createMockUseMachine`, `createMockSnapshot`, `createMatchesFn` | ✅ |
| `productContext.ts` | `createMockProductContextValue`, `createMockProductFormContext`, `createMockGeneralFormData`, etc. | ✅ |
| `affiliationContext.ts` | `createMockAffiliationContextValue`, `createMockAffiliationDetails`, `createMockAffiliationSnapshot` | ✅ |
| `webhooksContext.ts` | `createMockWebhooksContextValue`, `createMockWebhook`, `createMockWebhooksSnapshot` | ✅ |
| `membersAreaContext.ts` | `createMockMembersAreaSnapshot`, `createMockMemberModule`, `createMockMemberContent` | ✅ |
| `checkoutPublicContext.ts` | `createMockCheckoutPublicContext`, `createMockCheckoutPublicSnapshot`, `createMockPixNavigationData` | ✅ |
| `pixelsContext.ts` | `createMockPixelsContextValue`, `createMockPixel`, `createMockPixelsSnapshot` | ✅ |

**Total de Factories:** 12 arquivos (5 existentes + 7 novos)

---

## PRÓXIMAS FASES

### ⏳ FASE 2: Eliminação de `as any` (~204 ocorrências)
**Status:** PENDENTE
**Prioridade:** CRÍTICA

Arquivos prioritários:
- [ ] `AffiliationContext.test.tsx` (14x)
- [ ] `useGeneralTab.test.ts` (~20x)
- [ ] `useAffiliatesTab.test.ts` (~15x)
- [ ] `ProductOffersSection.test.tsx` (1x)
- [ ] Outros (~154x)

### ⏳ FASE 3: Eliminação de `as never` (~561 ocorrências)
**Status:** PENDENTE
**Prioridade:** CRÍTICA

Módulos prioritários:
- [ ] Webhooks (2 arquivos, ~45x)
- [ ] Products (6 arquivos, ~200x)
- [ ] Members Area (2 arquivos, ~60x)
- [ ] Checkout Public (1 arquivo, ~20x)
- [ ] Builder (1 arquivo, ~25x)
- [ ] Affiliation (2 arquivos, ~50x)

### ⏳ FASE 4: Correção de Terminologia
**Status:** PENDENTE
**Prioridade:** ALTA

- [ ] Renomear `legacyProductHandlers` → `supabaseRestProductHandlers` em `handlers.ts`
- [ ] Atualizar comentários

### ⏳ FASE 5: Atualização de Documentação
**Status:** PENDENTE
**Prioridade:** ALTA

- [ ] `docs/STATUS_ATUAL.md` - Sincronizar com estado real
- [ ] `docs/TERMINOLOGY_COMPLIANCE_REPORT.md` - Adicionar correção de `handlers.ts`
- [ ] `docs/TESTING_SYSTEM.md` - Documentar novas factories

### ⏳ FASE 6: Validação Final
**Status:** PENDENTE
**Prioridade:** CRÍTICA

Verificações:
- [ ] Zero `as any` em arquivos de teste
- [ ] Zero `as never` em arquivos de teste
- [ ] Zero termos proibidos (legacy, workaround, etc.)
- [ ] Todos os testes passando
- [ ] Documentação sincronizada

---

## RESUMO DE VIOLAÇÕES (Estado Atual)

| Métrica | Quantidade | Status |
|---------|------------|--------|
| `as any` | ~204 | ⏳ PENDENTE |
| `as never` | ~561 | ⏳ PENDENTE |
| Terminologia proibida | 13 | ⏳ PENDENTE |
| Factories type-safe | 12 arquivos | ✅ CONCLUÍDO |

---

## CRONOGRAMA ATUALIZADO

```
FASE 1: ████████████████████ CONCLUÍDA ✅ (2-3h)
FASE 2: ░░░░░░░░░░░░░░░░░░░░ PENDENTE (4-6h)
FASE 3: ░░░░░░░░░░░░░░░░░░░░ PENDENTE (8-12h)
FASE 4: ░░░░░░░░░░░░░░░░░░░░ PENDENTE (30min)
FASE 5: ░░░░░░░░░░░░░░░░░░░░ PENDENTE (1h)
FASE 6: ░░░░░░░░░░░░░░░░░░░░ PENDENTE (1-2h)
```

**Total Restante:** ~14-21 horas

---

## ARQUIVOS CRÍTICOS COM VIOLAÇÕES

### Prioridade 1 (P1) - `as any`:
1. `src/modules/affiliation/context/__tests__/AffiliationContext.test.tsx` - 14x
2. `src/modules/products/tabs/general/__tests__/useGeneralTab.test.ts` - ~20x
3. `src/modules/products/tabs/affiliate/__tests__/useAffiliatesTab.test.ts` - ~15x

### Prioridade 1 (P1) - `as never`:
1. `src/modules/webhooks/components/__tests__/WebhooksList.test.tsx` - ~30x
2. `src/modules/products/tabs/__tests__/GeneralTab.test.tsx` - ~40x
3. `src/modules/products/components/__tests__/ProductHeader.test.tsx` - ~50x

### Terminologia:
1. `src/test/mocks/handlers.ts` - 13x termo "legacy"

---

## DECISÃO ARQUITETURAL (RISE V3 Seção 4)

### Solução Escolhida: B - Refatoração Total com Factory Infrastructure First

| Critério | Nota |
|----------|------|
| Manutenibilidade | 10/10 |
| Zero DT | 10/10 |
| Arquitetura | 10/10 |
| Escalabilidade | 10/10 |
| Segurança | 10/10 |
| **NOTA FINAL** | **10.0/10** |

**Justificativa:** Conforme a Seção 4.6 do RISE V3 ("A Regra do 1 Ano vs 5 Minutos"), criar a infraestrutura de factories PRIMEIRO permite que TODAS as correções subsequentes sejam type-safe desde o início.
