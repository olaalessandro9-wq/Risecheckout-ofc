

# Plano de Ação: Eliminação Total do Código Legado `auth.users`

## 📊 Análise de Soluções (RISE V3 Mandatório)

### Solução A: Eliminação Completa com Reescrita Total
- **Manutenibilidade:** 10/10 - Zero referências a sistema abandonado
- **Zero DT:** 10/10 - Elimina 100% da dívida técnica
- **Arquitetura:** 10/10 - Single Source of Truth absoluto (tabela `users`)
- **Escalabilidade:** 10/10 - Sem dependências de sistema externo
- **Segurança:** 10/10 - Sem pontos de falha por tabela vazia
- **NOTA FINAL: 10.0/10**
- **Tempo estimado:** 1-2 dias

### Solução B: Migração Gradual com Fallbacks
- **Manutenibilidade:** 6/10 - Mantém código de fallback
- **Zero DT:** 4/10 - Cria mais dívida técnica
- **Arquitetura:** 5/10 - Viola Single Source of Truth
- **Escalabilidade:** 6/10 - Complexidade desnecessária
- **Segurança:** 7/10 - Pontos de falha ocultos
- **NOTA FINAL: 5.6/10**
- **Tempo estimado:** 30 minutos

### DECISÃO: Solução A (Nota 10.0)
**Justificativa:** A Solução B seria "rápida" mas criaria mais dívida técnica e violaria o RISE Protocol V3. Não existe justificativa para manter código que consulta uma tabela abandonada.

---

## 📋 Inventário de Código Legado a Eliminar

### Edge Functions
| Arquivo | Problema | Ação |
|---------|----------|------|
| `get-users-with-emails/index.ts` | Usa `auth.admin.listUsers()` | DELETAR inteiramente |
| `_shared/user-sync.ts` | Consulta `auth.users` via RPC | DELETAR inteiramente |
| `_shared/test-helpers.ts` | Usa `auth.admin.createUser/deleteUser` | REESCREVER para usar `users` |
| `create-order/handlers/affiliate/index.ts` | Usa `auth.admin.getUserById()` | CORRIGIR para usar `users` |

### RPC Functions (SQL)
| Função | Problema | Ação |
|--------|----------|------|
| `get_auth_user_by_email` | Consulta `auth.users` | DROPAR |
| `get_user_email` | Consulta `auth.users` | REESCREVER para usar `users` |

### Frontend
| Arquivo | Problema | Ação |
|---------|----------|------|
| `src/modules/admin/context/adminFetchers.ts` | Chama função obsoleta | REMOVER chamada |
| `src/lib/rpc/rpcProxy.ts` | Exporta função obsoleta | REMOVER export |
| `supabase/functions/rpc-proxy/index.ts` | Lista RPC obsoleto | REMOVER da lista |

### Documentação
| Arquivo | Problema | Ação |
|---------|----------|------|
| `docs/EDGE_FUNCTIONS_REGISTRY.md` | Lista função obsoleta | ATUALIZAR |

---

## 🔧 Plano de Execução (14 Passos)

### Fase 1: Eliminação de Edge Functions Legadas

**Passo 1:** Deletar `supabase/functions/get-users-with-emails/` (pasta inteira)
- Esta função é 100% inútil - consulta tabela abandonada
- Nenhuma funcionalidade será perdida - os emails já estão na tabela `users`

**Passo 2:** Deletar `supabase/functions/_shared/user-sync.ts`
- Módulo de "sincronização" entre `auth.users` e `users` é obsoleto
- O sistema Unified Auth já cria usuários diretamente em `users`
- Nenhuma outra função importa este módulo (confirmado via busca)

### Fase 2: Correção de Dependências Remanescentes

**Passo 3:** Corrigir `create-order/handlers/affiliate/index.ts`
- Função `checkSelfReferral` usa `auth.admin.getUserById()`
- Reescrever para buscar email diretamente da tabela `users`

**Passo 4:** Reescrever `_shared/test-helpers.ts`
- Remover uso de `auth.admin.createUser()`
- Remover uso de `auth.admin.deleteUser()`
- Usar tabela `users` como SSOT
- Remover referências a tabela `profiles` (também legada)

### Fase 3: Limpeza do Frontend

**Passo 5:** Atualizar `src/modules/admin/context/adminFetchers.ts`
- Remover chamada a `get-users-with-emails`
- O handler `getUsersWithMetrics` já retorna dados da tabela `users`
- Adicionar campo `email` na query de `users` no backend

