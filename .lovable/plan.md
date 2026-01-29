
# Plano Completo: Fase 2 de Testes Unitários

## Diagnóstico Atual

### Estado da Cobertura de Testes

| Métrica | Atual | Após Fase 2 |
|---------|-------|-------------|
| **Arquivos Testáveis** | ~168 | ~168 |
| **Arquivos com Testes** | 6 | ~45 |
| **Cobertura de Arquivos** | 3.5% | ~27% |
| **Total de Testes** | 311 | ~600+ |

### Arquivos Atualmente Testados (6)

1. `src/test/infrastructure.test.ts` - Setup/Mocks
2. `src/lib/logger.test.ts` - Logger utility
3. `src/lib/money.test.ts` - Formatação monetária
4. `src/lib/validation.test.ts` - Validadores
5. `src/hooks/useUnifiedAuth.test.ts` - Auth hook
6. `src/hooks/checkout/useFormManager.test.ts` - Form manager

---

## Estrutura de Fases

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                        FASE 2: TESTES UNITÁRIOS                              │
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  SUBFASE 2.1 │  │  SUBFASE 2.2 │  │  SUBFASE 2.3 │  │  SUBFASE 2.4 │    │
│  │   API Core   │→ │  Gateways    │→ │   Hooks      │→ │  Utilities   │    │
│  │   (Crítico)  │  │  (Crítico)   │  │  (Business)  │  │  (Support)   │    │
│  │   +7 arq.    │  │   +8 arq.    │  │   +15 arq.   │  │   +9 arq.    │    │
│  │   ~60 testes │  │   ~80 testes │  │   ~100 testes│  │   ~50 testes │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                                              │
│  Cobertura Progressiva:                                                     │
│  Atual: 3.5% → 2.1: 8% → 2.2: 13% → 2.3: 22% → 2.4: 27%                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## SUBFASE 2.1: API Core (Crítico)

**Prioridade:** MÁXIMA - Base de toda comunicação backend

**Arquivos a Testar (7):**

| Arquivo | Linhas | Testes Estimados |
|---------|--------|------------------|
| `src/lib/api/errors.ts` | 144 | 15 |
| `src/lib/api/client.ts` | 236 | 20 |
| `src/lib/api/public-client.ts` | ~50 | 8 |
| `src/lib/api/endpoints/analytics.ts` | ~40 | 6 |
| `src/lib/api/endpoints/products.ts` | ~60 | 8 |
| `src/lib/api/types.ts` | ~30 | 3 (type guards) |
| **TOTAL** | ~560 | **~60** |

**Casos de Teste Principais:**

```text
errors.ts:
├── createApiError() - factory correta
├── parseHttpError() - mapeamento status → code
├── parseNetworkError() - AbortError, fetch error
├── getDisplayMessage() - mensagens user-friendly
├── isAuthError() - detecta 401/403
└── isRetryableError() - detecta network/timeout

client.ts:
├── api.call() - request bem sucedido
├── api.call() - retry automático em 401
├── api.call() - timeout handling
├── api.call() - correlation ID gerado
├── api.publicCall() - sem auth header
└── api.call() - custom headers merged
```

**Cobertura após Subfase 2.1:** ~8% (13 arquivos)

---

## SUBFASE 2.2: Payment Gateways (Crítico)

**Prioridade:** ALTA - Processamento de pagamentos

**Arquivos a Testar (8):**

| Arquivo | Linhas | Testes Estimados |
|---------|--------|------------------|
| `src/lib/payment-gateways/installments.ts` | 74 | 12 |
| `src/lib/payment-gateways/gateway-factory.ts` | 36 | 8 |
| `src/lib/payment-gateways/helpers/mercadopago-sync.ts` | ~80 | 10 |
| `src/lib/payment-gateways/gateways/mercado-pago/index.ts` | ~100 | 12 |
| `src/lib/payment-gateways/gateways/stripe/index.ts` | ~80 | 10 |
| `src/components/checkout/payment/hooks/useGatewayManager.ts` | 137 | 15 |
| `src/lib/payment-gateways/index.ts` | ~30 | 5 |
| `src/config/payment-gateways.ts` | ~100 | 8 |
| **TOTAL** | ~637 | **~80** |

**Casos de Teste Principais:**

```text
installments.ts:
├── generateInstallments() - cálculo correto de juros
├── generateInstallments() - limite máximo de parcelas
├── generateInstallments() - valor mínimo de parcela
├── generateInstallments() - à vista sem juros
└── generateInstallments() - config customizada

gateway-factory.ts:
├── getGateway('mercadopago') - retorna instância
├── getGateway('stripe') - retorna instância
├── getGateway('invalid') - throws error
├── getAvailableGateways() - lista correta
└── isGatewaySupported() - validação

useGatewayManager.ts:
├── inicialização com config válida
├── estado isLoading durante carregamento
├── estado isReady após SDK carregado
├── reload() reinicia carregamento
└── error handling para gateway inválido
```

