
# Plano: Remoção dos Controles Não Funcionais (Eye, Copy, Trash)

## Diagnóstico

### Problema Identificado
No `SectionWrapper.tsx`, existe um bloco de controles (linhas 190-251) que contém:
- **Eye/EyeOff** - Toggle de visibilidade (`onToggleActive`)
- **Copy** - Duplicar seção (`onDuplicate`)
- **Trash2/Lock** - Excluir seção (`onDelete`)

Esses controles estão **visíveis** mas **não funcionam corretamente** para a Header (passam funções vazias `() => {}`).

### Localização do Código
```
src/modules/members-area-builder/components/canvas/SectionWrapper.tsx
Linhas 190-251: Bloco com os 3 botões problemáticos
```

---

## Análise de Soluções (RISE V3 - Seção 4.4)

### Solução A: Remover Completamente os 3 Controles
- Manutenibilidade: 10/10 (menos código, menos confusão)
- Zero DT: 10/10 (remove código que não funciona)
- Arquitetura: 10/10 (UI reflete funcionalidade real)
- Escalabilidade: 10/10 (se precisar no futuro, adiciona corretamente)
- Segurança: 10/10
- **NOTA FINAL: 10.0/10**
- Tempo estimado: 20 minutos

### Solução B: Corrigir os Handlers para Funcionarem
- Manutenibilidade: 8/10 (mais código para manter)
- Zero DT: 7/10 (funcionalidade extra pode não ser necessária)
- Arquitetura: 7/10 (adiciona complexidade)
- Escalabilidade: 8/10
- Segurança: 10/10
- **NOTA FINAL: 8.0/10**
- Tempo estimado: 1 hora

### Solução C: Esconder os Botões Apenas para Header
- Manutenibilidade: 6/10 (lógica condicional extra)
- Zero DT: 5/10 (código morto ainda existe)
- Arquitetura: 5/10 (solução parcial)
- Escalabilidade: 6/10
- Segurança: 10/10
- **NOTA FINAL: 6.4/10**
- Tempo estimado: 15 minutos

### DECISÃO: Solução A (10.0/10)

Remover completamente os 3 controles (Eye, Copy, Trash). Se no futuro essas funcionalidades forem necessárias, serão implementadas corretamente.

---

## Implementação Técnica

### 1. `SectionWrapper.tsx` - Remover Bloco de Controles

**Código a Remover (linhas 190-251):**
```tsx
<div className="flex flex-col gap-0.5 bg-background border rounded-md shadow-sm p-0.5">
  <Tooltip>
    <TooltipTrigger asChild>
      <Button ... onClick={handleToggleActive}>
        {section.is_active ? <Eye /> : <EyeOff />}
      </Button>
    </TooltipTrigger>
    ...
  </Tooltip>
  
  <Tooltip>
    <TooltipTrigger asChild>
      <Button ... onClick={handleDuplicate}>
        <Copy />
      </Button>
    </TooltipTrigger>
    ...
  </Tooltip>
  
  <Tooltip>
    <TooltipTrigger asChild>
      <Button ... onClick={handleDelete}>
        <Trash2 /> ou <Lock />
      </Button>
    </TooltipTrigger>
    ...
  </Tooltip>
</div>
```

### 2. `SectionWrapper.tsx` - Remover Props Não Utilizadas

**Props a Remover da Interface:**
```typescript
onDuplicate: () => void;  // REMOVER
onDelete: () => void;     // REMOVER
onToggleActive: () => void; // REMOVER
```

### 3. `SectionWrapper.tsx` - Remover Handlers Não Utilizados

**Handlers a Remover:**
```typescript
const handleToggleActive = (e: React.MouseEvent) => { ... };  // REMOVER
const handleDuplicate = (e: React.MouseEvent) => { ... };      // REMOVER
const handleDelete = (e: React.MouseEvent) => { ... };         // REMOVER
```

### 4. `SectionWrapper.tsx` - Remover Imports Não Utilizados

**Imports a Remover:**
```typescript
import { Copy, Trash2, Eye, EyeOff } from 'lucide-react';  // REMOVER estes 4
import { canDeleteSection, canDuplicateSection } from '../../registry';  // REMOVER estes 2
```

### 5. `BuilderCanvas.tsx` - Remover Props Passadas

**Linhas a Modificar (Desktop e Mobile):**

Remover estas 3 props de TODAS as chamadas de `<SectionWrapper>`:
```tsx
onDuplicate={() => ...}
onDelete={() => ...}
onToggleActive={() => ...}
```

---

## Código Final do SectionWrapper

Após a limpeza, o arquivo ficará mais limpo:

```typescript
interface SectionWrapperProps {
  section: Section;
  isSelected: boolean;
  isFirst: boolean;
  isLast: boolean;
  isPreviewMode: boolean;
  onSelect: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  children: React.ReactNode;
}
```

Os controles laterais conterão apenas:
- **ChevronUp** - Mover para cima
- **ChevronDown** - Mover para baixo

---

## Impacto Total

| Arquivo | Mudança |
|---------|---------|
| `SectionWrapper.tsx` | Remover ~80 linhas (bloco de controles + handlers + props + imports) |
| `BuilderCanvas.tsx` | Remover 6 props (3 por chamada × 2 viewports + 2 para fixedHeader) |

---

## Limpeza de Código Morto

### Imports a Remover de `SectionWrapper.tsx`:
- `Copy` (lucide-react)
- `Trash2` (lucide-react)
- `Eye` (lucide-react)
- `EyeOff` (lucide-react)
- `canDeleteSection` (registry)
- `canDuplicateSection` (registry)

### Variáveis a Remover:
- `const canDelete = canDeleteSection(section.type);`
- `const canDuplicate = canDuplicateSection(section.type);`

---

## Conformidade RISE V3

| Critério | Nota | Justificativa |
|----------|------|---------------|
| LEI SUPREMA (4.1) | 10/10 | Remoção completa, não workaround |
| Manutenibilidade Infinita | 10/10 | Menos código = menos bugs |
| Zero Dívida Técnica | 10/10 | Remove código não funcional |
| Arquitetura Correta | 10/10 | UI reflete realidade |
| Escalabilidade | 10/10 | Base limpa para futuras features |
| Segurança | 10/10 | Não afeta segurança |

**NOTA FINAL: 10.0/10**

---

## Resultado Visual

### Antes:
```
[Section Header Label]
                        [↑]
                        [↓]
                        [👁]  ← NÃO FUNCIONA
                        [📋]  ← NÃO FUNCIONA  
                        [🗑]  ← NÃO FUNCIONA
```

### Depois:
```
[Section Header Label]
                        [↑]  ← FUNCIONA
                        [↓]  ← FUNCIONA
```

Interface limpa com apenas controles que funcionam.
