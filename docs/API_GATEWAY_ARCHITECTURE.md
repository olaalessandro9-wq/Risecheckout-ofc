# API Gateway Architecture

> **RISE Protocol V3** - Zero Secrets in Frontend (10.0/10)  
> **Última atualização:** 2026-02-06

## Visão Geral

O RiseCheckout utiliza uma arquitetura de **API Gateway BFF (Backend-for-Frontend)** para:

1. **Eliminar secrets do bundle frontend**
2. **Centralizar segurança e headers**
3. **Simplificar configuração de CORS**
4. **Habilitar observabilidade unificada**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          ARQUITETURA API GATEWAY                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Frontend (Lovable)                                                         │
│   ┌─────────────────┐                                                        │
│   │ api.call()      │  ← Sem apikey header (Worker injeta)                  │
│   │ Sem secrets     │  ← Nenhuma chave no bundle                            │
│   └────────┬────────┘                                                        │
│            │                                                                 │
│            │  POST https://api.risecheckout.com/functions/v1/{fn}           │
│            │  + credentials: include (cookies)                               │
│            │  + X-Correlation-Id                                             │
│            ▼                                                                 │
│   ┌─────────────────────────────────────────────────────────────┐           │
│   │                   CLOUDFLARE WORKER (BFF)                    │           │
│   │  api.risecheckout.com                                        │           │
│   ├─────────────────────────────────────────────────────────────┤           │
│   │  1. Valida Origin (allowlist)                                │           │
│   │  2. Injeta header "apikey" (publishable key via Secret)      │           │
│   │  3. Forward cookies (credentials)                            │           │
│   │  4. Aplica Security Headers                                  │           │
│   │  5. Timeout + correlation-id                                 │           │
│   └────────┬────────────────────────────────────────────────────┘           │
│            │                                                                 │
│            │  POST https://wivbtmtgpsxupfjwwovf.supabase.co/functions/v1/   │
│            │  + apikey: {PUBLISHABLE KEY do Worker}                          │
│            │  + Cookie passthrough                                           │
│            ▼                                                                 │
│   ┌─────────────────┐                                                        │
│   │ Supabase Edge   │                                                        │
│   │ Functions       │                                                        │
│   └─────────────────┘                                                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Configuração do Worker

### Secrets no Cloudflare

O Worker precisa dos seguintes secrets configurados:

| Secret | Descrição |
|--------|-----------|
| `SUPABASE_PUBLISHABLE_KEY` | Publishable key do projeto Supabase (`sb_publishable_...`) |

> **⚠️ MIGRAÇÃO (2026-02):** A secret foi renomeada de `SUPABASE_ANON_KEY` (legacy JWT)
> para `SUPABASE_PUBLISHABLE_KEY` (new opaque token). Se o Worker ainda usa o nome antigo,
> atualize o nome e o valor para a nova publishable key.

### Origins Permitidas

O Worker valida as seguintes origins:

- `https://risecheckout.com`
- `https://www.risecheckout.com`
- `https://app.risecheckout.com`
- `https://pay.risecheckout.com`
- `*.lovable.app` (previews)

### Rotas

| Rota | Método | Descrição |
|------|--------|-----------|
| `/functions/v1/*` | POST | Proxy para Edge Functions |
| `/health` | GET | Health check |

## Uso no Frontend

### API Autenticada

```typescript
import { api } from "@/lib/api";

// Chamada autenticada (usa cookies httpOnly)
const { data, error } = await api.call<ProductResponse>("products-crud", {
  action: "list",
  params: { page: 1 }
});
```

### API Pública

```typescript
import { publicApi } from "@/lib/api/public-client";

// Chamada pública (checkout, payment links)
const { data, error } = await publicApi.call("checkout-public-data", {
  action: "resolve-and-load",
  slug: "abc123"
});
```

## Segurança

### Headers de Resposta

O Worker aplica os seguintes headers de segurança:

- `Access-Control-Allow-Origin`: Origin específica (não wildcard)
- `Access-Control-Allow-Credentials`: true (para cookies)

### Proteções

1. **Validação de Origin**: Apenas origins na allowlist são aceitas
2. **Injeção de apikey**: Publishable key nunca exposta no frontend
3. **Forward de cookies**: Autenticação via httpOnly cookies
4. **Timeout**: 30s padrão para evitar requests pendurados

## CSP (Content Security Policy)

O CSP é definido no `index.html` com as seguintes diretivas relevantes:

```
connect-src 'self' https://api.risecheckout.com https://*.sentry.io ...
```

**Nota:** `*.supabase.co` pode ser removido do CSP após validação completa do API Gateway em produção.

## Manutenção

### Atualizando Origins

1. Editar allowlist no Worker
2. Deploy via Cloudflare Dashboard ou Wrangler CLI

### Rotacionando publishable key

1. Gerar nova publishable key no Supabase Dashboard (Settings > API Keys)
2. Atualizar secret `SUPABASE_PUBLISHABLE_KEY` no Cloudflare
3. Deploy do Worker

> **Nota:** A rotação da publishable key não afeta sessões ativas (autenticação
> é baseada em cookies httpOnly, não na publishable key).

### Monitoramento

