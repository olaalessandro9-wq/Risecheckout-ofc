# Edge Functions - Módulos Compartilhados (`_shared/`)

> **IMPORTANTE**: Esta pasta contém módulos reutilizáveis que NÃO são Edge Functions independentes.
> Eles são importados por outras funções e executados no contexto delas.

---

## 📁 Estrutura

```
_shared/
├── platform-config.ts        # Configurações centralizadas da plataforma
├── asaas-customer.ts         # Gerenciamento de clientes Asaas
├── asaas-split-calculator.ts # Cálculo de split Marketplace
├── audit-logger.ts           # Log de eventos de segurança
├── rate-limiting/            # Módulo consolidado de rate limiting (RISE V3)
│   ├── index.ts              # Barrel exports
│   ├── types.ts              # Tipagens TypeScript
│   ├── configs.ts            # Configurações por action
│   ├── service.ts            # Lógica core (checkRateLimit)
│   ├── blocklist.ts          # IP blocklist
│   └── middleware.ts         # Middlewares prontos
├── role-validator.ts         # Validação de permissões (RBAC)
├── get-vendor-token.ts       # Busca tokens do Vault
├── unified-auth.ts           # Wrapper de compatibilidade (usa unified-auth-v2)
├── unified-auth-v2.ts        # Sistema de auth unificado (RISE V3 SSOT)
└── payment-gateways/         # Módulos específicos de gateways
```

---

## 🔐 Autenticação (RISE V3 - Unified Auth)

### Arquitetura

O sistema de autenticação segue o padrão **Unified Identity**:

```
┌──────────────────────────────────────────┐
│                  users                    │
│  (single source of truth for identity)   │
└──────────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────┐
│                sessions                   │
│          (with active_role)              │
└──────────────────────────────────────────┘
```

### Cookies

| Cookie | Duração | Propósito |
|--------|---------|-----------|
| `__Secure-rise_access` | 4h | Access token (httpOnly, Secure, Domain=.risecheckout.com) |
| `__Secure-rise_refresh` | 30 dias | Refresh token (httpOnly, Secure, Domain=.risecheckout.com) |

### Módulos de Auth

#### `unified-auth-v2.ts` (Fonte da Verdade)

```typescript
import { 
  getAuthenticatedUser, 
  requireAuthenticatedUser,
  getUnifiedAccessToken 
} from "../_shared/unified-auth-v2.ts";

// Opcional - retorna null se não autenticado
const user = await getAuthenticatedUser(supabase, req);

// Obrigatório - lança erro se não autenticado
const user = await requireAuthenticatedUser(supabase, req);
```

#### `unified-auth.ts` (Wrapper de Compatibilidade)

```typescript
import { 
  getAuthenticatedProducer, 
  requireAuthenticatedProducer,
  unauthorizedResponse 
} from "../_shared/unified-auth.ts";

// Para ações de produtor
const producer = await requireAuthenticatedProducer(supabase, req);
```

### Interface UnifiedUser

```typescript
interface UnifiedUser {
  id: string;           // UUID do usuário
  email: string;        // Email
  name: string | null;  // Nome
  activeRole: string;   // "buyer" | "user" | "seller" | "admin" | "owner"
  roles: string[];      // Roles disponíveis
}
```

---

## 🔧 Outros Módulos

### `platform-config.ts`

Configuração centralizada da plataforma RiseCheckout.

```typescript
import { 
  PLATFORM_FEE_PERCENT,
  calculatePlatformFeeCents,
  isVendorOwner 
} from "../_shared/platform-config.ts";

// Calcular taxa
const fee = calculatePlatformFeeCents(10000); // R$100 → R$4 (400 centavos)
```

### `rate-limiting/`

Sistema unificado de rate limiting e IP blocklist.

```typescript
import { 
  checkRateLimit, 
  RATE_LIMIT_CONFIGS,
  rateLimitMiddleware 
} from "../_shared/rate-limiting/index.ts";

// Middleware completo
const blocked = await rateLimitMiddleware(
  supabase, req, RATE_LIMIT_CONFIGS.CREATE_ORDER, corsHeaders
);
if (blocked) return blocked;
```

### `role-validator.ts`

Validação de permissões (RBAC).

```typescript
import { requireRole } from "../_shared/role-validator.ts";

// Exige que seja admin ou owner
await requireRole(supabase, userId, 'admin', 'manage_affiliates', req);
```

---

## ⚠️ Código Legado (REMOVIDO)

Os seguintes padrões foram **completamente removidos** na migração RISE V3:

- ❌ `producer_sessions` - Substituída por `sessions`
- ❌ `buyer_sessions` - Substituída por `sessions`
- ❌ `x-buyer-token` header - Substituído por cookie `__Secure-rise_access`
- ❌ `x-producer-session-token` header - Substituído por cookie `__Secure-rise_access`
- ❌ `validateLegacyProducerSession()` - Removida
- ❌ `validateLegacyBuyerSession()` - Removida

---

## 📊 RISE V3 Compliance

| Critério | Status |
|----------|--------|
| Single Source of Truth | ✅ `sessions` table |
| Zero Fallbacks Legados | ✅ 0 funções |
| Cookie-based Auth | ✅ `__Secure-rise_*` (Domain=.risecheckout.com) |
| Zero Headers Legados | ✅ Removidos |
| Documentação Atualizada | ✅ Este arquivo |
