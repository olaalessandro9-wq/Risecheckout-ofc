
# Fase 3: Continuação - Etapas 2 e 3

## Resumo do Progresso

### Etapa 1 (Concluída)
- 11 arquivos de teste para XState Machines criados
- ~180 testes implementados
- Cobertura de arquivos: 10.5% → ~12%

### Status Atual
- **Cobertura:** ~12% (62 arquivos de teste)
- **Testes Totais:** ~1.100

---

## Etapa 2: Token Manager Completo

### Arquivos a Criar

| # | Arquivo | Funções a Testar | Testes Est. |
|---|---------|------------------|-------------|
| 1 | `src/lib/token-manager/__tests__/service.test.ts` | TokenService class, initialize, setAuthenticated, hasValidToken, subscribe, refresh | 25 |
| 2 | `src/lib/token-manager/__tests__/persistence.test.ts` | persistTokenState, restoreTokenState, clearPersistedState, error handling | 20 |
| 3 | `src/lib/token-manager/__tests__/heartbeat.test.ts` | HeartbeatManager, start/stop, triggerNow, suspension detection | 15 |
| 4 | `src/lib/token-manager/__tests__/cross-tab-lock.test.ts` | CrossTabLock, tryAcquire, release, isOtherTabRefreshing, waitForResult, BroadcastChannel | 20 |

**Subtotal Etapa 2:** 4 arquivos, ~80 testes

### Detalhes de Implementacao

**service.test.ts:**
- Testar construtor e estado inicial (idle)
- Testar lazy initialization (isInitialized)
- Testar setAuthenticated e transicao de estado
- Testar hasValidToken em diferentes estados
- Testar subscribe/unsubscribe pattern
- Testar clearTokens e limpeza de estado
- Mock de HeartbeatManager, CrossTabLock e SessionCommander

**persistence.test.ts:**
- Testar persistTokenState para diferentes estados
- Testar restoreTokenState com dados validos e invalidos
- Testar clearPersistedState
- Testar tratamento de erros de localStorage (QuotaExceeded, SecurityError)
- Mock de localStorage via vi.spyOn

**heartbeat.test.ts:**
- Testar start/stop do timer
- Testar callback imediato no start
- Testar intervalos regulares
- Testar deteccao de suspensao (gap > 2x intervalo)
- Testar triggerNow e getTimeSinceLastTick
- Usar vi.useFakeTimers

**cross-tab-lock.test.ts:**
- Testar tryAcquire quando nao existe lock
- Testar tryAcquire quando outro tab tem lock
- Testar expiracao de lock (TTL 30s)
- Testar release e notifySuccess/notifyFailure
- Testar isOtherTabRefreshing
- Testar waitForResult com timeout
- Mock de BroadcastChannel e localStorage

---

## Etapa 3: Lib Utilities

### Arquivos a Criar

| # | Arquivo | Funções a Testar | Testes Est. |
|---|---------|------------------|-------------|
| 5 | `src/lib/rpc/rpcProxy.test.ts` | invokeRpc, validateCouponRpc, getCheckoutBySlugRpc, etc. | 20 |
| 6 | `src/lib/storage/storageProxy.test.ts` | uploadViaEdge, removeViaEdge, listViaEdge, copyViaEdge, uploadImage | 18 |
| 7 | `src/lib/order-status/service.test.ts` | getDisplayLabel, getColorScheme, normalize, isPaid, isPending, isTerminal | 25 |
| 8 | `src/lib/security.test.ts` | sanitize, sanitizeHtml, sanitizeText, sanitizeUrl, sanitizeColor, sanitizeFormObject | 20 |
| 9 | `src/lib/utils.test.ts` | cn, parseJsonSafely | 12 |
| 10 | `src/lib/uploadUtils.test.ts` | getAllComponentsFromCustomization, hasPendingUploads, waitForUploadsToFinish | 12 |
| 11 | `src/lib/lazyWithRetry.test.ts` | lazyWithRetry, isChunkLoadError, retry logic, network error detection | 15 |
| 12 | `src/lib/utmify-helper.test.ts` | extractUTMParameters, formatDateForUTMify, convertToCents | 12 |
| 13 | `src/lib/products/deleteProduct.test.ts` | deleteProductCascade, validation, error handling | 10 |
| 14 | `src/lib/products/duplicateProduct.test.ts` | duplicateProductDeep, validation, error handling | 10 |
| 15 | `src/lib/checkouts/cloneCheckoutDeep.test.ts` | cloneCheckoutDeep, RPC integration | 8 |
| 16 | `src/lib/checkouts/duplicateCheckout.test.ts` | duplicateCheckout, slug sanitization | 8 |

