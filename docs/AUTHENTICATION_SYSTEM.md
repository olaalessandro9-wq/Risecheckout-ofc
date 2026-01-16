# 🔐 Sistema de Autenticação - RiseCheckout

**Última Atualização:** 16 de Janeiro de 2026  
**Status:** ✅ Produção  
**RISE ARCHITECT PROTOCOL:** 100% Conformidade

---

## 📋 Sumário

1. [Visão Geral](#visão-geral)
2. [Por Que Não Usamos Supabase Auth?](#por-que-não-usamos-supabase-auth)
3. [Arquitetura](#arquitetura)
4. [Fluxo de Autenticação](#fluxo-de-autenticação)
5. [Módulo unified-auth.ts](#módulo-unified-authts)
6. [Edge Functions Protegidas](#edge-functions-protegidas)
7. [Frontend Integration](#frontend-integration)
8. [RISE ARCHITECT PROTOCOL](#rise-architect-protocol)

---

## Visão Geral

RiseCheckout utiliza um **sistema de autenticação customizado** baseado em `producer_sessions`, completamente independente do Supabase Auth.

```
┌─────────────────────────────────────────────────────────────────────┐
│                SISTEMA DE AUTENTICAÇÃO RISECHECKOUT                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐    ┌──────────────────┐    ┌──────────────────┐   │
│  │   Frontend   │───▶│  producer-auth   │───▶│producer_sessions │   │
│  │   (Login)    │    │  Edge Function   │    │    (Tabela)      │   │
│  └──────────────┘    └──────────────────┘    └──────────────────┘   │
│         │                                            │               │
│         │ Armazena session_token                     │               │
│         ▼                                            │               │
│  ┌──────────────┐    ┌──────────────────┐            │               │
│  │   Frontend   │───▶│  Edge Function   │────────────┘               │
│  │  (Requests)  │    │   (Protegida)    │  Valida via unified-auth   │
│  └──────────────┘    └──────────────────┘                            │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Por Que Não Usamos Supabase Auth?

| Aspecto | Supabase Auth | producer_sessions |
|---------|---------------|-------------------|
| **Controle de Sessão** | Limitado | Total |
| **Expiração** | JWT padrão | Customizável (7 dias) |
| **Invalidação** | Complexa | Simples (`is_valid = false`) |
| **Separação Buyer/Producer** | Difícil | Natural |
| **Auditoria** | Limitada | Completa |
| **Multi-sessão** | Automático | Controlado |

### Benefícios da Implementação Customizada

1. **Maior controle sobre sessões** - Podemos invalidar, rastrear e gerenciar
2. **Expiração customizável** - 7 dias padrão, extensível
3. **Separação clara** - Compradores (`buyer_sessions`) vs Produtores (`producer_sessions`)
4. **Auditoria completa** - Todas as ações de auth são logadas
5. **Simplicidade** - Sem dependência de JWTs complexos

---

## Arquitetura

### Tabela: `producer_sessions`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | uuid | Primary Key |
| `producer_id` | uuid | FK → `profiles.id` |
| `session_token` | text | Token único (64 caracteres) |
| `expires_at` | timestamptz | Data de expiração (7 dias) |
| `is_valid` | boolean | Permite invalidação manual |
| `ip_address` | text | IP de origem |
| `user_agent` | text | Browser/device |
| `created_at` | timestamptz | Data de criação |
| `last_activity_at` | timestamptz | Última atividade |

### Componentes do Sistema

```
┌───────────────────────────────────────────────────────────────┐
│                       COMPONENTES                              │
├───────────────────────────────────────────────────────────────┤
│                                                                │
│  1. TABELA: producer_sessions                                  │
│     └─► Armazena sessões ativas de produtores                  │
│                                                                │
│  2. EDGE FUNCTION: producer-auth                               │
│     └─► Login: Cria sessão e retorna token                     │
│     └─► Logout: Invalida sessão existente                      │
│                                                                │
│  3. MÓDULO: unified-auth.ts                                    │
│     └─► Valida tokens em todas as Edge Functions               │
│     └─► Retorna dados do produtor autenticado                  │
│                                                                │
│  4. FRONTEND: useProducerAuth hook                             │
│     └─► Gerencia estado de autenticação                        │
│     └─► Envia header em todas as requisições                   │
│                                                                │
└───────────────────────────────────────────────────────────────┘
```

---

## Fluxo de Autenticação

### Login

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FLUXO DE LOGIN                                │
└─────────────────────────────────────────────────────────────────────┘

  ┌──────────┐           ┌──────────────────┐          ┌─────────────┐
  │ Frontend │           │  producer-auth   │          │  Database   │
  │  (User)  │           │  Edge Function   │          │             │
  └────┬─────┘           └────────┬─────────┘          └──────┬──────┘
       │                          │                           │
       │ 1. POST /producer-auth   │                           │
       │    { email, password }   │                           │
       │─────────────────────────▶│                           │
       │                          │                           │
       │                          │ 2. Busca profile          │
       │                          │    por email              │
       │                          │──────────────────────────▶│
       │                          │                           │
       │                          │ 3. Profile + password_hash│
       │                          │◀──────────────────────────│
       │                          │                           │
       │                          │ 4. bcrypt.verify()        │
       │                          │    Valida senha           │
       │                          │                           │
       │                          │ 5. Gera session_token     │
       │                          │    (64 chars aleatórios)  │
       │                          │                           │
       │                          │ 6. INSERT producer_sessions│
       │                          │──────────────────────────▶│
       │                          │                           │
       │ 7. { session_token,      │                           │
       │      producer, role }    │                           │
       │◀─────────────────────────│                           │
       │                          │                           │
       │ 8. Armazena token        │                           │
       │    em localStorage       │                           │
       │                          │                           │
```

### Requisição Autenticada

```
┌─────────────────────────────────────────────────────────────────────┐
│                   FLUXO DE REQUISIÇÃO AUTENTICADA                    │
└─────────────────────────────────────────────────────────────────────┘

  ┌──────────┐           ┌──────────────────┐          ┌─────────────┐
  │ Frontend │           │  Edge Function   │          │  Database   │
  │          │           │   (Qualquer)     │          │             │
  └────┬─────┘           └────────┬─────────┘          └──────┬──────┘
       │                          │                           │
       │ 1. Request com header    │                           │
       │    X-Producer-Session-   │                           │
       │    Token: <token>        │                           │
       │─────────────────────────▶│                           │
       │                          │                           │
       │                          │ 2. unified-auth.ts        │
       │                          │    getAuthenticatedProducer│
       │                          │                           │
       │                          │ 3. SELECT producer_sessions│
       │                          │    WHERE token = X        │
       │                          │    AND is_valid = true    │
       │                          │    AND expires_at > now() │
       │                          │──────────────────────────▶│
       │                          │                           │
       │                          │ 4. Sessão válida          │
       │                          │◀──────────────────────────│
       │                          │                           │
       │                          │ 5. SELECT profiles        │
       │                          │    WHERE id = producer_id │
       │                          │──────────────────────────▶│
       │                          │                           │
       │                          │ 6. Profile data           │
       │                          │◀──────────────────────────│
       │                          │                           │
       │                          │ 7. SELECT user_roles      │
       │                          │──────────────────────────▶│
       │                          │                           │
       │                          │ 8. Role data              │
       │                          │◀──────────────────────────│
       │                          │                           │
       │                          │ 9. Retorna ProducerAuth   │
       │                          │    { id, email, name,     │
       │                          │      role }               │
       │                          │                           │
       │ 10. Response             │                           │
       │◀─────────────────────────│                           │
       │                          │                           │
```

---

## Módulo unified-auth.ts

### Localização

```
supabase/functions/_shared/unified-auth.ts
```

### Interface de Retorno

```typescript
interface ProducerAuth {
  id: string;           // UUID do produtor
  email: string;        // Email do produtor
  name: string | null;  // Nome (pode ser null)
  role: string;         // "owner" | "admin" | "user" | "seller"
}
```

### Funções Exportadas

| Função | Parâmetros | Retorno | Descrição |
|--------|------------|---------|-----------|
| `getAuthenticatedProducer` | `(supabase, request)` | `Promise<ProducerAuth \| null>` | Tenta autenticar, retorna null se falhar |
| `requireAuthenticatedProducer` | `(supabase, request)` | `Promise<ProducerAuth>` | Exige autenticação, throws se falhar |
| `unauthorizedResponse` | `(corsHeaders)` | `Response` | Response 401 padronizada |

### Exemplo de Uso

```typescript
import { 
  requireAuthenticatedProducer, 
  unauthorizedResponse 
} from "../_shared/unified-auth.ts";

Deno.serve(async (req) => {
  // CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Autenticação obrigatória
  let producer;
  try {
    producer = await requireAuthenticatedProducer(supabaseAdmin, req);
  } catch {
    return unauthorizedResponse(corsHeaders);
  }

  // Usar dados do produtor
  console.log(`Authenticated: ${producer.email} (${producer.role})`);
  
  // Resto da lógica...
});
```

### Header Esperado

```
X-Producer-Session-Token: <token_de_64_caracteres>
```

---

## Edge Functions Protegidas

| Edge Function | Usa unified-auth | Descrição |
|---------------|------------------|-----------|
| `manage-affiliation` | ✅ | Gerenciamento de afiliações |
| `update-affiliate-settings` | ✅ | Configurações de afiliado |
| `manage-user-role` | ✅ | Alterar roles de usuário |
| `manage-user-status` | ✅ | Ativar/desativar usuários |
| `create-product` | ✅ | Criar produtos |
| `update-product` | ✅ | Atualizar produtos |
| `get-vendor-credentials` | ✅ | Buscar credenciais de gateway |
| `save-vendor-credentials` | ✅ | Salvar credenciais de gateway |

---

## Frontend Integration

### Hook: useProducerAuth

O frontend gerencia autenticação via hook customizado que:

1. **Armazena token** em `localStorage`
2. **Envia header** `X-Producer-Session-Token` em todas as requisições
3. **Valida sessão** no carregamento da página
4. **Limpa sessão** no logout

### Exemplo de Chamada

```typescript
// O hook adiciona automaticamente o header
const response = await supabase.functions.invoke("manage-affiliation", {
  body: { action: "approve", affiliateId: "..." },
  headers: {
    "X-Producer-Session-Token": sessionToken
  }
});
```

---

## RISE ARCHITECT PROTOCOL

### Conformidade 100%

Este sistema foi implementado seguindo rigorosamente o RISE ARCHITECT PROTOCOL:

| Princípio | Status | Implementação |
|-----------|--------|---------------|
| **Zero Código Morto** | ✅ | Sem fallbacks JWT ou body token |
| **Single Responsibility** | ✅ | unified-auth só valida producer_sessions |
| **Caminho Único** | ✅ | Apenas `X-Producer-Session-Token` |
| **Sem Fallbacks** | ✅ | Removidos em 10/01/2026 |
| **Arquitetura Limpa** | ✅ | Módulo compartilhado isolado |

### Histórico de Limpeza

| Data | Ação | Linhas Removidas |
|------|------|------------------|
| 10/01/2026 | Remoção de fallback JWT | ~40 linhas |
| 10/01/2026 | Remoção de body.sessionToken | ~15 linhas |
| 10/01/2026 | Remoção de função validateJWT | ~35 linhas |

### Resultado

```
ANTES:  207 linhas, 3 caminhos de autenticação
DEPOIS: 126 linhas, 1 caminho de autenticação
```

---

## Referências

- [`supabase/functions/_shared/unified-auth.ts`](../supabase/functions/_shared/unified-auth.ts) - Implementação
- [`supabase/functions/_shared/README.md`](../supabase/functions/_shared/README.md) - Documentação de módulos
- [`docs/ADMIN_ROUTES_SECURITY.md`](./ADMIN_ROUTES_SECURITY.md) - Segurança de rotas

---

*Documento mantido pela equipe de desenvolvimento RiseCheckout.*
*Conformidade RISE ARCHITECT PROTOCOL verificada em 16 de Janeiro de 2026.*
