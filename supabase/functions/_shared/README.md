# Edge Functions - Módulos Compartilhados (`_shared/`)

> **IMPORTANTE**: Esta pasta contém módulos reutilizáveis que NÃO são Edge Functions independentes.
> Eles são importados por outras funções e executados no contexto delas.

---

## 📁 Estrutura

```
_shared/
├── platform-config.ts      # Configurações centralizadas da plataforma
├── asaas-customer.ts       # Gerenciamento de clientes Asaas
├── asaas-split-calculator.ts  # Cálculo de split Marketplace
├── audit-logger.ts         # Log de eventos de segurança
├── rate-limit.ts           # Proteção contra brute force
├── role-validator.ts       # Validação de permissões (RBAC)
├── get-vendor-token.ts     # Busca tokens do Vault
└── payment-gateways/       # Módulos específicos de gateways
```

---

## 🔧 Módulos

### 1. `platform-config.ts`

**Propósito**: Configuração centralizada da plataforma RiseCheckout.

#### Constantes Principais

```typescript
// Taxa da plataforma (4%)
export const PLATFORM_FEE_PERCENT = 0.04;

// ID do Owner da plataforma
export const PLATFORM_OWNER_USER_ID = "ccff612c-93e6-4acc-85d9-7c9d978a7e4e";

// IDs de contas nos gateways
export const PLATFORM_MERCADOPAGO_COLLECTOR_ID = "3002802852";
export const PLATFORM_PUSHINPAY_ACCOUNT_ID = "A0557404-1578-4F50-8AE7-AEF8711F03D1";
```

#### Funções Exportadas

| Função | Descrição | Retorno |
|--------|-----------|---------|
| `calculatePlatformFeeCents(amountCents, feePercent?)` | Calcula taxa em centavos | `number` |
| `calculatePlatformFeeReais(amountReais, feePercent?)` | Calcula taxa em reais | `number` |
| `getVendorFeePercent(supabase, vendorId)` | Busca taxa personalizada do vendedor | `Promise<number>` |
| `isVendorOwner(supabase, vendorId)` | Verifica se é Owner | `Promise<boolean>` |
| `validateGatewaySecrets(gateway)` | Health check de secrets | `object` |
| `getSecretsHealthCheck()` | Health check completo | `object` |
| `getGatewayCredentials(supabase, vendorId, gateway)` | Busca credenciais dinâmicas | `Promise<GatewayCredentials>` |

#### Exemplo de Uso

```typescript
import { 
  PLATFORM_FEE_PERCENT,
  calculatePlatformFeeCents,
  isVendorOwner 
} from "../_shared/platform-config.ts";

// Calcular taxa
const fee = calculatePlatformFeeCents(10000); // R$100 → R$4 (400 centavos)

// Verificar se é Owner
const isOwner = await isVendorOwner(supabase, vendorId);
if (isOwner) {
  // Skip taxa para Owner
}
```

#### Secrets Manifest

O arquivo contém um manifesto completo de todos os secrets configurados:

```typescript
export const SECRETS_MANIFEST = {
  lastUpdated: '2024-12-24',
  totalSecrets: 24,
  supabase: { ... },      // 4 secrets automáticos
  gateways: {
    pushinpay: { ... },   // 6 secrets
    mercadopago: { ... }, // 5 secrets
    stripe: { ... },      // 4 secrets
    asaas: { ... }        // 3 secrets
  },
  platform: { ... }       // 2 secrets
};
```

---

### 2. `asaas-customer.ts`

**Propósito**: Gerenciar clientes no Asaas (buscar ou criar).

#### Interface

```typescript
interface CustomerData {
  name: string;
  email: string;
  document: string;  // CPF ou CNPJ
  phone?: string;
}

interface AsaasCustomer {
  id: string;
}
```

#### Função Principal

```typescript
findOrCreateCustomer(
  baseUrl: string,      // URL da API Asaas
  apiKey: string,       // Token de acesso
  customer: CustomerData
): Promise<AsaasCustomer | null>
```

#### Fluxo

```
┌─────────────────┐
│ Recebe customer │
└────────┬────────┘
         │
         ▼
┌─────────────────────┐     ┌──────────────────┐
│ Buscar por CPF/CNPJ │────▶│ Cliente existe?  │
└─────────────────────┘     └────────┬─────────┘
                                     │
                    ┌────────────────┴────────────────┐
                    │                                 │
                    ▼ SIM                             ▼ NÃO
           ┌────────────────┐               ┌─────────────────┐
           │ Retorna ID     │               │ Criar novo      │
           │ existente      │               │ customer        │
           └────────────────┘               └────────┬────────┘
                                                     │
                                                     ▼
                                            ┌────────────────┐
                                            │ Retorna novo   │
                                            │ customer ID    │
                                            └────────────────┘
```