**Subtotal Etapa 3:** 12 arquivos, ~170 testes

### Detalhes de Implementacao

**rpcProxy.test.ts:**
- Mock de api.call e api.publicCall
- Testar invokeRpc com diferentes authLevels
- Testar RPCs tipados: validateCouponRpc, getCheckoutBySlugRpc, etc.
- Testar tratamento de erros

**storageProxy.test.ts:**
- Mock de api.call
- Testar fileToBase64 (funcao interna)
- Testar uploadViaEdge com File e Blob
- Testar removeViaEdge com array vazio
- Testar listViaEdge e copyViaEdge
- Testar helper uploadImage

**order-status/service.test.ts:**
- Testar normalizacao de todos os status de gateway
- Testar mapeamento expired/cancelled/failed para pending
- Testar getDisplayLabel para cada status canonico
- Testar getColorScheme
- Testar isPaid, isPending, isTerminal
- Testar getStatusOptions

**security.test.ts:**
- Testar sanitize com XSS payloads
- Testar sanitizeText remove todas as tags
- Testar sanitizeUrl bloqueia javascript: e data:
- Testar sanitizeColor valida formato hex
- Testar sanitizeFormObject com diferentes tipos de campos

**utils.test.ts:**
- Testar cn com diferentes combinacoes de classes
- Testar parseJsonSafely com string, objeto, null, invalido

**uploadUtils.test.ts:**
- Testar getAllComponentsFromCustomization com diferentes estruturas
- Testar hasPendingUploads
- Testar waitForUploadsToFinish com timeout

**lazyWithRetry.test.ts:**
- Mock de React.lazy
- Testar retry em erro de rede
- Testar nao retry em erro de sintaxe
- Testar isChunkLoadError com diferentes mensagens

**utmify-helper.test.ts:**
- Testar extractUTMParameters com URL completa
- Testar formatDateForUTMify com Date e string
- Testar convertToCents com valores decimais

**deleteProduct.test.ts / duplicateProduct.test.ts:**
- Mock de api.call
- Testar validacao de productId
- Testar erro de Edge Function
- Testar sucesso

**cloneCheckoutDeep.test.ts / duplicateCheckout.test.ts:**
- Mock de rpcProxy
- Testar chamada correta de RPC
- Testar tratamento de erros

---

## Resumo Quantitativo

| Etapa | Arquivos | Testes | Prioridade |
|-------|----------|--------|------------|
| 2 - Token Manager | 4 | ~80 | CRITICA |
| 3 - Lib Utilities | 12 | ~170 | ALTA |
| **TOTAL** | **16** | **~250** | |

---

## Projecao de Cobertura Pos-Etapas 2-3

```text
ANTES (Atual):
Arquivos com Teste: ~62/478 (13%)
Testes Totais: ~1,100

APOS (Etapas 2-3):
Arquivos com Teste: ~78/478 (16.3%)
Testes Totais: ~1,350

INCREMENTO: +3.3% cobertura, +250 testes
```

---

## Infraestrutura de Mocks Necessaria

### Mocks Comuns (ja existentes)
- `@/lib/logger` - createLogger mock
- `@/lib/api` - api.call e api.publicCall mocks

### Novos Mocks
- BroadcastChannel - para cross-tab-lock
- localStorage - para persistence e cross-tab-lock
- FileReader - para storageProxy (fileToBase64)
- React.lazy - para lazyWithRetry

---

## Ordem de Implementacao

```text
1. Token Manager (Etapa 2)
   service.test.ts → persistence.test.ts → heartbeat.test.ts → cross-tab-lock.test.ts

2. Lib Core (Etapa 3 - Parte A)
   security.test.ts → utils.test.ts → order-status/service.test.ts

3. Lib RPC/Storage (Etapa 3 - Parte B)
   rpcProxy.test.ts → storageProxy.test.ts

4. Lib Helpers (Etapa 3 - Parte C)
   lazyWithRetry.test.ts → utmify-helper.test.ts → uploadUtils.test.ts

5. Products/Checkouts (Etapa 3 - Parte D)
   deleteProduct.test.ts → duplicateProduct.test.ts → cloneCheckoutDeep.test.ts → duplicateCheckout.test.ts
```

---

## Validacao RISE V3

| Criterio | Status |
|----------|--------|
| LEI SUPREMA (Secao 4) | Solucao C mantida (nota 10.0) |
| Zero Tipos `any` | Obrigatorio em todos os testes |
| Limite 300 Linhas | Modularizacao por arquivo |
| Testing Pyramid | 70% Unit (foco atual) |
| Documentacao JSDoc | Obrigatorio em cada arquivo |
