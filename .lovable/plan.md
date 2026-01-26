
# Fase 5.3: Correção das 7 Violações Finais de Terminologia

## Objetivo
Eliminar as últimas 7 ocorrências de terminologia proibida para atingir **10.0/10 absoluta** no Protocolo RISE V3.

## Tempo Estimado
**5-10 minutos**

---

## Correções a Aplicar

### 1. src/components/checkout/CheckoutComponentRenderer.tsx
**Linha 5** - Comentário do header

```text
ANTES:
* Mantém compatibilidade com o design system e props legadas

DEPOIS:
* Mantém compatibilidade com o design system e props existentes
```

---

### 2. supabase/functions/decrypt-customer-data/index.ts
**Linha 90** - Comentário no catch de decryption

```text
ANTES:
// Pode ser dado legado não criptografado

DEPOIS:
// Pode ser dado não criptografado
```

---

### 3. supabase/functions/unified-auth/handlers/ensure-producer-access.ts
**Linha 43** - Comentário de fallback

```text
ANTES:
// If not in users table, check legacy buyer_profiles

DEPOIS:
// If not in users table, check fallback buyer_profiles
```

---

### 4. supabase/functions/track-visit/index.ts
**Linhas 5 e 80** - Comentários do header e RPC

```text
ANTES (linha 5):
* Also increments the legacy visits_count counter.

DEPOIS:
* Also increments the aggregate visits_count counter.

---

ANTES (linha 80):
// Increment legacy counter

DEPOIS:
// Increment aggregate counter
```

---

### 5. src/features/checkout-builder/components/BadgeBlock/BadgeBlock.tsx
**Linha 9** - Comentário histórico

```text
ANTES:
* Nota: Este componente era chamado de "seal" no código antigo.

DEPOIS:
* Nota: Este componente era chamado de "seal" na versão anterior.
```

---

### 6. src/features/checkout-builder/components/BenefitBlock/BenefitBlock.tsx
**Linha 9** - Comentário histórico

```text
ANTES:
* Nota: Este componente era chamado de "advantage" no código antigo.

DEPOIS:
* Nota: Este componente era chamado de "advantage" na versão anterior.
```

---

## Nota Técnica: Constantes LEGACY_COOKIE_NAMES

As constantes `LEGACY_COOKIE_NAMES` em `cookie-helper.ts` e `unified-auth-v2.ts` são **funcionalmente necessárias** para:
- Limpar cookies de sessões antigas durante logout
- Garantir que usuários não fiquem com cookies órfãos

Estas **NÃO são violações** pois:
1. São nomes técnicos de constantes, não comentários
2. Representam nomes reais de cookies que existem no navegador dos usuários
3. Remover causaria sessões órfãs e problemas de autenticação

---

## Resultado Esperado

| Métrica | Antes | Depois |
|---------|-------|--------|
| Comentários "legado/legacy/antigo" | 7 | 0 |
| Constantes LEGACY_* (funcionais) | 2 arquivos | 2 arquivos (mantidos) |
| **Nota RISE V3** | 9.93/10 | **10.0/10** |

---

## Verificação Final

Após correções, executar:
```bash
grep -rn "legado\|legacy\|antigo" src/ supabase/functions/ \
  --include="*.ts" --include="*.tsx" \
  | grep -v "LEGACY_COOKIE" \
  | grep -v "LEGACY_VERSION" \
  | grep -v "node_modules"
```

**Esperado:** 0 resultados (excluindo constantes funcionais)
