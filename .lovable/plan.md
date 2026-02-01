

# PLANO DE EXECUÇÃO: Fases 3, 4 e 5

## Análise de Soluções

### Solução A: Executar as 3 fases simultaneamente
- Manutenibilidade: 3/10 (risco de conflitos)
- Zero DT: 5/10
- Arquitetura: 4/10
- Escalabilidade: 4/10
- Segurança: 8/10
- **NOTA FINAL: 4.8/10**
- Tempo estimado: Indeterminado (alto risco de erros)

### Solução B: Executar fase por fase, com validação entre cada uma
- Manutenibilidade: 10/10
- Zero DT: 10/10
- Arquitetura: 10/10
- Escalabilidade: 10/10
- Segurança: 10/10
- **NOTA FINAL: 10.0/10**
- Tempo estimado: 8-10 horas (execução controlada)

### **DECISÃO: Solução B (Nota 10.0)**

---

## VISÃO GERAL DAS 3 FASES

```text
┌─────────────────────────────────────────────────────────────┐
│                    FASE 3: GUARDS                            │
│                    (24 arquivos)                             │
│                                                              │
│  Substituir:                                                 │
│  ❌ const skipTests = !supabaseUrl || ...                   │
│                                                              │
│  Por:                                                        │
│  ✅ import { skipIntegration } from "../_shared/testing/mod.ts" │
│  ✅ ignore: skipIntegration()                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    FASE 4: GIGANTES                          │
│                    (20 arquivos >300 linhas)                 │
│                                                              │
│  Transformar:                                                │
│  ❌ function/index.test.ts (1071 linhas)                    │
│                                                              │
│  Em:                                                         │
│  ✅ function/tests/_shared.ts (~100 linhas)                 │
│  ✅ function/tests/validation.test.ts (~200 linhas)         │
│  ✅ function/tests/actions.test.ts (~200 linhas)            │
│  ✅ function/tests/integration.test.ts (~150 linhas)        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    FASE 5: MIGRAÇÃO                          │
│                    (40 arquivos restantes)                   │
│                                                              │
│  Migrar:                                                     │
│  ❌ function/index.test.ts (na raiz)                        │
│                                                              │
│  Para:                                                       │
│  ✅ function/tests/index.test.ts (ou modular)               │
└─────────────────────────────────────────────────────────────┘
```

---

## FASE 3: Unificação de Guards (24 arquivos)

### Objetivo
Eliminar TODAS as definições locais de `const skipTests` e substituir pela função centralizada `skipIntegration()` do módulo `_shared/testing/mod.ts`.

### Padrão de Transformação

```typescript
// ════════════════════════════════════════════════════════════
// ❌ ANTES (GAMBIARRA - Violação RISE V3)
// ════════════════════════════════════════════════════════════
import "https://deno.land/std@0.224.0/dotenv/load.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const skipTests = !supabaseUrl || 
  supabaseUrl.includes('test.supabase.co') || 
  !supabaseUrl.startsWith('https://');

Deno.test({
  name: "function: test name",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => { ... }
});

// ════════════════════════════════════════════════════════════
// ✅ DEPOIS (RISE V3 Compliant)
// ════════════════════════════════════════════════════════════
import { 
  skipIntegration, 
  integrationTestOptions,
  getTestConfig 
} from "../_shared/testing/mod.ts";

const config = getTestConfig();
const FUNCTION_URL = config.supabaseUrl
  ? `${config.supabaseUrl}/functions/v1/function-name`
  : "https://mock.supabase.co/functions/v1/function-name";

Deno.test({
  name: "function/integration: test name",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => { ... }
});
```

### Lista Completa de Arquivos (24)

