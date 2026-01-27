

# Plano: Otimização de Performance do Auto-Save de Ofertas

## Diagnóstico Completo

### Análise do Fluxo Atual

O auto-save passa por várias etapas que acumulam latência:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                          FLUXO ATUAL (LATENTE)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. Frontend: useAutoSaveOffer detecta mudança                              │
│     └── Debounce: 1000ms ⏱️                                                 │
│     │                                                                        │
│     ▼                                                                        │
│  2. api.call() → Cloudflare Worker (api.risecheckout.com)                   │
│     └── Latência de rede + cold start Worker: ~100-300ms                    │
│     │                                                                        │
│     ▼                                                                        │
│  3. Cloudflare Worker proxeia para Supabase Edge Function                   │
│     └── Outra hop de rede: ~50-100ms                                        │
│     │                                                                        │
│     ▼                                                                        │
│  4. Edge Function: offer-crud (cold start: ~114ms segundo logs)             │
│     │                                                                        │
│     ▼                                                                        │
│  5. Autenticação: unified-auth-v2.validateSessionToken()                    │
│     ├── Query 1: sessions table (~50-100ms)                                 │
│     ├── Query 2: users table (~50-100ms)                                    │
│     └── Query 3: user_roles table (~50-100ms)                               │
│     │                                                                        │
│     ▼                                                                        │
│  6. Ownership check: verifyOfferOwnership()                                 │
│     └── Query 4: offers JOIN products (~50-100ms)                           │
│     │                                                                        │
│     ▼                                                                        │
│  7. Update: handleUpdateOffer()                                              │
│     └── Query 5: UPDATE offers (~50-100ms)                                  │
│     │                                                                        │
│     ▼                                                                        │
│  8. Resposta retorna pelo caminho inverso                                   │
│                                                                              │
│  TOTAL ESTIMADO: 1s debounce + 2-8s processamento = 3-9 segundos           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Evidências dos Logs

```
2026-01-27T17:43:03Z LOG booted (time: 114ms)       ← Cold start
2026-01-27T17:43:08Z INFO Action: update            ← Request chegou
2026-01-27T17:43:10Z INFO Offer updated             ← Update completo (2s)
```

### Principais Gargalos Identificados

| Gargalo | Latência Est. | Causa Raiz |
|---------|---------------|------------|
| Cold Start Edge Function | 100-200ms | Função "dorme" após inatividade |
| Auth: 3 queries sequenciais | 150-300ms | `sessions` + `users` + `user_roles` |
| Ownership: 1 query JOIN | 50-100ms | `offers JOIN products` |
| API Gateway hop | 50-200ms | Cloudflare → Supabase |

---

## Análise de Soluções

### Solução A: Otimização de Queries + Cache de Sessão
- **Manutenibilidade:** 9/10 - Mudanças focadas e isoladas
- **Zero DT:** 10/10 - Melhora código existente
- **Arquitetura:** 10/10 - Segue padrões RISE V3
- **Escalabilidade:** 9/10 - Queries mais eficientes beneficiam todo o sistema
- **Segurança:** 10/10 - Mantém todas as validações
- **NOTA FINAL: 9.6/10**
- **Tempo estimado:** 4-6 horas

**Como funciona:**
1. **Query única para autenticação:** Juntar as 3 queries de auth em 1 usando JOIN
2. **Otimizar ownership check:** Combinar verificação de ownership com update em uma operação
3. **Reduzir debounce:** De 1000ms para 500ms (UX mais responsiva)

### Solução B: Optimistic UI + Background Save
- **Manutenibilidade:** 8/10 - Adiciona complexidade de rollback
- **Zero DT:** 7/10 - Precisa de lógica de rollback
- **Arquitetura:** 8/10 - Adiciona camada de complexidade
- **Escalabilidade:** 8/10 - Não resolve o problema de backend
- **Segurança:** 9/10 - Mantém validações, mas com delay
- **NOTA FINAL: 8.0/10**
- **Tempo estimado:** 6-8 horas