**Passo 6:** Atualizar `admin-data/handlers/users.ts`
- Modificar `getUsersWithMetrics` para incluir `email` no select
- Isso elimina necessidade de função separada para emails

**Passo 7:** Atualizar `src/lib/rpc/rpcProxy.ts`
- Remover export `getUserEmailRpc`
- Função não será mais necessária

**Passo 8:** Atualizar `supabase/functions/rpc-proxy/index.ts`
- Remover `get_user_email` da lista `PRODUCER_RPCS`

### Fase 4: Limpeza do Banco de Dados (Scripts SQL)

**Passo 9:** Criar migration para dropar `get_auth_user_by_email`

```sql
DROP FUNCTION IF EXISTS public.get_auth_user_by_email(text);
```

**Passo 10:** Criar migration para reescrever `get_user_email`

```sql
-- Reescrever para usar tabela 'users' (SSOT)
CREATE OR REPLACE FUNCTION get_user_email(user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_email text;
BEGIN
  SELECT email INTO user_email
  FROM users
  WHERE id = user_id;
  
  RETURN user_email;
END;
$$;
```

### Fase 5: Atualização de Documentação

**Passo 11:** Atualizar `docs/EDGE_FUNCTIONS_REGISTRY.md`
- Remover `get-users-with-emails` da lista
- Atualizar contagem de funções (106 → 105)

### Fase 6: Undeploy de Função Obsoleta

**Passo 12:** Deletar `get-users-with-emails` do Supabase
- Usar ferramenta de delete de edge functions

### Fase 7: Validação Final

**Passo 13:** Buscar qualquer referência remanescente
- Grep por `auth.users`, `auth.admin`, `listUsers`, `getUserById`
- Garantir zero ocorrências (exceto em arquivos de migration históricos)

**Passo 14:** Testar fluxos críticos
- Login de producer
- Listagem de usuários no admin
- Criação de pedido com afiliado

---

## 📁 Resumo de Arquivos Afetados

### Arquivos a DELETAR
```text
supabase/functions/get-users-with-emails/       (pasta inteira)
supabase/functions/_shared/user-sync.ts
```

### Arquivos a MODIFICAR
```text
supabase/functions/create-order/handlers/affiliate/index.ts
supabase/functions/_shared/test-helpers.ts
supabase/functions/rpc-proxy/index.ts
supabase/functions/admin-data/handlers/users.ts
src/modules/admin/context/adminFetchers.ts
src/lib/rpc/rpcProxy.ts
docs/EDGE_FUNCTIONS_REGISTRY.md
```

### Migrations SQL a CRIAR
```text
supabase/migrations/XXXXXX_drop_legacy_auth_functions.sql
```

---

## ⚠️ Seção Técnica Detalhada

### Por que `user-sync.ts` pode ser deletado?
O módulo foi criado para "sincronizar" usuários que existiam em `auth.users` mas não em `users`. Com a migração completa para Unified Auth, todos os novos usuários são criados diretamente em `users`. A tabela `auth.users` está abandonada e vazia (após a limpeza que você executou).

### Por que `get-users-with-emails` pode ser deletado?
Esta função buscava emails em `auth.users` para o painel admin. Como a tabela `users` já possui a coluna `email`, basta modificar `getUsersWithMetrics` para incluir o email no retorno.

### Como `checkSelfReferral` será corrigido?
Atualmente usa `auth.admin.getUserById()` para verificar se afiliado e comprador são a mesma pessoa. Será reescrito para:

```typescript
async function checkSelfReferral(
  supabase: SupabaseClient,
  userId: string,
  customerEmail: string
): Promise<boolean> {
  const { data } = await supabase
    .from("users")
    .select("email")
    .eq("id", userId)
    .single();
  
  return data?.email?.toLowerCase() === customerEmail.toLowerCase();
}
```

### Sobre `test-helpers.ts`
Este módulo ainda usa `auth.admin.createUser` para testes de integração. Será reescrito para criar usuários diretamente na tabela `users` com senha hasheada, usando o mesmo método do registro normal.

---

## ✅ Resultado Esperado

Após execução do plano:

| Métrica | Antes | Depois |
|---------|-------|--------|
| Referências a `auth.users` em código ativo | 4 arquivos | 0 |
| Referências a `auth.admin` | 3 arquivos | 0 |
| RPC functions consultando `auth.users` | 2 | 0 |
| Edge Functions obsoletas | 1 | 0 |
| Single Source of Truth | Violado | ✅ 100% `users` |
| RISE V3 Compliance | Parcial | ✅ Total |

