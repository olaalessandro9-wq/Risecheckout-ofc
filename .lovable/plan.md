
# PLANO: Unificação de Guards de Testes - Eliminação de Dívida Técnica

## Diagnóstico Confirmado: SIM, É DÍVIDA TÉCNICA E GAMBIARRA

### Análise de Soluções

#### Solução A: Manter Ambos os Padrões (Status Quo)
- Manutenibilidade: 4/10 (confusão entre padrões)
- Zero DT: 0/10 (DUPLICAÇÃO DE LÓGICA)
- Arquitetura: 3/10 (sem centralização)
- Escalabilidade: 3/10 (cada novo teste pode usar qualquer padrão)
- Segurança: 8/10 (funcional, mas confuso)
- **NOTA FINAL: 3.6/10**
- Tempo estimado: 0 minutos

#### Solução B: Unificar com `skipIntegration()` Centralizado
- Manutenibilidade: 10/10 (padrão único)
- Zero DT: 10/10 (sem duplicação)
- Arquitetura: 10/10 (centralizado em `_shared/testing/`)
- Escalabilidade: 10/10 (novos testes seguem padrão)
- Segurança: 10/10 (lógica validada em um só lugar)
- **NOTA FINAL: 10.0/10**
- Tempo estimado: 2-3 horas

### DECISÃO: Solução B (Nota 10.0)
A Solução A viola diretamente o RISE Protocol V3 §4.4 (Zero Dívida Técnica).

---

## Inventário Completo de Violações

### Padrão Legado (`skipTests` - variável local)
Arquivos que definem sua PRÓPRIA lógica de skip ao invés de usar infraestrutura centralizada:

| Arquivo | Problema |
|---------|----------|
| `create-order/index.test.ts` | Define `skipTests` local (linhas 26-27) |
| `verify-turnstile/integration.test.ts` | Define `skipTests` local (linhas 28-31) |
| `checkout-public-data/index.test.ts` | Sem skip (testes unitários válidos) |
| `unified-auth/index.test.ts` | Sem skip (testes unitários válidos) |
| `vault-save/index.test.ts` | Sem skip (testes unitários válidos) |

### Padrão Correto (`skipIntegration()` - função centralizada)
Arquivos que CORRETAMENTE importam de `_shared/testing/mod.ts`:

| Arquivo | Status |
|---------|--------|
| `pushinpay-get-status/tests/_shared.ts` | ✅ CORRETO |
| `pushinpay-get-status/tests/integration.test.ts` | ✅ CORRETO |
| `reconcile-pending-orders/tests/_shared.ts` | ✅ CORRETO |
| `reconcile-pending-orders/tests/integration.test.ts` | ✅ CORRETO |
| `pushinpay-webhook/tests/integration.test.ts` | ✅ CORRETO |
| `pushinpay-validate-token/tests/integration.test.ts` | ✅ CORRETO |
| `pushinpay-create-pix/tests/integration.test.ts` | ✅ CORRETO |

### Problema Estrutural Adicional
Algumas funções têm **DUAS estruturas de teste**:
- `unified-auth/` tem `index.test.ts` E `tests/` E `__tests__/`
- Isso viola DRY e cria confusão

---

## Por Que `skipTests` é Gambiarra

```typescript
// ❌ LEGADO - Cada arquivo define SUA PRÓPRIA lógica (GAMBIARRA)
const isMockUrl = !supabaseUrl || supabaseUrl.includes('test.supabase.co') || !supabaseUrl.startsWith('https://');
const skipTests = isMockUrl || !supabaseAnonKey || supabaseAnonKey === 'test-anon-key';
```

```typescript
// ✅ CORRETO - Lógica CENTRALIZADA em _shared/testing/test-config.ts
export function skipIntegration(): boolean {
  const config = getTestConfig();
  return config.environment !== "integration";
}
```

### Problemas do Padrão `skipTests`:

1. **Duplicação de Lógica**: Cada arquivo redefine as mesmas regras
2. **Inconsistência**: Arquivos diferentes podem ter regras diferentes
3. **Manutenção**: Mudança na lógica requer edição de N arquivos
4. **Sem Granularidade**: Não distingue entre unit/contract/integration
5. **Confusão**: Manus e outros analisadores ficam confusos

---

## Plano de Correção

### Fase 1: Migração de `create-order/index.test.ts`

**Antes:**
```typescript
const isMockUrl = !supabaseUrl || supabaseUrl.includes('test.supabase.co') || ...;
const skipTests = isMockUrl || !supabaseAnonKey || supabaseAnonKey === 'test-anon-key';

Deno.test({
  name: "create-order: Deve criar um pedido com sucesso",
  ignore: skipTests,
  ...
});
```

**Depois:**
```typescript
import { skipIntegration, integrationTestOptions } from "../_shared/testing/mod.ts";

Deno.test({
  name: "create-order/integration: creates order successfully",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => { ... }
});
```

### Fase 2: Migração de `verify-turnstile/integration.test.ts`

Remover a definição local de `skipTests` e usar `skipIntegration()`.

### Fase 3: Consolidação de Estruturas de Teste

Para `unified-auth/`:
- Manter apenas `tests/` como pasta canônica
- Mover testes válidos de `index.test.ts` para `tests/validation.test.ts`
- Remover `__tests__/` se redundante

### Fase 4: Atualização de Documentação

Atualizar `docs/ARQUITETURA_TESTES_AUTOMATIZADOS.md` com:
- Padrão único: `skipIntegration()` para testes de integração
- Padrão `skipContract()` para testes de contrato
- Estrutura canônica: `tests/_shared.ts`, `tests/*.test.ts`

---

## Arquivos a Modificar

```text
supabase/functions/
├── create-order/
│   └── index.test.ts          # Migrar para skipIntegration()
├── verify-turnstile/
│   └── integration.test.ts    # Remover skipTests local
├── unified-auth/
│   ├── index.test.ts          # Avaliar: migrar ou deletar
│   ├── __tests__/             # Avaliar: consolidar em tests/
│   └── tests/                 # Manter como canônico
├── coupon-management/
│   └── tests/_shared.ts       # REMOVER hardcoded credentials (SEGURANÇA!)
└── _shared/testing/
    └── mod.ts                 # Já correto - fonte da verdade
```

---

## Ação Adicional: Remoção de Credenciais Hardcoded

**VIOLAÇÃO DE SEGURANÇA ENCONTRADA** em `coupon-management/tests/_shared.ts`:

```typescript
// ❌ CRÍTICO - Credenciais hardcoded
export const SUPABASE_URL = "https://wivbtmtgpsxupfjwwovf.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6...";
```

Isso viola RISE Protocol V3 §3 (Segurança Absoluta) mesmo sendo anon key.

---

## Checklist de Validação RISE V3

| Critério | Meta |
|----------|------|
| Padrão único de skip | `skipIntegration()` em 100% dos arquivos |
| Zero definições locais de `skipTests` | 0 ocorrências |
| Estrutura canônica | `tests/` em todas as funções |
| Sem credenciais hardcoded | 0 ocorrências |
| Documentação atualizada | `ARQUITETURA_TESTES_AUTOMATIZADOS.md` |

---

## Resultado Esperado

Após implementação:
- **1 padrão único** para skip de testes de integração
- **0 gambiarras** com definições locais
- **100% conformidade** RISE V3
- **Manus** não terá mais confusão sobre padrões
- **Novos desenvolvedores** seguirão padrão claro
