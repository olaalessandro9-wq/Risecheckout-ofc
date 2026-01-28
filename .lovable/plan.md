
# Correção pela raiz (RISE V3): Transição Banner → Conteúdo com Gradiente **matematicamente válido** e arquitetura consistente

## Diagnóstico (causa raiz real — não “ajuste de porcentagem”)
O problema **não é** “área branca” e nem falta de tentativa: o problema é que o nosso **motor de gradiente está gerando CSS inválido** quando `use_theme_color = true`.

### Onde está a falha arquitetural
Em `src/modules/members-area-builder/utils/gradientUtils.ts` nós fazemos isto:

- `color = 'hsl(var(--background))'`
- depois concatenamos `40`, `80` etc:
  - `${color}40`, `${color}80`

Isso resulta em strings do tipo:

- `hsl(var(--background))40` (inválido)
- `hsl(var(--background))80` (inválido)

Quando um `linear-gradient(...)` contém paradas com cores inválidas, o browser **pode descartar o background inteiro** (ou tratar de forma inconsistente). Resultado prático: **o “fade” que deveria matar a emenda não acontece** → a emenda fica “crua” e visível.

Ou seja: hoje a arquitetura depende de um gradiente que, na prática, **não está sendo aplicado corretamente** em dark/light conforme esperado. Isso é raiz, não sintoma.

---

## Análise de Soluções (RISE V3 — obrigatório)

### Solução A — “Ajustar stops do gradiente” (mexer em 0/30/50/70/100)
- Manutenibilidade: 2/10 (continua em cima de CSS inválido)
- Zero DT: 1/10 (vai virar caça ao número “perfeito” por banner)
- Arquitetura: 1/10 (não corrige o motor; só tenta mascarar)
- Escalabilidade: 2/10 (cada banner/tema volta a quebrar)
- Segurança: 10/10
- **NOTA FINAL: 2.7/10**
- Tempo estimado: horas/dias “na sorte” + regressões futuras

### Solução B — Reescrever o motor de gradiente para gerar CSS válido (alpha correto + strength real + composição correta)
- Manutenibilidade: 10/10 (motor único, tipado, previsível)
- Zero DT: 10/10 (nada de números mágicos por imagem)
- Arquitetura: 10/10 (corrige o módulo responsável pelo efeito)
- Escalabilidade: 10/10 (funciona em qualquer tema/cor/config)
- Segurança: 10/10
- **NOTA FINAL: 10.0/10**
- Tempo estimado: 1–2 dias (com validação e teste de regressão)

### DECISÃO: **Solução B (10.0/10)**  
Justificativa: é a única que corrige **a raiz arquitetural** (o gerador de gradientes). Todo o resto é variação de “tentar empurrar stops” em cima de um output inválido.

---

## Objetivo arquitetural (Netflix real, sem hacks)
Garantir que:
1. O banner termina **no mesmo “surface color”** do container abaixo.
2. O gradiente é **sempre válido**, tanto para `theme color` quanto para `custom hex`.
3. O parâmetro `strength` (0–100) influencia de forma determinística o fade (como o tipo diz).

---

## Plano de Implementação (passo a passo)

### 1) Reescrever `gradientUtils.ts` para **não concatenar alpha**
**Arquivo:** `src/modules/members-area-builder/utils/gradientUtils.ts`