#### Exemplo

```typescript
import { findOrCreateCustomer } from "../_shared/asaas-customer.ts";

const customer = await findOrCreateCustomer(
  'https://sandbox.asaas.com/api/v3',
  ASAAS_API_KEY,
  {
    name: 'João Silva',
    email: 'joao@email.com',
    document: '123.456.789-00',
    phone: '11999999999'
  }
);

if (customer) {
  console.log('Customer ID:', customer.id);
}
```

---

### 3. `asaas-split-calculator.ts`

**Propósito**: Calcular dados de split para o modelo Marketplace Asaas.

#### Modelo de Split (BINÁRIO)

```
┌─────────────────────────────────────────────────────────────────┐
│                    MODELO MARKETPLACE ASAAS                      │
├─────────────────────────────────────────────────────────────────┤
│ REGRA FUNDAMENTAL: Split é SEMPRE BINÁRIO (nunca 3 partes)      │
│                                                                  │
│ CENÁRIOS:                                                        │
│                                                                  │
│ 1. OWNER DIRETO (sem afiliado)                                  │
│    └─► 100% → RiseCheckout                                      │
│                                                                  │
│ 2. OWNER + AFILIADO                                             │
│    └─► Afiliado recebe: X% × 0.96 (taxa já descontada)          │
│    └─► Owner recebe: resto (inclui taxa de 4%)                  │
│                                                                  │
│ 3. VENDEDOR COMUM                                               │
│    └─► 96% → Vendedor                                           │
│    └─► 4%  → Plataforma (RiseCheckout)                          │
└─────────────────────────────────────────────────────────────────┘
```

#### Interface de Retorno

```typescript
interface CalculatedSplitData {
  isOwner: boolean;                    // É o Owner da plataforma?
  hasAffiliate: boolean;               // Tem afiliado na venda?
  affiliateId: string | null;          // ID do registro de afiliado
  affiliateUserId: string | null;      // User ID do afiliado
  affiliateWalletId: string | null;    // Wallet ID Asaas do afiliado
  affiliateCommissionPercent: number;  // % de comissão configurado
  vendorWalletId: string | null;       // Wallet ID do vendedor
}
```

#### Função Principal

```typescript
calculateMarketplaceSplitData(
  supabase: any,
  orderId: string,
  vendorId: string
): Promise<CalculatedSplitData>
```

#### Exemplo

```typescript
import { calculateMarketplaceSplitData } from "../_shared/asaas-split-calculator.ts";

const splitData = await calculateMarketplaceSplitData(supabase, orderId, vendorId);

if (splitData.isOwner && !splitData.hasAffiliate) {
  // 100% para RiseCheckout, sem split
} else if (splitData.isOwner && splitData.hasAffiliate) {
  // Split para afiliado
  const splitRules = [{
    walletId: splitData.affiliateWalletId,
    percentualValue: splitData.affiliateCommissionPercent * 0.96
  }];
} else {
  // Vendedor comum: 96% vendedor, 4% plataforma
  const splitRules = [{
    walletId: splitData.vendorWalletId,
    percentualValue: 96
  }];
}
```

---

### 4. `audit-logger.ts`

**Propósito**: Registrar eventos de segurança para auditoria.

#### Ações Disponíveis

```typescript
export const SecurityAction = {
  // Autenticação
  LOGIN_SUCCESS: "login_success",
  LOGIN_FAILED: "login_failed",
  LOGOUT: "logout",
  
  // Afiliação
  MANAGE_AFFILIATION: "manage_affiliation",
  APPROVE_AFFILIATE: "approve_affiliate",
  REJECT_AFFILIATE: "reject_affiliate",
  BLOCK_AFFILIATE: "block_affiliate",
  
  // Produtos
  CREATE_PRODUCT: "create_product",
  UPDATE_PRODUCT: "update_product",
  DELETE_PRODUCT: "delete_product",
  
  // Admin
  ACCESS_ADMIN_PANEL: "access_admin_panel",
  CHANGE_USER_ROLE: "change_user_role",
  
  // Pagamentos
  PROCESS_PAYMENT: "process_payment",
  REFUND_PAYMENT: "refund_payment",
  
  // Acesso negado
  ACCESS_DENIED: "access_denied",
  PERMISSION_DENIED: "permission_denied",
};
```

