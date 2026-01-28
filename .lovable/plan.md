
# Plano: Reorganizar UI de "Tamanho do Título" no Builder

## RISE Protocol V3 - Seção 4: LEI SUPREMA

---

## Diagnóstico dos Problemas

| Problema | Localização | Status |
|----------|-------------|--------|
| "Tamanho do Título" mal posicionado | `ModulesEditor.tsx` linha 160-181 | Fora de contexto lógico |
| Texto "estilo Paramount+" | `ModulesEditor.tsx` linha 175 | Ruído visual |
| Campos de título separados | `SectionEditor.tsx` + `ModulesEditor.tsx` | Confuso para usuário |

**Problema de UX:** O usuário edita "Título da Seção" em um lugar e "Tamanho do Título" em outro (rolando para baixo). Ambos editam a mesma coisa (o título), logo devem estar juntos.

---

## Análise de Soluções

### Solução A: Mover campo para SectionEditor com lógica condicional
- Manutenibilidade: 10/10 (campos agrupados logicamente)
- Zero DT: 10/10 (remoção completa do código redundante)
- Arquitetura: 10/10 (Single Responsibility - cada editor com seu escopo)
- Escalabilidade: 10/10 (padrão replicável para outros tipos)
- Segurança: 10/10 (sem impacto)
- **NOTA FINAL: 10.0/10**
- Tempo estimado: 20 minutos

### Solução B: Apenas reordenar dentro de ModulesEditor
- Manutenibilidade: 5/10 (campo ainda separado do título)
- Zero DT: 3/10 (não resolve problema de UX)
- Arquitetura: 4/10 (lógica de título em dois lugares)
- Escalabilidade: 5/10 (outros tipos de seção não teriam)
- Segurança: 10/10 (sem impacto)
- **NOTA FINAL: 5.4/10**
- Tempo estimado: 5 minutos

### DECISÃO: Solução A (10.0/10)
O campo "Tamanho do Título" deve estar junto com "Título da Seção" pois editam a mesma propriedade visual.

---

## Alterações Necessárias

### Parte 1: Atualizar `SectionEditor.tsx`

Adicionar controle de tamanho do título logo após o input "Título da Seção" (apenas para seções tipo 'modules'):

```typescript
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ModulesSettings } from '../../types/builder.types';

// Dentro do bloco "Common Settings - Only for non-banner sections"
// APÓS o input "Título da Seção", ANTES de "Seção Ativa":

{/* Title Size - Only for modules sections */}
{section.type === 'modules' && (
  <div className="space-y-2">
    <Label>Tamanho do Título</Label>
    <Select
      value={(section.settings as ModulesSettings).title_size || 'medium'}
      onValueChange={(value: 'small' | 'medium' | 'large') => 
        onUpdateSettings({ title_size: value })
      }
    >
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="small">Pequeno</SelectItem>
        <SelectItem value="medium">Médio</SelectItem>
        <SelectItem value="large">Grande</SelectItem>
      </SelectContent>
    </Select>
  </div>
)}
```

### Parte 2: Remover de `ModulesEditor.tsx`

Remover completamente o bloco "Title Size Control" (linhas 160-181) para evitar duplicação.

---

## Estrutura UI Antes vs Depois

### ANTES (Confuso)
```text
┌─────────────────────────────────────────┐
│ MÓDULOS                                 │
├─────────────────────────────────────────┤
│ Título da Seção                         │ ← Edita título
│ [Recomendados________________]          │
│                                         │
│ Seção Ativa                      [ON]   │
├─────────────────────────────────────────┤
│ Configurações Específicas               │
│ ─────────────────────────────           │
│ Curso: [Todos os cursos ▾]              │
│ Tamanho dos Cards: [Médio ▾]            │
│ Tamanho do Título da Seção: [Médio ▾]   │ ← LONGE do título!
│ Exibir Título do Módulo: [Sempre ▾]     │
│ ...                                     │
└─────────────────────────────────────────┘
```

### DEPOIS (Intuitivo)
```text
┌─────────────────────────────────────────┐
│ MÓDULOS                                 │
├─────────────────────────────────────────┤
│ Título da Seção                         │ ← Edita título
│ [Recomendados________________]          │
│                                         │
│ Tamanho do Título                       │ ← JUNTO do título!
│ [Grande ▾]                              │
│                                         │
│ Seção Ativa                      [ON]   │
├─────────────────────────────────────────┤
│ Configurações Específicas               │
│ ─────────────────────────────           │
│ Curso: [Todos os cursos ▾]              │
│ Tamanho dos Cards: [Médio ▾]            │
│ Exibir Título do Módulo: [Sempre ▾]     │
│ ...                                     │
└─────────────────────────────────────────┘
```

---

## Resumo de Arquivos a Alterar

| Arquivo | Alteração |
|---------|-----------|
| `SectionEditor.tsx` | Adicionar Select "Tamanho do Título" após input de título (só para modules) |
| `ModulesEditor.tsx` | Remover bloco "Title Size Control" (linhas 160-181) |

---

## Fluxo de Dados (Inalterado)

```text
SectionEditor.tsx
    │ onUpdateSettings({ title_size: value })
    ▼
builderMachine
    │ UPDATE_SECTION_SETTINGS
    ▼
section.settings.title_size = 'large'
    │
    ├──► ModulesView.tsx (Builder Preview)
    │    getTitleSizeClass(settings.title_size, isMobile)
    │
    └──► CourseHome.tsx → ModuleCarousel.tsx (Área Real)
         getTitleSizeClass(titleSize, isMobile)
```

---

## Conformidade RISE V3

| Critério | Status |
|----------|--------|
| LEI SUPREMA (4.1) | Escolhemos nota 10.0 |
| Manutenibilidade Infinita | Campos agrupados por contexto |
| Zero Dívida Técnica | Remoção de código duplicado |
| Arquitetura Correta | Single Responsibility |
| Escalabilidade | Padrão para futuros tipos de seção |

**NOTA FINAL: 10.0/10**
