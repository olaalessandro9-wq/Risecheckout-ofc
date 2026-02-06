

# Unificar Intensidade do Gradiente: Header + Conteudo

## Diagnostico

Tres problemas distintos foram identificados na implementacao atual:

### Problema 1: Slider com minimo muito alto
O slider de "Intensidade" nos editores (FixedHeaderEditor e BannerEditor) tem `min={20}`. Isso impede que o usuario defina intensidades realmente fracas. Mesmo no valor mais baixo (20%), o efeito visual e forte demais.

### Problema 2: Formula do gradiente nao permite valores realmente sutis
A funcao `generateBottomFadeCSS` usa a formula:
```text
startPercent = 60 - (strength/100 * 40)
```
Com strength=0, o fade comeca em 60% da imagem. Isso ja e um gradiente significativo. Nao existe faixa para gradientes "quase transparentes".

### Problema 3: Background do conteudo ignora intensidade
A funcao `buildGradientContentStyle` aplica `backgroundColor` com 100% de opacidade, independente do valor de `strength`:
```text
// Atual: SEMPRE 100% opaco
return {
  '--background': hsl,
  backgroundColor: hsl(${hsl}),  // <-- opacity fixa em 1.0
}
```
Quando a intensidade e fraca (ex: 5%), o gradiente do header mal aparece, mas o conteudo abaixo tem a cor customizada a 100% de opacidade. Resultado: descontinuidade visual.

## Solucao

### 1. Expandir range do slider para 0-100

Nos dois editores (FixedHeaderEditor e BannerEditor), alterar o slider:
```text
ANTES: min={20}  max={100} step={5}
DEPOIS: min={0}   max={100} step={1}
```
`step={1}` da controle fino ao usuario. `min={0}` permite gradientes quase imperceptiveis.

### 2. Recalibrar a formula do gradiente no header

Ajustar `generateBottomFadeCSS` para que valores baixos produzam gradientes realmente sutis:

```text
// ANTES:
const startPercent = 60 - (s * 40);  // range: 60% a 20%
// O ultimo stop e sempre solid (alpha = 1.0)

// DEPOIS:
const startPercent = 70 - (s * 50);  // range: 70% a 20%
// O ultimo stop usa maxAlpha baseado no strength:
const maxAlpha = 0.1 + (s * 0.9);   // range: 0.1 a 1.0
```

Com strength=5 (5%):
- startPercent = 67.5% (fade comeca bem no final)
- maxAlpha = 0.145 (quase transparente)

Com strength=100:
- startPercent = 20% (fade agressivo desde cedo)
- maxAlpha = 1.0 (totalmente opaco)

### 3. Aplicar intensidade ao background do conteudo

A funcao `buildGradientContentStyle` deve usar o strength para definir a opacidade do `backgroundColor`:

```text
export function buildGradientContentStyle(
  config: GradientOverlayConfig
): React.CSSProperties | undefined {
  if (!config.enabled || config.use_theme_color) return undefined;

  const hsl = hexToHSL(config.custom_color || '#000000');
  const s = clampStrength(config.strength) / 100;
  const alpha = 0.1 + (s * 0.9); // Mesma curva do header

  return {
    '--background': hsl,
    backgroundColor: `hsl(${hsl} / ${alpha})`,
  } as React.CSSProperties;
}
```

Isso garante que header e conteudo tenham a MESMA intensidade da cor customizada. Quando o slider esta fraco, AMBOS ficam sutis. Quando forte, AMBOS ficam vibrantes.

## Arquivos Afetados

```text
src/modules/members-area-builder/utils/
  gradientUtils.ts                        <- EDITAR (formula + buildGradientContentStyle)

src/modules/members-area-builder/components/sections/
  FixedHeader/FixedHeaderEditor.tsx       <- EDITAR (slider min=0, step=1)
  Banner/BannerEditor.tsx                 <- EDITAR (slider min=0, step=1)
```

## Comportamento Resultante

| Strength | Header Gradient | Content Background | Resultado Visual |
|----------|-----------------|-------------------|------------------|
| 0% | Quase invisivel (alpha ~0.1) | Quase transparente (alpha ~0.1) | Sutil, quase sem efeito |
| 25% | Fade leve no final | Cor leve (alpha ~0.325) | Transicao suave |
| 50% | Fade medio | Cor media (alpha ~0.55) | Equilibrado |
| 75% | Fade forte | Cor forte (alpha ~0.775) | Vibrante |
| 100% | Fade maximo (solid) | Cor solida (alpha ~1.0) | Maximo impacto |

Header e conteudo sempre proporcionais -- zero divisao visual em qualquer nivel de intensidade.

