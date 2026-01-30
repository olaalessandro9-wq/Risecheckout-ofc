
# Correção de Testes Pré-Existentes - RISE Protocol V3 10.0/10

## Diagnóstico

Após análise detalhada, identifiquei que **2 arquivos de teste** estão falhando devido a mocks incorretos:

| Arquivo | Problema |
|---------|----------|
| `useContextSwitcher.test.ts` | Mock usa path relativo `"./useUnifiedAuth"` mas deveria usar `"@/hooks/useUnifiedAuth"` |
| `useVendorTimezone.test.ts` | Mock usa path relativo `"./useUnifiedAuth"` mas deveria usar `"@/hooks/useUnifiedAuth"` |

## Análise Técnica

### Por que o mock falha?

1. Os hooks (`useContextSwitcher.ts`, `useVendorTimezone.ts`) importam via:
   ```typescript
   import { useUnifiedAuth } from './useUnifiedAuth';  // path relativo
   ```

2. Os testes em `__tests__/` mockam via:
   ```typescript
   vi.mock("./useUnifiedAuth", ...);  // path relativo
   ```

3. **Problema**: Quando Vitest resolve o path relativo `./useUnifiedAuth` no contexto do arquivo de teste (`src/hooks/__tests__/`), ele resolve para um path diferente do hook real que está em `src/hooks/`.

4. **Solução**: O Vitest resolve aliases corretamente. Usar `@/hooks/useUnifiedAuth` funciona porque é absoluto e resolve para o mesmo módulo tanto no teste quanto no hook.

### Evidência - Testes que funcionam:

Os seguintes testes usam o path correto e passam:
- `useAffiliations.test.ts`: `vi.mock("@/hooks/useUnifiedAuth", ...)`
- `usePaymentAccountCheck.test.ts`: `vi.mock("@/hooks/useUnifiedAuth", ...)`
- `useProduct.test.tsx`: `vi.mock("@/hooks/useUnifiedAuth", ...)`
- `useAffiliateRequest.test.ts`: `vi.mock("@/hooks/useUnifiedAuth", ...)`

---

## Correções Necessárias

### Arquivo 1: `src/hooks/__tests__/useContextSwitcher.test.ts`

**Mudança:**
```diff
- vi.mock("./useUnifiedAuth", () => ({
+ vi.mock("@/hooks/useUnifiedAuth", () => ({
```

E atualizar o import:
```diff
- import { useUnifiedAuth } from "../useUnifiedAuth";
+ import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
```

### Arquivo 2: `src/hooks/__tests__/useVendorTimezone.test.ts`

**Mudança:**
```diff
- vi.mock("./useUnifiedAuth", () => ({
+ vi.mock("@/hooks/useUnifiedAuth", () => ({
```

E atualizar o import:
```diff
- import { useUnifiedAuth } from "../useUnifiedAuth";
+ import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
```

---

## Impacto

| Métrica | Antes | Depois |
|---------|-------|--------|
| Testes falhando (hooks) | 2 arquivos | 0 arquivos |
| Linhas modificadas | 0 | ~8 linhas |
| Risco de regressão | N/A | Zero |

## Checklist RISE V3

- [x] Zero dívida técnica (correção definitiva)
- [x] Zero `any` types
- [x] Headers de documentação mantidos
- [x] Padrão consistente com demais testes
- [x] Limite de 300 linhas respeitado

---

## Tempo Estimado

**5 minutos** - Correção cirúrgica de 2 arquivos.
