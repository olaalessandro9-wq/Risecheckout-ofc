
# Plano: Restringir Botão "Validar Credenciais" para Admin/Owner

## Objetivo

O botão **"Validar Credenciais"** (ferramenta de debug/diagnóstico) deve aparecer **apenas para usuários com role `owner` ou `admin`**. Usuários comuns (`user`, `seller`) não devem ver esse botão.

---

## Solução

Usar a permissão `canAccessAdminPanel` do hook `usePermissions`, que retorna `true` apenas para `owner` e `admin`.

---

## Alteração no Código

**Arquivo:** `src/modules/utmify/components/ValidateCredentialsButton.tsx`

```typescript
// Adicionar import (linha ~23)
import { usePermissions } from "@/hooks/usePermissions";

// Adicionar hook no componente (linha ~59)
const { canAccessAdminPanel } = usePermissions();

// Modificar condição de exibição (linha ~97-100)
// ANTES:
if (!hasExistingToken) {
  return null;
}

// DEPOIS:
if (!hasExistingToken || !canAccessAdminPanel) {
  return null;
}
```

---

## Resultado

| Role | Token Existe | Vê Botão? |
|------|--------------|-----------|
| owner | Sim | ✅ SIM |
| admin | Sim | ✅ SIM |
| user | Sim | ❌ NÃO |
| seller | Sim | ❌ NÃO |
| qualquer | Não | ❌ NÃO |

---

## Arquivos Modificados

| Arquivo | Alteração |
|---------|-----------|
| `src/modules/utmify/components/ValidateCredentialsButton.tsx` | Adicionar verificação `canAccessAdminPanel` |
