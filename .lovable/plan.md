

# Plano: Corrigir Duplicação de Produtos com Nomes Longos

## Diagnóstico (Root Cause Only)

O erro ocorre na linha 89 de `product-duplicate-handlers.ts`:

```typescript
const baseName = `${srcProduct.name} (Cópia)`;
```

**Constraint do banco de dados:**
```sql
CHECK (((char_length(name) >= 1) AND (char_length(name) <= 100)))
```

**Problema:** Quando o nome original tem 100 caracteres (limite máximo), ao adicionar " (Cópia)" (8 caracteres), o novo nome fica com **108 caracteres**, violando a constraint `products_name_length`.

| Cenário | Nome Original | + Sufixo | Total | Resultado |
|---------|---------------|----------|-------|-----------|
| Nome curto | 44 chars | " (Cópia)" | 52 chars | ✅ OK |
| Nome no limite | 100 chars | " (Cópia)" | 108 chars | ❌ ERRO |
| Nome próximo | 95 chars | " (Cópia)" | 103 chars | ❌ ERRO |

---

## Análise de Soluções (RISE V3)

### Solução A: Truncar Nome + Adicionar Sufixo com Limite Garantido
- **Manutenibilidade:** 10/10 - Lógica clara e centralizada
- **Zero DT:** 10/10 - Resolve problema na raiz
- **Arquitetura:** 10/10 - Constantes centralizadas, helper reutilizável
- **Escalabilidade:** 10/10 - Funciona para qualquer tamanho de nome
- **Segurança:** 10/10 - Impossível violar constraint
- **NOTA FINAL: 10.0/10**

### Solução B: Aumentar limite no banco para 200
- **Manutenibilidade:** 4/10 - Adia o problema
- **Zero DT:** 3/10 - Problema reaparece em 200 chars
- **Arquitetura:** 4/10 - Não resolve causa raiz
- **Escalabilidade:** 3/10 - Limite arbitrário
- **Segurança:** 8/10 - Funciona temporariamente
- **NOTA FINAL: 4.4/10**

## DECISÃO: Solução A (10.0/10)

---

## Implementação Técnica

### 1. Adicionar Constantes de Duplicação

**Arquivo:** `src/lib/constants/field-limits.ts`

```typescript
export const PRODUCT_DUPLICATION = {
  /** Sufixo padrão para cópia */
  COPY_SUFFIX: " (Cópia)",
  /** Tamanho do sufixo padrão */
  COPY_SUFFIX_LENGTH: 8,
  /** Limite máximo do nome do produto */
  MAX_NAME_LENGTH: 100,
  /** Tamanho máximo para nome base (garante espaço para sufixo + contador) */
  MAX_BASE_NAME_LENGTH: 88, // 100 - 8 (" (Cópia)") - 4 (margem para " 99")
} as const;
```

### 2. Criar Helper para Truncar Nome com Sufixo

**Arquivo:** `supabase/functions/_shared/edge-helpers.ts`

Adicionar função:

```typescript
export function buildDuplicateName(originalName: string): string {
  const COPY_SUFFIX = " (Cópia)";
  const MAX_LENGTH = 100;
  const SUFFIX_MARGIN = 12; // " (Cópia) 99" = 12 chars
  
  const maxBaseLength = MAX_LENGTH - SUFFIX_MARGIN;
  
  // Truncar nome se necessário
  const truncatedName = originalName.length > maxBaseLength
    ? originalName.substring(0, maxBaseLength - 3) + "..."
    : originalName;
  
  return `${truncatedName}${COPY_SUFFIX}`;
}
```

### 3. Atualizar `product-duplicate-handlers.ts`

**Arquivo:** `supabase/functions/_shared/product-duplicate-handlers.ts`

**Antes (linha 89):**
```typescript
const baseName = `${srcProduct.name} (Cópia)`;
```

**Depois:**
```typescript
import { buildDuplicateName } from "./edge-helpers.ts";

// Na função duplicateProduct:
const baseName = buildDuplicateName(srcProduct.name);
```

### 4. Atualizar `ensureUniqueName` para Respeitar Limite

**Arquivo:** `supabase/functions/_shared/edge-helpers.ts`

Modificar a função para garantir que mesmo com sufixo numérico, não exceda 100:

```typescript
export async function ensureUniqueName(
  supabase: SupabaseClient,
  baseName: string
): Promise<string> {
  const MAX_LENGTH = 100;
  let name = baseName.substring(0, MAX_LENGTH); // Garantir limite
  let counter = 1;
  const maxAttempts = 100;

  while (counter <= maxAttempts) {
    const { data, error } = await supabase
      .from("products")
      .select("id")
      .eq("name", name)
      .maybeSingle();

    if (error || !data) {
      return name;
    }

    counter++;
    const suffix = ` ${counter}`;
    // Truncar base name para caber sufixo numérico
    const maxBase = MAX_LENGTH - suffix.length;
    const truncatedBase = baseName.length > maxBase 
      ? baseName.substring(0, maxBase) 
      : baseName;
    name = `${truncatedBase}${suffix}`;
  }

  const finalSuffix = ` ${Date.now()}`;
  const maxBase = MAX_LENGTH - finalSuffix.length;
  return `${baseName.substring(0, maxBase)}${finalSuffix}`;
}
```

---

## Alterações por Arquivo

| Arquivo | Ação | Mudança |
|---------|------|---------|
| `src/lib/constants/field-limits.ts` | MODIFICAR | Adicionar `PRODUCT_DUPLICATION` |
| `supabase/functions/_shared/edge-helpers.ts` | MODIFICAR | Adicionar `buildDuplicateName` + atualizar `ensureUniqueName` |
| `supabase/functions/_shared/product-duplicate-handlers.ts` | MODIFICAR | Usar `buildDuplicateName` |

---

## Comportamento Resultante

| Cenário | Nome Original | Resultado | Total |
|---------|---------------|-----------|-------|
| Nome curto (44 chars) | "Meu Produto" | "Meu Produto (Cópia)" | 20 chars ✅ |
| Nome médio (80 chars) | "Nome com oitenta caracteres..." | "Nome com oitenta... (Cópia)" | 88 chars ✅ |
| Nome no limite (100 chars) | "yyrrrrrrrrrrr..." | "yyrrrrrrrrrrr... (Cópia)" | 96 chars ✅ |
| Com sufixo numérico | "Produto (Cópia)" existe | "Produto (Cópia) 2" | ≤100 chars ✅ |

---

## Diagrama Visual

```text
ANTES (overflow):
┌─────────────────────────────────────────────────────┐
│ Nome Original: "yyrrrrr...k" (100 chars)            │
│ + Sufixo: " (Cópia)" (8 chars)                      │
│ = Total: 108 chars → VIOLA CONSTRAINT ❌            │
└─────────────────────────────────────────────────────┘

DEPOIS (truncation):
┌─────────────────────────────────────────────────────┐
│ Nome Original: "yyrrrrr...k" (100 chars)            │
│ Truncado: "yyrrrrr..." (85 chars)                   │
│ + Sufixo: " (Cópia)" (8 chars)                      │
│ = Total: 93 chars → OK ✅                           │
└─────────────────────────────────────────────────────┘
```

---

## Conformidade RISE V3

| Critério | Status |
|----------|--------|
| Root Cause Only | Resolve overflow na origem |
| Single Source of Truth | Constantes centralizadas |
| Zero Dívida Técnica | Impossível violar constraint |
| Arquitetura Correta | Helper reutilizável |
| Segurança | Truncation + limit garantido |

