

# Plano de Atualização: Documentação Multi-Subdomain (__Host-* → __Secure-*)

## Resumo Executivo

Este plano atualiza **toda** a documentação e comentários do projeto para refletir a migração de cookies `__Host-rise_*` para `__Secure-rise_*` com `Domain=.risecheckout.com`, atingindo compliance total com RISE Protocol V3 (10.0/10).

---

## Inventário Completo de Arquivos

### Auditoria Realizada

| Categoria | Arquivos Encontrados | Matches `__Host-rise` |
|-----------|---------------------|----------------------|
| **Documentação (`docs/`)** | 7 arquivos | ~35 ocorrências |
| **Frontend (`src/`)** | 3 arquivos | ~15 ocorrências |
| **Edge Functions (`supabase/functions/`)** | 10 arquivos | ~78 ocorrências |
| **TOTAL** | **20 arquivos** | **~128 ocorrências** |

---

## Arquivos a Modificar

### 1. Documentação Principal (`docs/`)

| Arquivo | Tipo de Mudança | Prioridade |
|---------|-----------------|------------|
| `docs/UNIFIED_AUTH_SYSTEM.md` | Atualizar tabela de cookies + diagramas | Alta |
| `docs/ARCHITECTURE.md` | Atualizar seção de cookies + diagrama ASCII | Alta |
| `docs/UNIFIED_IDENTITY_ARCHITECTURE.md` | Atualizar seção Cookies + diagrama | Alta |
| `docs/RELATORIO_MAE.md` | Atualizar referência a cookies | Média |
| `docs/RLS_SECURITY_TESTER.md` | Atualizar exemplo de curl com cookie | Média |

### 2. Frontend (`src/`)

| Arquivo | Tipo de Mudança | Prioridade |
|---------|-----------------|------------|
| `src/integrations/supabase/client.ts` | Atualizar comentário header | Alta |
| `src/lib/token-manager/unified-service.ts` | Atualizar comentário architecture | Alta |
| `src/lib/token-manager/service.ts` | Atualizar comentário | Média |

### 3. Edge Functions (`supabase/functions/`)

| Arquivo | Tipo de Mudança | Prioridade |
|---------|-----------------|------------|
| `_shared/README.md` | Atualizar tabela de cookies + compliance | Alta |
| `_shared/unified-auth.ts` | Atualizar comentário JSDoc | Alta |
| `decrypt-customer-data/index.ts` | Atualizar comentário SECURITY | Média |
| `decrypt-customer-data-batch/index.ts` | Atualizar comentário SECURITY | Média |
| `update-affiliate-settings/index.ts` | Atualizar comentário auth | Média |
| `buyer-profile/index.ts` | Atualizar comentário auth | Média |
| `members-area-quizzes/index.ts` | Atualizar comentário função | Média |
| `members-area-progress/index.ts` | Atualizar comentário | Média |
| `session-manager/index.ts` | Atualizar comentário Headers | Média |

---

## Mudanças Específicas por Arquivo

### docs/UNIFIED_AUTH_SYSTEM.md

**Linhas 33, 67-68, 160-161, 173, 240-243, 347:**

```text
ANTES:
| **Cookies** | `__Host-rise_access` e `__Host-rise_refresh` |
...
| `__Host-rise_access` | 60 min | httpOnly, Secure, SameSite=None, Partitioned, Path=/ |

DEPOIS:
| **Cookies** | `__Secure-rise_access` e `__Secure-rise_refresh` (Domain=.risecheckout.com) |
...
| `__Secure-rise_access` | 4h | httpOnly, Secure, SameSite=None, Domain=.risecheckout.com, Path=/ |
| `__Secure-rise_refresh` | 30 dias | httpOnly, Secure, SameSite=None, Domain=.risecheckout.com, Path=/ |
```

**Adicionar nota sobre multi-subdomain:**

```markdown
> **Arquitetura Multi-Subdomain (RISE V4):** Cookies usam `Domain=.risecheckout.com` 
> permitindo compartilhamento de sessão entre `app.risecheckout.com`, `pay.risecheckout.com`, 
> e `api.risecheckout.com`.
```

---

### docs/ARCHITECTURE.md

**Linhas 92, 103-104:**

```text
ANTES:
│ Set-Cookie: __Host-rise_access (httpOnly)
...
- `__Host-rise_access`: Token de acesso (60 min, httpOnly, Secure)
- `__Host-rise_refresh`: Token de refresh (30 dias, httpOnly, Secure)

DEPOIS:
│ Set-Cookie: __Secure-rise_access (httpOnly, Domain=.risecheckout.com)
...
- `__Secure-rise_access`: Token de acesso (4h, httpOnly, Secure, Domain=.risecheckout.com)
- `__Secure-rise_refresh`: Token de refresh (30 dias, httpOnly, Secure, Domain=.risecheckout.com)
```

---

### docs/UNIFIED_IDENTITY_ARCHITECTURE.md

**Linhas 95-96, 197-200:**

```text
ANTES:
│ __Host-rise_*   │
...
| `__Host-rise_access` | 60 min | Access token (httpOnly, Secure) |
| `__Host-rise_refresh` | 30 days | Refresh token (httpOnly, Secure) |

DEPOIS:
│ __Secure-rise_*  │
│ Domain=.risecheckout.com
...
| `__Secure-rise_access` | 4h | Access token (httpOnly, Secure, Domain=.risecheckout.com) |
| `__Secure-rise_refresh` | 30 days | Refresh token (httpOnly, Secure, Domain=.risecheckout.com) |
```

---

