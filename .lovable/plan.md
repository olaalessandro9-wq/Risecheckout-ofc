
# Plano de Testes Automatizados - RiseCheckout

## Status Geral

| Fase | Status | Testes | Detalhes |
|------|--------|--------|----------|
| 1 | ✅ COMPLETA | N/A | Infraestrutura configurada |
| 2 | ✅ COMPLETA | 125/125 | Backend _shared tests |
| 3 | 🔲 PENDENTE | 0 | Frontend lib tests |
| 4 | 🔲 PENDENTE | 0 | Frontend hooks tests |
| 5 | 🔲 PENDENTE | 0 | Edge Function integration |
| 6 | 🔲 PENDENTE | 0 | E2E Playwright |
| 7 | 🔲 PENDENTE | 0 | CI/CD Pipeline |

---

## Fase 2 - Resultados

### Arquivos Criados

| Arquivo | Testes | Status |
|---------|--------|--------|
| `fee-calculator.test.ts` | 31 | ✅ Passando |
| `idempotency.test.ts` | 25 | ✅ Passando |
| `coupon-validation.test.ts` | 37 | ✅ Passando |
| `grant-members-access.test.ts` | 32 | ✅ Passando |

### Bugs Descobertos

1. **`validateCouponPayload`**: Não trata `null`/`undefined` - lança exceção em vez de retornar `{ valid: false }`. Documentado como BUG nos testes.

---

## Próxima Fase: 3 - Testes Unitários Frontend

### Arquivos a Criar

1. `src/lib/money.test.ts` - JÁ EXISTE (50+ testes)
2. `src/lib/logger.test.ts` - PENDENTE
3. `src/lib/validation.test.ts` - PENDENTE

### Prioridade

- money.ts ✅ (já criado na Fase 1)
- logger.ts
- validation.ts (se existir)

---

## Métricas Atuais

| Métrica | Fase 1 | Fase 2 | Meta Final |
|---------|--------|--------|------------|
| Testes Backend | 0 | 125 | 150+ |
| Testes Frontend | 0 | 50+ | 150+ |
| Cobertura Geral | 0% | ~10% | 70%+ |
