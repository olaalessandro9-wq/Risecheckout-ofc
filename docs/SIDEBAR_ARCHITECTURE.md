# Arquitetura do Sidebar - RiseCheckout

> **Versão:** 3.0 (XState v5)  
> **Última Atualização:** 21/01/2026  
> **Status:** RISE V3 Compliant - 10.0/10

---

## 1. Visão Geral

O módulo de navegação/sidebar é uma implementação modular e type-safe que utiliza **XState v5** como Single Source of Truth para gerenciamento de estado.

### Características Principais

| Característica | Implementação |
|----------------|---------------|
| State Management | XState v5 State Machine |
| Type Safety | Discriminated Unions |
| Persistência | localStorage via events |
| Responsividade | Desktop (3 estados) + Mobile (drawer) |
| Permissões | Filtragem recursiva por role |

---

## 2. Estrutura de Arquivos

```
src/modules/navigation/
├── components/Sidebar/
│   ├── Sidebar.tsx           # Container principal (106 linhas)
│   ├── SidebarContent.tsx    # Composição de itens (87 linhas)
│   ├── SidebarBrand.tsx      # Logo e nome (54 linhas)
│   ├── SidebarItem.tsx       # Item individual (123 linhas)
│   ├── SidebarGroup.tsx      # Grupo expansível (185 linhas)
│   ├── SidebarFooter.tsx     # Rodapé com usuário (57 linhas)
│   └── index.ts              # Barrel exports
├── config/
│   └── navigationConfig.ts   # Configuração declarativa (189 linhas)
├── hooks/
│   └── useNavigation.ts      # Hook principal (211 linhas)
├── machines/
│   ├── navigationMachine.ts       # State Machine (165 linhas)
│   ├── navigationMachine.types.ts # Tipos (57 linhas)
│   ├── navigationMachine.actions.ts # Actions (191 linhas)
│   ├── navigationMachine.guards.ts  # Guards (52 linhas)
│   └── index.ts                     # Barrel exports
├── types/
│   └── navigation.types.ts   # Tipos públicos (133 linhas)
├── utils/
│   ├── navigationHelpers.ts  # Funções puras (204 linhas)
│   └── permissionFilters.ts  # Filtros de permissão (137 linhas)
└── index.ts                  # API pública do módulo
```

---

## 3. XState State Machine

### Diagrama de Estados

```
┌─────────────────────────────────────────────────────────────┐
│                   navigationMachine                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌──────┐  RESTORE_FROM_STORAGE  ┌───────────────────────┐ │
│   │ idle │ ────────────────────▶  │        ready          │ │
│   └──────┘                        │  ┌─────────────────┐  │ │
│                                   │  │     active      │  │ │
│                                   │  └────────┬────────┘  │ │
│                                   │           │           │ │
│                                   │  SET_SIDEBAR (collapsed)│
│                                   │  + hasExpandedGroups    │ │
│                                   │           │           │ │
│                                   │           ▼           │ │
│                                   │  ┌─────────────────┐  │ │
│                                   │  │  closingMenus   │  │ │
│                                   │  └─────────────────┘  │ │
│                                   │   after: 250ms → active │
│                                   └───────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Context

```typescript
interface NavigationMachineContext {
  readonly sidebarState: SidebarState;  // "expanded" | "collapsed" | "hidden"
  readonly isHovering: boolean;
  readonly mobileOpen: boolean;
  readonly expandedGroups: Set<string>;
}
```

### Eventos

| Evento | Payload | Descrição |
|--------|---------|-----------|
| `RESTORE_FROM_STORAGE` | - | Restaura estado do localStorage |
| `CYCLE_SIDEBAR` | - | Cicla: hidden → collapsed → expanded → hidden |
| `SET_SIDEBAR` | `{ state: SidebarState }` | Define estado específico |
| `MOUSE_ENTER` | - | Ativa hover temporário |
| `MOUSE_LEAVE` | - | Desativa hover |
| `SET_MOBILE_OPEN` | `{ open: boolean }` | Controla drawer mobile |
| `TOGGLE_GROUP` | `{ groupId: string }` | Expande/colapsa grupo |
| `EXPAND_GROUP` | `{ groupId: string }` | Expande grupo |
| `COLLAPSE_GROUP` | `{ groupId: string }` | Colapsa grupo |
| `COLLAPSE_ALL_GROUPS` | - | Colapsa todos os grupos |
| `INIT_ACTIVE_GROUPS` | `{ path: string }` | Expande grupos da rota ativa |

### Guards

```typescript
// navigationMachine.guards.ts
isCollapsed(context)      // sidebarState === "collapsed"
isNotCollapsed(context)   // sidebarState !== "collapsed"
hasExpandedGroups(context) // expandedGroups.size > 0
isGroupExpanded(context, event) // expandedGroups.has(groupId)
isHovering(context)       // isHovering === true
```

---

## 4. Sistema de Tipos

### Discriminated Union para Itens de Navegação

```typescript
// Variante de rota interna
interface NavItemRouteVariant {
  readonly type: "route";
  readonly path: string;
  readonly exact?: boolean;
}

// Variante de link externo
interface NavItemExternalVariant {
  readonly type: "external";
  readonly url: string;
}

// Variante de grupo com filhos
interface NavItemGroupVariant {
  readonly type: "group";
  readonly children: readonly NavItemConfig[];
}