### supabase/functions/_shared/README.md

**Linhas 55-56, 157-158, 170:**

```text
ANTES:
| `__Host-rise_access` | 60 min | Access token (httpOnly, Secure) |
| `__Host-rise_refresh` | 30 dias | Refresh token (httpOnly, Secure) |
...
- ❌ `x-buyer-token` header - Substituído por cookie `__Host-rise_access`
- ❌ `x-producer-session-token` header - Substituído por cookie `__Host-rise_access`
...
| Cookie-based Auth | ✅ `__Host-rise_*` |

DEPOIS:
| `__Secure-rise_access` | 4h | Access token (httpOnly, Secure, Domain=.risecheckout.com) |
| `__Secure-rise_refresh` | 30 dias | Refresh token (httpOnly, Secure, Domain=.risecheckout.com) |
...
- ❌ `x-buyer-token` header - Substituído por cookie `__Secure-rise_access`
- ❌ `x-producer-session-token` header - Substituído por cookie `__Secure-rise_access`
...
| Cookie-based Auth | ✅ `__Secure-rise_*` (Domain=.risecheckout.com) |
```

---

### src/integrations/supabase/client.ts

**Linha 7:**

```typescript
// ANTES:
* - Authentication uses httpOnly cookies (__Host-rise_access, __Host-rise_refresh)

// DEPOIS:
* - Authentication uses httpOnly cookies (__Secure-rise_access, __Secure-rise_refresh) with Domain=.risecheckout.com
```

---

### supabase/functions/_shared/unified-auth.ts

**Linha 44:**

```typescript
// ANTES:
* Token source: Cookie `__Host-rise_access` (httpOnly)

// DEPOIS:
* Token source: Cookie `__Secure-rise_access` (httpOnly, Domain=.risecheckout.com)
```

---

### docs/RLS_SECURITY_TESTER.md

**Linhas 29, 74:**

```text
ANTES:
**Auth:** Cookie `__Host-rise_access` (requer autenticação via unified-auth)
...
-H "Cookie: __Host-rise_access=[token]"

DEPOIS:
**Auth:** Cookie `__Secure-rise_access` (requer autenticação via unified-auth)
...
-H "Cookie: __Secure-rise_access=[token]"
```

---

### Edge Functions (Comentários Inline)

**Padrão de atualização para todos os arquivos de Edge Functions:**

```typescript
// ANTES:
// RISE V3: Use unified auth - validates via sessions table + __Host-rise_access cookie

// DEPOIS:
// RISE V3: Use unified auth - validates via sessions table + __Secure-rise_access cookie (Domain=.risecheckout.com)
```

Arquivos afetados:
- `decrypt-customer-data/index.ts` (linhas 7, 129)
- `decrypt-customer-data-batch/index.ts` (linhas 7, 106)
- `update-affiliate-settings/index.ts` (linha 111)
- `buyer-profile/index.ts` (linha 33)
- `members-area-quizzes/index.ts` (linhas 90, 286)
- `members-area-progress/index.ts` (linha 51)
- `session-manager/index.ts` (linha 21)

---

## Verificação Adicional: cookie-helper.ts

O arquivo `cookie-helper.ts` mantém referências aos nomes antigos em `LEGACY_COOKIE_NAMES.v3` para **compatibilidade durante transição** (leitura de cookies antigos). Isso é **correto e intencional**, não é código morto.

```typescript
// ✅ CORRETO: Mantido para fallback de leitura durante transição
LEGACY_COOKIE_NAMES: {
  v3: {
    access: "__Host-rise_access",   // Para ler cookies antigos
    refresh: "__Host-rise_refresh", // Para ler cookies antigos
  },
}
```

---

## Ordem de Execução

```text
1. [Documentação] docs/UNIFIED_AUTH_SYSTEM.md
   ↓
2. [Documentação] docs/ARCHITECTURE.md
   ↓
3. [Documentação] docs/UNIFIED_IDENTITY_ARCHITECTURE.md
   ↓
4. [Documentação] docs/RELATORIO_MAE.md
   ↓
5. [Documentação] docs/RLS_SECURITY_TESTER.md
   ↓
6. [Documentação] supabase/functions/_shared/README.md
   ↓
7. [Código] supabase/functions/_shared/unified-auth.ts
   ↓
8. [Código] src/integrations/supabase/client.ts
   ↓
9. [Código] src/lib/token-manager/unified-service.ts
   ↓
10. [Código] src/lib/token-manager/service.ts
   ↓
11. [Edge Functions] Atualizar comentários inline (7 arquivos)
```

---

## Resultado Final

Após implementação:

| Critério | Antes | Depois |
|----------|-------|--------|
| Referências a `__Host-rise_*` | ~128 | 0 (exceto fallback intencional) |
| Documentação Atualizada | Parcial | 100% |
| Comentários Consistentes | Não | Sim |
| Score RISE V3 | 9.8/10 | **10.0/10** |

---

## Seção Técnica: Novo Formato de Cookie (Referência)

```text
__Secure-rise_access=TOKEN; Max-Age=14400; Path=/; Domain=.risecheckout.com; HttpOnly; Secure; SameSite=None

__Secure-rise_refresh=TOKEN; Max-Age=2592000; Path=/; Domain=.risecheckout.com; HttpOnly; Secure; SameSite=None
```

**Diferenças do formato anterior:**
- `__Host-` → `__Secure-` (permite Domain)
- `Max-Age=3600` → `Max-Age=14400` (4 horas)
- Adicionado `Domain=.risecheckout.com`
- Removido `Partitioned` (incompatível com Domain)