| # | Arquivo | Linha | Prioridade |
|---|---------|-------|------------|
| 1 | `update-affiliate-settings/index.test.ts` | 18 | ALTA |
| 2 | `request-affiliation/index.test.ts` | 20 | ALTA |
| 3 | `mercadopago-create-payment/index.test.ts` | 22 | ALTA |
| 4 | `members-area-quizzes/index.test.ts` | 19 | MÉDIA |
| 5 | `members-area-certificates/index.test.ts` | 19 | MÉDIA |
| 6 | `manage-user-role/integration.test.ts` | 26 | ALTA |
| 7 | `manage-user-status/integration.test.ts` | 28 | ALTA |
| 8 | `get-order-for-pix/index.test.ts` | 20 | ALTA |
| 9 | `get-pix-status/index.test.ts` | 20 | ALTA |
| 10 | `get-my-affiliations/index.test.ts` | 17 | MÉDIA |
| 11 | `get-affiliation-status/index.test.ts` | 17 | MÉDIA |
| 12 | `get-all-affiliation-statuses/index.test.ts` | 16 | MÉDIA |
| 13 | `gdpr-request/integration.test.ts` | 28 | ALTA |
| 14 | `get-affiliation-details/index.test.ts` | 17 | MÉDIA |
| 15 | `gdpr-forget/integration.test.ts` | 28 | ALTA |
| 16 | `content-crud/index.test.ts` | 19 | MÉDIA |
| 17 | `asaas-validate-credentials/index.test.ts` | 25 | ALTA |
| 18 | `asaas-create-payment/index.test.ts` | 28 | ALTA |
| 19 | `affiliation-public/index.test.ts` | 17 | MÉDIA |
| 20 | `alert-stuck-orders/index.test.ts` | 20 | BAIXA |
| 21 | `admin-data/tests/integration.test.ts` | 22 | ALTA |
| 22 | `_integration-tests/payments/pix-flow.integration.test.ts` | 27 | CRÍTICA |
| 23 | `_integration-tests/payments/card-flow.integration.test.ts` | 27 | CRÍTICA |
| 24 | `_integration-tests/payments/payment-order-webhook.integration.test.ts` | 26 | CRÍTICA |

### Execução Sugerida: 3 Lotes

**Lote 3.1 (8 arquivos - Críticos e Pagamentos)**
1. `_integration-tests/payments/pix-flow.integration.test.ts`
2. `_integration-tests/payments/card-flow.integration.test.ts`
3. `_integration-tests/payments/payment-order-webhook.integration.test.ts`
4. `mercadopago-create-payment/index.test.ts`
5. `asaas-create-payment/index.test.ts`
6. `asaas-validate-credentials/index.test.ts`
7. `get-order-for-pix/index.test.ts`
8. `get-pix-status/index.test.ts`

**Lote 3.2 (8 arquivos - Admin e GDPR)**
1. `admin-data/tests/integration.test.ts`
2. `manage-user-role/integration.test.ts`
3. `manage-user-status/integration.test.ts`
4. `gdpr-request/integration.test.ts`
5. `gdpr-forget/integration.test.ts`
6. `update-affiliate-settings/index.test.ts`
7. `request-affiliation/index.test.ts`
8. `alert-stuck-orders/index.test.ts`

**Lote 3.3 (8 arquivos - Afiliação e Conteúdo)**
1. `get-my-affiliations/index.test.ts`
2. `get-affiliation-status/index.test.ts`
3. `get-all-affiliation-statuses/index.test.ts`
4. `get-affiliation-details/index.test.ts`
5. `affiliation-public/index.test.ts`
6. `content-crud/index.test.ts`
7. `members-area-quizzes/index.test.ts`
8. `members-area-certificates/index.test.ts`

---

## FASE 4: Refatoração de Arquivos Gigantes (20+ arquivos)

### Objetivo
Quebrar TODOS os arquivos de teste com mais de 300 linhas em estrutura modular `tests/`.

### Estratégia de Quebra

