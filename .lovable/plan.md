
# Fase 4: Testes para Componentes UI (Testing Pyramid - 70% Unit)

## Análise de Soluções (RISE V3 Seção 4.4)

### Solução A: Testes Básicos de Renderização
- Manutenibilidade: 6/10 (cobre apenas renderização, não comportamento)
- Zero DT: 5/10 (não testa variants, estados, interações)
- Arquitetura: 6/10 (não segue testing pyramid completo)
- Escalabilidade: 6/10 (difícil expandir sem refatorar)
- Segurança: 7/10 (não testa acessibilidade)
- **NOTA FINAL: 6.0/10**
- Tempo estimado: 4 horas

### Solução B: Testes Completos por Categoria com Cobertura Total
- Manutenibilidade: 10/10 (modular, um arquivo por categoria)
- Zero DT: 10/10 (cobre variants, estados, interações, acessibilidade)
- Arquitetura: 10/10 (segue SRP, categorização lógica)
- Escalabilidade: 10/10 (adicionar novos testes é trivial)
- Segurança: 10/10 (testa ARIA, roles, disabled states)
- **NOTA FINAL: 10.0/10**
- Tempo estimado: 12 horas

### DECISÃO: Solução B (Nota 10.0/10)
A Solução A é inferior porque não testa variants (6 variants de Button), estados (disabled, loading), interações (onClick, onChange), nem acessibilidade (roles ARIA, screen reader).

---

## Inventário de Componentes UI (53 componentes)

```text
src/components/ui/
├── TIER 1 - CORE (Prioridade Máxima) - 12 componentes
│   ├── button.tsx (6 variants, 4 sizes, asChild)
│   ├── input.tsx (types, disabled, className merge)
│   ├── card.tsx (Card, Header, Title, Description, Content, Footer)
│   ├── dialog.tsx (10 subcomponentes, modal behavior)
│   ├── badge.tsx (4 variants)
│   ├── alert.tsx (2 variants, AlertTitle, AlertDescription)
│   ├── checkbox.tsx (checked state, disabled)
│   ├── switch.tsx (checked state, disabled)
│   ├── select.tsx (10 subcomponentes, dropdown)
│   ├── textarea.tsx (disabled, className merge)
│   ├── label.tsx (htmlFor integration)
│   └── progress.tsx (value binding, animation)
│
├── TIER 2 - LAYOUT (Prioridade Alta) - 8 componentes
│   ├── separator.tsx (horizontal/vertical orientation)
│   ├── skeleton.tsx (animation class)
│   ├── avatar.tsx (Avatar, Image, Fallback)
│   ├── scroll-area.tsx (scroll behavior)
│   ├── aspect-ratio.tsx (ratio prop)
│   ├── resizable.tsx (resize behavior)
│   ├── collapsible.tsx (open/close state)
│   └── accordion.tsx (expand/collapse)
│
├── TIER 3 - NAVIGATION (Prioridade Média) - 10 componentes
│   ├── tabs.tsx (tab switching)
│   ├── breadcrumb.tsx (navigation links)
│   ├── pagination.tsx (page navigation)
│   ├── navigation-menu.tsx (nested menus)
│   ├── menubar.tsx (menu items)
│   ├── dropdown-menu.tsx (dropdown items)
│   ├── context-menu.tsx (right-click menu)
│   ├── sidebar.tsx (collapsible sidebar)
│   ├── sheet.tsx (slide-in panel)
│   └── drawer.tsx (bottom sheet)
│
├── TIER 4 - FEEDBACK (Prioridade Média) - 8 componentes
│   ├── toast.tsx (notifications)
│   ├── toaster.tsx (toast container)
│   ├── use-toast.ts (hook)
│   ├── sonner.tsx (sonner integration)
│   ├── alert-dialog.tsx (confirmation dialogs)
│   ├── popover.tsx (popover content)
│   ├── tooltip.tsx (hover info)
│   └── hover-card.tsx (hover content)
│
├── TIER 5 - FORM CONTROLS (Prioridade Alta) - 8 componentes
│   ├── form.tsx (form integration)
│   ├── radio-group.tsx (radio selection)
│   ├── slider.tsx (range input)
│   ├── toggle.tsx (toggle button)
│   ├── toggle-group.tsx (toggle group)
│   ├── input-otp.tsx (OTP input)
│   ├── currency-input.tsx (currency formatting)
│   └── calendar.tsx (date picker)
│
└── TIER 6 - SPECIALIZED (Prioridade Baixa) - 7 componentes
    ├── table.tsx (data table)
    ├── carousel.tsx (image carousel)
    ├── chart.tsx (recharts wrapper)
    ├── command.tsx (command palette)
    ├── loading-switch.tsx (loading indicator)
    ├── price-display.tsx (price formatting)
    └── CountryCodeSelector.tsx (country codes)
```

