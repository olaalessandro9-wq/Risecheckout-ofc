

# Plano: Seção "Fixed Header" (Estilo Cakto)

## Resumo Executivo

Implementar uma nova seção **Fixed Header** que combina:
- Imagem de fundo (como um banner)
- Título customizável
- Contador automático de módulos ("X módulos")

Esta seção será **fixa no topo**, não pode ser movida, deletada ou duplicada. Todas as outras seções existirão **abaixo** dela.

---

## Análise de Soluções (RISE V3 - Seção 4.4)

### Solução A: Reutilizar Banner e adicionar campos
- Manutenibilidade: 3/10 (mistura responsabilidades)
- Zero DT: 2/10 (banner não deveria ter lógica de contagem de módulos)
- Arquitetura: 2/10 (viola Single Responsibility Principle)
- Escalabilidade: 3/10 (acopla visual ao banner)
- Segurança: 10/10
- **NOTA FINAL: 4.0/10**

### Solução B: Nova seção "fixed_header" com tratamento especial no BuilderCanvas
- Manutenibilidade: 10/10 (componente isolado, single purpose)
- Zero DT: 10/10 (lógica própria, sem gambiarras)
- Arquitetura: 10/10 (segue Registry Pattern existente + novo conceito de seção fixa)
- Escalabilidade: 10/10 (extensível para futuros campos)
- Segurança: 10/10
- **NOTA FINAL: 10.0/10**

### DECISÃO: Solução B (10.0/10)

Criar uma nova seção `fixed_header` com propriedades especiais no Registry:
- `canDelete: false`
- `canDuplicate: false`
- `canMove: false` (nova propriedade)
- `isRequired: true`
- `maxInstances: 1`

---

## Arquitetura da Seção

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│                       FIXED HEADER (sempre no topo)                          │
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                    [Imagem de Fundo]                                   │  │
│  │                                                                        │  │
│  │    ┌──────────────────────────────────────┐                           │  │
│  │    │  RatoFlix - Tenha acesso a tudo      │ ← Título customizável     │  │
│  │    │  ┌─────────┐                         │                            │  │
│  │    │  │6 módulos│ ← Badge automático      │                            │  │
│  │    │  └─────────┘                         │                            │  │
│  │    └──────────────────────────────────────┘                           │  │
│  │                                                                        │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────────────┐
│                     SEÇÕES ADICIONÁVEIS (abaixo da header)                   │
│  - Banners                                                                   │
│  - Módulos                                                                   │
│  - Texto                                                                     │
│  - Espaçador                                                                 │
│  - etc.                                                                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Implementação Técnica

### 1. Novos Tipos em `builder.types.ts`

```typescript
// Nova interface para Fixed Header
export interface FixedHeaderSettings {
  type: 'fixed_header';
  bg_image_url: string;
  title: string;
  show_module_count: boolean;
  alignment: 'left' | 'center';
  size: 'small' | 'medium' | 'large';
  gradient_overlay?: GradientOverlayConfig;
}

// Atualizar SectionType union
export type SectionType = 
  | 'fixed_header'  // NEW - sempre primeiro
  | 'banner' 
  | 'modules' 
  | 'courses' 
  | 'continue_watching' 
  | 'text' 
  | 'spacer';

// Atualizar SectionSettings union
export type SectionSettings = 
  | FixedHeaderSettings  // NEW
  | BannerSettings 
  | ModulesSettings 
  | CoursesSettings 
  | ContinueWatchingSettings
  | TextSettings
  | SpacerSettings;

// Defaults
export const DEFAULT_FIXED_HEADER_SETTINGS: Omit<FixedHeaderSettings, 'type'> = {
  bg_image_url: '',
  title: '',
  show_module_count: true,
  alignment: 'left',
  size: 'large',
  gradient_overlay: DEFAULT_GRADIENT_OVERLAY,
};
```

### 2. Atualizar `SectionConfig` Interface

