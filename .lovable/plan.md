

# Plano: Marketplace "Em Breve" para Não-Admin/Owner

## Resumo

Modificar o item "Marketplace" no sidebar para mostrar uma badge "Em Breve" e redirecionar para uma página de "Coming Soon" quando clicado por usuários que NÃO sejam `admin` ou `owner`. Para `admin` e `owner`, o comportamento permanece normal.

---

## Análise de Soluções (RISE V3)

### Solução A: Filtrar Marketplace via Permissions + Rota Separada
- Esconder Marketplace para não-admin/owner
- Criar rota `/dashboard/marketplace-em-breve` separada
- **Manutenibilidade**: 5/10 - Usuários não verão o menu (confuso)
- **Zero DT**: 6/10 - Duplicação de lógica de visibilidade
- **Arquitetura**: 5/10 - Viola expectativa do usuário (menu some)
- **NOTA FINAL: 5.3/10**

### Solução B: Badge "Em Breve" no SidebarItem + Guard na Rota
- Estender tipos de navegação com flag `comingSoon`
- Modificar `SidebarItem` para mostrar badge visual
- Criar guard no `App.tsx` para redirecionar não-admin/owner para página EmBreve
- **Manutenibilidade**: 9/10 - Lógica concentrada em poucos pontos
- **Zero DT**: 9/10 - Reutiliza componente EmBreve existente
- **Arquitetura**: 8/10 - Modifica tipos existentes
- **NOTA FINAL: 8.7/10**

### Solução C: Componente Wrapper de Rota + SidebarItem Condicional (MODULAR)
- Criar novo type em `navigation.types.ts`: adicionar `comingSoon` flag
- Criar wrapper `MarketplaceRoute` que verifica role e renderiza EmBreve ou Marketplace
- Modificar `SidebarItem` para mostrar badge "(Em Breve)" no label
- Zero mudança na lógica de permissões existente (não esconde, apenas altera visual/comportamento)
- **Manutenibilidade**: 10/10 - Cada responsabilidade isolada
- **Zero DT**: 10/10 - Usa infraestrutura existente (EmBreve, permissions)
- **Arquitetura**: 10/10 - Clean Architecture, Single Responsibility
- **Escalabilidade**: 10/10 - Fácil aplicar em outros menus futuramente
- **Segurança**: 10/10 - Verificação de role no componente de rota
- **NOTA FINAL: 10.0/10**

### DECISÃO: Solução C (Nota 10.0/10)

---

## Arquitetura da Solução

```text
┌─────────────────────────────────────────────────────────────────┐
│                    FLUXO PARA USER/SELLER                       │
├─────────────────────────────────────────────────────────────────┤
│ 1. Sidebar mostra "Marketplace (Em Breve)" com badge visual    │
│ 2. Clique navega para /dashboard/marketplace                    │
│ 3. MarketplaceRoute verifica role                               │
│ 4. Se role !== admin/owner → renderiza <EmBreve />              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    FLUXO PARA ADMIN/OWNER                        │
├─────────────────────────────────────────────────────────────────┤
│ 1. Sidebar mostra "Marketplace" (sem badge)                     │
│ 2. Clique navega para /dashboard/marketplace                    │
│ 3. MarketplaceRoute verifica role                               │
│ 4. Se role === admin/owner → renderiza <Marketplace />          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Arquivos a Criar/Modificar

| Arquivo | Ação | Linhas Afetadas |
|---------|------|-----------------|
| `src/modules/navigation/types/navigation.types.ts` | MODIFICAR | +5 |
| `src/modules/navigation/config/navigationConfig.ts` | MODIFICAR | +3 |
| `src/modules/navigation/components/Sidebar/SidebarItem.tsx` | MODIFICAR | +20 |
| `src/components/guards/MarketplaceRoute.tsx` | CRIAR | ~35 |
| `src/App.tsx` | MODIFICAR | +5 |

---

## Especificação Técnica

### 1. Estender Tipos de Navegação

**Arquivo:** `src/modules/navigation/types/navigation.types.ts`

```typescript
// Adicionar na interface NavItemConfig:
export interface NavItemConfig {
  readonly id: string;
  readonly label: string;
  readonly icon: LucideIcon;
  readonly variant: NavItemVariant;
  readonly permissions?: NavItemPermissions;
  
