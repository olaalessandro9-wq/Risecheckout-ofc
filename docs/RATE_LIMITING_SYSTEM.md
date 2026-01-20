# Rate Limiting System - Rise Checkout

> **RISE ARCHITECT PROTOCOL V3 - Sistema Centralizado de Rate Limiting**  
> Última atualização: 2026-01-20  
> Status: ✅ 100% COMPLIANT (28 configs, 0 hardcoded)

---

## Resumo Executivo

O sistema de rate limiting foi consolidado em um único módulo centralizado (`_shared/rate-limiting/`) seguindo o princípio **Single Source of Truth (SSOT)** do RISE Protocol V3.

| Métrica | Valor |
|---------|-------|
| **Total de Configs** | 28 |
| **Configs Hardcoded** | 0 ✅ |
| **Edge Functions Usando** | 53 |
| **Conformidade** | 100% |

---

## Arquitetura do Módulo

```
supabase/functions/_shared/rate-limiting/
├── index.ts          # Barrel export
├── types.ts          # Interfaces e tipos
├── configs.ts        # 28 configurações centralizadas (SSOT)
├── service.ts        # Lógica de rate limiting
├── blocklist.ts      # IP blocklist
└── middleware.ts     # Middlewares prontos para uso
```

---

## Configurações Disponíveis

### Authentication

| Config | maxAttempts | windowMinutes | blockDurationMinutes | Uso |
|--------|-------------|---------------|----------------------|-----|
| `BUYER_AUTH_LOGIN` | 10 | 15 | 30 | Login de compradores |
| `BUYER_AUTH_REGISTER` | 5 | 60 | 60 | Registro de compradores |
| `BUYER_AUTH_RESET` | 5 | 60 | 120 | Reset de senha buyer |
| `PRODUCER_AUTH_LOGIN` | 15 | 15 | 30 | Login de produtores |
| `PRODUCER_AUTH_RESET` | 5 | 60 | 60 | Reset de senha produtor |

### Payments (Otimizado para Black Friday)

| Config | maxAttempts | windowMinutes | blockDurationMinutes | Uso |
|--------|-------------|---------------|----------------------|-----|
| `CREATE_ORDER` | 60 | 1 | 2 | Criação de pedidos |
| `CREATE_PIX` | 60 | 1 | 2 | Pagamento PIX genérico |
| `ASAAS_CREATE_PAYMENT` | 60 | 1 | 2 | Pagamento Asaas |
| `MERCADOPAGO_CREATE_PAYMENT` | 60 | 1 | 2 | Pagamento MercadoPago |
| `STRIPE_CREATE_PAYMENT` | 60 | 1 | 2 | Pagamento Stripe |

### Webhooks

| Config | maxAttempts | windowMinutes | blockDurationMinutes | Uso |
|--------|-------------|---------------|----------------------|-----|
| `WEBHOOK` | 300 | 1 | 5 | Webhooks de gateways |
| `WEBHOOK_TEST` | 30 | 1 | 5 | Teste de webhooks |

### GDPR/LGPD

| Config | maxAttempts | windowMinutes | blockDurationMinutes | Uso |
|--------|-------------|---------------|----------------------|-----|
| `GDPR_REQUEST` | 5 | 60 | 60 | Solicitação de dados |
| `GDPR_FORGET` | 5 | 60 | 120 | Anonimização |

### Outras

| Config | maxAttempts | windowMinutes | blockDurationMinutes | Uso |
|--------|-------------|---------------|----------------------|-----|
| `MEMBERS_AREA` | 120 | 1 | 5 | Leitura área de membros |
| `MEMBERS_AREA_WRITE` | 60 | 1 | 5 | Escrita área de membros |
| `ADMIN_ACTION` | 60 | 1 | 10 | Ações administrativas |
| `VAULT_SAVE` | 40 | 1 | 5 | Salvar no vault |
| `DECRYPT_DATA` | 40 | 1 | 10 | Decriptografar dados |
| `TURNSTILE_VERIFY` | 30 | 1 | 5 | Verificação Turnstile |
| `DEFAULT` | 60 | 1 | 5 | Ações não especificadas |

---

## Como Usar

### Middleware Completo (Recomendado)