// Union type
type NavItemVariant = 
  | NavItemRouteVariant 
  | NavItemExternalVariant 
  | NavItemGroupVariant;

// Configuração completa de um item
interface NavItemConfig extends NavItemVariant {
  readonly id: string;
  readonly label: string;
  readonly icon: LucideIcon;
  readonly permissions?: NavItemPermissions;
  readonly badge?: NavItemBadge;
}
```

### Exhaustiveness Check

```typescript
// SidebarItem.tsx - Garantia de type safety
function renderByVariant(item: NavItemConfig) {
  switch (item.type) {
    case "route":
      return <RouteLink {...} />;
    case "external":
      return <ExternalLink {...} />;
    case "group":
      return <SidebarGroup {...} />;
    default:
      // TypeScript error se algum tipo não for tratado
      const _exhaustive: never = item;
      return null;
  }
}
```

---

## 5. Sistema de Permissões

### Configuração

```typescript
interface NavItemPermissions {
  requiresAdmin?: boolean;      // true = só admin/owner
  requiresOwner?: boolean;      // true = só owner, false = só NÃO-owner
  requiresPermission?: "canHaveAffiliates" | "canAccessAdminPanel";
}
```

### Filtragem Recursiva

```typescript
// permissionFilters.ts
function filterByPermissions(
  items: NavItemConfig[],
  permissions: NavigationPermissions
): NavItemConfig[] {
  return items
    .filter(item => checkItemPermissions(item, permissions))
    .map(item => {
      if (item.type === "group") {
        const filteredChildren = filterByPermissions(item.children, permissions);
        // Oculta grupo se não tem filhos visíveis
        if (filteredChildren.length === 0) return null;
        return { ...item, children: filteredChildren };
      }
      return item;
    })
    .filter(Boolean);
}
```

---

## 6. Diagrama de Fluxo

```
┌─────────────────────────────────────────────────────────────┐
│                      AppShell.tsx                            │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ const navigation = useNavigation();                     ││
│  │                                                         ││
│  │ useNavigation() → useMachine(navigationMachine)         ││
│  │  └── State: sidebarState, isHovering, mobileOpen        ││
│  │  └── Actions: send({ type: "CYCLE_SIDEBAR" })           ││
│  └─────────────────────────────────────────────────────────┘│
│                           │                                  │
│           ┌───────────────┼───────────────┐                 │
│           ▼               ▼               ▼                 │
│    ┌────────────┐  ┌────────────┐  ┌────────────────┐       │
│    │  Sidebar   │  │   Topbar   │  │  Main Content  │       │
│    │            │  │            │  │                │       │
│    │ Props:     │  │ Props:     │  │ paddingLeft:   │       │
│    │ navigation │  │ sidebarState│  │ currentWidth  │       │
│    └────────────┘  └────────────┘  └────────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. Estados do Sidebar

| Estado | Largura | Labels | Hover |
|--------|---------|--------|-------|
| `expanded` | 248px | Visíveis | N/A |
| `collapsed` | 64px | Ocultos | Expande temporariamente |
| `hidden` | 0px | N/A | N/A |

### Ciclo de Estados

```
hidden → collapsed → expanded → hidden → ...
```

---

## 8. Persistência

O estado do sidebar é persistido no `localStorage`:

```typescript
const SIDEBAR_STORAGE_KEY = "rise:sidebar-state";

// Ao iniciar (via event)
send({ type: "RESTORE_FROM_STORAGE" });

// Ao mudar (via action)
// navigationMachine.actions.ts → saveSidebarState()
```

---

## 9. Uso

### Importação

```typescript
import { 
  useNavigation,
  Sidebar,
  NAVIGATION_CONFIG,
} from "@/modules/navigation";
```

### No AppShell

```typescript
function AppShell() {
  const navigation = useNavigation();
  
  return (
    <div className="flex min-h-screen">
      <Sidebar navigation={navigation} />
      <main style={{ paddingLeft: navigation.currentWidth }}>
        <Outlet />
      </main>
    </div>
  );
}
```

### Adicionar Nova Rota

```typescript
// navigationConfig.ts
export const NAVIGATION_CONFIG: NavItemConfig[] = [
  {
    id: "nova-rota",
    type: "route",
    label: "Nova Rota",
    icon: StarIcon,
    path: "/nova-rota",
    permissions: { requiresAdmin: true },
  },
  // ...
];
```

---

## 10. Notas de Conformidade RISE V3

| Critério | Status | Evidência |
|----------|--------|-----------|
| XState como SSOT | ✅ | `useMachine(navigationMachine)` |
| Zero `useState` | ✅ | Nenhum useState no hook |
| Limite 300 linhas | ✅ | Maior arquivo: 211 linhas |
| Discriminated Unions | ✅ | `NavItemVariant` |
| Zero `any` | ✅ | Verificado por TSC |
| Readonly types | ✅ | `readonly` em todas interfaces |
| Funções puras | ✅ | Guards e helpers |
| Single Responsibility | ✅ | 1 componente = 1 responsabilidade |

---

## Changelog

| Versão | Data | Alterações |
|--------|------|------------|
| 3.0 | 21/01/2026 | Migração completa para XState v5, documentação reescrita |
| 2.0 | 15/01/2026 | Reestruturação modular, Discriminated Unions |
| 1.0 | 01/01/2026 | Versão inicial com useState |