#### Funções

```typescript
// Log genérico
logSecurityEvent(supabase, {
  userId: string,
  action: SecurityActionType,
  resource?: string,
  resourceId?: string,
  success?: boolean,
  request?: Request,
  metadata?: Record<string, unknown>
}): Promise<void>

// Helper para acesso negado
logAccessDenied(supabase, userId, resource, request?, reason?): Promise<void>

// Helper para permissão negada
logPermissionDenied(supabase, userId, userRole, requiredRole, resource, request?): Promise<void>
```

#### Exemplo

```typescript
import { logSecurityEvent, SecurityAction } from "../_shared/audit-logger.ts";

// Registrar pagamento processado
await logSecurityEvent(supabase, {
  userId: vendorId,
  action: SecurityAction.PROCESS_PAYMENT,
  resource: 'orders',
  resourceId: orderId,
  success: true,
  request: req,
  metadata: {
    gateway: 'asaas',
    paymentMethod: 'pix',
    amountCents: 10000
  }
});
```

---

### 5. `rate-limit.ts`

**Propósito**: Proteção contra brute force e abuso de API.

#### Funções

```typescript
// Verificar limite
checkRateLimit(supabase, config): Promise<RateLimitResult>

// Registrar tentativa
recordAttempt(supabase, config, success): Promise<void>

// Middleware completo
rateLimitMiddleware(req, config): Promise<Response | null>

// Extrair identificador
getIdentifier(req, preferUserId?): string
```

#### Configuração

```typescript
interface RateLimitConfig {
  maxAttempts: number;  // Máximo de tentativas
  windowMs: number;     // Janela de tempo em ms
  identifier: string;   // IP ou User ID
  action: string;       // Nome da ação
}
```

#### Exemplo

```typescript
import { checkRateLimit, recordAttempt, getIdentifier } from "../_shared/rate-limit.ts";

const identifier = getIdentifier(req);
const result = await checkRateLimit(supabase, {
  maxAttempts: 10,
  windowMs: 60 * 1000, // 1 minuto
  identifier,
  action: 'create_payment'
});

if (!result.allowed) {
  return new Response(JSON.stringify({
    error: 'Too many requests',
    retryAfter: result.retryAfter
  }), { status: 429 });
}

// Processar...

await recordAttempt(supabase, config, true);
```

---

### 6. `role-validator.ts`

**Propósito**: Validação de permissões (RBAC) no backend.

#### Hierarquia de Roles

```
owner (1) > admin (2) > user (3) > seller (4)
```

#### Funções

```typescript
// Obter role do usuário
getUserRole(supabase, userId): Promise<UserRole>

// Validar se tem pelo menos o role
validateRole(supabase, userId, requiredRole): Promise<boolean>

// Verificar se pode ter afiliados
canHaveAffiliates(supabase, userId): Promise<boolean>

// Verificar se é admin
isAdmin(supabase, userId): Promise<boolean>

// Exigir role (lança erro se não tiver)
requireRole(supabase, userId, requiredRole, action, request?): Promise<UserRole>

// Exigir permissão de afiliados
requireCanHaveAffiliates(supabase, userId, action, request?): Promise<void>
```

#### Exemplo

```typescript
import { requireRole, UserRole } from "../_shared/role-validator.ts";

try {
  // Exige que seja admin ou owner
  await requireRole(supabase, userId, 'admin', 'manage_affiliates', req);
  
  // Código protegido...
  
} catch (error) {
  // Permissão negada - já foi logado automaticamente
  return new Response(JSON.stringify({ error: error.message }), { status: 403 });
}
```

---

### 7. `get-vendor-token.ts`

**Propósito**: Buscar tokens de integração do Vault de forma segura.

#### Funções

```typescript
// Buscar token do vault
getVendorToken(vendorId, gateway): Promise<string | null>

// Buscar configuração completa
getVendorIntegrationConfig(vendorId, gateway): Promise<any | null>
```

#### Exemplo

```typescript
import { getVendorToken } from "../_shared/get-vendor-token.ts";

const accessToken = await getVendorToken(vendorId, 'mercadopago');
if (!accessToken) {
  throw new Error('Mercado Pago não configurado');
}
```

---

### 8. `unified-auth.ts`

