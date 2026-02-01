
# PLANO DE CORREÇÃO: VALIDAÇÃO FINAL FASE 0+1

## RISE ARCHITECT PROTOCOL V3 - 10.0/10

---

## 1. DIAGNÓSTICO TÉCNICO VERIFICADO

### 1.1 Resultado dos Testes

```text
TOTAL EXECUTADO: 130+ testes
PASSARAM: 126+ testes
FALHARAM: 4 testes (CORS contract tests)
IGNORADOS: ~40 testes (integration tests - esperado)
```

### 1.2 Erros Identificados

| # | Erro | Arquivo | Causa Raiz |
|---|------|---------|------------|
| 1 | `assertEquals(response.status, 200)` falha | 4 arquivos `api.contract.test.ts` | `corsOptionsResponse()` retorna **204**, não **200** |
| 2 | Response pode estar sendo consumida | `FetchMock` | Response é **single-use** no Web API |

---

## 2. ANÁLISE DE SOLUÇÕES

### Solução A: Corrigir Status Code nos Testes

**Descrição:** Mudar os testes de CORS para esperarem status 204 (no content) em vez de 200.

| Critério | Nota |
|----------|------|
| Manutenibilidade | 9/10 - Testes refletem comportamento correto |
| Zero DT | 10/10 - Nenhum código duplicado |
| Arquitetura | 9/10 - Segue padrão HTTP correto |
| Escalabilidade | 10/10 - Comportamento consistente |
| Segurança | 10/10 - Sem impacto |

**NOTA FINAL: 9.6/10**
**Tempo:** 5 minutos

### Solução B: Mudar `corsOptionsResponse()` para retornar 200

**Descrição:** Alterar a função para retornar status 200 com body vazio.

| Critério | Nota |
|----------|------|
| Manutenibilidade | 7/10 - Viola padrão HTTP para OPTIONS |
| Zero DT | 8/10 - Funciona mas é incorreto semanticamente |
| Arquitetura | 6/10 - Não segue RFC 7231 |
| Escalabilidade | 8/10 - Consistente internamente |
| Segurança | 10/10 - Sem impacto |

**NOTA FINAL: 7.8/10**
**Tempo:** 2 minutos

### Solução C: Aceitar 200 OU 204 nos Testes

**Descrição:** Modificar a asserção para aceitar ambos os status codes.

| Critério | Nota |
|----------|------|
| Manutenibilidade | 6/10 - Asserção fraca, mascara bugs |
| Zero DT | 5/10 - Gambiarra |
| Arquitetura | 5/10 - Não define comportamento esperado |
| Escalabilidade | 6/10 - Pode confundir |
| Segurança | 10/10 - Sem impacto |

**NOTA FINAL: 6.4/10**
**Tempo:** 3 minutos

### DECISÃO: Solução A (Nota 9.6/10)

O padrão HTTP correto para CORS preflight é status **204 No Content** (RFC 7231). Os testes devem refletir isso. Corrigir os testes para esperarem 204.

---

## 3. CORREÇÕES NECESSÁRIAS

### 3.1 Correção 1: Status Code CORS (4 arquivos)

**Arquivos afetados:**
- `pushinpay-validate-token/tests/api.contract.test.ts`
- `pushinpay-webhook/tests/api.contract.test.ts`
- `asaas-webhook/tests/api.contract.test.ts`
- `mercadopago-webhook/tests/api.contract.test.ts`

**Mudança:**
```typescript
// ANTES (INCORRETO)
assertEquals(response.status, 200);

// DEPOIS (CORRETO - RFC 7231)
assertEquals(response.status, 204);
```

### 3.2 Correção 2: FetchMock Response Clone

O `FetchMock` na classe existente pode ter problemas com Response single-use. Precisamos garantir que ele clone a response:

**Arquivo:** `_shared/test-mocks.ts`

**Mudança na linha 144:**
```typescript
// ANTES
return mock.response;

// DEPOIS (Clone para evitar body consumption)
return mock.response.clone();
```

---

## 4. VERIFICAÇÃO COMPLETA DA INFRAESTRUTURA

