

# Sidebar 2-State Mode para Monitores Grandes

## O que muda

Em monitores grandes (>= 1920px), a sidebar passa de 3 estados para 2:

| Monitor | Estados Disponiveis | Ciclo do Toggle |
|---------|---------------------|-----------------|
| Normal (< 1920px) | hidden, collapsed, expanded | expanded -> hidden -> collapsed -> expanded |
| Grande (>= 1920px) | collapsed, expanded | expanded -> collapsed -> expanded |

O estado "hidden" (sidebar 100% invisivel) fica disponivel apenas em monitores normais.

---

## Pontos de Mudanca

### 1. useNavigation.ts - Ciclo viewport-aware

O `cycleSidebarState` atualmente envia `CYCLE_SIDEBAR` para a state machine, que usa o mapa fixo `SIDEBAR_STATE_CYCLE` (3 estados). A mudanca e fazer o hook calcular o proximo estado localmente, considerando o viewport:

```text
Normal:       expanded -> hidden -> collapsed -> expanded (3 estados)
Grande:       expanded -> collapsed -> expanded (2 estados, pula hidden)
```

Em vez de enviar `CYCLE_SIDEBAR`, o hook enviara `SET_SIDEBAR` com o proximo estado calculado. Isso mantem a state machine generica e move a logica de viewport para o hook (que ja tem acesso ao contexto de UI).

### 2. useNavigation.ts - Restauracao do localStorage

Se um usuario em monitor grande tinha "hidden" salvo (ex: usou em monitor normal antes), ao restaurar, o hook deve coercer para "collapsed". Isso evita que o usuario fique preso em um estado impossivel.

### 3. Topbar.tsx - Icone e tooltip adaptativo

Atualmente o Topbar mostra 3 icones diferentes (PanelLeft para hidden, PanelLeftClose para collapsed, PanelLeftOpen para expanded). Em monitores grandes, como "hidden" nao existe, os icones e tooltips devem refletir apenas os 2 estados:

| Estado | Monitor Normal | Monitor Grande |
|--------|---------------|----------------|
| collapsed | "Expandir sidebar" + PanelLeftClose | "Expandir sidebar" + PanelLeftClose |
| expanded | "Ocultar sidebar" + PanelLeftOpen | "Recolher sidebar" + PanelLeftOpen |

No monitor normal, expanded vai para "hidden" (ocultar). No monitor grande, expanded vai para "collapsed" (recolher). Icones e tooltips mudam de acordo.

---

## Detalhes Tecnicos

### Arquivos a modificar

```text
src/
  modules/navigation/
    hooks/
      useNavigation.ts          (EDITAR - ciclo viewport-aware + restauracao)
    types/
      navigation.types.ts       (EDITAR - adicionar ciclo de 2 estados)
  components/layout/
    Topbar.tsx                  (EDITAR - icone/tooltip adaptativo)
```

### navigation.types.ts

Adicionar um segundo mapa de ciclo para monitores grandes:

```typescript
export const SIDEBAR_STATE_CYCLE_LARGE: Readonly<Record<SidebarState, SidebarState>> = {
  hidden: "collapsed",     // fallback caso chegue aqui
  collapsed: "expanded",
  expanded: "collapsed",   // pula hidden, vai direto para collapsed
} as const;
```

### useNavigation.ts

1. Importar `useIsLargeViewport`
2. Modificar `cycleSidebarState` para usar `SET_SIDEBAR` com o proximo estado calculado:
   - Normal: usa `SIDEBAR_STATE_CYCLE[current]`
   - Grande: usa `SIDEBAR_STATE_CYCLE_LARGE[current]`
3. Modificar o `useEffect` de restauracao do localStorage: se `isLargeViewport` e estado restaurado e "hidden", coercer para "collapsed"

### Topbar.tsx

1. Receber nova prop `isLargeViewport: boolean`
2. Ajustar `getSidebarIcon` e `getSidebarTooltip` para refletir apenas 2 estados quando `isLargeViewport` e true
3. No estado expanded + monitor grande: tooltip muda de "Ocultar sidebar" para "Recolher sidebar"

### AppShell.tsx

Passar `isLargeViewport` para o Topbar (ja tem acesso via hook).

---

## Resultado Esperado

- Monitor normal: sidebar continua com 3 estados (expanded, hidden, collapsed) - comportamento identico ao atual
- Monitor grande: sidebar alterna apenas entre expanded e collapsed - sem estado "100% sem sidebar"
- Se usuario muda de monitor grande para normal (resize), os 3 estados voltam a ficar disponiveis
- Se usuario tinha "hidden" salvo e abre em monitor grande, sidebar aparece como "collapsed" automaticamente
