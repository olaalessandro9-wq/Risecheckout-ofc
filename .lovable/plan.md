
# Plano: Atingir 70% de Coverage Global

## Análise de Soluções (RISE V3 Seção 4.4)

### Solucao A: Adicionar testes superficiais em muitos arquivos
- Manutenibilidade: 4/10 (testes rasos nao capturam bugs reais)
- Zero DT: 3/10 (cobertura falsa - linhas cobertas sem valor)
- Arquitetura: 3/10 (nao segue Testing Pyramid)
- Escalabilidade: 3/10 (testes frageis quebram facilmente)
- Seguranca: 4/10 (falsa sensacao de seguranca)
- **NOTA FINAL: 3.4/10**
- Tempo estimado: 3 dias

### Solucao B: Testes profundos em modulos criticos com alta ciclomatica
- Manutenibilidade: 10/10 (testa logica real e edge cases)
- Zero DT: 10/10 (cada teste tem valor real)
- Arquitetura: 10/10 (Testing Pyramid - 70% Unit focado)
- Escalabilidade: 10/10 (testes robustos sobrevivem refatoracoes)
- Seguranca: 10/10 (cobertura real de codigo critico)
- **NOTA FINAL: 10.0/10**
- Tempo estimado: 5-7 dias

### DECISAO: Solucao B (Nota 10.0/10)
Solucao A viola RISE V3 - "cobertura falsa" e divida tecnica disfarçada.

---

## Diagnostico Atual

### Arquivos de Teste Existentes (106 arquivos)

