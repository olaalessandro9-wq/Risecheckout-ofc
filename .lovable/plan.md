
# Plano: Transição Visual Premium - Banner Gradient Overlay System

## RISE ARCHITECT PROTOCOL V3 - Seção 4: LEI SUPREMA

---

## Diagnóstico Visual (Análise das Imagens)

| Aspecto | RiseCheckout (Atual) | Cakto/RatoFlix (Referência) |
|---------|---------------------|----------------------------|
| Transição Banner → Conteúdo | Corte seco, linha dura visível | Gradiente suave, efeito "fade" |
| Profundidade Visual | Design plano, 2D, "colado" | Múltiplas camadas, profundidade |
| Integração com Fundo | Banner termina abruptamente | Banner se dissolve no background |
| Percepção de Qualidade | "Amador", "cru" | Premium, Netflix-like |
| **Nota de Design** | **3.0/10** | **9.5/10** |

### Cadeia Técnica do Problema

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ BuyerBannerSection.tsx (linha 86-130)                                        │
│                                                                              │
│ <div className="relative overflow-hidden {heightClass}">                     │
│   <div ref={emblaRef}>                                                       │
│     {slides.map(...)}   ← Imagem CRUA, sem overlay                          │
│   </div>                                                                     │
│   {indicators}                                                               │
│ </div>                                                                       │
│                                                                              │
│ PROBLEMA: Zero camadas de gradiente sobre a imagem                          │
│ RESULTADO: Corte abrupto entre banner e conteúdo                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Contraste com Componente Correto

O `HeroBanner.tsx` (linhas 47-49) **já implementa o padrão correto**:

```tsx
{/* Gradient Overlays */}
<div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
<div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent" />
```

O `BuyerBannerSection.tsx` e `BannerView.tsx` **não possuem estas camadas**.

---

## Análise de Soluções (RISE V3 - Seção 4.4)

### Solução A: Overlay com Gradiente Fixo
- **Manutenibilidade:** 7/10 (hardcoded, sem customização)
- **Zero DT:** 6/10 (funciona mas limita o futuro)
- **Arquitetura:** 5/10 (não segue padrão SOLID - hardcoded)
- **Escalabilidade:** 4/10 (não escala para temas claros/escuros dinâmicos)
- **Segurança:** 10/10 (sem impacto)
- **NOTA FINAL: 6.4/10**
- Tempo estimado: 30 minutos

### Solução B: Gradiente Customizável no Builder (10.0/10)
- **Manutenibilidade:** 10/10 (configuração no Builder, flexibilidade total)
- **Zero DT:** 10/10 (resolve completamente, sem "melhorar depois")
- **Arquitetura:** 10/10 (SOLID, clean, extensível, tipo discriminado)
- **Escalabilidade:** 10/10 (suporta temas, cores customizadas, dark/light)
- **Segurança:** 10/10 (sem impacto)
- **NOTA FINAL: 10.0/10**
- Tempo estimado: 4-6 horas

### Solução C: Divisor Separado Entre Seções
- **Manutenibilidade:** 3/10 (workaround, não resolve raiz)
- **Zero DT:** 2/10 (cria espaçamento estranho)
- **Arquitetura:** 2/10 (viola RISE V3 - é uma gambiarra)
- **Escalabilidade:** 2/10 (não resolve problema real)
- **Segurança:** 10/10 (sem impacto)
- **NOTA FINAL: 3.8/10**
- Tempo estimado: 15 minutos

### DECISÃO: Solução B (Nota 10.0/10)

As outras soluções são inferiores porque:
- **A** é hardcoded e viola princípios SOLID (não é extensível)
- **C** é literalmente uma gambiarra (proibido pelo RISE V3)
- **B** dá poder total ao produtor, é extensível, e resolve o problema na raiz

---

## Implementação Completa