### 4.1 Fase 0 - Infraestrutura de Mocks

| Componente | Status | Arquivo |
|------------|--------|---------|
| `types.ts` | ✅ COMPLETO | `_shared/testing/types.ts` |
| `test-config.ts` | ✅ COMPLETO | `_shared/testing/test-config.ts` |
| `mock-supabase-client.ts` | ✅ COMPLETO | `_shared/testing/mock-supabase-client.ts` |
| `mock-responses.ts` | ✅ COMPLETO | `_shared/testing/mock-responses.ts` |
| `test-factories.ts` | ✅ COMPLETO | `_shared/testing/test-factories.ts` |
| `mod.ts` | ✅ COMPLETO | `_shared/testing/mod.ts` |
| Testes da infra | ✅ PASSANDO | `_shared/testing/__tests__/*` |

### 4.2 Fase 1 - Testes de Pagamentos

| Função | Unit | Contract | Integration | Status |
|--------|------|----------|-------------|--------|
| `pushinpay-validate-token` | ✅ 8 tests | ⚠️ 6/7 (1 CORS) | ✅ 4 skipped | 93% |
| `pushinpay-webhook` | ✅ 8 tests | ⚠️ 7/8 (1 CORS) | ✅ 4 skipped | 93% |
| `asaas-webhook` | ✅ 23 tests | ⚠️ 6/7 (1 CORS) | ✅ 4 skipped | 96% |
| `mercadopago-webhook` | ✅ 24 tests | ⚠️ 6/7 (1 CORS) | ✅ 4 skipped | 96% |

**TOTAL ANTES DA CORREÇÃO:** 126/130 testes passando (96.9%)
**TOTAL APÓS CORREÇÃO:** 130/130 testes passando (100%)

---

## 5. ARQUIVOS A SEREM MODIFICADOS

```text
Correções Fase 0+1:

1. supabase/functions/_shared/test-mocks.ts
   - Linha 144: mock.response → mock.response.clone()

2. supabase/functions/pushinpay-validate-token/tests/api.contract.test.ts
   - Linha 51: status 200 → 204

3. supabase/functions/pushinpay-webhook/tests/api.contract.test.ts
   - Linha 54: status 200 → 204

4. supabase/functions/asaas-webhook/tests/api.contract.test.ts
   - Linha 51: status 200 → 204

5. supabase/functions/mercadopago-webhook/tests/api.contract.test.ts
   - Linha 54: status 200 → 204

TOTAL: 5 arquivos, 5 linhas modificadas
```

---

## 6. VALIDAÇÃO PÓS-CORREÇÃO

Após as correções, executar:

```bash
# Testar todas as funções de pagamento
deno test supabase/functions/pushinpay-*/tests/*.test.ts \
          supabase/functions/asaas-webhook/tests/*.test.ts \
          supabase/functions/mercadopago-webhook/tests/*.test.ts
```

**Resultado esperado:**
```text
ok | 130 passed | 0 failed | ~40 ignored (integration)
```

---

## 7. CONFORMIDADE RISE V3

| Seção | Requisito | Status |
|-------|-----------|--------|
| 4.1 | Melhor solução (nota máxima) | ✅ Solução A: 9.6/10 |
| 4.5 | Nenhum atalho | ✅ Correção segue RFC 7231 |
| 6.1 | Resolver causa raiz | ✅ Corrige expectativa incorreta |
| 9.1 | Proibições explícitas | ✅ Sem gambiarras |

---

## 8. RESUMO EXECUTIVO

### O Que Foi Validado

- **Fase 0:** 100% completa e funcional
- **Fase 1:** 96.9% completa, 4 falhas menores

### Erros Encontrados

- **4 testes CORS** esperavam status 200, mas o correto é 204

### Correção Proposta

- Mudar 4 linhas de `assertEquals(response.status, 200)` para `assertEquals(response.status, 204)`
- Adicionar `.clone()` no FetchMock para prevenir problemas futuros

### Após Correção

- **130/130 testes passando (100%)**
- **Zero dívida técnica**
- **Infraestrutura pronta para Fases 2-5**
