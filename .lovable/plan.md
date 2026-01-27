
# Plano de Correção: FK Incorreta + Fallback de Login

## 1. Diagnóstico Real (Dados Verificados via SQL)

| Verificação | Resultado |
|-------------|-----------|
| `sandro098@gmail.com` em `public.users` | ✅ Existe (ID: `c6e2e08d-...`) |
| `sandro098@gmail.com` em `auth.users` | ❌ NÃO existe |
| `sandro098@gmail.com` em `user_roles` | ❌ VAZIO |
| FK `user_roles_user_id_fkey` | ❌ Aponta para `auth.users(id)` |
| FK `sessions.user_id` | ✅ Aponta para `users(id)` (correto) |
| `profiles` para `sandro098` | ❌ NÃO existe |
| Sessões válidas | 2 (uma `user`, uma `buyer`) |

## 2. Causa Raiz Identificada

O sistema RiseCheckout usa **`public.users`** como SSOT (Single Source of Truth), mas a Foreign Key em `user_roles` ainda aponta para **`auth.users`** (tabela do Supabase Auth nativo, que NÃO é utilizada).

Quando `register.ts` executa:
```typescript
await supabase.from("user_roles").insert({ user_id: newUser.id, role: "user" });
```

O INSERT falha silenciosamente porque `newUser.id` não existe em `auth.users`. O usuário é criado em `users`, mas fica SEM ROLE.

No login subsequente (`login.ts`):
1. Busca roles de `user_roles` → retorna vazio
2. Adiciona `buyer` como fallback
3. `activeRole = "buyer"` (porque não há roles de produtor)
4. Redireciona para `/minha-conta/dashboard`

## 3. Análise de Soluções (RISE V3 4.4 - Obrigatório)

### Solução A: Corrigir FK + Fallback Inteligente no Login

**Alterações:**
1. **Migration SQL:** Alterar FK para apontar para `public.users(id)`
2. **Migration SQL:** Atribuir role `seller` para usuários sem role (baseado em `registration_source`)
3. **`register.ts`:** Adicionar tratamento de erro no INSERT de role
4. **`login.ts`:** Adicionar lógica de fallback inteligente para usuários sem role

- Manutenibilidade: 10/10 (corrige na raiz)
- Zero DT: 10/10 (elimina o problema completamente)
- Arquitetura: 10/10 (FK correta = integridade referencial)
- Escalabilidade: 10/10
- Segurança: 10/10
- **NOTA FINAL: 10.0/10**
- Tempo estimado: 1 hora

### Solução B: Remover FK e confiar no código

- Manutenibilidade: 5/10
- Zero DT: 6/10
- Arquitetura: 4/10
- Escalabilidade: 7/10
- Segurança: 6/10
- **NOTA FINAL: 5.6/10**
- Tempo estimado: 15 minutos

### DECISÃO: Solução A (Nota 10.0/10)

## 4. Plano de Implementação

### Fase 1: Migration SQL

```sql
-- 1. Remover FK antiga (aponta para auth.users)
ALTER TABLE public.user_roles 
DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;

-- 2. Adicionar FK correta (aponta para public.users)
ALTER TABLE public.user_roles 
ADD CONSTRAINT user_roles_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- 3. Atribuir role 'seller' para usuários sem role
-- (Conforme definido: seller para todos no cadastro via /cadastro)
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'seller'::app_role
FROM public.users u
WHERE u.registration_source IN ('organic', 'affiliate', 'producer')
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = u.id
  );
```

### Fase 2: Corrigir `register.ts`

**Arquivo:** `supabase/functions/unified-auth/handlers/register.ts`

**Alterações:**
1. Manter `registrationType` como está (produtor ou buyer)
2. Atribuir role `seller` para TODOS que vêm de `/cadastro`
3. Adicionar tratamento de erro no INSERT de role
4. Fazer rollback se role falhar

```typescript
// ANTES (linha 80-96)
if (registrationType === "producer") {
  roles.push("user");
  await supabase.from("user_roles").insert({
    user_id: newUser.id,
    role: "user",
  });
}

// DEPOIS
// Cadastro via /cadastro = sempre recebe role seller
// Origem (producer/affiliate) é apenas marcação interna
if (registrationType === "producer" || registrationType === "affiliate") {
  const { error: roleError } = await supabase.from("user_roles").insert({
    user_id: newUser.id,
    role: "seller",
  });
  
  if (roleError) {
    log.error("Failed to assign role:", roleError.message);
    // Rollback: deletar usuário criado
    await supabase.from("users").delete().eq("id", newUser.id);
    return errorResponse("Erro ao configurar permissões", corsHeaders, 500);
  }
  
  roles.push("seller");
}
```