- Logs disponíveis no Cloudflare Workers Analytics
- Métricas de latência e errors
- Correlation ID para rastreamento end-to-end

## Migração de API Keys (2026)

### Sistema Antigo (Legacy - DEPRECATED)

| Key | Formato | Status |
|-----|---------|--------|
| `anon` key | JWT (`eyJ...`) | ❌ DEPRECATED |
| `service_role` key | JWT (`eyJ...`) | ❌ DEPRECATED |

### Sistema Novo (Active)

| Key | Formato | Uso |
|-----|---------|-----|
| Publishable key | `sb_publishable_...` | Frontend (via Cloudflare Worker) |
| Secret key | `sb_secret_...` | Backend (Edge Functions auto-injected) |

### O que mudou

1. **Cloudflare Worker**: Secret atualizada de JWT anon key para `sb_publishable_...`
2. **Edge Functions**: `verify_jwt = false` em TODAS as funções (new keys não são JWTs)
3. **Env vars backend**: Nomes mantidos (`SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`),
   valores atualizados automaticamente pelo Supabase

### Antes (Legacy)

```typescript
// ❌ Frontend enviava apikey no header (RISE V2)
const headers = {
  "apikey": SUPABASE_ANON_KEY, // JWT exposto no bundle
  "Content-Type": "application/json",
};
```

### Depois (RISE V3 + New Keys)

```typescript
// ✅ Frontend não envia apikey (RISE V3)
const headers = {
  "Content-Type": "application/json",
  "X-Correlation-Id": correlationId,
};
// Worker injeta publishable key automaticamente
```

## Multi-Secret Key Architecture (4 Domínios)

> **Atualizado: 2026-02-06** - Isolamento operacional de secret keys por domínio funcional.

As 107 Edge Functions são segmentadas em **4 domínios de segurança**, cada um com sua
própria secret key (`sb_secret_...`). Se uma key for comprometida, revoga-se APENAS ela,
limitando o blast radius ao domínio afetado.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MULTI-SECRET KEY ISOLATION                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│   │  WEBHOOKS    │  │  PAYMENTS    │  │    ADMIN     │  │   GENERAL    │   │
│   │  10 funções  │  │  18 funções  │  │  17 funções  │  │  62 funções  │   │
│   │              │  │              │  │              │  │              │   │
│   │  sb_secret_  │  │  sb_secret_  │  │  sb_secret_  │  │  sb_secret_  │   │
│   │  (webhooks)  │  │  (payments)  │  │  (admin)     │  │  (auto)      │   │
│   └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘   │
│          │                 │                 │                 │            │
│          └─────────────────┴─────────────────┴─────────────────┘            │
│                                   │                                         │
│                    ┌──────────────┴──────────────┐                          │
│                    │    _shared/supabase-client   │                          │
│                    │    Factory (SSOT)            │                          │
│                    │    getSupabaseClient(domain) │                          │
│                    └─────────────────────────────┘                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Mapeamento Domínio → Env Var

| Domínio | Env Var | Configuração |
|---------|---------|--------------|
| `webhooks` | `RISE_SECRET_WEBHOOKS` | Manual (Supabase Secrets) |
| `payments` | `RISE_SECRET_PAYMENTS` | Manual (Supabase Secrets) |
| `admin` | `RISE_SECRET_ADMIN` | Manual (Supabase Secrets) |
| `general` | `SUPABASE_SERVICE_ROLE_KEY` | Auto-injected by Supabase |

### Rotação de Secret Key (por domínio)

```
1. Supabase Dashboard > API Keys > Revogar key comprometida
2. Criar nova key no mesmo Dashboard
3. Dashboard > Edge Functions > Manage Secrets > Atualizar env var correspondente
4. Edge Functions re-deployam automaticamente com novo secret
5. Tempo total de downtime: ~30 segundos (apenas no domínio afetado)
6. Domínios não afetados: ZERO impacto
```

### Fallback de Segurança

O factory (`_shared/supabase-client.ts`) implementa fallback automático: se a secret de um
domínio não estiver configurada, usa a key `general` com log de warning. Isso garante zero
downtime durante a migração gradual das keys.

## Troubleshooting

### CORS Errors

1. Verificar se origin está na allowlist do Worker
2. Verificar se CSP do index.html inclui `api.risecheckout.com`
3. Verificar se cookies estão sendo enviados (`credentials: include`)

### 401 Unauthorized

1. Verificar se cookies estão presentes (DevTools > Application > Cookies)
2. Verificar se Worker está injetando publishable key corretamente
3. Verificar logs da Edge Function no Supabase

### 502 Bad Gateway

1. Verificar se Supabase está online
2. Verificar logs do Worker no Cloudflare
3. Verificar timeout (pode ser request lento)

### Edge Function rejeita request após migração

1. Verificar se `verify_jwt = false` está no `supabase/config.toml`
2. Verificar se a publishable key está correta no Worker
3. Verificar logs: `supabase functions logs <function-name>`

### Domínio usando key errada

1. Verificar qual domínio a função usa: consultar tabela em `EDGE_FUNCTIONS_REGISTRY.md`
2. Verificar se o env var correto está configurado em Supabase Secrets
3. Checar logs: o factory emite warning quando faz fallback para `general`
