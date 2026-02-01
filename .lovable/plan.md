
# PLANO DE CORREÇÃO IMEDIATA: Completar Fases 1 e 2

## Análise de Soluções

### Solução A: Ignorar as violações e prosseguir para Fase 3
- Manutenibilidade: 2/10
- Zero DT: 0/10 (VIOLAÇÃO DIRETA)
- Arquitetura: 0/10
- Escalabilidade: 2/10
- Segurança: 0/10 (CREDENCIAIS EXPOSTAS)
- **NOTA FINAL: 0.8/10**
- Tempo estimado: 0 minutos

### Solução B: Corrigir as 3 violações antes de prosseguir
- Manutenibilidade: 10/10
- Zero DT: 10/10
- Arquitetura: 10/10
- Escalabilidade: 10/10
- Segurança: 10/10
- **NOTA FINAL: 10.0/10**
- Tempo estimado: 15 minutos

### DECISÃO: Solução B (Nota 10.0)
Conforme RISE V3 §4.4: "A melhor solução VENCE. SEMPRE."

---

## Correções Necessárias

### Correção 1: `checkout-crud/tests/_shared.ts`
**Ação:** Remover linhas 11-12 e substituir por padrão centralizado

```typescript
// ❌ REMOVER (Linhas 7-13)
// ============================================
// CONFIGURATION (Hardcoded for unit tests - no dotenv dependency)
// ============================================

export const SUPABASE_URL = "https://wivbtmtgpsxupfjwwovf.supabase.co";
export const SUPABASE_ANON_KEY = "eyJ...";
export const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/checkout-crud`;

// ✅ SUBSTITUIR POR
import { getTestConfig } from "../../_shared/testing/mod.ts";

// ============================================
// CONFIGURATION (Centralized via getTestConfig)
// ============================================

const config = getTestConfig();

export const FUNCTION_NAME = "checkout-crud";
export const FUNCTION_URL = config.supabaseUrl
  ? `${config.supabaseUrl}/functions/v1/${FUNCTION_NAME}`
  : `https://mock.supabase.co/functions/v1/${FUNCTION_NAME}`;
```

### Correção 2: `rls-security-tester/`
**Ação:** Deletar arquivos de teste na raiz

```text
DELETAR:
- supabase/functions/rls-security-tester/index.test.ts
- supabase/functions/rls-security-tester/integration.test.ts
```

### Correção 3: `verify-turnstile/`
**Ação:** Deletar arquivo de teste na raiz

```text
DELETAR:
- supabase/functions/verify-turnstile/index.test.ts
```

---

## Verificação Pré-Delete

Antes de deletar, confirmar que `tests/` contém os testes equivalentes.

### Para `rls-security-tester/tests/`:
- Verificar se existe `_shared.ts` e arquivos de teste
- Se não existir estrutura completa: MIGRAR conteúdo do `integration.test.ts`

### Para `verify-turnstile/tests/`:
- Já confirmado: estrutura `tests/` existe e contém `_shared.ts` + `integration.test.ts`

---

## Árvore de Arquivos Após Correção

```text
supabase/functions/
├── checkout-crud/
│   └── tests/
│       └── _shared.ts          # CORRIGIDO (getTestConfig)
├── rls-security-tester/
│   ├── services/
│   ├── tests/                  # Manter
│   ├── index.ts
│   └── types.ts
│   # DELETADOS: index.test.ts, integration.test.ts
└── verify-turnstile/
    ├── tests/                  # Manter
    └── index.ts
    # DELETADO: index.test.ts
```

---

## Checklist de Validação Pós-Correção

| Critério | Verificação | Meta |
|----------|-------------|------|
| `checkout-crud/_shared.ts` | Sem hardcoded credentials | ✅ |
| `checkout-crud/_shared.ts` | Usa `getTestConfig()` | ✅ |
| `rls-security-tester/index.test.ts` | Não existe | ✅ |
| `rls-security-tester/integration.test.ts` | Não existe | ✅ |
| `verify-turnstile/index.test.ts` | Não existe | ✅ |
| `rls-security-tester/tests/` | Contém testes | ✅ |
| `verify-turnstile/tests/` | Contém testes | ✅ |

---

## Resultado Esperado

Após estas 3 correções:
- **Fase 1:** 100% (7/7 arquivos corrigidos)
- **Fase 2:** 100% (11/11 arquivos deletados)
- **Pronto para Fase 3:** ✅ SIM
