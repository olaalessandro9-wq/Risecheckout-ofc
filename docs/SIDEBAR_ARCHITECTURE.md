# Arquitetura do Sidebar - RiseCheckout

## 1. Visão Geral

O Sidebar é o componente de navegação principal do dashboard administrativo. Foi refatorado para seguir o RISE ARCHITECT PROTOCOL.

### Características Principais

- **Responsivo:** Desktop (colapsável) e Mobile (Sheet)
- **Animação em Cascata:** Menus fecham antes do sidebar colapsar
- **Menu Expansível:** Subitens com Collapsible do Radix UI
- **Permissões:** Itens filtrados por role do usuário

---

## 2. Estrutura de Arquivos

```
src/components/layout/
├── Sidebar.tsx                  # Componente principal (~130 linhas)
└── sidebar/
    ├── index.ts                 # Barrel exports
    ├── types.ts                 # Interfaces: NavItem, NavContentProps
    ├── buildNavItems.ts         # Função geradora de itens de navegação
    ├── navUtils.ts              # Helpers: isActivePath, hasActiveChild
    ├── NavContent.tsx           # Lista de navegação
    ├── NavItem.tsx              # Item simples (sem filhos)
    └── NavItemGroup.tsx         # Item expansível (com filhos)
```

---

## 3. Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────┐
│                       Sidebar.tsx                            │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Estado:                                                  ││
│  │ - isHovered: boolean                                     ││
│  │ - openMenus: Record<string, boolean>                     ││
│  │ - collapseTimeoutRef: Ref<Timeout>                       ││
│  │                                                          ││
│  │ Renderiza: Desktop (<aside>) ou Mobile (<Sheet>)         ││
│  └─────────────────────────────────────────────────────────┘│
│         │                                                    │
│         ▼                                                    │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              NavContent.tsx                              ││
│  │  Props: navItems, openMenus, toggleMenu, isExpanded      ││
│  │  Mapeia itens → NavItem ou NavItemGroup                  ││
│  └──────────────┬──────────────────────────────────────────┘│
│                 │                                            │
│     ┌───────────┴───────────┐                               │
│     ▼                       ▼                               │
│  NavItem.tsx          NavItemGroup.tsx                       │
│  (item simples)       (item expansível)                      │
│  - Link direto        - Collapsible (Radix)                  │
│  - Ícone + Label      - Subitens recursivos                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Fluxo da Animação em Cascata

A animação garante uma experiência fluida ao fechar o sidebar:

```
Mouse sai do sidebar
        │
        ▼
┌─────────────────────┐
│ hasOpenMenu?        │──── Verifica Object.values(openMenus).some(Boolean)
└─────────────────────┘
        │
   ┌────┴────┐
   │         │
  SIM       NÃO
   │         │
   ▼         ▼
closeAllMenus()   setIsHovered(false)
   │               (imediato)
   │
   ▼
setTimeout(MENU_CLOSE_DELAY)  ← 250ms
   │
   ▼
setIsHovered(false)
onExpandChange(false)
```

### Constantes

```typescript
const MENU_CLOSE_DELAY = 250; // ms - tempo para menu fechar antes do collapse
```

### Cancelabilidade

Se o mouse re-entrar antes do timeout:

```typescript
const handleMouseEnter = useCallback(() => {
  if (collapseTimeoutRef.current) {
    clearTimeout(collapseTimeoutRef.current);  // Cancela collapse pendente
    collapseTimeoutRef.current = null;
  }
  setIsHovered(true);
  onExpandChange?.(true);
}, [onExpandChange]);
```

---

## 5. Interface NavItem

```typescript
interface NavItem {
  label: string;              // Texto exibido
  icon: React.ElementType;    // Componente de ícone (Lucide)
  to?: string;                // Rota interna (react-router)
  external?: string;          // Link externo (abre nova aba)
  requiresAdmin?: boolean;    // Requer role admin
  children?: NavItem[];       // Subitens (torna item expansível)
}
```

### Exemplo