### Fase 3: Corrigir `login.ts`

**Arquivo:** `supabase/functions/unified-auth/handlers/login.ts`

**Alterações:**
1. Adicionar fallback inteligente para usuários sem role
2. Se `registration_source` indica produtor/afiliado, atribuir `seller` retroativamente
3. Priorizar roles de produtor quando login é via `/auth`

```typescript
// ADICIONAR após linha 93 (após buscar roles)
// RISE V3: Fallback para usuários sem role (migracao de dados antigos)
if (roles.length === 1 && roles[0] === "buyer") {
  const { data: userData } = await supabase
    .from("users")
    .select("registration_source")
    .eq("id", user.id)
    .single();
  
  // Se registrou como produtor/afiliado mas não tem role, atribuir seller
  if (userData?.registration_source === "organic" || 
      userData?.registration_source === "affiliate") {
    const { error: roleError } = await supabase.from("user_roles").insert({
      user_id: user.id,
      role: "seller",
    });
    
    if (!roleError) {
      roles.push("seller");
      log.info("Auto-assigned seller role based on registration_source", {
        userId: user.id,
        source: userData.registration_source,
      });
    }
  }
}

// ALTERAR linha 109-112
// Priorizar roles de produtor quando há roles disponíveis
} else if (roles.some(r => ["owner", "admin", "user", "seller"].includes(r))) {
  activeRole = roles.find(r => ["owner", "admin", "user", "seller"].includes(r)) || "seller";
}
```

### Fase 4: Corrigir Sessões Existentes (Opcional)

```sql
-- Atualizar sessões ativas com role errada
UPDATE public.sessions s
SET active_role = 'seller'
FROM public.users u
WHERE s.user_id = u.id
  AND u.registration_source IN ('organic', 'affiliate')
  AND s.active_role = 'buyer'
  AND s.is_valid = true;
```

## 5. Arquivos a Modificar

| Arquivo | Ação |
|---------|------|
| **Migration SQL** | Corrigir FK + atribuir roles |
| `supabase/functions/unified-auth/handlers/register.ts` | Atribuir `seller` + tratamento de erro |
| `supabase/functions/unified-auth/handlers/login.ts` | Fallback inteligente |

## 6. Resultado Esperado

```text
┌─────────────────────────────────────────────────────────────┐
│  FLUXO CORRIGIDO                                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Cadastro via /cadastro:                                  │
│     → Cria user em public.users                             │
│     → FK agora aponta para public.users                     │
│     → INSERT em user_roles SUCEDE                           │
│     → role = "seller" (para todos)                          │
│     → registration_source = "organic" ou "affiliate"        │
│                                                              │
│  2. Login via /auth:                                         │
│     → Busca roles de user_roles                             │
│     → roles = ["seller", "buyer"]                           │
│     → activeRole = "seller" (produtor-type priority)        │
│     → Redireciona para /dashboard                           │
│                                                              │
│  3. UserAvatar:                                              │
│     → canSwitchToProducer = true                            │
│     → Opção de trocar contexto visível                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 7. Validação Pós-Deploy

1. Verificar FK aponta para `public.users`:
   ```sql
   SELECT pg_get_constraintdef(c.oid) FROM pg_constraint c 
   WHERE conname = 'user_roles_user_id_fkey';
   ```

2. Verificar `sandro098@gmail.com` tem role `seller`

3. Criar nova conta via `/cadastro` → verificar role `seller` atribuída

4. Login em `/auth` → verificar redirect para `/dashboard`

5. Verificar menu mostra opção de trocar contexto

## 8. Seção Técnica

### Interface Atualizada (register.ts)

```typescript
interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
  phone?: string;
  registrationType?: "producer" | "affiliate" | "buyer";
}
```

### Mapeamento Final

| registrationType | role em user_roles | registration_source | activeRole no login |
|------------------|-------------------|---------------------|---------------------|
| `"producer"` | `seller` | `organic` | `seller` |
| `"affiliate"` | `seller` | `affiliate` | `seller` |
| `"buyer"` | (nenhuma) | `checkout` | `buyer` |

### Deploy Order

1. Executar Migration SQL (FK + roles)
2. Deploy Edge Function `unified-auth`
3. Testar fluxo completo