---

## Estrutura de Arquivos Proposta

```text
src/components/ui/__tests__/
├── button.test.tsx            (~120 linhas) - 18 testes
├── input.test.tsx             (~100 linhas) - 14 testes
├── card.test.tsx              (~110 linhas) - 15 testes
├── dialog.test.tsx            (~150 linhas) - 20 testes
├── badge.test.tsx             (~80 linhas)  - 10 testes
├── alert.test.tsx             (~90 linhas)  - 12 testes
├── checkbox.test.tsx          (~80 linhas)  - 10 testes
├── switch.test.tsx            (~80 linhas)  - 10 testes
├── select.test.tsx            (~140 linhas) - 16 testes
├── textarea.test.tsx          (~70 linhas)  - 8 testes
├── label.test.tsx             (~60 linhas)  - 6 testes
├── progress.test.tsx          (~70 linhas)  - 8 testes
├── separator.test.tsx         (~60 linhas)  - 6 testes
├── skeleton.test.tsx          (~50 linhas)  - 4 testes
├── avatar.test.tsx            (~80 linhas)  - 10 testes
└── form-controls.test.tsx     (~120 linhas) - 14 testes (toggle, toggle-group, radio-group)

TOTAL ETAPA 1: 16 arquivos, ~1,460 linhas, ~171 testes
```

---

## Detalhamento dos Arquivos (Etapa 1 - TIER 1 + TIER 2)

### 1. button.test.tsx (~18 testes)

```text
DESCRIBE: Button
├── DESCRIBE: Rendering
│   ├── IT: renders with children
│   ├── IT: renders with displayName
│   └── IT: forwards ref correctly
│
├── DESCRIBE: Variants
│   ├── IT: applies default variant classes
│   ├── IT: applies destructive variant classes
│   ├── IT: applies outline variant classes
│   ├── IT: applies secondary variant classes
│   ├── IT: applies ghost variant classes
│   └── IT: applies link variant classes
│
├── DESCRIBE: Sizes
│   ├── IT: applies default size classes
│   ├── IT: applies sm size classes
│   ├── IT: applies lg size classes
│   └── IT: applies icon size classes
│
├── DESCRIBE: States
│   ├── IT: applies disabled styles when disabled
│   ├── IT: prevents click when disabled
│   └── IT: handles onClick callback
│
├── DESCRIBE: asChild (Slot)
│   ├── IT: renders as Slot when asChild=true
│   └── IT: passes className to Slot child
│
└── DESCRIBE: Accessibility
    └── IT: has type="button" by default
```

---

### 2. input.test.tsx (~14 testes)

```text
DESCRIBE: Input
├── DESCRIBE: Rendering
│   ├── IT: renders input element
│   ├── IT: renders with displayName
│   └── IT: forwards ref correctly
│
├── DESCRIBE: Types
│   ├── IT: renders text type by default
│   ├── IT: renders password type
│   ├── IT: renders email type
│   └── IT: renders number type
│
├── DESCRIBE: States
│   ├── IT: applies disabled styles when disabled
│   ├── IT: prevents input when disabled
│   └── IT: handles onChange callback
│
├── DESCRIBE: Styling
│   ├── IT: merges custom className
│   ├── IT: applies placeholder styles
│   └── IT: applies focus-visible styles
│
└── DESCRIBE: Attributes
    └── IT: forwards aria attributes
```

---

### 3. card.test.tsx (~15 testes)

```text
DESCRIBE: Card Components
├── DESCRIBE: Card
│   ├── IT: renders with children
│   ├── IT: renders with displayName
│   ├── IT: forwards ref correctly
│   └── IT: merges custom className
│
├── DESCRIBE: CardHeader
│   ├── IT: renders with children
│   └── IT: applies flex layout
│
├── DESCRIBE: CardTitle
│   ├── IT: renders as h3 element
│   └── IT: applies text styles
│
├── DESCRIBE: CardDescription
│   ├── IT: renders as p element
│   └── IT: applies muted foreground color
│
├── DESCRIBE: CardContent
│   ├── IT: renders with children
│   └── IT: applies padding styles
│
└── DESCRIBE: CardFooter
    ├── IT: renders with children
    └── IT: applies flex layout with items-center
```

---

### 4. dialog.test.tsx (~20 testes)