  // NOVO: Flag para features "em breve" para roles específicos
  readonly comingSoonForRoles?: readonly AppRole[];
}
```

### 2. Atualizar Configuração do Marketplace

**Arquivo:** `src/modules/navigation/config/navigationConfig.ts`

```typescript
{
  id: "marketplace",
  label: "Marketplace",
  icon: Store,
  variant: {
    type: "route",
    path: "/dashboard/marketplace",
  },
  // NOVO: Em breve para user e seller
  comingSoonForRoles: ["user", "seller"],
},
```

### 3. Modificar SidebarItem para Badge Visual

**Arquivo:** `src/modules/navigation/components/Sidebar/SidebarItem.tsx`

```typescript
import { usePermissions } from "@/hooks/usePermissions";
import { Badge } from "@/components/ui/badge";

export function SidebarItem({ item, showLabels, onNavigate }) {
  const { role } = usePermissions();
  
  // Verificar se é "em breve" para este role
  const isComingSoon = item.comingSoonForRoles?.includes(role) ?? false;
  
  // ... código existente ...
  
  // Modificar o content para incluir badge:
  const content = (
    <>
      <Icon className={...} />
      {showLabels && (
        <span className="...">
          {item.label}
          {isComingSoon && (
            <Badge variant="secondary" className="ml-2 text-xs">
              Em Breve
            </Badge>
          )}
        </span>
      )}
      {/* Active Indicator Strip */}
      ...
    </>
  );
}
```

### 4. Criar Guard MarketplaceRoute

**Arquivo:** `src/components/guards/MarketplaceRoute.tsx`

```typescript
/**
 * MarketplaceRoute - Guard de Acesso ao Marketplace
 * 
 * RISE Protocol V3: Renderização condicional por role
 * - admin/owner: Renderiza Marketplace normal
 * - user/seller: Renderiza página "Em Breve"
 */

import { usePermissions } from "@/hooks/usePermissions";
import EmBreve from "@/pages/EmBreve";

interface MarketplaceRouteProps {
  children: React.ReactNode;
}

export function MarketplaceRoute({ children }: MarketplaceRouteProps) {
  const { role, isLoading } = usePermissions();

  // Aguardando permissões
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Apenas admin e owner têm acesso completo
  const hasFullAccess = role === "admin" || role === "owner";

  if (!hasFullAccess) {
    return <EmBreve titulo="Marketplace" />;
  }

  return <>{children}</>;
}
```

### 5. Integrar Guard no App.tsx

**Arquivo:** `src/App.tsx`

```typescript
import { MarketplaceRoute } from "./components/guards/MarketplaceRoute";

// Na rota do marketplace:
{ 
  path: "marketplace", 
  element: (
    <MarketplaceRoute>
      <Marketplace />
    </MarketplaceRoute>
  )
},
```

---

## Layout Visual

### Para User/Seller (Sidebar)
```text
┌────────────────────────────────────┐
│ 📦 Produtos                        │
│ 🏪 Marketplace  [Em Breve]         │  ← Badge cinza
│ 💰 Financeiro                      │
└────────────────────────────────────┘
```

### Para Admin/Owner (Sidebar)
```text
┌────────────────────────────────────┐
│ 📦 Produtos                        │
│ 🏪 Marketplace                     │  ← Sem badge
│ 💰 Gateways                        │
└────────────────────────────────────┘
```

### Página "Em Breve" (User/Seller acessando rota)
```text
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│              🚧                                                 │
│                                                                 │
│         Marketplace                                             │
│                                                                 │
│    Esta funcionalidade estará disponível em breve.              │
│    Estamos trabalhando para trazer novidades incríveis!         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Verificação RISE V3

| Critério | Nota | Justificativa |
|----------|------|---------------|
| Manutenibilidade | 10/10 | Flag declarativa, componentes isolados |
| Zero DT | 10/10 | Reutiliza EmBreve existente, tipos estendidos limpos |
| Arquitetura | 10/10 | Single Responsibility, Clean Architecture |
| Escalabilidade | 10/10 | Basta adicionar `comingSoonForRoles` em outros itens |
| Segurança | 10/10 | Verificação de role no guard + visual feedback |
| **NOTA FINAL** | **10.0/10** | Alinhado 100% com RISE Protocol V3 |

---

## Tempo Estimado
**30 minutos**

---

## Ordem de Implementação

1. Estender `navigation.types.ts` com `comingSoonForRoles`
2. Atualizar `navigationConfig.ts` com flag no Marketplace
3. Modificar `SidebarItem.tsx` para badge condicional
4. Criar `MarketplaceRoute.tsx` guard
5. Integrar no `App.tsx`
6. Testar com diferentes roles

