
# Plano: Modularização do `builder.types.ts` (348 → ~290 linhas distribuídas)

## Diagnóstico Atual

**Violação Identificada:** O arquivo `src/modules/members-area-builder/types/builder.types.ts` possui **348 linhas**, ultrapassando o limite de **300 linhas** do RISE ARCHITECT PROTOCOL V3 (Seção 6.4).

### Estrutura Atual do Arquivo (348 linhas)

| Bloco | Linhas | Descrição |
|-------|--------|-----------|
| Viewport Types | 17-17 | 1 linha útil |
| Section Types | 22-43 | ~22 linhas (SectionType, Section) |
| Section Settings | 45-135 | ~90 linhas (todas as interfaces de settings) |
| Gradient Overlay | 79-91 | ~13 linhas (incluso acima) |
| Global Settings | 137-174 | ~38 linhas (MenuItemConfig, MembersAreaBuilderSettings) |
| Builder State | 176-247 | ~72 linhas (BuilderState, BuilderActions) |
| Section Registry | 249-263 | ~15 linhas (SectionConfig) |
| **Defaults** | **265-348** | **~84 linhas** (todos os DEFAULT_*) |

---

## Análise de Soluções (RISE V3 - Seção 4.4)

### Solução A: Extrair Apenas Defaults
- **Manutenibilidade:** 7/10 (melhora, mas tipos ainda misturados)
- **Zero DT:** 7/10 (resolve o limite de linhas)
- **Arquitetura:** 6/10 (tipos e constantes ainda no mesmo domínio)
- **Escalabilidade:** 7/10 (razoável)
- **Segurança:** 10/10
- **NOTA FINAL: 7.4/10**
- **Tempo estimado:** 30 minutos

### Solução B: Modularização por Domínio Semântico
- **Manutenibilidade:** 10/10 (cada arquivo tem responsabilidade única)
- **Zero DT:** 10/10 (estrutura escalável)
- **Arquitetura:** 10/10 (Clean Architecture - separação por domínio)
- **Escalabilidade:** 10/10 (fácil adicionar novos tipos de seção)
- **Segurança:** 10/10
- **NOTA FINAL: 10.0/10**
- **Tempo estimado:** 1 hora

### DECISÃO: Solução B (10.0/10)

Modularização completa por domínio semântico, criando arquivos especializados.

---

## Arquitetura da Solução

```text
ANTES (Atual)
src/modules/members-area-builder/types/
└── builder.types.ts (348 linhas) ← VIOLAÇÃO

DEPOIS (Modularizado)
src/modules/members-area-builder/types/
├── index.ts (~40 linhas)           ← Re-exports públicos
├── viewport.types.ts (~15 linhas)  ← Viewport, ViewMode
├── section.types.ts (~50 linhas)   ← Section, SectionType
├── settings.types.ts (~95 linhas)  ← Todas as *Settings interfaces
├── builder-state.types.ts (~75 linhas) ← BuilderState, BuilderActions
├── registry.types.ts (~20 linhas)  ← SectionConfig
└── defaults.ts (~90 linhas)        ← Todos os DEFAULT_*
```

---

## Detalhamento dos Novos Arquivos

### 1. `viewport.types.ts` (~15 linhas)
```typescript
// Tipos de viewport para o sistema dual-layout
export type Viewport = 'desktop' | 'mobile';
export type ViewMode = 'desktop' | 'mobile';
```

### 2. `section.types.ts` (~50 linhas)
```typescript
// Tipo discriminante e interface Section
import type { Viewport } from './viewport.types';
import type { SectionSettings } from './settings.types';

export type SectionType = 
  | 'fixed_header'
  | 'banner' 
  | 'modules' 
  | 'courses' 
  | 'continue_watching' 
  | 'text' 
  | 'spacer';

export interface Section {
  id: string;
  product_id: string;
  type: SectionType;
  viewport: Viewport;
  title: string | null;
  position: number;
  settings: SectionSettings;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
```

### 3. `settings.types.ts` (~95 linhas)
```typescript
// Todas as interfaces de configurações de seções
export type GradientDirection = 'bottom' | 'top' | 'left' | 'right';

export interface GradientOverlayConfig { ... }
export interface FixedHeaderSettings { ... }
export interface BannerSlide { ... }
export interface BannerSettings { ... }
export interface ModulesSettings { ... }
export interface CoursesSettings { ... }
export interface ContinueWatchingSettings { ... }
export interface TextSettings { ... }
export interface SpacerSettings { ... }

// Discriminated Union
export type SectionSettings = 
  | FixedHeaderSettings
  | BannerSettings
  | ModulesSettings
  | CoursesSettings
  | ContinueWatchingSettings
  | TextSettings
  | SpacerSettings;

// Global Settings
export interface MenuItemConfig { ... }
export interface MembersAreaBuilderSettings { ... }
```

### 4. `builder-state.types.ts` (~75 linhas)
```typescript
// Estado e Ações do Builder
import type { Section } from './section.types';
import type { SectionType } from './section.types';
import type { Viewport, ViewMode } from './viewport.types';
import type { SectionSettings, MembersAreaBuilderSettings } from './settings.types';
import type { MemberModule } from '@/modules/members-area/types/module.types';

export interface BuilderState { ... }
export interface BuilderActions { ... }
```