### Solução C: Edge Function Dedicada para Micro-Updates
- **Manutenibilidade:** 8/10 - Mais uma função para manter
- **Zero DT:** 8/10 - Código específico
- **Arquitetura:** 7/10 - Duplicação de lógica
- **Escalabilidade:** 8/10 - Função leve mas específica
- **Segurança:** 10/10 - Mesmas validações
- **NOTA FINAL: 8.2/10**
- **Tempo estimado:** 4-5 horas

---

## DECISÃO: Solução A (Nota 9.6/10)

A Solução A é superior porque:
1. **Resolve a causa raiz:** Queries ineficientes no backend
2. **Beneficia todo o sistema:** Não apenas auto-save
3. **Zero código novo:** Otimiza código existente
4. **Mantém arquitetura:** Segue RISE V3 rigorosamente

---

## Implementação Técnica

### 1. MODIFICAR: `unified-auth-v2.ts` - Query Única para Auth

**Antes (3 queries sequenciais):**
```typescript
// Query 1: sessions
const { data: session } = await supabase.from("sessions").select(...);
// Query 2: users
const { data: user } = await supabase.from("users").select(...);
// Query 3: user_roles
const { data: userRoles } = await supabase.from("user_roles").select(...);
```

**Depois (1 query com JOINs):**
```typescript
const { data: sessionWithUser } = await supabase
  .from("sessions")
  .select(`
    id, user_id, active_role, access_token_expires_at, is_valid,
    users!inner(id, email, name, timezone, is_active),
    user_roles:user_id(role)
  `)
  .eq("session_token", token)
  .eq("is_valid", true)
  .single();
```

**Economia estimada:** ~100-200ms por request

### 2. MODIFICAR: `offer-crud-handlers.ts` - Ownership + Update em 1 Operação

**Antes (2 operações):**
```typescript
// Operação 1: verifyOfferOwnership
const ownershipCheck = await verifyOfferOwnership(supabase, offerId, producerId);

// Operação 2: handleUpdateOffer
const { data } = await supabase.from("offers").update(updates).eq("id", offerId);
```

**Depois (1 operação com WHERE composto):**
```typescript
// Update com verificação de ownership integrada
const { data, error } = await supabase
  .from("offers")
  .update({ ...updates, updated_at: new Date().toISOString() })
  .eq("id", offerId)
  .eq("products.user_id", producerId) // Ownership check no WHERE
  .select(`id, product_id, products!inner(user_id)`)
  .single();

// Se não retornou dados, ou não é dono ou oferta não existe
if (!data) return forbiddenResponse();
```

**Economia estimada:** ~50-100ms por request

### 3. MODIFICAR: `useAutoSaveOffer.ts` - Reduzir Debounce

**Antes:**
```typescript
debounceMs = 1000 // 1 segundo
```

**Depois:**
```typescript
debounceMs = 500 // 500ms - UX mais responsiva
```

**Economia:** 500ms na percepção do usuário

---

## Fluxo Otimizado

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                          FLUXO OTIMIZADO                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. Frontend: useAutoSaveOffer detecta mudança                              │
│     └── Debounce: 500ms ⏱️ (era 1000ms)                                    │
│     │                                                                        │
│     ▼                                                                        │
│  2. api.call() → Cloudflare → Edge Function                                 │
│     └── Latência: ~200-400ms (inalterado)                                   │
│     │                                                                        │
│     ▼                                                                        │
│  3. Auth: 1 query unificada                                                 │
│     └── sessions JOIN users, user_roles: ~100ms (era 300ms)                 │
│     │                                                                        │
│     ▼                                                                        │
│  4. Update com ownership check integrado                                    │
│     └── UPDATE with WHERE: ~100ms (era 200ms)                               │
│     │                                                                        │
│     ▼                                                                        │
│  5. Resposta retorna                                                         │
│                                                                              │
│  TOTAL ESTIMADO: 500ms debounce + 1-2s processamento = 1.5-2.5 segundos    │
│                                                                              │
│  ECONOMIA: ~5-6 segundos → ~2 segundos (redução de ~60-70%)                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Alterações por Arquivo

