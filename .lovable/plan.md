

# Implementacao: Full Compositor Architecture (Plano Pendente)

O plano aprovado anteriormente NAO foi implementado. A sidebar continua animando `width` (propriedade de layout), causando reflow por frame. Todos os 5 gargalos identificados permanecem ativos.

---

## Status Atual vs Planejado

| Item | Status |
|------|--------|
| Sidebar anima `width` (layout) | NAO corrigido |
| `useSidebarTransform` hook | NAO criado |
| `transition-all` nos componentes da sidebar | NAO removido |
| `scale-110` no SidebarItem | NAO removido |
| Regra CSS global para `transition-all` | NAO adicionada |
| `useNavigation` expor `visibleWidth` | NAO feito |
| AppShell usar `visibleWidth` | NAO feito |

---

## Implementacao Completa (7 Arquivos)

### 1. CRIAR: `src/hooks/useSidebarTransform.ts`

Hook puro que calcula `translateX` e `visibleWidth` para cada estado da sidebar.

- A sidebar tera SEMPRE `width: 280px` (valor de `SIDEBAR_WIDTHS.expanded`)
- O estado "collapsed" sera representado por `translateX(-(280-80))` = `translateX(-200px)`
- O estado "hidden" sera representado por `translateX(-280px)`
- O estado "expanded" ou "collapsed+hovering" sera `translateX(0)`
- Retorna `{ translateX, visibleWidth }` para uso no Sidebar e AppShell

### 2. EDITAR: `src/modules/navigation/hooks/useNavigation.ts`

- Importar e usar `useSidebarTransform`
- Adicionar `visibleWidth` e `translateX` ao retorno `UseNavigationReturn`
- `visibleWidth` substitui `currentWidth` como largura para o layout do conteudo (marginLeft)
- `translateX` e usado pela sidebar para posicionamento via transform

### 3. EDITAR: `src/modules/navigation/components/Sidebar/Sidebar.tsx`

Remover:
- `transition-[width]` da className
- `width: currentWidth` do style
- `willChange: 'width'` do style

Adicionar:
- `width: '280px'` fixo (ou usar constante `SIDEBAR_WIDTHS.expanded`)
- `transform: translateX(${translateX}px)` no style
- `transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]` na className
- `willChange: 'transform'` (apenas durante animacao, controlado pelo CSS transition)

Receber `translateX` do navigation prop em vez de calcular width.

### 4. EDITAR: `src/modules/navigation/components/Sidebar/SidebarItem.tsx`

- Linha 102: Trocar `transition-all duration-200` por `transition-colors duration-200`
- Linha 111: Trocar `transition-all duration-300` por `transition-colors duration-300`
- Linha 115: Remover `group-hover/item:scale-110` completamente

### 5. EDITAR: `src/modules/navigation/components/Sidebar/SidebarGroup.tsx`

- Linha 71: Trocar `transition-all duration-200` por `transition-colors duration-200`
- Linha 78: Trocar `transition-all duration-300` por `transition-colors duration-300`
- Linha 163: Trocar `transition-all duration-200` por `transition-colors duration-200`
- Linha 173: Trocar `transition-all duration-300` por `transition-colors duration-300`

### 6. EDITAR: `src/modules/navigation/components/Sidebar/SidebarBrand.tsx`

- Linha 30: Trocar `transition-all duration-300` por `transition-[padding,height] duration-300`
- Linha 36: Trocar `transition-all duration-300` por `transition-[gap] duration-300`

### 7. EDITAR: `src/layouts/AppShell.tsx`

- Usar `navigation.visibleWidth` (novo) em vez de `navigation.currentWidth` para o `marginLeft`
- O FLIP transition ja esta implementado e continuara funcionando com `visibleWidth`

### 8. EDITAR: `src/index.css`

Adicionar regra global que neutraliza `transition-all` para animar apenas propriedades compositor-safe (cores, opacidade, sombras). Isso protege contra componentes de terceiros ou futuros que usem `transition-all`.

---

## Arquitetura Resultante

```text
SIDEBAR (aside)                    MAIN CONTENT (div)
width: 280px (FIXO)               marginLeft: visibleWidth (INSTANTANEO)
transform: translateX(X)          FLIP anima via transform
transition-transform: 300ms       (compositor-only)
(compositor-only)

Estado    | translateX | visibleWidth | Efeito Visual
----------|------------|--------------|-------------------
hidden    | -280px     | 0px          | Sidebar invisivel
collapsed | -200px     | 80px         | So icones visiveis
expanded  | 0px        | 280px        | Tudo visivel
hover     | 0px        | 280px        | Expande temporario
```

Zero propriedades de layout animadas. Zero reflow por frame. 60 FPS garantido.

---

## Ordem de Execucao

1. Criar `useSidebarTransform.ts`
2. Editar `useNavigation.ts` (expor `visibleWidth` + `translateX`)
3. Editar `Sidebar.tsx` (transform em vez de width)
4. Editar `SidebarItem.tsx`, `SidebarGroup.tsx`, `SidebarBrand.tsx` (remover transition-all e scale)
5. Editar `AppShell.tsx` (usar visibleWidth)
6. Editar `index.css` (regra global transition-all)