```text
ARQUIVO ORIGINAL (>300 linhas)
├── Mocks e helpers (~20-30%)
├── Testes de validação (~25-30%)
├── Testes de ações/CRUD (~25-30%)
└── Testes de integração (~15-20%)

                    │
                    ▼

ESTRUTURA MODULAR (4 arquivos)
tests/
├── _shared.ts           (Mocks, helpers, factories)
├── validation.test.ts   (Input validation, schemas)
├── actions.test.ts      (CRUD operations, business logic)
└── integration.test.ts  (E2E com skipIntegration)
```

### Top 20 Arquivos Prioritários (ordenados por tamanho)

| # | Arquivo | Linhas | Arquivos Resultado |
|---|---------|--------|-------------------|
| 1 | `affiliate-pixel-management/index.test.ts` | 1071 | 4 arquivos |
| 2 | `webhook-crud/index.test.ts` | 1013 | 4 arquivos |
| 3 | `utmify-conversion/index.test.ts` | 944 | 4 arquivos |
| 4 | `facebook-conversion-api/index.test.ts` | 930 | 4 arquivos |
| 5 | `pixel-management/index.test.ts` | 885 | 3 arquivos |
| 6 | `checkout-public-data/index.test.ts` | 797 | 3 arquivos |
| 7 | `checkout-editor/index.test.ts` | 797 | 3 arquivos |
| 8 | `dashboard-analytics/index.test.ts` | 759 | 3 arquivos |
| 9 | `trigger-webhooks/index.test.ts` | 737 | 3 arquivos |
| 10 | `offer-bulk/index.test.ts` | 737 | 3 arquivos |
| 11 | `checkout-heartbeat/index.test.ts` | 720 | 3 arquivos |
| 12 | `coupon-read/index.test.ts` | 717 | 3 arquivos |
| 13 | `track-visit/index.test.ts` | 686 | 3 arquivos |
| 14 | `detect-abandoned-checkouts/index.test.ts` | 653 | 3 arquivos |
| 15 | `process-webhook-queue/index.test.ts` | 599 | 2 arquivos |
| 16 | `manage-user-status/integration.test.ts` | 576 | 2 arquivos |
| 17 | `_shared/coupon-validation.test.ts` | 555 | 2 arquivos |
| 18 | `unified-auth/tests/api.contract.test.ts` | 512 | 2 arquivos |
| 19 | `gdpr-forget/integration.test.ts` | 505 | 2 arquivos |
| 20 | `members-area-certificates/index.test.ts` | 459 | 2 arquivos |

### Execução Sugerida: 4 Lotes

**Lote 4.1 (5 arquivos - Maiores de 900 linhas)**
1. `affiliate-pixel-management/index.test.ts` → 4 arquivos
2. `webhook-crud/index.test.ts` → 4 arquivos
3. `utmify-conversion/index.test.ts` → 4 arquivos
4. `facebook-conversion-api/index.test.ts` → 4 arquivos
5. `pixel-management/index.test.ts` → 3 arquivos

**Lote 4.2 (5 arquivos - 700-800 linhas)**
1. `checkout-public-data/index.test.ts` → 3 arquivos
2. `checkout-editor/index.test.ts` → 3 arquivos
3. `dashboard-analytics/index.test.ts` → 3 arquivos
4. `trigger-webhooks/index.test.ts` → 3 arquivos
5. `offer-bulk/index.test.ts` → 3 arquivos

**Lote 4.3 (5 arquivos - 600-720 linhas)**
1. `checkout-heartbeat/index.test.ts` → 3 arquivos
2. `coupon-read/index.test.ts` → 3 arquivos
3. `track-visit/index.test.ts` → 3 arquivos
4. `detect-abandoned-checkouts/index.test.ts` → 3 arquivos
5. `process-webhook-queue/index.test.ts` → 2 arquivos

**Lote 4.4 (5 arquivos - 450-580 linhas)**
1. `manage-user-status/integration.test.ts` → 2 arquivos
2. `_shared/coupon-validation.test.ts` → 2 arquivos
3. `unified-auth/tests/api.contract.test.ts` → 2 arquivos
4. `gdpr-forget/integration.test.ts` → 2 arquivos
5. `members-area-certificates/index.test.ts` → 2 arquivos