| Arquivo | Ação | Mudança |
|---------|------|---------|
| `supabase/functions/_shared/unified-auth-v2.ts` | MODIFICAR | `validateSessionToken()` - Query única com JOINs |
| `supabase/functions/_shared/offer-crud-handlers.ts` | MODIFICAR | `handleUpdateOffer()` - Update com WHERE composto |
| `src/components/products/offers-manager/useAutoSaveOffer.ts` | MODIFICAR | `debounceMs = 500` |

---

## Detalhes Técnicos

### Nova Query de Auth (unified-auth-v2.ts)

```typescript
async function validateSessionToken(
  supabase: SupabaseClient,
  token: string
): Promise<UnifiedUser | null> {
  const now = new Date().toISOString();
  
  // OTIMIZAÇÃO: Query única com JOINs
  const { data: sessionData, error } = await supabase
    .from("sessions")
    .select(`
      id, 
      user_id, 
      active_role, 
      access_token_expires_at, 
      is_valid,
      users!inner(
        id, 
        email, 
        name, 
        timezone, 
        is_active
      )
    `)
    .eq("session_token", token)
    .eq("is_valid", true)
    .gt("access_token_expires_at", now)
    .single();
  
  if (error || !sessionData?.users) {
    return null;
  }
  
  const user = Array.isArray(sessionData.users) 
    ? sessionData.users[0] 
    : sessionData.users;
    
  if (!user.is_active) {
    return null;
  }
  
  // Query separada para roles (necessária por ser array)
  const { data: userRoles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);
  
  const roles = (userRoles || []).map(r => r.role as AppRole);
  if (!roles.includes("buyer")) roles.push("buyer");
  
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    timezone: user.timezone,
    roles,
    activeRole: sessionData.active_role as AppRole,
  };
}
```

### Novo Update Handler (offer-crud-handlers.ts)

```typescript
export async function handleUpdateOffer(
  supabase: SupabaseClient,
  producerId: string,
  offerId: string,
  updates: Partial<OfferCreatePayload>,
  corsHeaders: Record<string, string>
): Promise<Response> {
  // OTIMIZAÇÃO: Update + Ownership check em uma operação
  // O JOIN com products garante que só atualiza se o producer for dono
  const { data: updatedOffer, error: updateError, count } = await supabase
    .from("offers")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", offerId)
    .in("product_id", 
      supabase
        .from("products")
        .select("id")
        .eq("user_id", producerId)
    )
    .select()
    .maybeSingle();

  // Se não encontrou, ou não é dono ou oferta não existe
  if (!updatedOffer && !updateError) {
    return new Response(
      JSON.stringify({ success: false, error: "Oferta não encontrada ou sem permissão" }), 
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (updateError) {
    log.error("Update error", updateError);
    return new Response(
      JSON.stringify({ success: false, error: "Erro ao atualizar oferta" }), 
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  log.info(`Offer updated: ${offerId}`);
  return new Response(
    JSON.stringify({ success: true, offer: updatedOffer }), 
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
```

---

## Resultados Esperados

| Métrica | Antes | Depois | Melhoria |
|---------|-------|--------|----------|
| Tempo total percebido | 8-9s | 2-3s | ~70% mais rápido |
| Queries de auth | 3 | 2 | 33% menos queries |
| Queries de update | 2 | 1 | 50% menos queries |
| Debounce | 1000ms | 500ms | UX mais responsiva |

---

## Conformidade RISE V3

| Critério | Status |
|----------|--------|
| Manutenibilidade Infinita | Queries mais simples de manter |
| Zero Dívida Técnica | Otimiza código existente |
| Arquitetura Correta | Mantém separação de responsabilidades |
| Escalabilidade | Menos carga no banco |
| Segurança | Mesmas validações, apenas otimizadas |
| Limite 300 linhas | Arquivos mantêm-se dentro do limite |

