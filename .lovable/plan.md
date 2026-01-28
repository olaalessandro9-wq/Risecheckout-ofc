
# Plano: Tamanho Configurável do Título da Seção

## RISE Protocol V3 - Seção 4: LEI SUPREMA

---

## Análise de Soluções

### Solução A: Adicionar `title_size` em ModulesSettings com SSOT
- Manutenibilidade: 10/10 (configuração centralizada)
- Zero DT: 10/10 (resolve na raiz)
- Arquitetura: 10/10 (SSOT compartilhado entre Builder e Área Real)
- Escalabilidade: 10/10 (suporta tamanhos customizados futuros)
- Segurança: 10/10 (sem impacto)
- **NOTA FINAL: 10.0/10**
- Tempo estimado: 1 hora

### Solução B: CSS direto com classes hardcoded
- Manutenibilidade: 4/10 (não configurável pelo produtor)
- Zero DT: 3/10 (tamanho fixo)
- Arquitetura: 3/10 (sem controle)
- Escalabilidade: 2/10 (mudança requer código)
- Segurança: 10/10 (sem impacto)
- **NOTA FINAL: 4.4/10**
- Tempo estimado: 10 minutos

### DECISÃO: Solução A (10.0/10)

---

## Análise de Referências

### Paramount+
| Seção | Tamanho Título | Estilo |
|-------|---------------|--------|
| "Lançamentos no Paramount+" | Grande (~24px) | Bold, Uppercase |
| "Populares no Paramount+" | Grande (~24px) | Bold, Uppercase |
| "Diretamente dos palcos" | Grande (~24px) | Bold, Normal case |

### Netflix / Disney+
- Títulos grandes (~20-24px)
- Peso: Semibold/Bold
- Espaçamento: tracking normal

### Tamanhos Propostos (baseado em tendências)

| title_size | Desktop | Mobile | Classes Tailwind |
|------------|---------|--------|------------------|
| small | 16px | 14px | `text-base md:text-base` |
| medium | 20px | 18px | `text-lg md:text-xl` |
| large | 28px | 22px | `text-xl md:text-2xl` |

---

## Alterações Necessárias

### Parte 1: Adicionar `title_size` em builder.types.ts

```typescript
export interface ModulesSettings {
  type: 'modules';
  course_id: string | null;
  show_title: 'always' | 'hover' | 'never';
  show_progress: boolean;
  module_order?: string[];
  hidden_module_ids?: string[];
  card_size: 'small' | 'medium' | 'large';
  // NOVO: Tamanho do título da seção
  title_size: 'small' | 'medium' | 'large';
}

export const DEFAULT_MODULES_SETTINGS: Omit<ModulesSettings, 'type'> = {
  course_id: null,
  show_title: 'always',
  show_progress: true,
  module_order: [],
  hidden_module_ids: [],
  card_size: 'medium',
  title_size: 'medium', // Default
};
```

### Parte 2: Criar SSOT para Title Sizes (constants/titleSizes.ts)

```typescript
/**
 * Title Size Constants - SSOT for section title sizes
 * Used by both Builder preview and Live Members Area
 */

export type TitleSize = 'small' | 'medium' | 'large';

export const TITLE_SIZE_MAP = {
  small: {
    desktop: 'text-base font-semibold',
    mobile: 'text-sm font-semibold',
  },
  medium: {
    desktop: 'text-xl font-semibold',
    mobile: 'text-lg font-semibold',
  },
  large: {
    desktop: 'text-2xl font-bold',
    mobile: 'text-xl font-bold',
  },
} as const;

export function getTitleSizeClass(size: TitleSize | undefined, isMobile: boolean): string {
  const titleSize = size || 'medium';
  return TITLE_SIZE_MAP[titleSize][isMobile ? 'mobile' : 'desktop'];
}
```

### Parte 3: Adicionar UI no ModulesEditor.tsx

```typescript
{/* Title Size Control - NOVO */}
<div className="space-y-2">
  <Label>Tamanho do Título da Seção</Label>
  <Select
    value={settings.title_size || 'medium'}
    onValueChange={(value: 'small' | 'medium' | 'large') => 
      onUpdate({ title_size: value })
    }
  >
    <SelectTrigger>
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="small">Pequeno</SelectItem>
      <SelectItem value="medium">Médio</SelectItem>
      <SelectItem value="large">Grande (estilo Paramount+)</SelectItem>
    </SelectContent>
  </Select>
  <p className="text-xs text-muted-foreground">
    Define o tamanho do título como "Recomendados"
  </p>
</div>
```

### Parte 4: Aplicar no Builder Preview (ModulesView.tsx)