### Arquitetura da Solução

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                    GRADIENT OVERLAY SYSTEM                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  TIPOS (builder.types.ts)                                                    │
│  ─────────────────────────                                                   │
│  interface GradientOverlayConfig {                                           │
│    enabled: boolean;                                                         │
│    direction: 'bottom' | 'top' | 'left' | 'right';                          │
│    strength: number; // 0-100                                                │
│    use_theme_color: boolean; // Se true, usa --background do tema           │
│    custom_color?: string; // Cor customizada (hex)                           │
│  }                                                                           │
│                                                                              │
│  interface BannerSettings {                                                  │
│    type: 'banner';                                                           │
│    slides: BannerSlide[];                                                    │
│    transition_seconds: number;                                               │
│    height: 'small' | 'medium' | 'large';                                    │
│    gradient_overlay: GradientOverlayConfig; // ← NOVO                        │
│  }                                                                           │
│                                                                              │
│  BUILDER UI (BannerEditor.tsx)                                               │
│  ──────────────────────────────                                              │
│  ┌────────────────────────────┐                                              │
│  │ ☑ Ativar Efeito de Gradiente                                             │
│  │                            │                                              │
│  │ Direção: [⬇ Para Baixo ▾] │                                              │
│  │                            │                                              │
│  │ Intensidade: ──●────── 60% │                                              │
│  │                            │                                              │
│  │ ○ Usar cor do tema         │                                              │
│  │ ● Cor customizada: [■ #000]│                                              │
│  └────────────────────────────┘                                              │
│                                                                              │
│  RENDERIZAÇÃO (BuyerBannerSection.tsx + BannerView.tsx)                      │
│  ──────────────────────────────────────────────────────                      │
│  <div className="relative overflow-hidden">                                  │
│    {/* Carousel */}                                                          │
│    <div ref={emblaRef}>...</div>                                             │
│                                                                              │
│    {/* NOVO: Gradient Overlay */}                                            │
│    {gradient_overlay.enabled && (                                            │
│      <div                                                                    │
│        className="absolute inset-0 pointer-events-none z-10"                │
│        style={{                                                              │
│          background: generateGradientCSS(gradient_overlay)                   │
│        }}                                                                    │
│      />                                                                      │
│    )}                                                                        │
│                                                                              │
│    {/* Indicators (z-20 para ficar acima) */}                               │
│  </div>                                                                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Arquivos a Modificar

| Arquivo | Alteração | Prioridade |
|---------|-----------|------------|
| `src/modules/members-area-builder/types/builder.types.ts` | Adicionar `GradientOverlayConfig` e atualizar `BannerSettings` | CRÍTICA |
| `src/modules/members-area-builder/components/sections/Banner/BannerEditor.tsx` | Adicionar UI para configurar gradiente | ALTA |
| `src/modules/members-area-builder/components/sections/Banner/BannerView.tsx` | Renderizar overlay no Builder (preview) | ALTA |
| `src/modules/members-area/pages/buyer/components/sections/BuyerBannerSection.tsx` | Renderizar overlay na área do aluno | ALTA |
| `src/modules/members-area-builder/utils/gradientUtils.ts` | NOVO - Utilitário para gerar CSS do gradiente | MÉDIA |

---

## Detalhamento Técnico

### 1. Tipos (builder.types.ts)

```typescript
// =====================================================
// GRADIENT OVERLAY CONFIG (NEW)
// =====================================================

export type GradientDirection = 'bottom' | 'top' | 'left' | 'right';

export interface GradientOverlayConfig {
  enabled: boolean;
  direction: GradientDirection;
  strength: number; // 0-100 (controla ponto médio do gradiente)
  use_theme_color: boolean; // Se true, usa hsl(var(--background))
  custom_color?: string; // Hex color quando use_theme_color = false
}

// Atualizar BannerSettings
export interface BannerSettings {
  type: 'banner';
  slides: BannerSlide[];
  transition_seconds: number;
  height: 'small' | 'medium' | 'large';
  gradient_overlay: GradientOverlayConfig; // ← NOVO
}

// Atualizar DEFAULT_BANNER_SETTINGS
export const DEFAULT_BANNER_SETTINGS: Omit<BannerSettings, 'type'> = {
  slides: [{ id: crypto.randomUUID(), image_url: '', link: '', alt: '' }],
  transition_seconds: 5,
  height: 'medium',
  gradient_overlay: {
    enabled: true, // Ativado por padrão para melhor UX out-of-the-box
    direction: 'bottom',
    strength: 60,
    use_theme_color: true,
    custom_color: undefined,
  },
};
```

### 2. Utilitário de Gradiente (NOVO)

**Arquivo:** `src/modules/members-area-builder/utils/gradientUtils.ts`

```typescript
/**
 * Gradient Utilities
 * Gera CSS para gradientes baseado em configuração
 * 
 * @see RISE ARCHITECT PROTOCOL V3
 */

import type { GradientOverlayConfig, GradientDirection } from '../types/builder.types';

const DIRECTION_MAP: Record<GradientDirection, string> = {
  bottom: 'to bottom',
  top: 'to top',
  left: 'to left',
  right: 'to right',
};

/**
 * Gera o CSS do linear-gradient baseado na configuração
 * 
 * @param config - Configuração do gradiente
 * @param themeColor - Cor do tema (usada se use_theme_color = true)
 * @returns String CSS do gradiente
 */
export function generateGradientCSS(
  config: GradientOverlayConfig,
  themeColor?: string
): string {
  if (!config.enabled) return 'none';
  
  const direction = DIRECTION_MAP[config.direction];
  const color = config.use_theme_color 
    ? (themeColor || 'hsl(var(--background))') 
    : (config.custom_color || '#000000');
  
  // Strength controla onde o gradiente atinge opacidade máxima
  // 0% = gradiente começa opaco imediatamente
  // 100% = gradiente só fica opaco no final
  const midpoint = Math.max(0, Math.min(100, config.strength));
  
  // Criar gradiente com 3 stops para efeito suave
  // transparent → semi-opaco (midpoint) → opaco
  return `linear-gradient(${direction}, transparent 0%, ${color}40 ${midpoint * 0.5}%, ${color}99 ${midpoint}%, ${color} 100%)`;
}

/**
 * Gera o gradiente lateral complementar (efeito Netflix)
 * Usado em combinação com o gradiente principal para profundidade
 */
export function generateSideGradientCSS(
  config: GradientOverlayConfig,
  themeColor?: string
): string {
  if (!config.enabled) return 'none';
  
  const color = config.use_theme_color 
    ? (themeColor || 'hsl(var(--background))') 
    : (config.custom_color || '#000000');
  
  // Gradiente lateral suave para dar profundidade
  return `linear-gradient(to right, ${color}80 0%, transparent 40%, transparent 60%, ${color}40 100%)`;
}
```

### 3. Editor do Banner (BannerEditor.tsx)

Adicionar nova seção após "Tempo de Transição":

```typescript
{/* Gradient Overlay Settings */}
<div className="space-y-3 pt-4 border-t">
  <div className="flex items-center justify-between">
    <div className="space-y-0.5">
      <Label>Efeito de Gradiente</Label>
      <p className="text-xs text-muted-foreground">
        Suaviza a transição do banner para o conteúdo
      </p>
    </div>
    <Switch
      checked={settings.gradient_overlay?.enabled ?? true}
      onCheckedChange={(enabled) => onUpdate({ 
        gradient_overlay: { 
          ...settings.gradient_overlay, 
          enabled 
        } 
      })}
    />
  </div>
  
  {settings.gradient_overlay?.enabled && (
    <>
      {/* Direction */}
      <div className="space-y-2">
        <Label>Direção</Label>
        <Select
          value={settings.gradient_overlay?.direction || 'bottom'}
          onValueChange={(direction: GradientDirection) => onUpdate({ 
            gradient_overlay: { 
              ...settings.gradient_overlay, 
              direction 
            } 
          })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bottom">Para Baixo ↓</SelectItem>
            <SelectItem value="top">Para Cima ↑</SelectItem>
            <SelectItem value="left">Para Esquerda ←</SelectItem>
            <SelectItem value="right">Para Direita →</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Strength Slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Intensidade</Label>
          <span className="text-xs text-muted-foreground">
            {settings.gradient_overlay?.strength || 60}%
          </span>
        </div>
        <Slider
          value={[settings.gradient_overlay?.strength || 60]}
          onValueChange={([strength]) => onUpdate({ 
            gradient_overlay: { 
              ...settings.gradient_overlay, 
              strength 
            } 
          })}
          min={20}
          max={100}
          step={5}
        />
      </div>
      
      {/* Color Mode */}
      <div className="space-y-2">
        <Label>Cor do Gradiente</Label>
        <RadioGroup
          value={settings.gradient_overlay?.use_theme_color ? 'theme' : 'custom'}
          onValueChange={(value) => onUpdate({ 
            gradient_overlay: { 
              ...settings.gradient_overlay, 
              use_theme_color: value === 'theme' 
            } 
          })}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="theme" id="theme" />
            <Label htmlFor="theme" className="font-normal">
              Usar cor do tema (recomendado)
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="custom" id="custom" />
            <Label htmlFor="custom" className="font-normal">
              Cor customizada
            </Label>
          </div>
        </RadioGroup>
        
        {!settings.gradient_overlay?.use_theme_color && (
          <Input
            type="color"
            value={settings.gradient_overlay?.custom_color || '#000000'}
            onChange={(e) => onUpdate({ 
              gradient_overlay: { 
                ...settings.gradient_overlay, 
                custom_color: e.target.value 
              } 
            })}
            className="h-10 w-full"
          />
        )}
      </div>
    </>
  )}
</div>
```

### 4. Renderização no Builder (BannerView.tsx)

Adicionar após o carousel, antes dos indicators:

```tsx
{/* Gradient Overlay - Netflix-style transition effect */}
{settings.gradient_overlay?.enabled !== false && (
  <>
    {/* Primary gradient (direction-based) */}
    <div 
      className="absolute inset-0 pointer-events-none z-10"
      style={{
        background: generateGradientCSS(
          settings.gradient_overlay || DEFAULT_GRADIENT_CONFIG,
          theme === 'dark' ? 'hsl(var(--background))' : undefined
        )
      }}
    />
    {/* Side gradient for depth (Netflix-style) */}
    <div 
      className="absolute inset-0 pointer-events-none z-10"
      style={{
        background: generateSideGradientCSS(
          settings.gradient_overlay || DEFAULT_GRADIENT_CONFIG,
          theme === 'dark' ? 'hsl(var(--background))' : undefined
        )
      }}
    />
  </>
)}

{/* Indicators - z-20 para ficar acima do gradiente */}
{slides.length > 1 && (
  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
    ...
  </div>
)}
```

### 5. Renderização na Área do Aluno (BuyerBannerSection.tsx)

Mesma lógica do BannerView.tsx, garantindo paridade visual:

```tsx
{/* Gradient Overlay - Netflix-style transition effect */}
{settings.gradient_overlay?.enabled !== false && (
  <>
    <div 
      className="absolute inset-0 pointer-events-none z-10"
      style={{
        background: generateGradientCSS(
          settings.gradient_overlay || DEFAULT_GRADIENT_CONFIG
        )
      }}
    />
    <div 
      className="absolute inset-0 pointer-events-none z-10"
      style={{
        background: generateSideGradientCSS(
          settings.gradient_overlay || DEFAULT_GRADIENT_CONFIG
        )
      }}
    />
  </>
)}
```

---

## Resultado Visual Esperado

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ANTES vs DEPOIS                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ ANTES (Atual):                                                               │
│ ┌─────────────────────────────────────┐                                      │
│ │        BANNER IMAGE                 │ ← Imagem crua                        │
│ └─────────────────────────────────────┘                                      │
│ ━━━━━━━━━━ LINHA DURA VISÍVEL ━━━━━━━━━━ ← Corte abrupto                     │
│ ┌─────────────────────────────────────┐                                      │
│ │        CONTEÚDO                     │                                      │
│ └─────────────────────────────────────┘                                      │
│                                                                              │
│ DEPOIS (Com Gradiente):                                                      │
│ ┌─────────────────────────────────────┐                                      │
│ │        BANNER IMAGE                 │                                      │
│ │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│ ← Gradiente suave começando          │
│ │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│ ← Gradiente mais forte               │
│ │███████████████████████████████████████│ ← Blend total com background        │
│ └─────────────────────────────────────┘                                      │
│ ┌─────────────────────────────────────┐                                      │
│ │        CONTEÚDO                     │ ← Transição imperceptível            │
│ └─────────────────────────────────────┘                                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Retrocompatibilidade

Para banners existentes sem `gradient_overlay`:

```typescript
// Em BuyerBannerSection.tsx e BannerView.tsx
const gradientConfig: GradientOverlayConfig = settings.gradient_overlay ?? {
  enabled: true, // Ativar por padrão para melhorar UX instantaneamente
  direction: 'bottom',
  strength: 60,
  use_theme_color: true,
};
```

Isso garante que:
1. Banners existentes ganham o efeito automaticamente
2. Produtores podem desativar se preferirem
3. Zero migração de dados necessária

---

## Resumo de Arquivos

| Arquivo | Tipo | Linhas Estimadas |
|---------|------|------------------|
| `builder.types.ts` | Modificação | +25 linhas |
| `gradientUtils.ts` | NOVO | ~60 linhas |
| `BannerEditor.tsx` | Modificação | +80 linhas |
| `BannerView.tsx` | Modificação | +30 linhas |
| `BuyerBannerSection.tsx` | Modificação | +30 linhas |

---

## Conformidade RISE V3

| Critério | Status |
|----------|--------|
| LEI SUPREMA (4.1) | 10.0/10 - Melhor solução, customizável |
| Manutenibilidade Infinita | Configuração no Builder, zero hardcode |
| Zero Dívida Técnica | Não precisa "melhorar depois" |
| Arquitetura Correta | SOLID, tipos discriminados, utilitários puros |
| Escalabilidade | Suporta qualquer tema, cor, direção |
| Limite 300 Linhas | Utilitário separado, tipos separados |
| Single Responsibility | Cada arquivo tem uma responsabilidade |

**NOTA FINAL: 10.0/10** - Solução Premium com Controle Total do Produtor