```text
DESCRIBE: Dialog Components
├── DESCRIBE: Dialog (Root)
│   ├── IT: controls open state
│   ├── IT: calls onOpenChange when state changes
│   └── IT: renders children when open
│
├── DESCRIBE: DialogTrigger
│   ├── IT: renders trigger button
│   └── IT: opens dialog on click
│
├── DESCRIBE: DialogContent
│   ├── IT: renders content in portal
│   ├── IT: renders overlay
│   ├── IT: renders close button
│   ├── IT: closes on overlay click
│   ├── IT: closes on Escape key
│   └── IT: applies custom className
│
├── DESCRIBE: DialogContentWithoutClose
│   ├── IT: renders without close button
│   └── IT: still closes on overlay click
│
├── DESCRIBE: DialogHeader
│   ├── IT: renders with flex layout
│   └── IT: applies text-center on mobile
│
├── DESCRIBE: DialogFooter
│   ├── IT: renders with flex layout
│   └── IT: applies responsive spacing
│
├── DESCRIBE: DialogTitle
│   └── IT: applies title styles
│
└── DESCRIBE: DialogDescription
    └── IT: applies muted foreground color
│
└── DESCRIBE: Accessibility
    ├── IT: traps focus inside dialog
    └── IT: has correct ARIA attributes
```

---

### 5. badge.test.tsx (~10 testes)

```text
DESCRIBE: Badge
├── DESCRIBE: Rendering
│   ├── IT: renders with children
│   └── IT: merges custom className
│
├── DESCRIBE: Variants
│   ├── IT: applies default variant classes
│   ├── IT: applies secondary variant classes
│   ├── IT: applies destructive variant classes
│   └── IT: applies outline variant classes
│
└── DESCRIBE: Styling
    ├── IT: applies rounded-full
    ├── IT: applies px-2.5 py-0.5
    └── IT: applies text-xs font-semibold
```

---

### 6. alert.test.tsx (~12 testes)

```text
DESCRIBE: Alert Components
├── DESCRIBE: Alert
│   ├── IT: renders with role="alert"
│   ├── IT: forwards ref correctly
│   ├── IT: applies default variant classes
│   ├── IT: applies destructive variant classes
│   └── IT: merges custom className
│
├── DESCRIBE: AlertTitle
│   ├── IT: renders as h5 element
│   └── IT: applies font-medium styles
│
├── DESCRIBE: AlertDescription
│   ├── IT: renders as div element
│   └── IT: applies text-sm styles
│
└── DESCRIBE: Icon Integration
    ├── IT: positions icon with absolute left-4
    └── IT: adds padding-left to children when icon present
```

---

### 7. checkbox.test.tsx (~10 testes)

```text
DESCRIBE: Checkbox
├── DESCRIBE: Rendering
│   ├── IT: renders checkbox element
│   ├── IT: renders with displayName
│   └── IT: forwards ref correctly
│
├── DESCRIBE: States
│   ├── IT: handles checked state
│   ├── IT: handles unchecked state
│   ├── IT: handles indeterminate state
│   └── IT: handles disabled state
│
├── DESCRIBE: Interactions
│   ├── IT: calls onCheckedChange when clicked
│   └── IT: toggles state on click
│
└── DESCRIBE: Accessibility
    └── IT: shows check icon when checked
```

---

### 8. switch.test.tsx (~10 testes)

```text
DESCRIBE: Switch
├── DESCRIBE: Rendering
│   ├── IT: renders switch element
│   ├── IT: renders with displayName
│   └── IT: forwards ref correctly
│
├── DESCRIBE: States
│   ├── IT: handles checked state
│   ├── IT: handles unchecked state
│   └── IT: handles disabled state
│
├── DESCRIBE: Interactions
│   ├── IT: calls onCheckedChange when clicked
│   └── IT: toggles state on click
│
└── DESCRIBE: Styling
    ├── IT: applies translate-x-5 when checked
    └── IT: applies translate-x-0 when unchecked
```

---

### 9. select.test.tsx (~16 testes)

```text
DESCRIBE: Select Components
├── DESCRIBE: Select (Root)
│   ├── IT: controls value state
│   └── IT: calls onValueChange
│
├── DESCRIBE: SelectTrigger
│   ├── IT: renders trigger button
│   ├── IT: shows chevron icon
│   ├── IT: applies disabled styles
│   └── IT: merges custom className
│
├── DESCRIBE: SelectContent
│   ├── IT: renders in portal when open
│   ├── IT: closes on outside click
│   └── IT: applies animation classes
│
├── DESCRIBE: SelectItem
│   ├── IT: renders item text
│   ├── IT: shows check icon when selected
│   ├── IT: applies hover styles
│   └── IT: handles disabled items
│
├── DESCRIBE: SelectLabel
│   └── IT: renders label with styles
│
├── DESCRIBE: SelectSeparator
│   └── IT: renders separator line
│
└── DESCRIBE: Accessibility
    ├── IT: has correct ARIA attributes
    └── IT: supports keyboard navigation
```

---

### 10-16. Arquivos Restantes (Resumo)

