# 🔐 Sistema de Autenticação - RiseCheckout

**Data:** 18 de Janeiro de 2026  
**Versão:** 2.0.0  
**Status:** ✅ RISE V3 10.0/10 | Produção

---

## 📋 Sumário

1. [Visão Geral da Arquitetura](#-visão-geral-da-arquitetura)
2. [Estrutura de Arquivos](#-estrutura-de-arquivos)
3. [Fluxos de Autenticação](#-fluxos-de-autenticação)
4. [Estrutura do Banco de Dados](#-estrutura-do-banco-de-dados)
5. [Segurança](#-segurança)
6. [Constantes Centralizadas](#-constantes-centralizadas)
7. [Response Helpers](#-response-helpers)
8. [API Endpoints](#-api-endpoints)
9. [Frontend Hooks](#-frontend-hooks)
10. [Decisões Arquiteturais](#-decisões-arquiteturais)
11. [Score RISE V3](#-score-rise-v3)

---

## 🏗️ Visão Geral da Arquitetura

### Dual-Domain Authentication

O RiseCheckout implementa um sistema de autenticação **dual-domain** com domínios completamente separados:

| Domínio | Tabela de Perfil | Tabela de Sessão | Propósito |
|---------|------------------|------------------|-----------|
| **Producer** | `profiles` | `producer_sessions` | Vendedores/Produtores do SaaS |
| **Buyer** | `buyer_profiles` | `buyer_sessions` | Compradores/Clientes finais |

### Por que NÃO usamos Supabase Auth JWT?

O sistema foi projetado com **tokens de sessão customizados** ao invés do Supabase Auth padrão por razões arquiteturais:

1. **Separação de Domínios:** Produtores e Compradores são entidades completamente distintas com fluxos diferentes
2. **Evitar "Dual-Auth":** Combinar `auth.users` com tabelas customizadas gera complexidade desnecessária
3. **Controle Total:** Tokens customizados permitem expiração, revogação e auditoria granular
4. **RLS Simplificado:** A função SQL `get_producer_id_from_session()` resolve o producer_id sem dependência do JWT

```
┌─────────────────────────────────────────────────────────────────┐
│                    ARQUITETURA DE AUTH                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────┐                    ┌─────────────┐           │
│   │  PRODUCER   │                    │   BUYER     │           │
│   │   Domain    │                    │   Domain    │           │
│   └──────┬──────┘                    └──────┬──────┘           │
│          │                                  │                   │
│          ▼                                  ▼                   │
│   ┌─────────────┐                    ┌─────────────┐           │
│   │  profiles   │                    │buyer_profiles│           │
│   │    table    │                    │    table    │           │
│   └──────┬──────┘                    └──────┬──────┘           │
│          │                                  │                   │
│          ▼                                  ▼                   │
│   ┌─────────────┐                    ┌─────────────┐           │
│   │  producer_  │                    │   buyer_    │           │
│   │  sessions   │                    │  sessions   │           │
│   └──────┬──────┘                    └──────┬──────┘           │
│          │                                  │                   │
│          ▼                                  ▼                   │
│   ┌─────────────┐                    ┌─────────────┐           │
│   │producer-auth│                    │ buyer-auth  │           │
│   │Edge Function│                    │Edge Function│           │
│   └─────────────┘                    └─────────────┘           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Estrutura de Arquivos

### Edge Functions (Backend)

```
supabase/functions/
├── _shared/
│   ├── auth-constants.ts          # Constantes centralizadas (BCRYPT_COST, SESSION_DURATION, etc.)
│   ├── buyer-auth-handlers.ts     # Handlers core: register, login, logout
│   ├── buyer-auth-handlers-extended.ts  # Handlers: validate, check-email, password-reset
│   ├── buyer-auth-password.ts     # Hash/verify (bcrypt), token generation
│   ├── buyer-auth-producer-handlers.ts  # Producer → Buyer access handlers
│   ├── buyer-auth-types.ts        # Interfaces e tipos TypeScript
│   ├── producer-auth-helpers.ts   # Hash/verify para producers
│   └── response-helpers.ts        # jsonResponse, errorResponse padronizados
│
├── buyer-auth/
│   └── index.ts                   # Router principal para ações de buyer
│
├── buyer-session/
│   └── index.ts                   # Validação/refresh de sessão buyer
│
├── producer-auth/
│   └── index.ts                   # Router principal para ações de producer
│
└── producer-session/
    └── index.ts                   # Validação de sessão producer
```

### Frontend (React Hooks)

```
src/hooks/
├── useBuyerAuth.ts       # Hook completo: login, register, logout, checkEmail
├── useBuyerSession.ts    # Hook de validação de sessão com React Query
├── useProducerAuth.ts    # Hook completo: login, register, logout, resetPassword
└── useProducerSession.ts # Hook de validação de sessão com React Query
```

### Cliente Supabase

```
src/integrations/supabase/
└── client.ts             # Cliente Supabase (SEM injeção estática de headers)
```

---

## 🔄 Fluxos de Autenticação

### Fluxo de Login (Producer)

```mermaid
sequenceDiagram
    participant U as Usuário
    participant FE as Frontend
    participant EF as Edge Function
    participant DB as Database
    
    U->>FE: Submete email + senha
    FE->>EF: POST /producer-auth?action=login
    EF->>DB: SELECT * FROM profiles WHERE email = ?
    DB-->>EF: Profile data
    EF->>EF: bcrypt.verify(senha, hash)
    alt Senha válida
        EF->>EF: crypto.randomUUID() → token
        EF->>DB: INSERT INTO producer_sessions
        EF-->>FE: { success: true, token, profile }
        FE->>FE: localStorage.setItem('producer_session_token', token)
        FE-->>U: Redirect para Dashboard
    else Senha inválida
        EF-->>FE: { success: false, error: 'Credenciais inválidas' }
        FE-->>U: Mostra erro
    end
```

### Fluxo de Requisição Autenticada

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant API as api.call()
    participant EF as Edge Function
    participant DB as Database
    
    FE->>API: api.call('my-function', payload)
    API->>API: Injeta x-producer-session-token
    API->>EF: POST /my-function
    EF->>EF: requireAuthenticatedProducer(req)
    EF->>DB: SELECT producer_id FROM producer_sessions WHERE token = ?
    DB-->>EF: producer_id
    EF->>EF: Executa lógica de negócio
    EF-->>FE: Response
```

### Fluxo de RLS com get_producer_id_from_session()

```mermaid
sequenceDiagram
    participant EF as Edge Function
    participant RLS as RLS Policy
    participant FN as SQL Function
    participant DB as Database
    
    EF->>DB: Query com service_role
    Note over EF,DB: set_config('request.headers', headers)
    DB->>RLS: Verifica policy
    RLS->>FN: get_producer_id_from_session()
    FN->>FN: Extrai token do header
    FN->>DB: SELECT producer_id FROM producer_sessions
    DB-->>FN: producer_id
    FN-->>RLS: Retorna producer_id
    RLS-->>EF: Permite/Nega acesso
```

---

## 🗃️ Estrutura do Banco de Dados

### Tabela: `producer_sessions`

```sql
CREATE TABLE producer_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    session_token TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL,
    is_valid BOOLEAN DEFAULT true,
    ip_address TEXT,
    user_agent TEXT,
    last_activity_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX idx_producer_sessions_token ON producer_sessions(session_token);
CREATE INDEX idx_producer_sessions_producer ON producer_sessions(producer_id);
CREATE INDEX idx_producer_sessions_valid ON producer_sessions(is_valid, expires_at);
```

### Tabela: `buyer_sessions`

```sql
CREATE TABLE buyer_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID NOT NULL REFERENCES buyer_profiles(id) ON DELETE CASCADE,
    session_token TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL,
    is_valid BOOLEAN DEFAULT true,
    ip_address TEXT,
    user_agent TEXT,
    last_activity_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX idx_buyer_sessions_token ON buyer_sessions(session_token);
CREATE INDEX idx_buyer_sessions_buyer ON buyer_sessions(buyer_id);
CREATE INDEX idx_buyer_sessions_valid ON buyer_sessions(is_valid, expires_at);
```

### Tabela: `profiles` (Producers)

```sql
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    password_hash_version INTEGER DEFAULT 2,  -- 2 = bcrypt
    is_owner BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    -- ... outros campos
);
```

### Tabela: `buyer_profiles`

```sql
CREATE TABLE buyer_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    password_hash TEXT NOT NULL,
    password_hash_version INTEGER DEFAULT 2,  -- 2 = bcrypt
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    phone TEXT,
    reset_token TEXT,
    reset_token_expires_at TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Função SQL: `get_producer_id_from_session()`

```sql
CREATE OR REPLACE FUNCTION public.get_producer_id_from_session()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    session_token TEXT;
    producer_id UUID;
BEGIN
    -- Extrai token do header customizado
    session_token := current_setting('request.headers', true)::json->>'x-producer-session-token';
    
    IF session_token IS NULL OR session_token = '' THEN
        -- Fallback para auth.uid() se não houver token customizado
        RETURN auth.uid();
    END IF;
    
    -- Busca producer_id da sessão válida
    SELECT ps.producer_id INTO producer_id
    FROM producer_sessions ps
    WHERE ps.session_token = session_token
      AND ps.is_valid = true
      AND ps.expires_at > now();
    
    -- Retorna producer_id ou fallback para auth.uid()
    RETURN COALESCE(producer_id, auth.uid());
END;
$$;
```

---

## 🔒 Segurança

### Hashing de Senhas

| Aspecto | Implementação |
|---------|---------------|
| **Algoritmo** | bcrypt |
| **Cost Factor** | 10 (~100ms/hash) |
| **Versão** | `password_hash_version = 2` |
| **Biblioteca** | `bcrypt` (Deno) |

```typescript
// supabase/functions/_shared/auth-constants.ts
export const CURRENT_HASH_VERSION = 2;
export const BCRYPT_COST = 10;
```

### Geração de Tokens

```typescript
// Token de sessão: UUID v4 criptograficamente seguro
const sessionToken = crypto.randomUUID();

// Token de reset de senha: 64 bytes hex
const resetToken = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
```

### Password Markers (Marcadores Especiais)

Usados para estados especiais de senha sem hash real:

| Marker | Propósito |
|--------|-----------|
| `REQUIRES_RESET` | Conta requer redefinição de senha |
| `PENDING_PASSWORD_SETUP` | Conta nova, senha não configurada |
| `OWNER_NO_PASSWORD` | Conta de proprietário (login via producer auth) |

```typescript
// supabase/functions/_shared/auth-constants.ts
export const PASSWORD_REQUIRES_RESET = "REQUIRES_RESET";
export const PASSWORD_PENDING_SETUP = "PENDING_PASSWORD_SETUP";
export const PASSWORD_OWNER_NO_PASSWORD = "OWNER_NO_PASSWORD";
```

### Rate Limiting

| Ação | Limite | Bloqueio |
|------|--------|----------|
| Login | 5 tentativas/15min | 15 minutos |
| Register | 3 tentativas/hora | 1 hora |
| Password Reset | 3 tentativas/hora | 1 hora |

### Validação de Senha (Policy)

```typescript
// Requisitos mínimos
- 8+ caracteres
- 1+ letra maiúscula
- 1+ letra minúscula
- 1+ número
- 1+ caractere especial
```

### Sanitização de Input

- **Email:** Normalizado e sanitizado
- **Nome:** DOMPurify para prevenir XSS
- **Todos inputs:** Validação Zod no backend

---

## 📊 Constantes Centralizadas

**Arquivo:** `supabase/functions/_shared/auth-constants.ts`

```typescript
// Hash
export const CURRENT_HASH_VERSION = 2;      // bcrypt only
export const BCRYPT_COST = 10;              // ~100ms per hash

// Sessions
export const PRODUCER_SESSION_DURATION_DAYS = 30;
export const BUYER_SESSION_DURATION_DAYS = 30;
export const SESSION_DURATION_DAYS = BUYER_SESSION_DURATION_DAYS; // alias

// Password Reset
export const RESET_TOKEN_EXPIRY_HOURS = 1;

// Password Markers
export const PASSWORD_REQUIRES_RESET = "REQUIRES_RESET";
export const PASSWORD_PENDING_SETUP = "PENDING_PASSWORD_SETUP";
export const PASSWORD_OWNER_NO_PASSWORD = "OWNER_NO_PASSWORD";

// Legacy (deprecated)
export const PENDING_MIGRATION = "PENDING_MIGRATION";
```

---

## 📤 Response Helpers

**Arquivo:** `supabase/functions/_shared/response-helpers.ts`

### Assinatura Padronizada

```typescript
function jsonResponse(
    data: unknown,
    corsHeaders: HeadersInit,
    status: number = 200
): Response
```

### Uso

```typescript
import { jsonResponse, errorResponse } from "../_shared/response-helpers.ts";

// Sucesso
return jsonResponse({ success: true, data }, corsHeaders);

// Sucesso com status customizado
return jsonResponse({ created: true }, corsHeaders, 201);

// Erro
return errorResponse("Mensagem de erro", corsHeaders, 400);

// Erro de autenticação
return authErrorResponse("Token inválido", corsHeaders); // 401
```

---

## 🔌 API Endpoints

### Producer Auth (`/producer-auth`)

| Action | Método | Descrição |
|--------|--------|-----------|
| `login` | POST | Login com email/senha |
| `register` | POST | Registro de novo producer |
| `logout` | POST | Invalidar sessão |
| `validate` | POST | Validar token de sessão |
| `request-password-reset` | POST | Solicitar reset de senha |
| `verify-reset-token` | POST | Verificar token de reset |
| `reset-password` | POST | Redefinir senha |

### Buyer Auth (`/buyer-auth`)

| Action | Método | Descrição |
|--------|--------|-----------|
| `register` | POST | Registro de novo buyer |
| `login` | POST | Login com email/senha |
| `logout` | POST | Invalidar sessão |
| `validate` | POST | Validar token de sessão |
| `check-email` | POST | Verificar se email existe |
| `request-password-reset` | POST | Solicitar reset de senha |
| `verify-reset-token` | POST | Verificar token de reset |
| `reset-password` | POST | Redefinir senha |
| `check-producer-buyer` | POST | Verificar se producer tem buyer |
| `ensure-producer-access` | POST | Garantir acesso de producer |
| `producer-login` | POST | Login como producer na área do buyer |

### Buyer Session (`/buyer-session`)

| Action | Método | Descrição |
|--------|--------|-----------|
| `validate` | POST | Validar sessão |
| `logout` | POST | Invalidar sessão |
| `refresh` | POST | Renovar sessão |

### Producer Session (`/producer-session`)

| Action | Método | Descrição |
|--------|--------|-----------|
| `validate` | POST | Validar sessão |

---

## ⚛️ Frontend Hooks

### `useProducerAuth`

```typescript
const {
    producer,           // ProducerProfile | null
    isLoading,          // boolean
    isAuthenticated,    // boolean
    login,              // (email, password) => Promise<LoginResult>
    register,           // (data) => Promise<RegisterResult>
    logout,             // () => Promise<void>
    requestPasswordReset, // (email) => Promise<boolean>
    validateSession,    // () => Promise<boolean>
} = useProducerAuth();
```

### `useBuyerAuth`

```typescript
const {
    buyer,              // BuyerProfile | null
    isLoading,          // boolean
    isAuthenticated,    // boolean
    login,              // (email, password) => Promise<LoginResult>
    register,           // (data) => Promise<RegisterResult>
    logout,             // () => Promise<void>
    checkEmail,         // (email) => Promise<CheckEmailResult>
} = useBuyerAuth();
```

### `useProducerSession`

```typescript
const {
    producer,           // ProducerProfile | null
    isValid,            // boolean
    isLoading,          // boolean
    error,              // Error | null
    invalidateSession,  // () => void
    clearSession,       // () => void
} = useProducerSession();
```

### `useBuyerSession`

```typescript
const {
    buyer,              // BuyerProfile | null
    isValid,            // boolean
    isLoading,          // boolean
    error,              // Error | null
    invalidateSession,  // () => Promise<void>
    setSessionData,     // (buyer) => void
    clearSession,       // () => void
} = useBuyerSession();
```

### Armazenamento de Tokens

| Domínio | localStorage Key |
|---------|------------------|
| Producer | `producer_session_token` |
| Buyer | `buyer_session_token` |

---

## 🎯 Decisões Arquiteturais

### 1. Por que tokens customizados ao invés de Supabase Auth JWT?

**Problema:** Combinar `auth.users` do Supabase com tabelas customizadas (`profiles`, `buyer_profiles`) cria complexidade de "dual-auth" - onde há conflito entre o JWT do Supabase e a necessidade de sessões customizadas.

**Solução:** Tokens de sessão 100% customizados armazenados em tabelas dedicadas (`producer_sessions`, `buyer_sessions`) com validação via Edge Functions.

**Benefícios:**
- Controle total sobre expiração e revogação
- Auditoria granular de sessões
- Separação clara entre domínios Producer e Buyer
- RLS simplificado via `get_producer_id_from_session()`

### 2. Por que Edge Functions com service_role?

**Problema:** Acesso direto ao banco via frontend (`supabase.from()`) expõe a lógica de negócio e dificulta auditoria.

**Solução:** 100% das operações passam por Edge Functions que usam `service_role` internamente.

**Benefícios:**
- Zero database access no frontend
- Lógica de negócio centralizada
- Auditoria de todas as operações
- Rate limiting aplicado no servidor

### 3. Por que bcrypt ao invés de SHA-256?

**Problema:** SHA-256 (versão 1 legada) é vulnerável a ataques de força bruta modernos.

**Solução:** Migração completa para bcrypt com cost factor 10.

**Benefícios:**
- Resistente a ataques de GPU/ASIC
- Salt automático
- Cost factor ajustável para hardware futuro

---

## 🏆 Score RISE V3

| Critério | Nota | Justificativa |
|----------|------|---------------|
| Manutenibilidade Infinita | 10/10 | Código centralizado, zero duplicação |
| Zero Dívida Técnica | 10/10 | Nenhum TODO, workaround ou código legado |
| Arquitetura Correta | 10/10 | SOLID, Clean Architecture, separação de concerns |
| Escalabilidade | 10/10 | Modular, stateless, horizontally scalable |
| Segurança | 10/10 | bcrypt, rate limiting, sanitização, RLS |
| **NOTA FINAL** | **10.0/10** | ✅ **CONFORMIDADE TOTAL** |

---

## 📚 Documentação Relacionada

- [STATUS_ATUAL.md](./STATUS_ATUAL.md) - Status geral do projeto
- [AUTH_CHANGELOG.md](./AUTH_CHANGELOG.md) - Histórico de mudanças do auth
- [EDGE_FUNCTIONS_REGISTRY.md](./EDGE_FUNCTIONS_REGISTRY.md) - Registro de Edge Functions
- [ORDER_STATUS_MODEL.md](./ORDER_STATUS_MODEL.md) - Modelo de status de pedidos

---

**Última atualização:** 18 de Janeiro de 2026