#### 1.1 Criar util interno “Color Engine” (sem novos deps)
- `clampStrength(strength: number): number`
- `parseHexToRgb(hex: string): { r: number; g: number; b: number }` (suporte #RGB e #RRGGBB)
- `getSolidColor(config): { solid: string; withAlpha: (a: number) => string }`

Regras:
- Se `use_theme_color === true`:
  - `solid = 'hsl(var(--background))'`
  - `withAlpha(a) = 'hsl(var(--background) / a)'`
- Se `use_theme_color === false`:
  - converter hex para `rgb(r g b / a)`
  - `solid = 'rgb(r g b)'` (ou `rgb(r g b / 1)`)

Isso elimina a classe inteira de bugs “CSS inválido”.

#### 1.2 Implementar `strength` como “ponto médio do fade”
Como o tipo diz: `strength` controla “midpoint”. Então:
- Definir um mapeamento determinístico de `strength` → stops e opacidades
- Exemplo (conceitual, vamos fixar matematicamente no código):
  - `mid = lerp(0.55, 0.35, s)` onde `s = strength/100`
  - `startFade = mid - 0.20`
  - `endFade = 1.0`
  - Opacidades crescem com `s`

O importante: zero “tentativa”; é fórmula.

#### 1.3 Corrigir `generateBottomFadeCSS`
Gerar gradiente **com alpha válido**:
- usar `withAlpha(0.0..1.0)` e não sufixo `40/80`
- manter semântica Netflix:
  - topo: transparente
  - base: sólido

#### 1.4 Corrigir `generateSideGradientCSS`
Mesma correção: alpha válido (hsl/rgba).
Também passar a usar `strength` para controlar vinheta:
- força alta = vinheta mais presente
- força baixa = mais sutil

> Resultado: gradientes deixam de ser “strings frágeis” e viram produto de um motor consistente.

---

### 2) Composição correta: **um único overlay** (não duas DIVs empilhadas)
**Arquivos:**
- `src/modules/members-area/pages/buyer/components/sections/BuyerBannerSection.tsx`
- `src/modules/members-area-builder/components/sections/Banner/BannerView.tsx`

Trocar:
- duas layers `<div style={{ background: ... }}>` em sequência

Por:
- **uma** layer overlay com `backgroundImage` combinando múltiplos gradients:

Exemplo de arquitetura:
- `backgroundImage: "${sideGradient}, ${bottomFade}"`
- `backgroundRepeat: 'no-repeat'`
- `backgroundSize: 'cover'`

Isso reduz DOM, evita qualquer chance de “a layer de cima anular a de baixo”, e torna a renderização mais previsível.

---

### 3) Garantia de “surface continuity” (sem depender de layout de outras seções)
**Arquivos:**
- `BuyerBannerSection.tsx`
- `BannerView.tsx`
- (auditoria) `CourseHome.tsx` e `ModuleCarousel.tsx`

Ajustes:
- O container do banner (`relative overflow-hidden`) deve ter `bg-background` explícito (não “herdar”):
  - isso garante que qualquer pixel transparente do overlay “cai” na cor correta.
- Auditar `ModuleCarousel` para garantir que ele não introduz um “top border / shadow / bg-card” no primeiro bloco que cria a linha.

Se existir algum “top border”/“shadow top”/“bg-card” em wrappers do carousel ou do título, isso será removido ou redesenhado para manter a superfície única.

---

### 4) Verificação (sem achismo)
#### 4.1 Verificação manual guiada
- Abrir área de membros (dark e light, se existir).
- Verificar transição em:
  - Desktop
  - Mobile
- Verificar paridade no Builder (BannerView).

#### 4.2 Verificação automatizada (melhor solução = anti-regressão)
Como já existe `@playwright/test`, criar teste E2E que:
- navega para uma página com banner + primeira seção de módulos
- localiza o overlay do banner e valida `computedStyle.backgroundImage` contém `linear-gradient` válido (não “none”)
- opcional: screenshot snapshot focado na borda inferior (regressão visual controlada)

Isso garante que nunca mais voltaremos ao estado “gradiente inválido e a emenda reaparece”.

---

## Escopo de arquivos (o que será alterado)
1. `src/modules/members-area-builder/utils/gradientUtils.ts`
   - Reescrita do motor de cor/alpha
   - `strength` passa a ser realmente aplicado
   - CSS sempre válido (hsl/rgba)
2. `src/modules/members-area/pages/buyer/components/sections/BuyerBannerSection.tsx`
   - Overlay único com múltiplos backgrounds
   - `bg-background` explícito
3. `src/modules/members-area-builder/components/sections/Banner/BannerView.tsx`
   - Mesma mudança para paridade Builder ↔ Buyer
4. (Auditoria) `src/modules/members-area/pages/buyer/components/netflix/ModuleCarousel.tsx`
   - Garantir que não há borda/sombra/top background introduzindo “linha”
5. (Opcional mas recomendado) `playwright` test de regressão

---

## Critérios de aceite (objetivos, sem subjetividade)
- Emenda entre banner e primeira seção **não é perceptível** em zoom 100% e 200%.
- `computedStyle` do overlay do banner **não** retorna `background-image: none`.
- O gradiente funciona com:
  - `use_theme_color = true` (hsl var)
  - `use_theme_color = false` (hex)
- Paridade visual: Builder (BannerView) = Área do aluno (BuyerBannerSection).

---

## Nota RISE V3
Isso é correção pela raiz porque:
- O bug está no **módulo gerador** (gradientUtils) produzindo CSS inválido.
- Consertar o gerador elimina todas as “tentativas” e remove a necessidade de hacks de layout.
- A solução passa a ser estável por décadas: qualquer banner, qualquer cor, qualquer tema.

