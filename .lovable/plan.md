
# Migrar Gradiente para Configuracoes Globais (SSOT)

## Diagnostico Profundo

### Problema Arquitetural

Atualmente, `gradient_overlay` vive DENTRO de cada secao individual (`FixedHeaderSettings.gradient_overlay` e `BannerSettings.gradient_overlay`). Isso causa:

1. **Duplicacao de controles**: Cada secao tem seu proprio editor de gradiente (intensidade, cor, direcao) -- mas o usuario quer UM controle unico que afete TUDO
2. **Inconsistencia visual**: Header e Banner podem ter configuracoes de gradiente DIFERENTES, criando descontinuidade
3. **Leitura indireta no canvas**: `BuilderCanvas` e `CourseHome` precisam "cavar" dentro do `fixedHeader.settings.gradient_overlay` para extrair a configuracao -- violando o principio de que o gradiente e uma propriedade GLOBAL da area de membros

### Causa Raiz

O gradiente foi modelado como propriedade de secao, mas na realidade e uma propriedade da **area de membros como um todo**. Ele afeta header, conteudo, modulos -- TUDO. Deve ser uma configuracao global.

## Analise de Solucoes

### Solucao A: Mover gradient_overlay para MembersAreaBuilderSettings (SSOT Global)

- Manutenibilidade: 10/10 -- Um unico lugar para configurar, um unico lugar para ler
- Zero DT: 10/10 -- Elimina duplicacao entre Header e Banner
- Arquitetura: 10/10 -- Gradiente e propriedade global, vive no lugar correto
- Escalabilidade: 10/10 -- Novas secoes automaticamente herdam o gradiente global
- Seguranca: 10/10 -- Sem impacto
- **NOTA FINAL: 10.0/10**

### Solucao B: Manter por secao mas sincronizar via useEffect

- Manutenibilidade: 5/10 -- Sincronizacao fragil entre secoes
- Zero DT: 3/10 -- Codigo de sync e divida tecnica pura
- Arquitetura: 4/10 -- O dado vive no lugar errado e e "corrigido" por workaround
- Escalabilidade: 3/10 -- Cada nova secao precisa de logica de sync
- Seguranca: 10/10 -- Sem impacto
- **NOTA FINAL: 4.5/10**

### DECISAO: Solucao A (Nota 10.0)

A Solucao B e um workaround que viola o protocolo RISE V3. O gradiente e semanticamente uma propriedade GLOBAL -- ele deve viver em `MembersAreaBuilderSettings`.

## Mudancas Tecnicas

### 1. `settings.types.ts` -- Adicionar gradient_overlay ao MembersAreaBuilderSettings

Adicionar o campo `gradient_overlay` na interface global:

```text
export interface MembersAreaBuilderSettings {
  // ... campos existentes ...
  
  // Global Gradient Overlay (Netflix-style, applies to entire members area)
  gradient_overlay: GradientOverlayConfig;
}
```

**NAO remover** `gradient_overlay` de `FixedHeaderSettings` e `BannerSettings` ainda -- marcar como `@deprecated` para backwards compatibility com dados ja salvos no banco.

### 2. `defaults.ts` -- Adicionar gradient default ao DEFAULT_BUILDER_SETTINGS

```text
export const DEFAULT_BUILDER_SETTINGS: MembersAreaBuilderSettings = {
  // ... campos existentes ...
  gradient_overlay: DEFAULT_GRADIENT_OVERLAY,
};
```

### 3. `GlobalSettingsPanel.tsx` -- Adicionar controles de gradiente

Mover os controles de gradiente (enabled switch, direction select, strength slider, color mode radio) dos editores de secao para o painel Global. Os controles chamarao `onUpdate({ gradient_overlay: { ...updates } })`.

### 4. `FixedHeaderEditor.tsx` -- Remover bloco de gradiente

Remover toda a secao "Efeito de Gradiente" (linhas 250-335), incluindo:
- Switch enabled/disabled
- Select de direcao
- Slider de intensidade
- RadioGroup de cor
- Input de cor customizada
- Funcao `updateGradient`
- Imports de `GradientOverlayConfig`, `GradientDirection`, `DEFAULT_GRADIENT_OVERLAY`

### 5. `BannerEditor.tsx` -- Remover bloco de gradiente

Mesma remocao: toda a secao "Gradient Overlay Settings" (linhas 178-263), funcao `updateGradient`, imports relacionados.

### 6. `BuilderCanvas.tsx` -- Ler gradient de settings (global)

