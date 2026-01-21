# Arquitetura do Sidebar - RiseCheckout

## 1. Visão Geral

O Sidebar é o componente de navegação principal do dashboard administrativo. Foi refatorado para seguir o RISE ARCHITECT PROTOCOL.

### Características Principais

- **3 Estados:** Hidden (0px), Collapsed (80px), Expanded (280px)
- **Responsivo:** Desktop (colapsável) e Mobile (Sheet overlay)
- **Animação em Cascata:** Menus fecham antes do sidebar colapsar
- **Menu Expansível:** Subitens com Collapsible do Radix UI
- **Permissões:** Itens filtrados por role do usuário
- **Persistência:** Estado salvo em localStorage

---

## 2. Estrutura de Arquivos

```
src/components/layout/
├── Sidebar.tsx                  # Componente principal (~150 linhas)
├── Topbar.tsx                   # Barra superior com toggle button
└── sidebar/
    ├── index.ts                 # Barrel exports
    ├── types.ts                 # Interfaces: NavItem, SidebarState, constantes
    ├── buildNavItems.ts         # Função geradora de itens de navegação
    ├── navUtils.ts              # Helpers: isActivePath, hasActiveChild
    ├── NavContent.tsx           # Lista de navegação
    ├── NavItem.tsx              # Item simples (sem filhos)
    └── NavItemGroup.tsx         # Item expansível (com filhos)

src/layouts/
└── AppShell.tsx                 # Layout principal, gerencia estado elevado
```

---

## 2.1 Estados do Sidebar

O sidebar possui 3 estados distintos gerenciados pelo `AppShell.tsx`:

| Estado | Largura | Descrição |
|--------|---------|-----------|
| `hidden` | 0px | Sidebar completamente oculto |
| `collapsed` | 80px | Apenas ícones visíveis (expande temporariamente no hover) |
| `expanded` | 280px | Totalmente expandido com labels |

### Tipos (types.ts)

```typescript
export type SidebarState = 'hidden' | 'collapsed' | 'expanded';

export const SIDEBAR_WIDTHS = {
  hidden: 0,
  collapsed: 80,
  expanded: 280,
} as const;

export const SIDEBAR_STORAGE_KEY = 'rise-sidebar-state';
```

### Ciclo de Estados

```
hidden → collapsed → expanded → hidden (ciclo)
```

O usuário alterna entre estados clicando no botão toggle no Topbar.

---

## 2.2 Persistência com localStorage

O estado do sidebar é persistido no `localStorage` para manter a preferência do usuário entre sessões.

### Implementação (AppShell.tsx)

```typescript
// Leitura inicial com fallback seguro
const [sidebarState, setSidebarState] = useState<SidebarState>(() => {
  if (typeof window === 'undefined') return 'collapsed';
  const saved = localStorage.getItem(SIDEBAR_STORAGE_KEY);
  if (saved === 'hidden' || saved === 'collapsed' || saved === 'expanded') {
    return saved;
  }
  return 'collapsed'; // Default
});

// Persistência automática a cada mudança
useEffect(() => {
  localStorage.setItem(SIDEBAR_STORAGE_KEY, sidebarState);
}, [sidebarState]);
```

---

## 2.3 Botão Toggle no Topbar

O `Topbar.tsx` contém um botão para alternar entre os 3 estados do sidebar.

### Props Recebidas

```typescript
interface TopbarProps {
  sidebarState?: SidebarState;
  onSidebarToggle?: () => void;
}
```

### Ícones por Estado

| Estado | Ícone | Tooltip |
|--------|-------|---------|
| `hidden` | `PanelLeft` | "Mostrar menu" |
| `collapsed` | `PanelLeftClose` | "Expandir menu" |
| `expanded` | `PanelLeftOpen` | "Ocultar menu" |

### Ciclo de Toggle (AppShell.tsx)

```typescript
const cycleSidebarState = useCallback(() => {
  const cycle: Record<SidebarState, SidebarState> = {
    hidden: 'collapsed',
    collapsed: 'expanded',
    expanded: 'hidden',
  };
  setSidebarState(prev => cycle[prev]);
}, []);
```