```typescript
import { rateLimitMiddleware, RATE_LIMIT_CONFIGS } from "../_shared/rate-limiting/index.ts";

// Dentro do handler:
const rateLimitResult = await rateLimitMiddleware(
  supabase,
  req,
  RATE_LIMIT_CONFIGS.MERCADOPAGO_CREATE_PAYMENT,
  corsHeaders
);
if (rateLimitResult) {
  return rateLimitResult;  // Response 429 pronta
}
```

### Rate Limit Only (Sem Blocklist)

```typescript
import { rateLimitOnlyMiddleware, RATE_LIMIT_CONFIGS } from "../_shared/rate-limiting/index.ts";

const rateLimitResult = await rateLimitOnlyMiddleware(
  supabase,
  req,
  RATE_LIMIT_CONFIGS.STRIPE_CREATE_PAYMENT,
  corsHeaders
);
```

### Verificação Manual

```typescript
import { checkRateLimit, RATE_LIMIT_CONFIGS, getClientIP } from "../_shared/rate-limiting/index.ts";

const identifier = getClientIP(req);
const result = await checkRateLimit(supabase, identifier, RATE_LIMIT_CONFIGS.BUYER_AUTH_LOGIN);

if (!result.allowed) {
  return new Response(JSON.stringify({ 
    error: "Rate limit exceeded",
    retryAfter: result.retryAfter 
  }), { status: 429 });
}
```

---

## Regras RISE V3 (OBRIGATÓRIAS)

### ✅ CORRETO - Usar Config Centralizada

```typescript
import { RATE_LIMIT_CONFIGS } from "../_shared/rate-limiting/index.ts";

const result = await rateLimitMiddleware(
  supabase,
  req,
  RATE_LIMIT_CONFIGS.GDPR_FORGET,  // ✅ Config centralizada
  corsHeaders
);
```

### ❌ PROIBIDO - Config Hardcoded

```typescript
// VIOLAÇÃO RISE V3 - Config hardcoded
const MY_RATE_LIMIT = {
  action: "my_action",
  maxAttempts: 5,
  windowMinutes: 60,
  blockDurationMinutes: 60
};
```

---

## Adicionar Nova Config

1. Editar `supabase/functions/_shared/rate-limiting/configs.ts`
2. Adicionar a nova config exportada
3. Adicionar ao objeto `RATE_LIMIT_CONFIGS`
4. Atualizar esta documentação

**Exemplo:**

```typescript
// configs.ts

/** Nova ação específica */
export const NOVA_ACAO: RateLimitConfig = {
  action: "nova_acao",
  maxAttempts: 20,
  windowMinutes: 5,
  blockDurationMinutes: 15,
};

// Adicionar ao mapa:
export const RATE_LIMIT_CONFIGS = {
  // ...
  NOVA_ACAO,
  // ...
} as const;
```

---

## Tabelas do Banco de Dados

### `buyer_rate_limits`

Armazena tentativas e bloqueios:

```sql
CREATE TABLE buyer_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  action TEXT NOT NULL,
  attempts INT DEFAULT 0,
  first_attempt_at TIMESTAMPTZ,
  last_attempt_at TIMESTAMPTZ,
  blocked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `ip_blocklist`

Bloqueios permanentes de IP:

```sql
CREATE TABLE ip_blocklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL UNIQUE,
  reason TEXT,
  blocked_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ  -- NULL = permanente
);
```

---

## Monitoramento

### Query: IPs Mais Bloqueados

```sql
SELECT 
  identifier,
  action,
  COUNT(*) as block_count,
  MAX(blocked_until) as last_block
FROM buyer_rate_limits
WHERE blocked_until IS NOT NULL
GROUP BY identifier, action
ORDER BY block_count DESC
LIMIT 20;
```

### Query: Tentativas por Ação

```sql
SELECT 
  action,
  COUNT(*) as total_attempts,
  COUNT(CASE WHEN blocked_until IS NOT NULL THEN 1 END) as blocked_count
FROM buyer_rate_limits
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY action
ORDER BY total_attempts DESC;
```

---

## Changelog

| Data | Alteração |
|------|-----------|
| 2026-01-20 | Adicionado `GDPR_FORGET`, `PRODUCER_AUTH_RESET` - 100% centralizado |
| 2026-01-20 | Corrigidos gateways para usar configs específicas |
| 2026-01-19 | Otimização para Black Friday - pagamentos 60 req/min |
| 2026-01-17 | Sistema consolidado inicial - 22 configs |
