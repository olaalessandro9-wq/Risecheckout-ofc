
# Fix: Gradiente Customizado Deve Cobrir TODA a Area de Conteudo

## Root Cause (Diagnostico Profundo)

O `contentStyle` atual define APENAS a CSS variable `--background`:

```text
contentStyle = { '--background': '260 65% 11%' }
```

Porem, os containers pai usam cores Tailwind HARDCODED que NAO usam `--background`:

- **BuilderCanvas desktop (linha 176):** `bg-zinc-950` -> `background-color: rgb(9 9 11)` (HARDCODED)
- **BuilderCanvas mobile (linha 81):** `bg-zinc-950` -> `background-color: rgb(9 9 11)` (HARDCODED)
- **ModulesView (linha 94):** `<div className="pt-3 pb-1">` -> SEM background (herda zinc-950 do pai)

Resultado: `--background` e sobrescrito mas NINGUEM usa essa variable no container principal. A cor `bg-zinc-950` continua visivel -- criando a divisao cinza entre o header e o conteudo.

## Solucao

Atualizar `gradientUtils.ts` para retornar um style object completo que inclui TANTO `--background` (para filhos que usam `bg-background`) QUANTO `backgroundColor` (para sobrescrever classes Tailwind hardcoded do container pai).

Inline styles tem especificidade MAIOR que classes Tailwind. Portanto `backgroundColor: hsl(260 65% 11%)` sobrescreve `bg-zinc-950` automaticamente.

## Mudancas Tecnicas

### 1. gradientUtils.ts -- Substituir funcao

Remover `getGradientBackgroundOverride` (retorna string) e substituir por `buildGradientContentStyle` (retorna `React.CSSProperties | undefined`):

```text
// ANTES:
export function getGradientBackgroundOverride(
  config: GradientOverlayConfig
): string | null {
  if (!config.enabled || config.use_theme_color) return null;
  return hexToHSL(config.custom_color || '#000000');
}

// DEPOIS:
export function buildGradientContentStyle(
  config: GradientOverlayConfig
): React.CSSProperties | undefined {
  if (!config.enabled || config.use_theme_color) return undefined;

  const hsl = hexToHSL(config.custom_color || '#000000');

  return {
    '--background': hsl,
    backgroundColor: `hsl(${hsl})`,
  } as React.CSSProperties;
}
```

A dupla propriedade garante:
- `--background` -> filhos com `bg-background` herdam a cor customizada
- `backgroundColor` -> container pai tem sua cor sobrescrita (elimina zinc-950)

### 2. BuilderCanvas.tsx -- Atualizar import e contentStyle

Substituir `getGradientBackgroundOverride` por `buildGradientContentStyle`:

```text
// Import
import { resolveGradientConfig, buildGradientContentStyle } from '../../utils/gradientUtils';

// contentStyle (linhas 35-42)
const contentStyle = useMemo(() => {
  if (!fixedHeader) return undefined;
  const headerSettings = fixedHeader.settings as FixedHeaderSettings;
  const gradientConfig = resolveGradientConfig(headerSettings.gradient_overlay);
  return buildGradientContentStyle(gradientConfig);
}, [fixedHeader]);
```

Nenhuma mudanca nos containers -- o `style={contentStyle}` ja esta aplicado nos locais corretos (desktop linha 178, mobile linha 83).

### 3. CourseHome.tsx -- Atualizar import e contentStyle

Mesma substituicao para a pagina do comprador:

```text
// Import
import { resolveGradientConfig, buildGradientContentStyle } from "@/modules/members-area-builder/utils/gradientUtils";

// contentStyle (linhas 138-146)
const contentStyle = useMemo(() => {
  const headerSection = sections.find(s => s.type === 'fixed_header');
  if (!headerSection) return undefined;
  const headerSettings = headerSection.settings as unknown as FixedHeaderSettings;
  const gradientConfig = resolveGradientConfig(headerSettings.gradient_overlay);
  return buildGradientContentStyle(gradientConfig);
}, [sections]);
```

## Arquivos Afetados

```text
src/modules/members-area-builder/utils/
  gradientUtils.ts           <-- EDITAR (substituir funcao)

src/modules/members-area-builder/components/canvas/
  BuilderCanvas.tsx          <-- EDITAR (import + contentStyle simplificado)

src/modules/members-area/pages/buyer/
  CourseHome.tsx             <-- EDITAR (import + contentStyle simplificado)
```

## Comportamento Resultante

| Configuracao do Gradiente | Container Pai | Filhos com bg-background |
|--------------------------|---------------|--------------------------|
| Desabilitado | bg-zinc-950 (padrao) | --background do tema |
| Cor do tema | bg-zinc-950 (padrao) | --background do tema |
| Cor customizada (#1a0a2e) | backgroundColor: hsl(260 65% 11%) SOBRESCREVE zinc-950 | --background: 260 65% 11% |

A transicao entre header e conteudo sera imperceptivel: o gradiente do header faz fade PARA a cor customizada, e o conteudo abaixo COMECA com essa mesma cor. Zero divisao visual.