---

## FASE 5: Migração Global e Validação Final

### Objetivo
Migrar TODOS os `index.test.ts` restantes (na raiz das funções) para estrutura `tests/`.

### Arquivos Estimados: ~40

Funções que ainda terão `index.test.ts` na raiz após Fases 3 e 4:

```text
buyer-orders/index.test.ts
content-crud/index.test.ts
members-area-quizzes/index.test.ts
... (demais funções menores)
```

### Execução Sugerida: 2 Lotes

**Lote 5.1 (20 arquivos)**
Migração simples: criar `tests/` e mover arquivo.

**Lote 5.2 (20 arquivos + Validação Final)**
Migração restante + auditoria completa.

### Validação Final Obrigatória

```bash
# Verificações obrigatórias após Fase 5

# 1. Zero credenciais hardcoded
grep -r "SUPABASE_URL = \"https" supabase/functions/ | wc -l
# Esperado: 0

# 2. Zero guards legados
grep -r "const skipTests" supabase/functions/ | wc -l
# Esperado: 0

# 3. Zero index.test.ts na raiz (exceto exceções documentadas)
find supabase/functions -maxdepth 2 -name "index.test.ts" | wc -l
# Esperado: 0

# 4. Zero arquivos >300 linhas em testes
find supabase/functions -name "*.test.ts" -exec wc -l {} \; | awk '$1 > 300'
# Esperado: 0

# 5. Todos os testes passando
deno test supabase/functions --allow-net --allow-env
# Esperado: Exit Code 0
```

---

## RESUMO EXECUTIVO

| Fase | Descrição | Arquivos | Lotes | Tempo Estimado |
|------|-----------|----------|-------|----------------|
| **3** | Unificação de Guards | 24 | 3 | 2-3 horas |
| **4** | Refatoração Gigantes | 20 → 60+ | 4 | 4-5 horas |
| **5** | Migração Global | ~40 | 2 | 2-3 horas |
| **TOTAL** | | 84+ arquivos | 9 lotes | 8-11 horas |

---

## PROPOSTA DE EXECUÇÃO

Dada a magnitude do trabalho, proponho executar **uma fase completa por vez**, com validação entre cada fase.

**Opção A:** Iniciar pela FASE 3 (Guards) - 3 lotes
**Opção B:** Iniciar pela FASE 4 (Gigantes) - 4 lotes  
**Opção C:** Iniciar pela FASE 5 (Migração) - 2 lotes

**RECOMENDAÇÃO:** Opção A (Fase 3 primeiro)
- Menor risco de quebrar testes
- Prepara o terreno para Fases 4 e 5
- Elimina a gambiarra mais visível do codebase

---

## CRITÉRIOS DE SUCESSO POR FASE

### Fase 3 Concluída Quando:
- [ ] 0 ocorrências de `const skipTests` no codebase
- [ ] Todos os 24 arquivos usando `skipIntegration()`
- [ ] Todos os testes passando (Exit Code 0)

### Fase 4 Concluída Quando:
- [ ] 0 arquivos de teste com mais de 300 linhas
- [ ] Todos os 20 arquivos gigantes quebrados em estrutura `tests/`
- [ ] Limite de 300 linhas respeitado em todos os novos arquivos

### Fase 5 Concluída Quando:
- [ ] 0 arquivos `index.test.ts` na raiz das funções
- [ ] 100% das funções com estrutura `tests/`
- [ ] Auditoria final aprovada

---

## DOCUMENTAÇÃO A ATUALIZAR

Após conclusão de todas as fases:

1. `docs/ARQUITETURA_TESTES_AUTOMATIZADOS.md` - Inventário final
2. `docs/RISE_V3_COMPLIANCE.md` - Certificado de conformidade
3. `supabase/functions/_shared/testing/README.md` - Guia de uso

