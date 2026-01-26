
# Plano de Implementação: Multi-Subdomain Architecture

## Resumo Executivo

Este plano implementa a arquitetura de cookies compartilhados via domínio `.risecheckout.com`, permitindo que sessões sejam compartilhadas entre subdomínios como `app.risecheckout.com`, `pay.risecheckout.com`, e `api.risecheckout.com`.

---

## Contexto Técnico

### Problema Atual

Os cookies atuais usam o prefixo `__Host-`, que:
- **Impede** o atributo `Domain=`
- **Isola** cookies por subdomínio
- **Bloqueia** compartilhamento de sessão entre `app.risecheckout.com` e `pay.risecheckout.com`

### Solução

Migrar de cookies `__Host-` para cookies com `Domain=.risecheckout.com`, permitindo compartilhamento entre todos os subdomínios enquanto mantém segurança via `Secure` e `HttpOnly`.

---

## Arquivos a Modificar

### Backend (Edge Functions)

| Arquivo | Tipo de Mudança |
|---------|-----------------|
| `supabase/functions/_shared/cookie-helper.ts` | Renomear cookies + adicionar `Domain` |
| `supabase/functions/_shared/unified-auth-v2.ts` | Importar constante + atualizar funções de cookie |

### Frontend

| Arquivo | Tipo de Mudança |
|---------|-----------------|
| `src/config/supabase.ts` | URL → `api.risecheckout.com` |
| `src/lib/api/client.ts` | Já usa `SUPABASE_URL` - mudança automática |
| `src/lib/api/public-client.ts` | Já usa `SUPABASE_URL` - mudança automática |
| `src/integrations/supabase/client.ts` | Manter URL direto do Supabase (não muda) |

---

## Detalhes de Implementação

### 1. cookie-helper.ts (Backend)

**Mudanças:**

```text
ANTES:
- Cookie names: "__Host-rise_access", "__Host-rise_refresh"
- Sem atributo Domain
- Com atributo Partitioned

DEPOIS:
- Cookie names: "__Secure-rise_access", "__Secure-rise_refresh"
- Com Domain=.risecheckout.com
- Sem Partitioned (conflita com Domain)
```

**Novas constantes:**

```typescript
export const COOKIE_DOMAIN = ".risecheckout.com";

export const COOKIE_NAMES = {
  access: "__Secure-rise_access",
  refresh: "__Secure-rise_refresh",
} as const;
```

**Função `createSecureCookie` atualizada:**

- Adicionar parâmetro opcional `domain?: string`
- Incluir `Domain=` quando definido
- Remover `Partitioned` quando `Domain` está presente

**Cookies de logout:**

- Limpar TODOS os nomes antigos (`__Host-*`) + novos (`__Secure-*`)
- Isso garante transição suave para usuários com sessões ativas

### 2. unified-auth-v2.ts (Backend)

**Mudanças:**

- Importar `COOKIE_DOMAIN` de `cookie-helper.ts`
- Atualizar `createUnifiedAuthCookies` para passar o domain
- Atualizar `createUnifiedLogoutCookies` para limpar todos os formatos

### 3. src/config/supabase.ts (Frontend)

**Mudança:**

```typescript
// ANTES
export const SUPABASE_URL = "https://wivbtmtgpsxupfjwwovf.supabase.co";

// DEPOIS
export const SUPABASE_URL = "https://api.risecheckout.com";
```

A anon key permanece a mesma (não muda).

### 4. src/integrations/supabase/client.ts (Frontend)

**Sem mudanças** - este cliente usa URL direto do Supabase para operações internas e não precisa passar pelo proxy.

---

## Secrets da Cloudflare (Já Configurados)

O Worker já configurado no Cloudflare:
- Route: `api.risecheckout.com/*`
- Target: `wivbtmtgpsxupfjwwovf.supabase.co`

## CORS (Validação)

Adicionar `https://risecheckout.com` ao secret `CORS_ALLOWED_ORIGINS` no Supabase se ainda não estiver lá (deve incluir todos os subdomínios que farão requests autenticados).

---

## Ordem de Execução

```text
1. [Backend] Atualizar cookie-helper.ts
   ↓
2. [Backend] Atualizar unified-auth-v2.ts
   ↓
3. [Frontend] Atualizar src/config/supabase.ts
   ↓
4. Deploy automático das Edge Functions
   ↓
5. Testar login/logout em risecheckout.com
```

---

## Impacto e Rollback

### Impacto em Sessões Existentes

- Usuários logados com cookies `__Host-*` precisarão fazer login novamente
- Isto é esperado e aceitável pois é uma mudança de arquitetura

### Rollback (Se Necessário)

Se houver problemas:
1. Reverter `src/config/supabase.ts` para URL original
2. Reverter `cookie-helper.ts` para nomes `__Host-*`
3. Deploy

---

## Resultado Final

Após implementação:

| Subdomínio | Função | Compartilha Sessão |
|------------|--------|-------------------|
| `api.risecheckout.com` | Proxy para Supabase Edge Functions | ✅ |
| `app.risecheckout.com` | Dashboard do Produtor | ✅ |
| `pay.risecheckout.com` | Checkout Público | ✅ |
| `*.risecheckout.com` | Qualquer futuro subdomínio | ✅ |

---

## Seção Técnica: Formato dos Cookies

```text
ANTES:
__Host-rise_access=TOKEN; Max-Age=14400; Path=/; HttpOnly; Secure; SameSite=None; Partitioned

DEPOIS:
__Secure-rise_access=TOKEN; Max-Age=14400; Path=/; Domain=.risecheckout.com; HttpOnly; Secure; SameSite=None
```

**Diferenças Técnicas:**
- `__Host-` → `__Secure-` (permite Domain)
- Adicionado `Domain=.risecheckout.com`
- Removido `Partitioned` (não compatível com Domain)