**Cobertura após Subfase 2.2:** ~13% (21 arquivos)

---

## SUBFASE 2.3: Business Hooks (Core do Negócio)

**Prioridade:** ALTA - Lógica de negócio do checkout

**Arquivos a Testar (15):**

| Arquivo | Linhas | Testes Estimados |
|---------|--------|------------------|
| `src/hooks/useCheckoutState.ts` | 129 | 12 |
| `src/hooks/checkout/useCheckoutSubmit.ts` | 46 | 8 |
| `src/hooks/checkout/useCouponValidation.ts` | 123 | 10 |
| `src/hooks/checkout/useVisitTracker.ts` | 78 | 6 |
| `src/hooks/checkout/useTrackingService.ts` | ~100 | 8 |
| `src/hooks/checkout/useCheckoutData.ts` | 209 | 12 |
| `src/hooks/checkout/helpers/fetchProductData.ts` | ~60 | 6 |
| `src/hooks/checkout/helpers/fetchOrderBumps.ts` | ~50 | 5 |
| `src/hooks/checkout/helpers/fetchAffiliateInfo.ts` | ~70 | 6 |
| `src/hooks/checkout/helpers/resolveCheckoutSlug.ts` | ~40 | 4 |
| `src/hooks/useAuthUser.ts` | ~80 | 6 |
| `src/hooks/useAuthActions.ts` | ~100 | 8 |
| `src/hooks/useFormValidation.ts` | ~60 | 6 |
| `src/hooks/usePermissions.ts` | ~50 | 5 |
| **TOTAL** | ~1195 | **~100** |

**Casos de Teste Principais:**

```text
useCheckoutState.ts:
├── selectedPayment - default 'pix'
├── setSelectedPayment - muda corretamente
├── toggleBump - adiciona bump
├── toggleBump - remove bump existente
├── totalPrice - calcula produto + bumps
└── bumpsTotal - soma apenas selecionados

useCouponValidation.ts:
├── validateCoupon() - cupom válido
├── validateCoupon() - cupom inválido
├── validateCoupon() - sem código
├── validateCoupon() - sem productId
├── removeCoupon() - limpa estado
└── isValidating - loading state

useCheckoutSubmit.ts:
├── handleCheckoutClick - PIX submits form
├── handleCheckoutClick - Cartão chama cardSubmitFn
├── handleCardSubmitReady - registra callback
└── formRef - referência correta
```

**Cobertura após Subfase 2.3:** ~22% (36 arquivos)

---

## SUBFASE 2.4: Utilities & Support (Suporte)

**Prioridade:** MÉDIA - Funções utilitárias

**Arquivos a Testar (9):**

| Arquivo | Linhas | Testes Estimados |
|---------|--------|------------------|
| `src/lib/utils/generateSlug.ts` | 25 | 5 |
| `src/lib/utils/uniqueName.ts` | ~30 | 4 |
| `src/lib/utils/uniqueCheckoutName.ts` | ~30 | 4 |
| `src/lib/utils/normalizeDataUrl.ts` | ~40 | 5 |
| `src/lib/checkout/normalizeDesign.ts` | ~80 | 8 |
| `src/lib/checkout/themePresets.ts` | ~100 | 6 |
| `src/lib/session-commander/retry-strategy.ts` | 107 | 10 |
| `src/lib/date-range/service.ts` | ~60 | 6 |
| `src/lib/timezone/service.ts` | ~50 | 5 |
| **TOTAL** | ~522 | **~50** |

**Casos de Teste Principais:**

```text
generateSlug.ts:
├── formato correto (7 chars + _ + 6 dígitos)
├── caracteres válidos (a-z, 0-9)
├── unicidade entre chamadas
└── segunda parte sempre 6 dígitos

retry-strategy.ts:
├── getExponentialDelay() - backoff correto
├── getExponentialDelay() - jitter aplicado
├── getExponentialDelay() - cap máximo
├── sleep() - delay correto
├── generateTabId() - formato válido
└── isRetryableFailure() - detecção correta

normalizeDesign.ts:
├── normaliza checkout sem design
├── preserva design existente
├── aplica defaults para campos faltantes
└── merge correto de estilos
```

**Cobertura após Subfase 2.4:** ~27% (45 arquivos)

---

## Cronograma Estimado

| Subfase | Arquivos | Testes | Tempo Estimado | Cobertura Acumulada |
|---------|----------|--------|----------------|---------------------|
| **2.1: API Core** | 7 | ~60 | 1-2 dias | 8% |
| **2.2: Gateways** | 8 | ~80 | 2-3 dias | 13% |
| **2.3: Hooks** | 15 | ~100 | 3-4 dias | 22% |
| **2.4: Utilities** | 9 | ~50 | 1-2 dias | 27% |
| **TOTAL FASE 2** | **39** | **~290** | **7-11 dias** | **27%** |

