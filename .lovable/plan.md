
# Plano: Correção Definitiva da Transição Banner → Conteúdo

## RISE ARCHITECT PROTOCOL V3 - Solução 10.0/10

---

## Diagnóstico Visual Comparativo

| Aspecto | RiseCheckout (Seu Print) | Cakto/RatoFlix (Print Referência) |
|---------|--------------------------|-----------------------------------|
| Transição | **LINHA DURA** visível entre banner e "Fase 1" | **IMPERCEPTÍVEL** - tudo parece contínuo |
| Gradiente | Preso DENTRO do `overflow-hidden` | "Vaza" para o conteúdo abaixo |
| Cards de Módulos | Começam FORA do banner, fundo separado | Aparecem DEBAIXO do gradiente |
| Percepção | "Colado", duas áreas separadas | Espaço único, profundo |

---

## Causa Raiz Identificada

```text
PROBLEMA NO CÓDIGO ATUAL (BuyerBannerSection.tsx):

Linha 96: <div className="relative overflow-hidden {heightClass}">
              │
              └─ overflow-hidden CORTA o gradiente
                 O gradiente MORRE na borda inferior do banner
                 Nada "vaza" para o conteúdo abaixo

Linha 123-141: Gradient está DENTRO do container cortado
               ├─ generateGradientCSS()      ← Preso dentro
               └─ generateSideGradientCSS()  ← Preso dentro

RESULTADO: Corte seco entre banner e "Fase 1"
```

---

## Solução: Gradient Extension (Netflix-Style)

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ARQUITETURA DA SOLUÇÃO                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ANTES (Problema):                                                           │
│  ┌────────────────────────────────────────────────────────────┐              │
│  │ <div overflow-hidden>                                       │              │
│  │   <img/>                                                    │              │
│  │   <gradient/> ← PRESO aqui dentro, não sai                 │              │
│  │ </div>                                                      │              │
│  └────────────────────────────────────────────────────────────┘              │
│  ─────────────── CORTE SECO ───────────────                                  │
│  ┌────────────────────────────────────────────────────────────┐              │
│  │ Fase 1 / Conteúdo                                           │              │
│  └────────────────────────────────────────────────────────────┘              │
│                                                                              │
│  DEPOIS (Solução):                                                           │
│  ┌────────────────────────────────────────────────────────────┐              │
│  │ <div relative> (wrapper SEM overflow)                       │              │
│  │   ┌──────────────────────────────────────────────────────┐ │              │
│  │   │ <div overflow-hidden> (só pro carousel)              │ │              │
│  │   │   <img/>                                              │ │              │
│  │   │   <side-gradient/> ← Gradiente lateral (vigneta)     │ │              │
│  │   │ </div>                                                │ │              │
│  │   └──────────────────────────────────────────────────────┘ │              │
│  │                                                             │              │
│  │   <gradient-extension/> ← FORA do overflow, z-10           │              │
│  │   │                                                         │              │
│  │   │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ Gradiente que "vaza"               │              │
│  │   │  ░░░░░░░░░░░░░░░░░ para baixo                          │              │
│  │   │  ·················                                     │              │
│  │   └─────────────────── ← Dissolve em transparent           │              │
│  └────────────────────────────────────────────────────────────┘              │
│  ┌─────────────────────── -mt-16 (margin negativo) ──────────┐               │
│  │ Fase 1 / Conteúdo ← SOBE para ficar debaixo do gradiente  │               │
│  └────────────────────────────────────────────────────────────┘              │
│                                                                              │
│  RESULTADO: Transição imperceptível, estilo Netflix/Cakto                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Arquivos a Modificar

| Arquivo | Modificação | Criticidade |
|---------|-------------|-------------|
| `gradientUtils.ts` | Adicionar `generateExtensionGradientCSS()` | ALTA |
| `BuyerBannerSection.tsx` | Reestruturar com gradient extension FORA do overflow | CRÍTICA |
| `BannerView.tsx` | Mesma reestruturação para paridade no Builder | ALTA |
| `CourseHome.tsx` | Adicionar margin-top negativo após banners | ALTA |

---

## Implementação Técnica Detalhada

### 1. Nova Função em `gradientUtils.ts`

