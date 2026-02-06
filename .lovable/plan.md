

# Fix: Gradiente Customizado Deve Cobrir Toda a Area de Membros

## Problema

O gradiente do header usa `createColorFactory` para gerar a cor de fade. Quando o usuario seleciona "Cor customizada", o gradiente faz fade para essa cor customizada na borda inferior do header. Porem, o conteudo ABAIXO do header (ModuleCarousel, etc.) usa `bg-background` -- que e a cor padrao do tema (`--background` CSS variable). Isso cria uma divisao visual "seca" entre o header e o conteudo.

```text
HEADER
  Gradiente faz fade para cor customizada (ex: #1a0a2e)
--------- DIVISAO VISIVEL ---------
CONTEUDO
  Usa bg-background (ex: hsl(240 10% 3.9%) = preto padrao)
```

## Solucao: Override da CSS Variable `--background`

A abordagem mais elegante e eficiente: quando o gradiente usa cor customizada, sobrescrever a CSS variable `--background` no container pai. Como TODOS os componentes filhos (ModuleCarousel, etc.) usam `bg-background` (que compila para `background-color: hsl(var(--background))`), eles automaticamente adotam a nova cor.

```text
HEADER
  Gradiente faz fade para cor customizada (#1a0a2e)
--------- SEM DIVISAO (mesma cor) ---------
CONTEUDO
  bg-background agora aponta para #1a0a2e (via --background override)
```

Vantagens:
- ZERO mudancas em componentes filhos (ModuleCarousel, ModulesView, etc.)
- Automaticamente afeta todos os `bg-background` na arvore
- So ativa quando "Cor customizada" esta selecionada
- Quando usa "Cor do tema" (padrao), nenhum override -- comportamento identico ao atual

## Mudancas Tecnicas

### 1. gradientUtils.ts -- Nova funcao publica

Adicionar `hexToHSL` (conversao hex para formato HSL sem wrapper) e `getGradientBackgroundOverride`:

```text
function hexToHSL(hex: string): string {
  // Converte #RRGGBB para "H S% L%" (formato que --background espera)
  // Ex: "#1a0a2e" -> "260 65% 11%"
}

export function getGradientBackgroundOverride(
  config: GradientOverlayConfig
): string | null {
  // Retorna null se desabilitado ou usando cor do tema
  // Retorna HSL string quando usando cor customizada
  if (!config.enabled || config.use_theme_color) return null;
  return hexToHSL(config.custom_color || '#000000');
}
```

### 2. BuilderCanvas.tsx -- Override no container de conteudo

Computar o override a partir do fixedHeader e aplicar como CSS variable inline nos containers (desktop e mobile):

```text
const contentStyle = useMemo(() => {
  if (!fixedHeader) return undefined;
  const settings = fixedHeader.settings as FixedHeaderSettings;
  const gradientConfig = resolveGradientConfig(settings.gradient_overlay);
  const bgOverride = getGradientBackgroundOverride(gradientConfig);
  if (!bgOverride) return undefined;
  return { '--background': bgOverride } as React.CSSProperties;
}, [fixedHeader]);

// Desktop:
<div style={contentStyle} className={cn('flex-1 flex overflow-hidden', ...)}>

// Mobile:
<div style={contentStyle} className={cn('mx-auto ...', ...)}>
```

### 3. CourseHome.tsx -- Override na area de conteudo do comprador

Mesma logica para a pagina do comprador:

```text
const contentStyle = useMemo(() => {
  const headerSection = sections.find(s => s.type === 'fixed_header');
  if (!headerSection) return undefined;
  const settings = headerSection.settings as unknown as FixedHeaderSettings;
  const gradientConfig = resolveGradientConfig(settings.gradient_overlay);
  const bgOverride = getGradientBackgroundOverride(gradientConfig);
  if (!bgOverride) return undefined;
  return { '--background': bgOverride } as React.CSSProperties;
}, [sections]);

// Aplicar no container principal:
<div className="flex flex-col" style={contentStyle}>
```

## Arquivos Afetados

```text
src/modules/members-area-builder/utils/
  gradientUtils.ts           <-- EDITAR (hexToHSL + getGradientBackgroundOverride)

src/modules/members-area-builder/components/canvas/
  BuilderCanvas.tsx          <-- EDITAR (contentStyle no desktop + mobile)

src/modules/members-area/pages/buyer/
  CourseHome.tsx             <-- EDITAR (contentStyle na pagina do comprador)
```

## Comportamento Resultante

| Configuracao do Gradiente | Comportamento |
|--------------------------|---------------|
| Desabilitado | Sem mudanca (bg-background padrao) |
| Cor do tema (padrao) | Sem mudanca (ja usa hsl(var(--background))) |
| Cor customizada | --background override com a cor customizada |

A transicao entre header e conteudo sera imperceptivel quando usando cor customizada, pois ambos usarao a mesma cor.