---

## 3. Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────────────┐
│                          AppShell.tsx                               │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ Estado Elevado:                                                 ││
│  │ - sidebarState: 'hidden' | 'collapsed' | 'expanded'             ││
│  │ - isHovering: boolean (notificado pelo Sidebar)                 ││
│  │ - mobileOpen: boolean                                           ││
│  │                                                                 ││
│  │ Derivado:                                                       ││
│  │ - effectiveWidth: 0 | 80 | 280 (considera hover + mobile)       ││
│  └────────────────────────┬────────────────────────────────────────┘│
│                           │                                         │
│           ┌───────────────┼───────────────┐                        │
│           ▼               ▼               ▼                        │
│    ┌────────────┐  ┌────────────┐  ┌────────────────┐              │
│    │  Sidebar   │  │   Topbar   │  │  Main Content  │              │
│    │            │  │            │  │                │              │
│    │ Props:     │  │ Props:     │  │ style:         │              │
│    │ -sidebarState│ │-sidebarState│ │ paddingLeft:   │              │
│    │ -onHoverChange│ │-onSidebarToggle│ effectiveWidth │              │
│    │ -onStateChange│ │            │  │                │              │
│    └────────────┘  └────────────┘  └────────────────┘              │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Sidebar.tsx                                 │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ Estado Local:                                                   ││
│  │ - isHovering: boolean (expansão temporária quando collapsed)    ││
│  │ - openMenus: Record<string, boolean>                            ││
│  │ - collapseTimeoutRef: Ref<Timeout>                              ││
│  │                                                                 ││
│  │ Callbacks:                                                      ││
│  │ - onHoverChange(boolean) → notifica AppShell                    ││
│  │                                                                 ││
│  │ Renderiza: Desktop (<aside>) ou Mobile (<Sheet>)                ││
│  └─────────────────────────────────────────────────────────────────┘│
│         │                                                           │
│         ▼                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │              NavContent.tsx                                     ││
│  │  Props: navItems, openMenus, toggleMenu, fullWidth, isHovered   ││
│  │  Mapeia itens → NavItem ou NavItemGroup                         ││
│  └──────────────┬──────────────────────────────────────────────────┘│
│                 │                                                   │
│     ┌───────────┴───────────┐                                      │
│     ▼                       ▼                                      │
│  NavItem.tsx          NavItemGroup.tsx                              │
│  (item simples)       (item expansível)                             │
│  - Link direto        - Collapsible (Radix)                         │
│  - Ícone + Label      - Subitens recursivos                         │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 4. Fluxo da Animação em Cascata

A animação garante uma experiência fluida ao fechar o sidebar:

```
Mouse sai do sidebar (collapsed + hovering)
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
closeAllMenus()   setIsHovering(false)
   │              onHoverChange(false)
   │               (imediato)
   │
   ▼
setTimeout(MENU_CLOSE_DELAY)  ← 250ms
   │
   ▼
setIsHovering(false)
onHoverChange(false)
```

### Constantes

```typescript
const MENU_CLOSE_DELAY = 250; // ms - tempo para menu fechar antes do collapse
```

### Cancelabilidade

Se o mouse re-entrar antes do timeout:

```typescript
const handleMouseEnter = useCallback(() => {
  if (sidebarState !== 'collapsed') return;
  
  if (collapseTimeoutRef.current) {
    clearTimeout(collapseTimeoutRef.current);  // Cancela collapse pendente
    collapseTimeoutRef.current = null;
  }
  setIsHovering(true);
  onHoverChange?.(true);
}, [sidebarState, onHoverChange]);
```

---

## 5. Interface NavItem