---

## Resumo de Cobertura

### Antes da Fase 2

```text
┌────────────────────────────────────────────────┐
│  Arquivos Testados: 6/168 (3.5%)               │
│  ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│                                                 │
│  Testes: 311                                   │
└────────────────────────────────────────────────┘
```

### Após a Fase 2

```text
┌────────────────────────────────────────────────┐
│  Arquivos Testados: 45/168 (27%)               │
│  ██████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│                                                 │
│  Testes: ~600                                  │
└────────────────────────────────────────────────┘
```

### Projeção de Fases Futuras

| Fase | Foco | Cobertura Esperada |
|------|------|-------------------|
| **Fase 2** (atual) | API, Gateways, Hooks, Utils | 27% |
| **Fase 3** | Token Manager, Session Commander | 40% |
| **Fase 4** | Modules (dashboard, products, affiliation) | 55% |
| **Fase 5** | Components (forms, checkout, UI) | 70% |

---

## Ordem de Execução Recomendada

```text
┌─────────────────────────────────────────────────────────────┐
│  ORDEM DE IMPLEMENTAÇÃO                                      │
│                                                              │
│  1. src/lib/api/errors.test.ts          ← Fundação          │
│  2. src/lib/api/client.test.ts          ← Comunicação       │
│  3. src/lib/payment-gateways/installments.test.ts           │
│  4. src/lib/payment-gateways/gateway-factory.test.ts        │
│  5. src/hooks/useCheckoutState.test.ts  ← Estado central    │
│  6. src/hooks/checkout/useCheckoutSubmit.test.ts            │
│  7. src/hooks/checkout/useCouponValidation.test.ts          │
│  8. src/lib/utils/generateSlug.test.ts                      │
│  9. src/lib/session-commander/retry-strategy.test.ts        │
│  10. [...demais arquivos por subfase]                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Técnicas de Teste a Utilizar

### Mocking Strategy

| Dependência | Técnica de Mock |
|-------------|-----------------|
| `fetch` | MSW (já configurado) |
| `localStorage/sessionStorage` | Vitest mock |
| `react-router-dom` | Mock de `useParams` |
| `toast` (sonner) | `vi.mock('sonner')` |
| `api.call()` | MSW handlers |

### Padrões de Teste

```typescript
// Padrão para hooks
describe('useCheckoutState', () => {
  it('should initialize with default payment method', () => {
    const { result } = renderHook(() => useCheckoutState());
    expect(result.current.selectedPayment).toBe('pix');
  });
});

// Padrão para funções puras
describe('generateInstallments', () => {
  it('should calculate correct interest', () => {
    const installments = generateInstallments(10000);
    expect(installments[1].hasInterest).toBe(true);
  });
});
```

---

## Métricas de Qualidade (Quality Gates)

| Métrica | Threshold Atual | Meta Fase 2 |
|---------|-----------------|-------------|
| **Statements** | 60% | 60% (mantido) |
| **Branches** | 50% | 50% (mantido) |
| **Functions** | 60% | 60% (mantido) |
| **Lines** | 60% | 60% (mantido) |

Os thresholds serão mantidos, mas a cobertura real aumentará significativamente nos módulos testados.

---

## Decisão Técnica (RISE V3)

### Análise de Soluções

**Solução A: Testar apenas módulos críticos (API + Gateways)**
- Manutenibilidade: 7/10
- Zero DT: 7/10
- Arquitetura: 6/10
- Escalabilidade: 6/10
- Segurança: 8/10
- **NOTA FINAL: 6.8/10**
- Tempo: 3-4 dias

**Solução B: Fase 2 Completa (4 subfases progressivas)**
- Manutenibilidade: 10/10
- Zero DT: 10/10
- Arquitetura: 10/10
- Escalabilidade: 10/10
- Segurança: 10/10
- **NOTA FINAL: 10.0/10**
- Tempo: 7-11 dias

### DECISÃO: Solução B (Nota 10.0)

A Solução A seria mais rápida mas deixaria hooks de negócio e utilities sem testes, criando pontos cegos críticos. A Solução B garante cobertura progressiva e sistemática, alinhada com o RISE Protocol V3.

---

## Resumo Executivo

| Aspecto | Valor |
|---------|-------|
| **Arquivos Novos de Teste** | ~39 |
| **Novos Testes** | ~290 |
| **Cobertura Final** | 27% (de 3.5%) |
| **Tempo Total** | 7-11 dias |
| **Subfases** | 4 |
| **Módulos Cobertos** | API, Gateways, Hooks, Utils |