```typescript
import { getTitleSizeClass } from '../../../constants/titleSizes';

// No render do título
{section.title && (
  <h2 className={cn(
    getTitleSizeClass(settings.title_size, viewMode === 'mobile'),
    'mb-3 px-4',
    theme === 'dark' ? 'text-white' : 'text-foreground'
  )}>
    {section.title}
  </h2>
)}
```

### Parte 5: Aplicar na Área Real (ModuleCarousel.tsx)

```typescript
import { getTitleSizeClass } from "@/modules/members-area-builder/constants/titleSizes";
import { useIsMobile } from "@/hooks/use-mobile";

interface ModuleCarouselProps {
  modules: Module[];
  onSelectContent: (content: ContentItem, module: Module) => void;
  title?: string | null;
  cardSize?: CardSize;
  titleSize?: 'small' | 'medium' | 'large'; // NOVO
}

// No componente
const isMobile = useIsMobile();

// No render do título
<h2 className={cn(
  getTitleSizeClass(titleSize, isMobile),
  'text-foreground'
)}>
  {title || "Módulos"}
</h2>
```

### Parte 6: Passar titleSize em CourseHome.tsx

```typescript
// No render da seção modules
const titleSize = sectionSettings.title_size || 'medium';

return (
  <ModuleCarousel
    key={section.id}
    modules={visibleModules}
    onSelectContent={handleSelectContent}
    title={section.title}
    cardSize={cardSize}
    titleSize={titleSize} // NOVO
  />
);
```

---

## Resumo de Arquivos a Alterar

| Arquivo | Alteração |
|---------|-----------|
| `constants/titleSizes.ts` | **CRIAR** - SSOT para tamanhos de título |
| `builder.types.ts` | Adicionar `title_size: 'small' \| 'medium' \| 'large'` |
| `ModulesEditor.tsx` | Adicionar Select "Tamanho do Título" |
| `ModulesView.tsx` (Builder) | Usar `getTitleSizeClass()` |
| `ModuleCarousel.tsx` (Área Real) | Adicionar prop `titleSize` e aplicar |
| `CourseHome.tsx` | Passar `titleSize` para ModuleCarousel |

---

## Fluxo Visual

```text
┌─────────────────────────────────────────────────────────────┐
│                    BUILDER (Produtor)                        │
│                                                              │
│   Título da Seção: [Recomendados]                           │
│   Tamanho do Título: [Grande ▾]                             │
│                                                              │
│   Preview:                                                   │
│   ┌────────────────────────────────────────┐                │
│   │ RECOMENDADOS  ← text-2xl font-bold     │                │
│   │ ┌───┐ ┌───┐ ┌───┐ ┌───┐               │                │
│   │ │   │ │   │ │   │ │   │               │                │
│   │ └───┘ └───┘ └───┘ └───┘               │                │
│   └────────────────────────────────────────┘                │
│                                                              │
└────────────────────────┬────────────────────────────────────┘
                         │ SAVE
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              ÁREA DE MEMBROS (Aluno)                         │
│                                                              │
│   RECOMENDADOS  ← Mesmo tamanho do Preview                  │
│   ┌───────┐ ┌───────┐ ┌───────┐                            │
│   │       │ │       │ │       │                            │
│   │       │ │       │ │       │                            │
│   └───────┘ └───────┘ └───────┘                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Comparação Visual de Tamanhos

```text
Pequeno (small):
  Recomendados    ← 16px, font-semibold

Médio (medium):  
  Recomendados    ← 20px, font-semibold

Grande (large) - Estilo Paramount+:
  RECOMENDADOS    ← 28px, font-bold
```

---

## Validação Pós-Implementação

| Verificação | Resultado Esperado |
|-------------|-------------------|
| Editor tem "Tamanho do Título" | Sim - Small/Medium/Large |
| Preview title_size=large | Título 28px bold |
| Área Real title_size=large | Título 28px bold (IGUAL preview) |
| Mobile title_size=large | Título 22px bold |
| Default | Medium (20px) |

---

## Conformidade RISE V3

| Critério | Status |
|----------|--------|
| LEI SUPREMA (4.1) | Escolhemos nota 10.0, não 4.4 |
| Manutenibilidade Infinita | SSOT em titleSizes.ts |
| Zero Dívida Técnica | Configurável pelo produtor |
| Arquitetura Correta | Consistência Builder ↔ Área Real |
| Escalabilidade | Novos tamanhos = apenas alterar mapeamento |

**NOTA FINAL: 10.0/10** - Adição de feature seguindo RISE Protocol V3.