```typescript
/**
 * Gera o gradiente de extensão que "vaza" para o conteúdo abaixo do banner
 * Este gradiente fica FORA do container overflow-hidden
 * 
 * @param config - Configuração do gradiente
 * @returns String CSS do gradiente de extensão
 */
export function generateExtensionGradientCSS(
  config: GradientOverlayConfig
): string {
  if (!config.enabled) return 'none';
  
  const color = config.use_theme_color 
    ? 'hsl(var(--background))' 
    : (config.custom_color || '#000000');
  
  // Gradiente que vai do opaco (topo) para transparente (base)
  // Isso cria a "extensão" visual que se mistura com o conteúdo
  return `linear-gradient(to bottom, ${color} 0%, ${color}95 20%, ${color}60 50%, ${color}20 80%, transparent 100%)`;
}
```

### 2. Reestruturação do `BuyerBannerSection.tsx`

```tsx
return (
  // WRAPPER: relative, SEM overflow-hidden
  <div className="w-full relative">
    {title && (
      <h2 className="...">
        {title}
      </h2>
    )}
    
    {/* CONTAINER DO CAROUSEL: COM overflow-hidden (só aqui) */}
    <div className={cn('relative overflow-hidden', heightClass)}>
      <div ref={emblaRef}>
        {/* slides... */}
      </div>

      {/* Gradiente INTERNO (lateral/vigneta) - fica dentro do overflow */}
      {gradientConfig.enabled && (
        <div 
          className="absolute inset-0 pointer-events-none z-10"
          style={{ background: generateSideGradientCSS(gradientConfig) }}
        />
      )}

      {/* Indicators */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          ...
        </div>
      )}
    </div>
    
    {/* GRADIENT EXTENSION: FORA do overflow-hidden, extende para baixo */}
    {gradientConfig.enabled && (
      <div 
        className="absolute left-0 right-0 h-24 pointer-events-none z-10"
        style={{
          bottom: 0,
          transform: 'translateY(100%)', // Posiciona ABAIXO do banner
          background: generateExtensionGradientCSS(gradientConfig),
        }}
      />
    )}
  </div>
);
```

### 3. Ajuste no `CourseHome.tsx`

Para que o gradiente de extensão sobreponha o conteúdo, as seções de módulos precisam "subir":

```tsx
<div className="space-y-2">
  {sections.map((section, index) => {
    // Detecta se a seção anterior é um banner
    const prevSection = index > 0 ? sections[index - 1] : null;
    const isAfterBanner = prevSection?.type === 'banner';
    
    if (section.type === 'banner') {
      // Banners renderizam normalmente
      return (
        <BuyerBannerSection key={section.id} ... />
      );
    }
    
    if (section.type === 'modules') {
      // Módulos após banner: margin-top negativo para "subir"
      return (
        <div 
          key={section.id}
          className={cn(
            isAfterBanner && '-mt-16 relative z-0' // Sobe e fica abaixo do gradient
          )}
        >
          <ModuleCarousel ... />
        </div>
      );
    }
    
    return null;
  })}
</div>
```

---

## Resultado Visual Esperado

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                         COMPARAÇÃO FINAL                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ ANTES (Seu Print - RiseCheckout):                                            │
│ ┌─────────────────────────────────────┐                                      │
│ │        COMMUNITY (Banner)           │                                      │
│ └─────────────────────────────────────┘                                      │
│ ━━━━━━━━━━ LINHA DURA VISÍVEL ━━━━━━━━━━ ← PROBLEMA                          │
│ Fase 1                                                                       │
│ ┌────────┐ ┌────────┐ ┌────────┐                                            │
│                                                                              │
│ DEPOIS (Igual Cakto/RatoFlix):                                               │
│ ┌─────────────────────────────────────┐                                      │
│ │        COMMUNITY (Banner)           │                                      │
│ │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│ ← Gradiente                         │
│ │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│ ← Extension (vaza para baixo)       │
│ │  Fase 1  ← Conteúdo SOBE debaixo    │                                      │
│ │  ┌────────┐ ┌────────┐ ┌────────┐   │                                      │
│ └─────────────────────────────────────┘                                      │
│                                                                              │
│ TRANSIÇÃO: Imperceptível, profunda, estilo Netflix/Cakto                     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Paridade Builder ↔ Área do Aluno

Aplicar a **mesma lógica** em `BannerView.tsx` para que o Builder mostre exatamente como ficará na área do aluno.

---

## Conformidade RISE V3

| Critério | Status |
|----------|--------|
| LEI SUPREMA (4.1) | 10.0/10 - Técnica real Netflix/Cakto |
| Manutenibilidade | Usa config do Builder, extensível |
| Zero Dívida Técnica | Resolve completamente na raiz |
| Arquitetura | Gradient fora do overflow, separação correta |
| Escalabilidade | Funciona com qualquer altura de banner |
| Paridade Visual | Builder e área do aluno idênticos |

**NOTA FINAL: 10.0/10** - Solução definitiva para transição premium