### 5. `registry.types.ts` (~20 linhas)
```typescript
// Configuração do Registry de Seções
import type { SectionType } from './section.types';
import type { SectionSettings } from './settings.types';

export interface SectionConfig<T extends SectionSettings = SectionSettings> {
  type: SectionType;
  label: string;
  description: string;
  icon: string;
  maxInstances: number;
  isRequired: boolean;
  canDuplicate: boolean;
  canMove: boolean;
  defaults: Omit<T, 'type'>;
}
```

### 6. `defaults.ts` (~90 linhas)
```typescript
// Valores padrão para todas as configurações
import type { 
  GradientOverlayConfig,
  FixedHeaderSettings,
  BannerSettings,
  ModulesSettings,
  CoursesSettings,
  ContinueWatchingSettings,
  TextSettings,
  SpacerSettings,
  MenuItemConfig,
  MembersAreaBuilderSettings,
} from './settings.types';

export const DEFAULT_GRADIENT_OVERLAY: GradientOverlayConfig = { ... };
export const DEFAULT_FIXED_HEADER_SETTINGS: Omit<FixedHeaderSettings, 'type'> = { ... };
export const DEFAULT_BANNER_SETTINGS: Omit<BannerSettings, 'type'> = { ... };
export const DEFAULT_MODULES_SETTINGS: Omit<ModulesSettings, 'type'> = { ... };
export const DEFAULT_COURSES_SETTINGS: Omit<CoursesSettings, 'type'> = { ... };
export const DEFAULT_CONTINUE_WATCHING_SETTINGS: Omit<ContinueWatchingSettings, 'type'> = { ... };
export const DEFAULT_TEXT_SETTINGS: Omit<TextSettings, 'type'> = { ... };
export const DEFAULT_SPACER_SETTINGS: Omit<SpacerSettings, 'type'> = { ... };
export const DEFAULT_MENU_ITEMS: MenuItemConfig[] = [ ... ];
export const DEFAULT_BUILDER_SETTINGS: MembersAreaBuilderSettings = { ... };
```

### 7. `index.ts` (~40 linhas) - Barrel Export
```typescript
// Re-exports públicos mantendo API compatível
export type { Viewport, ViewMode } from './viewport.types';
export type { SectionType, Section } from './section.types';
export type {
  GradientDirection,
  GradientOverlayConfig,
  FixedHeaderSettings,
  BannerSlide,
  BannerSettings,
  ModulesSettings,
  CoursesSettings,
  ContinueWatchingSettings,
  TextSettings,
  SpacerSettings,
  SectionSettings,
  MenuItemConfig,
  MembersAreaBuilderSettings,
} from './settings.types';
export type { BuilderState, BuilderActions } from './builder-state.types';
export type { SectionConfig } from './registry.types';
export * from './defaults';

// Re-export from members-area module
export type { MemberModule } from '@/modules/members-area/types/module.types';
```

---

## Migração de Imports

### Impacto Zero (Barrel Export)

Todos os imports existentes continuarão funcionando sem alteração:

```typescript
// ANTES e DEPOIS - mesmo import funciona
import type { Section, SectionType, BuilderState } from '../types/builder.types';

// Mudará apenas para:
import type { Section, SectionType, BuilderState } from '../types';
```

---

## Arquivos a Criar/Modificar

| Arquivo | Ação | Linhas |
|---------|------|--------|
| `types/viewport.types.ts` | CRIAR | ~15 |
| `types/section.types.ts` | CRIAR | ~50 |
| `types/settings.types.ts` | CRIAR | ~95 |
| `types/builder-state.types.ts` | CRIAR | ~75 |
| `types/registry.types.ts` | CRIAR | ~20 |
| `types/defaults.ts` | CRIAR | ~90 |
| `types/index.ts` | CRIAR | ~40 |
| `types/builder.types.ts` | DELETAR | - |

**Total:** 7 arquivos novos, 1 arquivo deletado.
**Maior arquivo:** `settings.types.ts` com ~95 linhas (BEM abaixo do limite de 300).

---

## Conformidade RISE V3

| Critério | Nota | Justificativa |
|----------|------|---------------|
| LEI SUPREMA (4.1) | 10/10 | Modularização completa, não apenas extrair defaults |
| Manutenibilidade Infinita | 10/10 | Cada arquivo tem responsabilidade única |
| Zero Dívida Técnica | 10/10 | Todos os arquivos < 100 linhas |
| Arquitetura Correta | 10/10 | Clean Architecture - separação por domínio |
| Escalabilidade | 10/10 | Fácil adicionar novos tipos de seção |
| Segurança | 10/10 | Não altera comportamento |

**NOTA FINAL: 10.0/10**

---

## Benefícios

1. **Limite de 300 linhas respeitado** - Maior arquivo terá ~95 linhas
2. **Single Responsibility** - Cada arquivo tem um propósito claro
3. **Melhor navegação** - Fácil encontrar tipos específicos
4. **Escalabilidade** - Adicionar novos tipos de seção é trivial
5. **API compatível** - Barrel export mantém imports existentes funcionando
