# 🔐 Documentação de Segurança para Rotas Administrativas

**Projeto:** RiseCheckout  
**Última Atualização:** Janeiro 2026  
**Status:** Ativo

---

## 📋 Sumário

1. [Objetivo](#objetivo)
2. [Arquitetura de Segurança em Camadas](#arquitetura-de-segurança-em-camadas)
3. [Estrutura de Arquivos](#estrutura-de-arquivos)
4. [Guia: Adicionando Nova Rota Admin](#guia-adicionando-nova-rota-admin)
5. [Referência de Roles e Permissões](#referência-de-roles-e-permissões)
6. [Opções do RoleProtectedRoute](#opções-do-roleprotectedroute)
7. [Rotas Protegidas Atuais](#rotas-protegidas-atuais)
8. [Regras de Ouro](#regras-de-ouro)

---

## Objetivo

Este documento estabelece o **padrão obrigatório** para implementação de rotas administrativas no RiseCheckout. O objetivo é garantir:

- **Segurança em múltiplas camadas** (defesa em profundidade)
- **Código não carregado** para usuários sem permissão (lazy loading)
- **Consistência** em todas as implementações
- **Facilidade de manutenção** e auditoria

---

## Arquitetura de Segurança em Camadas

```
┌─────────────────────────────────────────────────────────────┐
│                    CAMADA 0: CONTEXT GUARDS                 │
│         Isola Producer e Buyer em painéis separados         │
│                                                             │
│  ✓ ProducerContextGuard bloqueia /dashboard/* para buyers   │
│  ✓ BuyerContextGuard bloqueia /minha-conta/* para producers │
│  ✓ Único modo de troca: clique explícito no ContextSwitcher │
│  ✓ Comportamento idêntico ao Cakto/Kiwify                   │
│                                                             │
│  📄 Documentação: CONTEXT_GUARDS_ARCHITECTURE.md            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    CAMADA 1: LAZY LOADING                   │
│         O código da rota NÃO é carregado no bundle          │
│         até que o usuário navegue para a página             │
│                                                             │
│  ✓ Impede engenharia reversa do código admin                │
│  ✓ Reduz tamanho inicial do bundle                          │
│  ✓ Melhora performance para usuários normais                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│               CAMADA 2: ROLEPROTECTEDROUTE                  │
│         Valida role/permissão ANTES de renderizar           │
│                                                             │
│  ✓ Consulta role do usuário via RPC segura                  │
│  ✓ Bloqueia renderização se não autorizado                  │
│  ✓ Redireciona ou mostra mensagem de acesso negado          │
│  ✓ Log de tentativas de acesso não autorizado               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              CAMADA 3: EDGE FUNCTIONS (Backend)             │
│         Validação REAL no servidor - NUNCA confiar          │
│         apenas no frontend!                                 │
│                                                             │
│  ✓ Autentica via unified-auth-v2.ts (sessions, cookies)     │
│  ✓ Usa role-validator.ts para verificar permissões          │
│  ✓ Registra eventos de segurança via audit-logger.ts        │
│  ✓ Retorna 401 Unauthorized se não autenticado              │
│  ✓ Retorna 403 Forbidden se sem permissão                   │
│  ✓ Única fonte de verdade para autorização                  │
└─────────────────────────────────────────────────────────────┘
```

> ⚠️ **IMPORTANTE**: As camadas 0, 1 e 2 são **conveniência e UX**. A camada 3 (backend) é a **segurança real**. NUNCA confie apenas no frontend!

---

## Estrutura de Arquivos

```
src/
├── App.tsx                          # Define rotas com lazy loading + RoleProtectedRoute
├── components/
│   └── RoleProtectedRoute.tsx       # Componente de proteção de rotas
├── hooks/
│   └── usePermissions.ts            # Hook para verificar permissões no frontend
└── pages/
    └── dashboard/
        └── admin/
            └── AdminHealth.tsx      # Exemplo de página admin

supabase/
└── functions/
    └── _shared/
        ├── role-validator.ts        # Validação de roles no backend
        └── audit-logger.ts          # Log de eventos de segurança
```

---

## Guia: Adicionando Nova Rota Admin

### Passo 1: Criar o Componente da Página

```tsx
// src/pages/dashboard/admin/NovaRotaAdmin.tsx
export default function NovaRotaAdmin() {
  return (
    <div>
      <h1>Nova Funcionalidade Admin</h1>
      {/* Conteúdo da página */}
    </div>
  );
}
```

### Passo 2: Registrar com Lazy Loading no App.tsx

```tsx
// No topo do arquivo, junto com os outros lazy imports:
const NovaRotaAdmin = lazy(() => import("@/pages/dashboard/admin/NovaRotaAdmin"));
```

### Passo 3: Adicionar a Rota com RoleProtectedRoute

```tsx
// Dentro das rotas do dashboard:
<Route 
  path="admin/nova-rota" 
  element={
    <RoleProtectedRoute 
      requiredRole="admin"  // ou requiredPermission="nomePermissao"
      showAccessDenied      // mostra mensagem em vez de redirecionar
    >
      <Suspense fallback={<PageLoader />}>
        <NovaRotaAdmin />
      </Suspense>
    </RoleProtectedRoute>
  } 
/>
```

### Passo 4: Proteger no Backend (Edge Function)

```typescript
// Na Edge Function que a página usa:
import { requireRole } from "../_shared/role-validator.ts";

// No início do handler:
await requireRole(supabase, userId, "admin", "NOME_DA_ACAO", request);
```

### Passo 5: Adicionar à Documentação

Atualize a seção [Rotas Protegidas Atuais](#rotas-protegidas-atuais) deste documento.

---

## Referência de Roles e Permissões

### Hierarquia de Roles

| Role     | Prioridade | Descrição                                    |
|----------|------------|----------------------------------------------|
| `owner`  | 1 (maior)  | Dono da plataforma, acesso total             |
| `admin`  | 2          | Administrador, acesso a funcionalidades admin|
| `user`   | 3          | Usuário padrão do sistema                    |
| `seller` | 4 (menor)  | Vendedor, permissões limitadas               |

> **Nota**: Um role de prioridade maior tem acesso a tudo que roles menores têm.

### Permissões Derivadas

| Permissão             | Roles com Acesso             | Descrição                               |
|-----------------------|------------------------------|-----------------------------------------|
| `canManageProducts`   | owner, admin, user, seller   | Pode criar/editar produtos              |
| `canHaveAffiliates`   | **owner** (exclusivo)        | Pode ter programa de afiliados próprio  |
| `canBecomeAffiliate`  | admin, user, seller          | Pode se afiliar a produtos do Owner     |
| `canAccessMarketplace`| owner, admin, user, seller   | Pode acessar o marketplace              |
| `canAccessAdmin`      | owner, admin                 | Acesso ao painel administrativo         |
| `canManageUsers`      | owner                        | Pode gerenciar outros usuários          |
| `canViewSecurityLogs` | owner                        | Pode ver logs de segurança              |

> **⚠️ IMPORTANTE - Programa de Afiliados**: 
> - **APENAS o Owner** pode TER um programa de afiliados em seus produtos
> - Vendedores (`admin`, `user`, `seller`) podem SE AFILIAR a produtos do Owner, mas **NÃO podem ter afiliados próprios**
> - Esta é uma decisão de design para simplificar o modelo de negócio (ver `docs/MODELO_NEGOCIO.md`)

> **Nota sobre Seller**: O cargo `seller` pode criar produtos e acessar o marketplace, mas tem permissões mais limitadas que `user`.

---

## Opções do RoleProtectedRoute

```tsx
interface RoleProtectedRouteProps {
  children: React.ReactNode;
  
  // Opção 1: Exigir role mínimo
  requiredRole?: "owner" | "admin" | "user" | "seller";
  
  // Opção 2: Exigir permissão específica
  requiredPermission?: 
    | "canManageProducts"
    | "canHaveAffiliates"
    | "canAccessAdmin"
    | "canManageUsers"
    | "isOwner";
  
  // Rota de fallback (padrão: /dashboard)
  fallbackPath?: string;
  
  // Mostrar mensagem de acesso negado em vez de redirecionar
  showAccessDenied?: boolean;
}
```

### Exemplos de Uso

```tsx
// Exigir role admin
<RoleProtectedRoute requiredRole="admin">
  <AdminPanel />
</RoleProtectedRoute>

// Exigir permissão específica
<RoleProtectedRoute requiredPermission="canHaveAffiliates">
  <AffiliatesManagement />
</RoleProtectedRoute>

// Redirecionar para rota específica se não autorizado
<RoleProtectedRoute 
  requiredRole="owner" 
  fallbackPath="/dashboard/home"
>
  <OwnerSettings />
</RoleProtectedRoute>

// Mostrar mensagem de acesso negado
<RoleProtectedRoute 
  requiredRole="admin" 
  showAccessDenied
>
  <AdminHealth />
</RoleProtectedRoute>
```

---

## Rotas Protegidas Atuais

| Rota                    | Proteção                            | Descrição                        |
|-------------------------|-------------------------------------|----------------------------------|
| `/dashboard/afiliados`  | `requiredPermission="canHaveAffiliates"` | Gerenciamento de afiliados  |
| `/dashboard/admin/health` | `requiredRole="admin"`            | Health check do sistema          |

### Rotas Normais (Sem Proteção Especial)

Estas rotas usam apenas `ProtectedRoute` (autenticação), sem validação de role:

- `/dashboard` - Home do dashboard
- `/dashboard/checkout` - Checkout builder
- `/dashboard/checkout/:id` - Edição de checkout
- `/dashboard/checkout/:id/builder` - Builder visual
- `/dashboard/vendas` - Gestão de vendas
- `/dashboard/produtos` - Gestão de produtos
- `/dashboard/marketplace` - Marketplace
- `/dashboard/minhas-afiliacoes` - Minhas afiliações
- `/dashboard/financeiro` - Financeiro
- `/dashboard/trackeamento` - Trackeamento (Pixels + UTMify)
- `/dashboard/webhooks` - Webhooks
- `/dashboard/config` - Configurações
- `/dashboard/ajuda` - Ajuda

> **Nota (2026-01-21):** A rota `/dashboard/integracoes` foi removida. As funcionalidades foram reorganizadas em `/dashboard/trackeamento` (Pixels + UTMify) e `/dashboard/webhooks`.

---

## Regras de Ouro

### ✅ SEMPRE

1. **Usar Lazy Loading** para TODAS as rotas administrativas
2. **Envolver com RoleProtectedRoute** especificando role ou permissão
3. **Validar no backend** via Edge Functions - NUNCA confiar só no frontend
4. **Documentar** cada nova rota protegida neste arquivo
5. **Usar `showAccessDenied`** para UX clara quando acesso é negado

### ❌ NUNCA

1. **Importar componentes admin diretamente** (sem lazy loading)
2. **Confiar apenas no frontend** para segurança
3. **Hardcodar roles** ou verificar via localStorage
4. **Esquecer de atualizar** esta documentação
5. **Criar rotas admin sem as 3 camadas** de proteção

---

## Checklist para Code Review

Ao revisar PRs que adicionam rotas administrativas, verifique:

- [ ] Componente usa `lazy(() => import(...))`
- [ ] Rota envolvida com `<RoleProtectedRoute>`
- [ ] `requiredRole` ou `requiredPermission` especificado
- [ ] `<Suspense fallback={...}>` envolvendo o componente
- [ ] Edge Function usa `requireRole()` ou `requireCanHaveAffiliates()`
- [ ] Documentação atualizada neste arquivo
- [ ] Logs de auditoria implementados para ações sensíveis

---

## Referências

- `src/components/RoleProtectedRoute.tsx` - Implementação do componente
- `src/hooks/usePermissions.ts` - Hook de permissões frontend
- `supabase/functions/_shared/unified-auth.ts` - Autenticação via sessions (unified-auth)
- `supabase/functions/_shared/role-validator.ts` - Validação de roles
- `supabase/functions/_shared/audit-logger.ts` - Logs de segurança
- `docs/AUTHENTICATION_SYSTEM.md` - Documentação completa de autenticação
- `SECURITY.md` - Política geral de segurança do projeto
- `SECURITY_POLICY.md` - Gestão de secrets e resposta a incidentes

---

*Documento mantido pela equipe de desenvolvimento RiseCheckout.*
*Atualizado para refletir sistema de autenticação unificada via sessions (Janeiro 2026).*