**Propósito**: Autenticação centralizada de produtores via `producer_sessions`.

#### RISE ARCHITECT PROTOCOL - Conformidade 100%

Este módulo segue rigorosamente o protocolo:
- ✅ Zero fallbacks legados
- ✅ Caminho único de autenticação
- ✅ Sem código morto

#### Interface de Retorno

```typescript
interface ProducerAuth {
  id: string;           // UUID do produtor
  email: string;        // Email do produtor
  name: string | null;  // Nome (pode ser null)
  role: string;         // "owner" | "admin" | "user" | "seller"
}
```

#### Funções Exportadas

| Função | Parâmetros | Retorno | Descrição |
|--------|------------|---------|-----------|
| `getAuthenticatedProducer` | (supabase, request) | `Promise<ProducerAuth \| null>` | Tenta autenticar, retorna null se falhar |
| `requireAuthenticatedProducer` | (supabase, request) | `Promise<ProducerAuth>` | Exige autenticação, throws se falhar |
| `unauthorizedResponse` | (corsHeaders) | `Response` | Response 401 padronizada |

#### Exemplo de Uso

```typescript
import { 
  requireAuthenticatedProducer, 
  unauthorizedResponse 
} from "../_shared/unified-auth.ts";

// Em uma Edge Function protegida:
let producer;
try {
  producer = await requireAuthenticatedProducer(supabaseAdmin, req);
} catch {
  return unauthorizedResponse(corsHeaders);
}

console.log(`Autenticado: ${producer.email} (${producer.role})`);
```

#### Header Esperado

```
X-Producer-Session-Token: <token_de_64_caracteres>
```

#### Fluxo de Validação

```
┌─────────────────────────────────────────────────────────┐
│              VALIDAÇÃO DE SESSION TOKEN                  │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
         ┌───────────────────────────────┐
         │ Extrai X-Producer-Session-Token│
         │ do header                      │
         └───────────────┬───────────────┘
                         │
            Token existe? 
                         │
         ┌───────────────┴───────────────┐
         ▼ NÃO                           ▼ SIM
  ┌─────────────┐            ┌───────────────────────┐
  │ return null │            │ Busca em              │
  └─────────────┘            │ producer_sessions     │
                             │ WHERE is_valid = true │
                             │ AND expires_at > now  │
                             └───────────┬───────────┘
                                         │
                          Sessão válida?
                                         │
                         ┌───────────────┴───────────────┐
                         ▼ NÃO                           ▼ SIM
                  ┌─────────────┐            ┌───────────────────┐
                  │ return null │            │ Busca profile     │
                  └─────────────┘            │ e user_role       │
                                             └─────────┬─────────┘
                                                       │
                                                       ▼
                                             ┌───────────────────┐
                                             │ return ProducerAuth│
                                             └───────────────────┘
```

---

## 🔒 Segurança

### Princípios Aplicados

1. **Defesa em Profundidade**: Múltiplas camadas (rate limit, auth, role)
2. **Menor Privilégio**: Funções só acessam o necessário
3. **Auditoria Completa**: Todos eventos críticos são logados
4. **Tokens Protegidos**: Armazenados no Vault, nunca expostos

### Tabelas Utilizadas

| Tabela | Módulo | Propósito |
|--------|--------|-----------|
| `rate_limit_attempts` | rate-limit.ts | Controle de tentativas |
| `security_audit_log` | audit-logger.ts | Eventos de segurança |
| `user_roles` | role-validator.ts | Roles dos usuários |
| `profiles` | Vários | Dados de vendedores |

---

## 📝 Convenções

### Logs

Todos os módulos usam prefixo padronizado:

```typescript
console.log('[nome-modulo] Mensagem');
console.error('[nome-modulo] Erro:', error);
```

### Tratamento de Erros

- Nunca silenciar erros críticos
- Retornar `null` em funções de busca que podem falhar
- Lançar `Error` em validações obrigatórias
- Logar sempre antes de falhar

### TypeScript

- Interfaces bem definidas
- Tipos exportados para reutilização
- `any` apenas quando necessário (ex: Supabase client)

---

## 🔗 Links Úteis

- [Logs das Edge Functions](https://supabase.com/dashboard/project/wivbtmtgpsxupfjwwovf/functions)
- [Secrets Configuration](https://supabase.com/dashboard/project/wivbtmtgpsxupfjwwovf/settings/functions)
- [Documentação de Arquitetura](../../docs/ARCHITECTURE.md)