Adicionar nova propriedade `canMove`:

```typescript
export interface SectionConfig<T extends SectionSettings = SectionSettings> {
  type: SectionType;
  label: string;
  description: string;
  icon: string;
  maxInstances: number;
  isRequired: boolean;
  canDuplicate: boolean;
  canMove: boolean;  // NEW - se false, não mostra botões de mover
  defaults: Omit<T, 'type'>;
}
```

### 3. Registrar no `registry.ts`

```typescript
const FixedHeaderConfig: SectionConfig<FixedHeaderSettings> = {
  type: 'fixed_header',
  label: 'Header',
  description: 'Cabeçalho fixo com imagem, título e contador de módulos',
  icon: 'LayoutDashboard',
  maxInstances: 1,
  isRequired: true,
  canDuplicate: false,
  canMove: false,  // Não pode ser movida
  defaults: FIXED_HEADER_DEFAULTS,
};

export const SectionRegistry: Record<SectionType, SectionConfig> = {
  fixed_header: FixedHeaderConfig,  // Primeiro no registro
  banner: BannerConfig,
  modules: ModulesConfig,
  // ...
};

// Nova helper function
export function canMoveSection(type: SectionType): boolean {
  return SectionRegistry[type].canMove;
}
```

### 4. Atualizar `SectionWrapper.tsx`

Adicionar lógica para `canMove`:

```typescript
const canMove = canMoveSection(section.type);

// Esconder botões de mover se canMove === false
{canMove && (
  <div className="flex flex-col gap-0.5 bg-background border rounded-md shadow-sm p-0.5">
    <Button ... onClick={handleMoveUp} disabled={isFirst}>
      <ChevronUp />
    </Button>
    <Button ... onClick={handleMoveDown} disabled={isLast}>
      <ChevronDown />
    </Button>
  </div>
)}
```

### 5. Atualizar `BuilderCanvas.tsx`

Separar lógica para Fixed Header vs. seções normais:

```typescript
// Encontrar fixed_header (se existir)
const fixedHeader = sections.find(s => s.type === 'fixed_header');
const regularSections = sections.filter(s => s.type !== 'fixed_header');

return (
  <div>
    {/* Fixed Header - sempre no topo, sem drag controls */}
    {fixedHeader && (
      <FixedHeaderWrapper section={fixedHeader} ...>
        <FixedHeaderView section={fixedHeader} />
      </FixedHeaderWrapper>
    )}
    
    {/* Regular Sections - podem ser reordenadas */}
    {regularSections.map((section, index) => (
      <SectionWrapper ...>
        <SectionView section={section} />
      </SectionWrapper>
    ))}
    
    {/* Add Section Button */}
    <AddSectionButton />
  </div>
);
```

### 6. Criar Componentes do Builder

**`src/modules/members-area-builder/components/sections/FixedHeader/FixedHeaderView.tsx`**

Renderiza no canvas do builder:
- Imagem de fundo com altura configurável
- Gradiente overlay (Netflix-style)
- Título (ou fallback para nome do produto)
- Badge "X módulos"

**`src/modules/members-area-builder/components/sections/FixedHeader/FixedHeaderEditor.tsx`**

Painel de edição:
- Upload de imagem de fundo
- Input para título
- Switch para mostrar/ocultar contador
- Select para alinhamento (esquerda/centro)
- Select para tamanho (pequeno/médio/grande)
- Configurações de gradiente (reaproveitando a lógica do Banner)

**`src/modules/members-area-builder/components/sections/FixedHeader/FixedHeaderImageUpload.tsx`**

Componente de upload (similar ao BannerSlideUpload).

### 7. Criar Componente para Área do Aluno

**`src/modules/members-area/pages/buyer/components/sections/BuyerFixedHeaderSection.tsx`**

Renderização final para o aluno:
- Recebe `settings` e `moduleCount`
- Responsivo (mobile e desktop)
- Altura configurável (small/medium/large com vh + min/max)