> **Nota (2026-01-21):** A navegação foi reestruturada:
> - "Pixels" renomeado para "Trackeamento" (inclui UTMify)
> - "Webhooks" movido para item separado em Configurações
> - Página "Integrações" foi eliminada

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
    icon: Settings2,
    children: [
      { label: "Trackeamento", icon: BarChart3, to: "/dashboard/trackeamento" },
      { label: "Webhooks", icon: Webhook, to: "/dashboard/webhooks" }
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

| Viewport | Componente | Comportamento |
|----------|------------|---------------|
| Desktop  | `<aside>`  | 3 estados: hidden (0px), collapsed (80px), expanded (280px). Hover temporário expande collapsed para 280px. |
| Mobile   | `<Sheet>`  | Desliza da esquerda como overlay. Sidebar desktop fica hidden automaticamente. |

### Breakpoint

```typescript
// Detectado diretamente no AppShell.tsx (sem hook externo)
const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;
```

### Desktop (3 estados)

```tsx
// Estado hidden: sidebar não renderiza <aside>
if (sidebarState === 'hidden') {
  return <MobileSheet ... />; // Apenas Sheet disponível
}

// Estados collapsed/expanded
<aside
  className={cn(
    "fixed inset-y-0 left-0 z-40 border-r",
    "transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
  )}
  style={{ width: `${currentWidth}px` }}
  onMouseEnter={handleMouseEnter}
  onMouseLeave={handleMouseLeave}
>
  <NavContent fullWidth={showLabels} isHovered={isHovering} ... />
</aside>
```

### Mobile

```tsx
<Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
  <SheetContent side="left" className="w-[280px] p-0">
    <NavContent fullWidth={true} onNavigate={handleMobileNavigate} ... />
  </SheetContent>
</Sheet>
```

### Content Offset (AppShell.tsx)

O conteúdo principal ajusta `paddingLeft` dinamicamente:

```typescript
const effectiveWidth = useMemo(() => {
  if (isMobile) return 0; // Mobile: sem padding, sidebar é overlay
  if (sidebarState === 'hidden') return 0;
  if (sidebarState === 'collapsed' && isHovering) return SIDEBAR_WIDTHS.expanded;
  return SIDEBAR_WIDTHS[sidebarState];
}, [sidebarState, isHovering, isMobile]);

// Aplicado no container principal
<div style={{ paddingLeft: `${effectiveWidth}px` }}>
  <main>...</main>
</div>
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

| Regra | Status | Evidência |
|-------|--------|-----------|
| Limite 300 linhas | ✅ | Sidebar.tsx ~150 linhas, AppShell.tsx ~95 linhas |
| Arquivos modulares | ✅ | 8 arquivos especializados |
| Single Responsibility | ✅ | 1 responsabilidade por arquivo |
| Nomenclatura Inglês | ✅ | Consistente em todo código |
| Zero Gambiarras | ✅ | Sem workarounds |
| Zero `!important` | ✅ | Lógica React substitui CSS forçado |
| Animação fluida | ✅ | Cascata 250ms antes do collapse |
| Persistência | ✅ | localStorage para sidebarState |
| 3 Estados Sidebar | ✅ | hidden/collapsed/expanded |
| Conteúdo responsivo ao hover | ✅ | effectiveWidth + onHoverChange |

---

## 10. Troubleshooting

### Menu não expande no hover

1. Verificar se `onHoverChange` está sendo passado corretamente do AppShell
2. Verificar se `sidebarState` é 'collapsed' (hover só funciona nesse estado)
3. Verificar CSS de `pointer-events` no sidebar

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

### Conteúdo não acompanha hover do sidebar

1. Verificar se `isHovering` está sendo atualizado no AppShell via `onHoverChange`
2. Verificar se `effectiveWidth` está sendo recalculado corretamente
3. Verificar transição CSS no container principal

### Estado não persiste após reload

1. Verificar se `SIDEBAR_STORAGE_KEY` está correto
2. Verificar se `useEffect` de persistência está executando
3. Verificar permissões de localStorage no navegador

---

**Última Atualização:** 21/01/2026
**Autor:** Rise Architect Protocol
**Conformidade:** 100%

---

## Changelog

| Data | Alteração |
|------|-----------|
| 2026-01-21 | Atualizado exemplos de navegação (Trackeamento, Webhooks) |
| 2026-01-21 | Adicionada nota sobre reestruturação de rotas |
| 2026-01-12 | Versão inicial |