| Categoria | Arquivos de Teste | Status |
|-----------|-------------------|--------|
| **lib/__tests__/** | 9 arquivos | Coberto |
| **lib/api/** | 4 testes inline | Coberto |
| **lib/token-manager/__tests__/** | 6 arquivos | Coberto |
| **lib/order-status/__tests__/** | 1 arquivo | Coberto |
| **lib/date-range/** | 1 teste inline | Coberto |
| **lib/payment-gateways/** | 3 testes inline | Coberto |
| **lib/timezone/** | 1 teste inline | Coberto |
| **lib/products/__tests__/** | 2 arquivos | Coberto |
| **lib/storage/__tests__/** | 2 arquivos | Coberto |
| **lib/rpc/__tests__/** | 1 arquivo | Coberto |
| **lib/checkout/** | 2 testes inline | Coberto |
| **lib/session-commander/** | 1 teste inline | Coberto |
| **hooks/__tests__/** | 8 arquivos | Parcial |
| **hooks/checkout/** | 1 teste | Parcial |
| **hooks/*.test.ts** | 5 arquivos inline | Parcial |
| **providers/__tests__/** | 3 arquivos | Coberto |
| **contexts/__tests__/** | 2 arquivos | Coberto |
| **components/ui/__tests__/** | 17 arquivos | Coberto |
| **modules/admin/machines/__tests__/** | 1 arquivo | Coberto |
| **modules/products/machines/__tests__/** | 2 arquivos | Coberto |
| **modules/checkout-public/machines/__tests__/** | 2 arquivos | Coberto |
| **modules/pixels/machines/__tests__/** | 1 arquivo | Coberto |
| **modules/utmify/machines/__tests__/** | 1 arquivo | Coberto |
| **modules/webhooks/machines/__tests__/** | 1 arquivo | Coberto |
| **modules/affiliation/machines/__tests__/** | 1 arquivo | Coberto |
| **modules/dashboard/machines/__tests__/** | 1 arquivo | Coberto |
| **modules/financeiro/machines/__tests__/** | 1 arquivo | Coberto |

### Modulos SEM Testes (Gaps Criticos)

| Modulo/Arquivo | Linhas Estimadas | Complexidade | Prioridade |
|----------------|------------------|--------------|------------|
| **src/modules/navigation/machines/** | 200+ | Alta | CRITICA |
| **src/modules/members-area-builder/machines/** | 400+ | Alta | CRITICA |
| **src/lib/session-commander/coordinator.ts** | 280 | Alta | CRITICA |
| **src/lib/session-commander/session-monitor.ts** | 150+ | Media | ALTA |
| **src/lib/session-commander/feedback.ts** | 80+ | Baixa | MEDIA |
| **src/hooks/useAuthRole.ts** | 100+ | Media | ALTA |
| **src/hooks/useAffiliations.ts** | 150+ | Media | ALTA |
| **src/hooks/useBuyerOrders.ts** | 120+ | Media | ALTA |
| **src/hooks/useCheckoutEditor.ts** | 180+ | Alta | ALTA |
| **src/hooks/useMarketplaceProducts.ts** | 100+ | Media | MEDIA |
| **src/hooks/usePaymentAccountCheck.ts** | 80+ | Media | MEDIA |
| **src/hooks/useVendorPixels.ts** | 100+ | Media | MEDIA |
| **src/hooks/useProductPixels.ts** | 80+ | Media | MEDIA |
| **src/services/marketplace.ts** | 150+ | Media | ALTA |
| **src/services/offers.ts** | 100+ | Media | ALTA |
| **src/lib/products/ensureSingleCheckout.ts** | 60+ | Media | MEDIA |

---

## Plano de Implementacao por Fases

### Fase 9: State Machines Faltantes (~80 testes)

**Objetivo:** Completar cobertura de 100% das State Machines XState

#### 9.1 Navigation Machine
```text
src/modules/navigation/machines/__tests__/
├── navigationMachine.test.ts         (~25 testes)
├── navigationMachine.guards.test.ts  (~15 testes)
└── navigationMachine.actions.test.ts (~10 testes)
```

**Testes planejados:**
- Estados: idle, navigating, blocked, confirmed
- Transicoes: NAVIGATE, CONFIRM_NAVIGATION, CANCEL_NAVIGATION
- Guards: hasUnsavedChanges, isBlocking
- Actions: setTargetPath, clearNavigation

#### 9.2 Builder Machine
```text
src/modules/members-area-builder/machines/__tests__/
├── builderMachine.test.ts            (~30 testes)
├── builderMachine.guards.test.ts     (~10 testes)
└── builderMachine.actions.test.ts    (~15 testes)
```

**Testes planejados:**
- Estados: idle, loading, ready, saving, error
- Transicoes: LOAD, ADD_SECTION, UPDATE_SECTION, DELETE_SECTION, SAVE
- Guards: canSave, hasChanges
- Actions: todas as 12 actions exportadas

---

### Fase 10: Session Commander (~50 testes)

**Objetivo:** Testar sistema critico de refresh de sessao

```text
src/lib/session-commander/__tests__/
├── coordinator.test.ts        (~25 testes)
├── session-monitor.test.ts    (~15 testes)
└── feedback.test.ts           (~10 testes)
```

**Testes planejados - coordinator.ts:**
- Deduplication: multiplos callers recebem mesma Promise
- Retry logic: exponential backoff com jitter
- Status handlers: success, wait, unauthorized, error
- Timeout handling: AbortController
- Singleton behavior

**Testes planejados - session-monitor.ts:**
- Event listeners: visibilitychange, focus, online
- Threshold detection: token near expiry
- Coordinator integration

**Testes planejados - feedback.ts:**
- Toast functions: showReconnecting, showReconnected, etc.
- Toast dismissal

---

### Fase 11: Hooks Restantes (~60 testes)

**Objetivo:** Completar cobertura de hooks de dados

#### 11.1 Hooks de Auth/Role
```text
src/hooks/__tests__/
├── useAuthRole.test.ts           (~12 testes)
└── useContextSwitcher.test.ts    (~8 testes)
```

#### 11.2 Hooks de Afiliacao
```text
src/hooks/__tests__/
├── useAffiliations.test.ts       (~10 testes)
├── useAffiliationDetails.test.ts (~8 testes)
├── useAffiliationProduct.test.ts (~6 testes)
└── useAffiliateRequest.test.ts   (~6 testes)
```

#### 11.3 Hooks de Checkout/Products
```text
src/hooks/__tests__/
├── useCheckoutEditor.test.ts     (~12 testes)
├── useBuyerOrders.test.ts        (~8 testes)
├── useProductPixels.test.ts      (~6 testes)
└── useVendorPixels.test.ts       (~6 testes)
```

---

### Fase 12: Services Layer (~30 testes)

**Objetivo:** Testar camada de servicos

```text
src/services/__tests__/
├── marketplace.test.ts (~15 testes)
└── offers.test.ts      (~15 testes)
```

**Testes planejados:**
- Funcoes de fetch com mocks de API
- Transformacao de dados
- Error handling

---

### Fase 13: Lib Faltante (~25 testes)

**Objetivo:** Completar cobertura da pasta lib

```text
src/lib/products/__tests__/
└── ensureSingleCheckout.test.ts (~10 testes)

src/lib/links/__tests__/
└── generatePaymentLink.test.ts  (~8 testes)

src/lib/orderBump/__tests__/
└── orderBumpHelpers.test.ts     (~7 testes)
```

---

## Estimativa de Impacto no Coverage

| Fase | Testes | Linhas Cobertas | Coverage Estimado |
|------|--------|-----------------|-------------------|
| Atual | 765 | ~3500 | 60% |
| Fase 9 (Machines) | +80 | +500 | 63% |
| Fase 10 (Session) | +50 | +400 | 66% |
| Fase 11 (Hooks) | +60 | +500 | 69% |
| Fase 12 (Services) | +30 | +250 | 70% |
| Fase 13 (Lib) | +25 | +150 | 71% |
| **TOTAL** | **1010** | **~5300** | **71%** |

---

## Arvore de Arquivos Planejada

```text
src/
├── modules/
│   ├── navigation/machines/__tests__/
│   │   ├── navigationMachine.test.ts          (NOVO)
│   │   ├── navigationMachine.guards.test.ts   (NOVO)
│   │   └── navigationMachine.actions.test.ts  (NOVO)
│   └── members-area-builder/machines/__tests__/
│       ├── builderMachine.test.ts             (NOVO)
│       ├── builderMachine.guards.test.ts      (NOVO)
│       └── builderMachine.actions.test.ts     (NOVO)
├── lib/
│   ├── session-commander/__tests__/
│   │   ├── coordinator.test.ts                (NOVO)
│   │   ├── session-monitor.test.ts            (NOVO)
│   │   └── feedback.test.ts                   (NOVO)
│   ├── products/__tests__/
│   │   └── ensureSingleCheckout.test.ts       (NOVO)
│   ├── links/__tests__/
│   │   └── generatePaymentLink.test.ts        (NOVO)
│   └── orderBump/__tests__/
│       └── orderBumpHelpers.test.ts           (NOVO)
├── hooks/__tests__/
│   ├── useAuthRole.test.ts                    (NOVO)
│   ├── useContextSwitcher.test.ts             (NOVO)
│   ├── useAffiliations.test.ts                (NOVO)
│   ├── useAffiliationDetails.test.ts          (NOVO)
│   ├── useAffiliationProduct.test.ts          (NOVO)
│   ├── useAffiliateRequest.test.ts            (NOVO)
│   ├── useCheckoutEditor.test.ts              (NOVO)
│   ├── useBuyerOrders.test.ts                 (NOVO)
│   ├── useProductPixels.test.ts               (NOVO)
│   └── useVendorPixels.test.ts                (NOVO)
└── services/__tests__/
    ├── marketplace.test.ts                    (NOVO)
    └── offers.test.ts                         (NOVO)
```

---

## Validacao RISE V3

| Criterio | Status |
|----------|--------|
| Limite 300 linhas por arquivo | Cada teste < 200 linhas |
| Zero `any` types | Tipagem completa |
| Zero `@ts-expect-error` | Nenhum |
| Testing Pyramid | 70% Unit, 20% Integration, 10% E2E |
| Single Responsibility | 1 arquivo = 1 modulo testado |
| Manutenibilidade Infinita | Testes documentados e claros |

---

## Cronograma de Execucao

| Fase | Duracao | Dependencias |
|------|---------|--------------|
| Fase 9: State Machines | 2 dias | Nenhuma |
| Fase 10: Session Commander | 1 dia | Nenhuma |
| Fase 11: Hooks | 2 dias | Nenhuma |
| Fase 12: Services | 1 dia | Nenhuma |
| Fase 13: Lib Faltante | 1 dia | Nenhuma |
| **TOTAL** | **7 dias** | - |

---

## Metricas de Sucesso

| Metrica | Atual | Meta |
|---------|-------|------|
| Testes Totais | 765 | 1010+ |
| Coverage Statements | 60% | 70%+ |
| Coverage Branches | 50% | 55%+ |
| Coverage Functions | 60% | 70%+ |
| Coverage Lines | 60% | 70%+ |
| Testes Falhando | 0 | 0 |
| Warnings de Mock | 0 | 0 |

---

## Entregaveis

1. **Fase 9:** 6 arquivos de teste para State Machines faltantes
2. **Fase 10:** 3 arquivos de teste para Session Commander
3. **Fase 11:** 10 arquivos de teste para Hooks
4. **Fase 12:** 2 arquivos de teste para Services
5. **Fase 13:** 3 arquivos de teste para Lib faltante
6. **Documentacao:** Atualizacao do TESTING_REPORT.md com todas as fases

**Total: 24 novos arquivos de teste, ~245 novos testes**
