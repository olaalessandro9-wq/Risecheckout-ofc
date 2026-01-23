# 🔐 Sistema de Autenticação Unificado - RiseCheckout

**Data:** 23 de Janeiro de 2026  
**Versão:** 1.0.0  
**Status:** ✅ RISE V3 10.0/10 | 100% MIGRADO

---

## 📋 Sumário

1. [Visão Geral](#-visão-geral)
2. [Arquitetura Unificada](#-arquitetura-unificada)
3. [Componentes do Sistema](#-componentes-do-sistema)
4. [Fluxos de Autenticação](#-fluxos-de-autenticação)
5. [Banco de Dados](#-banco-de-dados)
6. [Segurança](#-segurança)
7. [API Endpoints](#-api-endpoints)
8. [Frontend](#-frontend)

---

## 🏗️ Visão Geral

O RiseCheckout implementa um **Sistema de Autenticação Unificado** que gerencia producers (vendedores) e buyers (compradores) através de uma única infraestrutura.

### Características Principais

| Aspecto | Implementação |
|---------|---------------|
| **Identidade** | Tabela única `users` para ambos os papéis |
| **Sessões** | Tabela única `sessions` com `active_role` |
| **Cookies** | `__Host-rise_access` e `__Host-rise_refresh` |
| **Context Switch** | Troca instantânea entre Produtor ↔ Aluno |
| **Edge Function** | `unified-auth` (única para todos os fluxos) |

---

## 🔄 Arquitetura Unificada

```
┌─────────────────────────────────────────────────────────────────┐
│                 UNIFIED AUTHENTICATION SYSTEM                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Browser (React App)                                           │
│        │                                                        │
│        ▼                                                        │
│   useUnifiedAuth() hook                                         │
│        │                                                        │
│        ▼                                                        │
│   api.publicCall() ──────► unified-auth Edge Function           │
│        │                         │                              │
│        │                         ▼                              │
│        │                   ┌───────────┐                        │
│        │                   │   users   │ (identidade única)     │
│        │                   └───────────┘                        │
│        │                         │                              │
│        │                         ▼                              │
│        │                   ┌───────────┐                        │
│        │                   │ sessions  │ (com active_role)      │
│        │                   └───────────┘                        │
│        │                         │                              │
│        ▼                         ▼                              │
│   Set-Cookie:              getAuthenticatedUser()               │
│   __Host-rise_access       (unified-auth-v2.ts)                 │
│   __Host-rise_refresh                                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Modelo de Identidade Única

Um usuário pode ter múltiplos papéis (producer, buyer) associados a uma única conta:

```
┌─────────────────────────────────────────────────────────────────┐
│  USUÁRIO: alessanderlaem@gmail.com                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  users.id: "abc-123-def"                                        │
│  users.email: "alessanderlaem@gmail.com"                        │
│  users.roles: ["producer", "buyer"]                             │
│                                                                  │
│  ┌─────────────────────┐    ┌─────────────────────┐            │
│  │ active_role:        │    │ active_role:        │            │
│  │ "producer"          │    │ "buyer"             │            │
│  │ ─────────────────── │    │ ─────────────────── │            │
│  │ Acessa Dashboard    │    │ Acessa Área de      │            │
│  │ Cria produtos       │◄──►│ Membros             │            │
│  │ Gerencia vendas     │    │ Consome cursos      │            │
│  └─────────────────────┘    └─────────────────────┘            │
│              ▲                         ▲                        │
│              │    switch-context       │                        │
│              └─────────────────────────┘                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🧩 Componentes do Sistema

### Backend (Edge Functions)

| Arquivo | Descrição |
|---------|-----------|
| `unified-auth/index.ts` | Router principal (~113 linhas) |
| `unified-auth/handlers/login.ts` | Handler de login |
| `unified-auth/handlers/register.ts` | Handler de registro |
| `unified-auth/handlers/refresh.ts` | Handler de refresh token |
| `unified-auth/handlers/password-reset-request.ts` | Solicita reset de senha |
| `unified-auth/handlers/reset-password.ts` | Executa reset de senha |
| `unified-auth/handlers/check-email.ts` | Verifica existência de email |
| `unified-auth/handlers/switch-context.ts` | Troca de role ativo |
| `_shared/unified-auth-v2.ts` | Helpers de validação de sessão |
| `_shared/password-utils.ts` | Utilitários de hash/token |
| `_shared/auth-types.ts` | Tipos TypeScript |

### Frontend (React)

| Arquivo | Descrição |
|---------|-----------|
| `src/hooks/useUnifiedAuth.ts` | Hook principal de autenticação |
| `src/lib/token-manager/unified-service.ts` | Serviço de gerenciamento de tokens |
| `src/lib/token-manager/service.ts` | Classe TokenService |
| `src/lib/api/client.ts` | Cliente HTTP com auto-refresh |

---

## 🔄 Fluxos de Autenticação

### Login

```
1. Usuário submete email + senha
2. Frontend chama unified-auth (action: login)
3. Backend valida credenciais na tabela users
4. Backend cria sessão na tabela sessions
5. Backend define cookies httpOnly:
   - __Host-rise_access (60 min)
   - __Host-rise_refresh (30 dias)
6. Frontend recebe { success: true, user, expiresIn }
7. unifiedTokenService.setAuthenticated(expiresIn)
8. Redirect para dashboard ou área de membros
```

### Refresh Token

```
1. Token de acesso expira (ou está próximo: < 5 min)
2. unifiedTokenService detecta via heartbeat
3. Chama unified-auth/refresh com credentials: include
4. Backend valida __Host-rise_refresh cookie
5. Backend rotaciona refresh token (proteção replay)
6. Backend define novos cookies
7. Frontend atualiza estado interno
```

### Switch Context (Troca de Papel)

```
1. Usuário clica "Acessar como Aluno" (ou Produtor)
2. Frontend chama unified-auth (action: switch-context)
3. Backend valida sessão atual
4. Backend atualiza sessions.active_role
5. Frontend recebe novo role
6. UI atualiza para novo contexto
```

---

## 🗃️ Banco de Dados

### Tabela: `users`

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    password_hash TEXT NOT NULL,
    roles TEXT[] DEFAULT ARRAY['buyer'],
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Tabela: `sessions`

```sql
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    access_token TEXT NOT NULL UNIQUE,
    refresh_token TEXT NOT NULL UNIQUE,
    active_role TEXT NOT NULL DEFAULT 'buyer',
    access_token_expires_at TIMESTAMPTZ NOT NULL,
    refresh_token_expires_at TIMESTAMPTZ NOT NULL,
    is_valid BOOLEAN DEFAULT true,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    last_activity_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_sessions_access ON sessions(access_token) WHERE is_valid = true;
CREATE INDEX idx_sessions_refresh ON sessions(refresh_token) WHERE is_valid = true;
CREATE INDEX idx_sessions_user ON sessions(user_id, is_valid);
```

---

## 🔒 Segurança

### Cookies httpOnly

| Cookie | Duração | Flags |
|--------|---------|-------|
| `__Host-rise_access` | 60 min | httpOnly, Secure, SameSite=None, Partitioned, Path=/ |
| `__Host-rise_refresh` | 30 dias | httpOnly, Secure, SameSite=None, Partitioned, Path=/ |

### Proteções Implementadas

| Proteção | Implementação |
|----------|---------------|
| **XSS** | Tokens NUNCA expostos ao JavaScript |
| **CSRF** | SameSite=None + validação de Origin |
| **Replay Attack** | Rotação de refresh token |
| **Brute Force** | Rate limiting por IP/email |
| **Session Hijack** | Validação de IP + User-Agent |

### Hashing de Senhas

```typescript
// bcrypt com cost 10 (~100ms/hash)
const BCRYPT_COST = 10;
const hash = await bcrypt.hash(password, BCRYPT_COST);
```

---

## 📡 API Endpoints

### unified-auth

| Action | Método | Descrição |
|--------|--------|-----------|
| `login` | POST | Autentica usuário |
| `register` | POST | Registra novo usuário |
| `logout` | POST | Invalida sessão atual |
| `refresh` | POST | Renova tokens |
| `check-email` | POST | Verifica se email existe |
| `password-reset-request` | POST | Solicita reset de senha |
| `reset-password` | POST | Executa reset com token |
| `switch-context` | POST | Troca role ativo |
| `validate` | POST | Valida sessão atual |

### Exemplo de Request

```typescript
// Login
const response = await api.publicCall("unified-auth", {
  action: "login",
  email: "user@example.com",
  password: "senha123",
  role: "producer" // ou "buyer"
});
```

---

## 💻 Frontend

### useUnifiedAuth Hook

```typescript
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";

function LoginPage() {
  const { login, isLoading, error } = useUnifiedAuth();
  
  const handleLogin = async () => {
    const result = await login(email, password, "producer");
    if (result.success) {
      navigate("/dashboard");
    }
  };
}
```

### unifiedTokenService

```typescript
import { unifiedTokenService } from "@/lib/token-manager/unified-service";

// Verificar se autenticado
const isAuth = unifiedTokenService.hasValidToken();

// Forçar refresh
await unifiedTokenService.refresh();

// Logout
unifiedTokenService.clearTokens();

// Subscrever a mudanças
unifiedTokenService.subscribe((state, context) => {
  console.log("Auth state:", state);
});
```

---

## 📊 Migração Concluída

Esta arquitetura substitui completamente o sistema anterior que tinha:

| Antes (Legado) | Depois (Unificado) |
|----------------|-------------------|
| `producer_sessions` + `buyer_sessions` | `sessions` única |
| `profiles` + `buyer_profiles` | `users` única |
| `producer-auth` + `buyer-auth` | `unified-auth` única |
| `useProducerAuth` + `useBuyerAuth` | `useUnifiedAuth` única |
| `producerTokenService` + `buyerTokenService` | `unifiedTokenService` única |
| 4 cookies diferentes | 2 cookies (`__Host-rise_*`) |

### Arquivos Deletados na Migração

- `supabase/functions/buyer-auth/`
- `supabase/functions/producer-auth/`
- `supabase/functions/buyer-session/`
- `src/hooks/useBuyerAuth.ts`
- `src/hooks/useProducerAuth.ts`
- `src/lib/token-manager/buyer-service.ts`
- `src/lib/token-manager/producer-service.ts`

---

## ✅ Compliance RISE V3

| Critério | Status |
|----------|--------|
| Zero código morto | ✅ |
| Zero aliases deprecados | ✅ |
| Documentação atualizada | ✅ |
| Limite 300 linhas | ✅ |
| Single Source of Truth | ✅ |
| **Score Final** | **10.0/10** |

---

**Última Atualização:** 23 de Janeiro de 2026  
**Mantenedor:** Lead Architect