```text
// ANTES: Lia do fixedHeader section
const contentStyle = useMemo(() => {
  if (!fixedHeader) return undefined;
  const headerSettings = fixedHeader.settings as FixedHeaderSettings;
  const gradientConfig = resolveGradientConfig(headerSettings.gradient_overlay);
  return buildGradientContentStyle(gradientConfig);
}, [fixedHeader]);

// DEPOIS: Le diretamente de settings (global)
const contentStyle = useMemo(() => {
  const gradientConfig = resolveGradientConfig(settings.gradient_overlay);
  return buildGradientContentStyle(gradientConfig);
}, [settings.gradient_overlay]);
```

### 7. `SectionView.tsx` -- Adicionar prop gradientConfig e propagar

Adicionar `gradientConfig?: GradientOverlayConfig` as props e passa-la para `FixedHeaderView` e `BannerView`.

### 8. `FixedHeaderView.tsx` -- Receber gradientConfig via prop

```text
// ANTES: Lia do section.settings.gradient_overlay
const gradientConfig = resolveGradientConfig(settings.gradient_overlay);

// DEPOIS: Recebe via prop (fallback para section settings para backwards compat)
const gradientConfig = resolveGradientConfig(
  gradientConfigProp ?? settings.gradient_overlay
);
```

### 9. `BannerView.tsx` -- Receber gradientConfig via prop

Mesma abordagem: recebe `gradientConfig` como prop, com fallback para `settings.gradient_overlay`.

### 10. `CourseHome.tsx` -- Ler gradient de membersAreaSettings

```text
// ANTES: Procurava no header section
const contentStyle = useMemo(() => {
  const headerSection = sections.find(s => s.type === 'fixed_header');
  if (!headerSection) return undefined;
  const headerSettings = headerSection.settings as unknown as FixedHeaderSettings;
  const gradientConfig = resolveGradientConfig(headerSettings.gradient_overlay);
  return buildGradientContentStyle(gradientConfig);
}, [sections]);

// DEPOIS: Le diretamente das settings globais
const contentStyle = useMemo(() => {
  const gradientConfig = resolveGradientConfig(membersAreaSettings.gradient_overlay);
  return buildGradientContentStyle(gradientConfig);
}, [membersAreaSettings.gradient_overlay]);
```

Tambem propagar `gradientConfig` para `BuyerFixedHeaderSection` e `BuyerBannerSection`.

### 11. `BuyerFixedHeaderSection.tsx` -- Receber gradientConfig via prop

Adicionar prop `gradientConfig?: GradientOverlayConfig` e usa-la no lugar de `settings.gradient_overlay`.

### 12. `BuyerBannerSection.tsx` -- Receber gradientConfig via prop

Mesma abordagem.

### 13. `builderMachine.actors.ts` -- Remover gradient_overlay do default sections

Na funcao `generateDefaultSections`, o `gradient_overlay` no `fixedHeaderSettings` se torna desnecessario (pois agora e global). Manter para backwards compatibility mas sem impacto funcional.

## Arvore de Arquivos Afetados

```text
src/modules/members-area-builder/
  types/
    settings.types.ts                          <-- EDITAR (adicionar gradient_overlay ao global)
    defaults.ts                                <-- EDITAR (adicionar default ao global)
  components/
    sidebar/
      GlobalSettingsPanel.tsx                   <-- EDITAR (adicionar controles de gradiente)
    sections/
      SectionView.tsx                          <-- EDITAR (adicionar prop gradientConfig)
      FixedHeader/
        FixedHeaderEditor.tsx                  <-- EDITAR (remover controles de gradiente)
        FixedHeaderView.tsx                    <-- EDITAR (receber gradientConfig via prop)
      Banner/
        BannerEditor.tsx                       <-- EDITAR (remover controles de gradiente)
        BannerView.tsx                         <-- EDITAR (receber gradientConfig via prop)
    canvas/
      BuilderCanvas.tsx                        <-- EDITAR (ler gradient de settings)

src/modules/members-area/pages/buyer/
  CourseHome.tsx                               <-- EDITAR (ler gradient de membersAreaSettings)
  components/sections/
    BuyerFixedHeaderSection.tsx                <-- EDITAR (receber gradientConfig via prop)
    BuyerBannerSection.tsx                     <-- EDITAR (receber gradientConfig via prop)
```

## Backwards Compatibility

Dados ja salvos no banco terao `gradient_overlay` nas secoes individuais. O sistema usa `resolveGradientConfig()` com fallback para defaults, entao dados antigos continuarao funcionando. A prop `gradientConfig` nas Views tem fallback para `settings.gradient_overlay`, garantindo que dados legados nao quebrem.

## Comportamento Resultante

| Onde configurar | GlobalSettingsPanel (aba Global) |
|----------------|----------------------------------|
| Onde aparece | Header + Banner + Conteudo + Modulos -- TUDO |
| SSOT | `MembersAreaBuilderSettings.gradient_overlay` |
| Consistencia | 100% -- um unico controle, um unico resultado |
| Backwards compat | Dados antigos com gradient no section continuam funcionando |