| Arquivo | Testes | Foco Principal |
|---------|--------|----------------|
| textarea.test.tsx | 8 | Rendering, disabled, className merge |
| label.test.tsx | 6 | Rendering, htmlFor, peer-disabled |
| progress.test.tsx | 8 | Value binding (0-100), animation |
| separator.test.tsx | 6 | Horizontal/vertical orientation |
| skeleton.test.tsx | 4 | Animation class, className merge |
| avatar.test.tsx | 10 | Image loading, fallback display |
| form-controls.test.tsx | 14 | Toggle, ToggleGroup, RadioGroup |

---

## Infraestrutura de Testes

### Mock de Radix UI Primitives

Os componentes Radix (Dialog, Select, etc.) requerem:
1. **Portal mock**: Para testar conteúdo em portal
2. **Animation mock**: Para testar classes de animação
3. **Focus trap mock**: Para testar comportamento de foco

```typescript
// Exemplo de setup para Dialog tests
beforeAll(() => {
  // Mock createPortal para renderizar inline
  vi.mock('react-dom', async () => {
    const actual = await vi.importActual('react-dom');
    return {
      ...actual,
      createPortal: (node: React.ReactNode) => node,
    };
  });
});
```

### Wrapper Padrão

Todos os testes usarão o `render` de `@/test/utils.tsx` que inclui:
- QueryClientProvider (para hooks de data fetching)
- BrowserRouter (para navegação)

---

## Ordem de Implementação

```text
ETAPA 1 (Prioridade Máxima - 8 arquivos):
1. button.test.tsx      ← Componente mais usado
2. input.test.tsx       ← Componente mais usado
3. card.test.tsx        ← Layout principal
4. badge.test.tsx       ← Simples, sem deps
5. alert.test.tsx       ← Simples, com variants
6. checkbox.test.tsx    ← Interação básica
7. switch.test.tsx      ← Interação básica
8. textarea.test.tsx    ← Similar ao input

ETAPA 2 (Prioridade Alta - 4 arquivos):
9. label.test.tsx
10. progress.test.tsx
11. separator.test.tsx
12. skeleton.test.tsx

ETAPA 3 (Prioridade Média - 4 arquivos):
13. avatar.test.tsx
14. select.test.tsx
15. dialog.test.tsx
16. form-controls.test.tsx
```

---

## Projeção de Cobertura

```text
ANTES (Atual):
├── Testes UI: 0/53 componentes (0%)
├── Arquivos de Teste UI: 0
└── Testes Totais: ~1,471

APÓS ETAPA 1 (8 arquivos):
├── Testes UI: 8/53 componentes (15.1%)
├── Arquivos de Teste UI: 8
└── Testes Totais: ~1,547 (+76 testes)

APÓS ETAPA 2 (12 arquivos):
├── Testes UI: 12/53 componentes (22.6%)
├── Arquivos de Teste UI: 12
└── Testes Totais: ~1,571 (+24 testes)

APÓS ETAPA 3 (16 arquivos):
├── Testes UI: 16/53 componentes (30.2%)
├── Arquivos de Teste UI: 16
└── Testes Totais: ~1,631 (+60 testes)

INCREMENTO TOTAL: +160 testes, 30.2% dos componentes UI cobertos
```

---

## Validação RISE V3

| Critério | Status |
|----------|--------|
| LEI SUPREMA (Seção 4) | ✅ Solução B (nota 10.0) |
| Zero Tipos `any` | ✅ Obrigatório |
| Limite 300 Linhas | ✅ Todos < 160 linhas |
| Testing Pyramid | ✅ 70% Unit Tests |
| Documentação JSDoc | ✅ Header em cada arquivo |
| Frases Proibidas | ✅ Nenhuma utilizada |
| SRP | ✅ Um arquivo por componente |

---

## Entregáveis da Etapa 1

1. **8 arquivos de teste** para componentes TIER 1 core
2. **~76 testes** cobrindo variants, states, interactions
3. **Zero violações** de limite de linhas (todos < 160)
4. **Documentação JSDoc** completa em cada arquivo
5. **Cobertura de acessibilidade** (ARIA, roles, disabled)
6. **Mocks reutilizáveis** para Radix UI primitives

---

## Próximos Passos Após Etapa 1

| Etapa | Arquivos | Testes | Componentes |
|-------|----------|--------|-------------|
| Etapa 2 | 4 | 24 | label, progress, separator, skeleton |
| Etapa 3 | 4 | 60 | avatar, select, dialog, form-controls |
| Etapa 4 | 10 | ~80 | Tabs, Navigation, Dropdown, etc. |
| Etapa 5 | 8 | ~60 | Toast, Popover, Tooltip, etc. |
| Etapa 6 | 7 | ~50 | Table, Carousel, Chart, etc. |

**Total UI Tests ao final: ~350 testes, 100% componentes cobertos**