```typescript
const navItems: NavItem[] = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    to: "/dashboard"
  },
  {
    label: "Configurações",
    icon: Settings,
    children: [
      { label: "Perfil", icon: User, to: "/dashboard/profile" },
      { label: "Pixels", icon: Zap, to: "/dashboard/pixels" }
    ]
  }
];
```

---

## 6. Sistema de Permissões

O `buildNavItems()` recebe flags de permissão e filtra os itens:

```typescript
interface PermissionFlags {
  canAccessAdminPanel: boolean;  // Exibe menu "Admin"
  canHaveAffiliates: boolean;    // Exibe menu "Afiliados"
  isOwner: boolean;              // Condições específicas de owner
}

const navItems = buildNavItems({
  canAccessAdminPanel,
  canHaveAffiliates,
  isOwner
});
```

### Fluxo de Filtragem

```
buildNavItems(permissions)
        │
        ▼
┌─────────────────────────┐
│ Gera lista base         │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Filtra por permissões   │
│ - requiresAdmin?        │
│ - isOwner?              │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Retorna NavItem[]       │
└─────────────────────────┘
```

---

## 7. Responsividade

| Viewport | Componente | Comportamento                          |
|----------|------------|----------------------------------------|
| Desktop  | `<aside>`  | Colapsa/expande no hover (64px ↔ 240px)|
| Mobile   | `<Sheet>`  | Desliza da esquerda, fecha ao navegar  |

### Breakpoint

```typescript
// Definido no componente pai (DashboardLayout)
const isMobile = useMediaQuery("(max-width: 768px)");
```

### Desktop

```tsx
<aside
  className={cn(
    "transition-all duration-300",
    isExpanded ? "w-60" : "w-16"
  )}
  onMouseEnter={handleMouseEnter}
  onMouseLeave={handleMouseLeave}
>
  <NavContent ... />
</aside>
```

### Mobile

```tsx
<Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
  <SheetContent side="left">
    <NavContent ... />
  </SheetContent>
</Sheet>
```

---

## 8. Helpers (navUtils.ts)

### isActivePath

Verifica se a rota atual corresponde ao item:

```typescript
function isActivePath(currentPath: string, itemPath?: string): boolean {
  if (!itemPath) return false;
  return currentPath === itemPath || currentPath.startsWith(`${itemPath}/`);
}
```

### hasActiveChild

Verifica se algum filho está ativo (para manter menu aberto):

```typescript
function hasActiveChild(item: NavItem, currentPath: string): boolean {
  if (!item.children) return false;
  return item.children.some(child => isActivePath(currentPath, child.to));
}
```

---

## 9. Conformidade RISE ARCHITECT PROTOCOL

| Regra                  | Antes           | Depois          | Status |
|------------------------|-----------------|-----------------|--------|
| Limite 300 linhas      | 365 linhas      | ~130 linhas     | ✅     |
| Arquivos modulares     | 1 monolítico    | 7 arquivos      | ✅     |
| Single Responsibility  | Múltiplas       | 1 por arquivo   | ✅     |
| Nomenclatura Inglês    | Misto           | Consistente     | ✅     |
| Zero Gambiarras        | -               | -               | ✅     |
| Animação fluida        | Abrupta         | Cascata 250ms   | ✅     |

---

## 10. Troubleshooting

### Menu não expande no hover

1. Verificar se `onExpandChange` está sendo passado corretamente
2. Verificar CSS de `pointer-events` no sidebar

### Animação cortada

1. Verificar valor de `MENU_CLOSE_DELAY` (deve ser >= animação do Collapsible)
2. Verificar se `clearTimeout` está sendo chamado no `mouseEnter`

### Itens não aparecem

1. Verificar permissões no `buildNavItems()`
2. Verificar se `requiresAdmin` está configurado corretamente
3. Verificar `usePermissions()` hook

### Menu fecha ao clicar em item

1. Comportamento esperado em mobile
2. Em desktop, verificar se `e.stopPropagation()` está sendo chamado

---

**Última Atualização:** 12/01/2026
**Autor:** Rise Architect Protocol
