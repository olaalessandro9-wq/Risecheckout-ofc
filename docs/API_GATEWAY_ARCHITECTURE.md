# API Gateway Architecture

> **RISE Protocol V3** - Zero Secrets in Frontend (10.0/10)  
> **Última atualização:** 2026-01-26

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
│   │  2. Injeta header "apikey" (via Secret)                      │           │
│   │  3. Forward cookies (credentials)                            │           │
│   │  4. Aplica Security Headers                                  │           │
│   │  5. Timeout + correlation-id                                 │           │
│   └────────┬────────────────────────────────────────────────────┘           │
│            │                                                                 │
│            │  POST https://wivbtmtgpsxupfjwwovf.supabase.co/functions/v1/   │
│            │  + apikey: {SECRET do Worker}                                   │
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
| `SUPABASE_ANON_KEY` | Anon key do projeto Supabase |

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
2. **Injeção de apikey**: Chave nunca exposta no frontend
3. **Forward de cookies**: Autenticação via httpOnly cookies
4. **Timeout**: 30s padrão para evitar requests pendurados

## CSP (Content Security Policy)

O CSP é definido no `index.html` com as seguintes diretivas relevantes:

```
connect-src 'self' https://api.risecheckout.com https://*.sentry.io ...
```

**Nota:** `*.supabase.co` foi mantido para compatibilidade, mas será removido em versões futuras.

## Manutenção

### Atualizando Origins

1. Editar allowlist no Worker
2. Deploy via Cloudflare Dashboard ou Wrangler CLI

### Rotacionando apikey

1. Gerar nova anon key no Supabase (se necessário)
2. Atualizar secret `SUPABASE_ANON_KEY` no Cloudflare
3. Deploy do Worker

### Monitoramento

- Logs disponíveis no Cloudflare Workers Analytics
- Métricas de latência e errors
- Correlation ID para rastreamento end-to-end

## Migração

### Antes (RISE V2)

```typescript
// ❌ Frontend enviava apikey no header
const headers = {
  "apikey": SUPABASE_ANON_KEY, // Exposta no bundle
  "Content-Type": "application/json",
};
```

### Depois (RISE V3)

```typescript
// ✅ Frontend não envia apikey
const headers = {
  "Content-Type": "application/json",
  "X-Correlation-Id": correlationId,
};
// Worker injeta apikey automaticamente
```

## Troubleshooting

### CORS Errors

1. Verificar se origin está na allowlist do Worker
2. Verificar se CSP do index.html inclui `api.risecheckout.com`
3. Verificar se cookies estão sendo enviados (`credentials: include`)

### 401 Unauthorized

1. Verificar se cookies estão presentes (DevTools > Application > Cookies)
2. Verificar se Worker está injetando apikey corretamente
3. Verificar logs da Edge Function no Supabase

### 502 Bad Gateway

1. Verificar se Supabase está online
2. Verificar logs do Worker no Cloudflare
3. Verificar timeout (pode ser request lento)
