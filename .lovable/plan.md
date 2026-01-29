
# Correção de Violação RISE V3 + Atualização Documentação

## Análise de Soluções (RISE V3 Seção 4.4)

### Solução A: Reduzir testes para caber em 300 linhas
- Manutenibilidade: 3/10 (remove cobertura de testes)
- Zero DT: 2/10 (cria dívida técnica de testes faltando)
- Arquitetura: 4/10 (compromete qualidade por limite)
- Escalabilidade: 3/10 (impossível adicionar novos testes)
- Segurança: 5/10 (menos cobertura = mais riscos)
- **NOTA FINAL: 3.4/10**
- Tempo estimado: 10 minutos

### Solução B: Dividir em 2 arquivos seguindo SRP
- Manutenibilidade: 10/10 (arquivos focados, fáceis de manter)
- Zero DT: 10/10 (mantém 100% da cobertura)
- Arquitetura: 10/10 (Single Responsibility por arquivo)
- Escalabilidade: 10/10 (cada arquivo pode crescer independentemente)
- Segurança: 10/10 (mesma cobertura mantida)
- **NOTA FINAL: 10.0/10**
- Tempo estimado: 30 minutos

### DECISÃO: Solução B (Nota 10.0/10)
Solução A é inferior porque sacrifica qualidade para cumprir limite, violando o próprio espírito do RISE V3 que exige a melhor solução.

---

## Problema Identificado

| Arquivo | Linhas | Status |
|---------|--------|--------|
| `dialog.test.tsx` | 310 | ❌ VIOLA (limite 300) |

---

## Plano de Correção

### 1. Divisão do Arquivo de Testes

Estrutura atual (1 arquivo, 310 linhas):
```text
dialog.test.tsx (310 linhas)
├── Dialog (Root) - 3 testes
├── DialogTrigger - 2 testes  
├── DialogContent - 5 testes
├── DialogContentWithoutClose - 1 teste
├── DialogHeader - 2 testes
├── DialogFooter - 1 teste
├── DialogTitle - 3 testes
└── DialogDescription - 2 testes
```

Nova estrutura (2 arquivos, ~155 linhas cada):
```text
dialog-core.test.tsx (~155 linhas)
├── Dialog (Root) - 3 testes
├── DialogTrigger - 2 testes
├── DialogContent - 5 testes
└── DialogContentWithoutClose - 1 teste

dialog-parts.test.tsx (~150 linhas)
├── DialogHeader - 2 testes
├── DialogFooter - 1 teste
├── DialogTitle - 3 testes
└── DialogDescription - 2 testes
```

### 2. Arquivos a Criar

#### 2.1 `src/components/ui/__tests__/dialog-core.test.tsx` (~155 linhas)
- Header JSDoc com RISE V3 10.0/10
- Imports necessários
- Describe blocks:
  - Dialog (Root): open state, closed state, onOpenChange
  - DialogTrigger: render, opens on click
  - DialogContent: close button, ref, styling, className, Escape key
  - DialogContentWithoutClose: no close button

#### 2.2 `src/components/ui/__tests__/dialog-parts.test.tsx` (~150 linhas)
- Header JSDoc com RISE V3 10.0/10
- Imports necessários
- Describe blocks:
  - DialogHeader: flex layout, text-center mobile
  - DialogFooter: flex layout
  - DialogTitle: text, styling, ref
  - DialogDescription: text, muted foreground

### 3. Arquivo a Remover
- `src/components/ui/__tests__/dialog.test.tsx` (será substituído pelos 2 novos)

---

## Atualização da Documentação

### TESTING_SYSTEM.md - Alterações

A documentação atual não menciona a Fase 4 (UI Components). Adicionar nova seção:

```markdown
## Fase 4: Testes de Componentes UI

### Estrutura
```text
src/components/ui/__tests__/
├── button.test.tsx       # 18 testes - variants, sizes, asChild
├── input.test.tsx        # 14 testes - types, states, attributes
├── card.test.tsx         # 15 testes - Card, Header, Title, Description, Content, Footer
├── badge.test.tsx        # 10 testes - variants, styling
├── alert.test.tsx        # 12 testes - Alert, AlertTitle, AlertDescription
├── checkbox.test.tsx     # 10 testes - states, interactions
├── switch.test.tsx       # 10 testes - states, styling
├── textarea.test.tsx     # 8 testes - rendering, states
├── label.test.tsx        # 7 testes - rendering, htmlFor
├── progress.test.tsx     # 10 testes - value binding, transform
├── separator.test.tsx    # 10 testes - orientation, decorative
├── skeleton.test.tsx     # 6 testes - animation, styling
├── avatar.test.tsx       # 8 testes - fallback, className
├── select.test.tsx       # 16 testes - trigger, content, items
├── dialog-core.test.tsx  # 11 testes - Dialog, Trigger, Content
├── dialog-parts.test.tsx # 8 testes - Header, Footer, Title, Description
└── form-controls.test.tsx # 16 testes - Toggle, ToggleGroup, RadioGroup
```

### Total: 179 testes de componentes UI
```

### Atualizar Contagem Total
- Antes: 586+ testes
- Após: 765+ testes (586 + 179 UI)

### Atualizar Tabela de Fases
```markdown
| Fase | Categoria | Quantidade |
|------|-----------|------------|
| F2 | Backend _shared | 129 |
| F3 | Frontend lib | 150+ |
| F4 | UI Components | 179 |      ← NOVO
| F5 | Hooks integração | 66 |
| F6 | Edge Functions | 200+ |
| F7 | E2E Playwright | 43+ |
| **TOTAL** | | **765+** |
```

---

## Checklist de Validação RISE V3

| Critério | dialog-core.test.tsx | dialog-parts.test.tsx |
|----------|---------------------|----------------------|
| Limite 300 linhas | ✅ ~155 linhas | ✅ ~150 linhas |
| Zero tipos `any` | ✅ | ✅ |
| Zero `@ts-ignore` | ✅ | ✅ |
| Header JSDoc | ✅ | ✅ |
| Frases proibidas | ✅ Zero | ✅ Zero |
| SRP | ✅ Componentes core | ✅ Subcomponentes |

---

## Entregáveis

1. **CRIAR** `src/components/ui/__tests__/dialog-core.test.tsx` (~155 linhas)
2. **CRIAR** `src/components/ui/__tests__/dialog-parts.test.tsx` (~150 linhas)
3. **REMOVER** `src/components/ui/__tests__/dialog.test.tsx`
4. **ATUALIZAR** `docs/TESTING_SYSTEM.md` com:
   - Nova seção "Fase 4: Testes de Componentes UI"
   - Lista completa dos 17 arquivos de teste UI
   - Total atualizado: 765+ testes
   - Tabela de fases atualizada

---

## Seção Técnica

### Divisão dos Testes

**dialog-core.test.tsx** conterá:
- Linhas 1-31: Header JSDoc + imports
- Linhas 32-102: Dialog (Root) + DialogTrigger tests
- Linhas 103-175: DialogContent tests
- Linhas 176-191: DialogContentWithoutClose test

**dialog-parts.test.tsx** conterá:
- Linhas 1-31: Header JSDoc + imports
- Linhas 32-80: DialogHeader tests
- Linhas 81-110: DialogFooter tests
- Linhas 111-155: DialogTitle tests
- Linhas 156-175: DialogDescription tests

### Imports Necessários (ambos arquivos)
```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@/test/utils";
import { createRef } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogContentWithoutClose,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "../dialog";
```