### 8. Atualizar Auto-Inicialização

Em `builderMachine.actors.ts`, a função `generateDefaultSections` deve:

1. Criar `fixed_header` como position 0
2. Criar `modules` como position 1
3. Não criar mais banner por padrão (a header substitui)

```typescript
function generateDefaultSections(
  productId: string,
  productImageUrl: string | null,
  modules: MemberModule[],
  viewport: Viewport
): Section[] {
  const sections: Section[] = [];
  const now = new Date().toISOString();
  
  // 1. Fixed Header (obrigatória)
  const headerSettings: FixedHeaderSettings = {
    type: 'fixed_header',
    bg_image_url: productImageUrl || '',
    title: '', // Será preenchido pelo nome do produto no frontend
    show_module_count: true,
    alignment: 'left',
    size: 'large',
    gradient_overlay: DEFAULT_GRADIENT_OVERLAY,
  };
  
  sections.push({
    id: `temp_${crypto.randomUUID()}`,
    product_id: productId,
    type: 'fixed_header',
    viewport,
    title: null,
    position: 0,
    settings: headerSettings,
    is_active: true,
    created_at: now,
    updated_at: now,
  });
  
  // 2. Modules section
  if (modules.length > 0) {
    // ... mesmo código existente, mas com position: 1
  }
  
  return sections;
}
```

### 9. Integrar em `CourseHome.tsx`

```typescript
{sections.map((section) => {
  if (section.type === 'fixed_header') {
    const headerSettings = section.settings as FixedHeaderSettings;
    
    return (
      <BuyerFixedHeaderSection
        key={section.id}
        settings={headerSettings}
        moduleCount={modules.length}
        productName={product?.name}
      />
    );
  }
  
  if (section.type === 'banner') {
    // ... código existente
  }
  
  // ... outros tipos
})}
```

---

## Arquivos a Criar

| Arquivo | Descrição |
|---------|-----------|
| `FixedHeader/FixedHeaderView.tsx` | Visualização no builder canvas |
| `FixedHeader/FixedHeaderEditor.tsx` | Painel de edição lateral |
| `FixedHeader/FixedHeaderImageUpload.tsx` | Componente de upload |
| `FixedHeader/index.ts` | Barrel export |
| `BuyerFixedHeaderSection.tsx` | Renderização na área do aluno |

## Arquivos a Modificar

| Arquivo | Modificação |
|---------|-------------|
| `builder.types.ts` | Adicionar `FixedHeaderSettings`, atualizar unions, adicionar `canMove` |
| `registry.ts` | Registrar `fixed_header`, adicionar `canMoveSection()` |
| `SectionWrapper.tsx` | Respeitar `canMove` para esconder botões |
| `SectionView.tsx` | Adicionar case para `fixed_header` |
| `SectionEditor.tsx` | Adicionar case para editar `fixed_header` |
| `BuilderCanvas.tsx` | Separar renderização de fixed_header vs. regulares |
| `builderMachine.actors.ts` | Atualizar auto-inicialização |
| `CourseHome.tsx` | Adicionar renderização para `fixed_header` |

---

## Migração de Dados Existentes

Para produtos que já possuem banner na position 0:
- O sistema continua funcionando normalmente
- O produtor pode adicionar manualmente a Fixed Header se desejar
- Novos produtos receberão Fixed Header por padrão

---

## Conformidade RISE V3

| Critério | Nota | Justificativa |
|----------|------|---------------|
| LEI SUPREMA (4.1) | 10/10 | Componente dedicado com Registry Pattern |
| Manutenibilidade Infinita | 10/10 | Isolado, single purpose, extensível |
| Zero Dívida Técnica | 10/10 | Segue arquitetura existente |
| Arquitetura Correta | 10/10 | Registry Pattern + SRP + nova propriedade `canMove` |
| Escalabilidade | 10/10 | Fácil adicionar novos campos à header |

**NOTA FINAL: 10.0/10**

