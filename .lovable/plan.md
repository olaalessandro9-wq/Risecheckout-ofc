

# Plano: Unificação do Controle Desktop/Mobile

## Diagnóstico

### Arquitetura Atual (Problema)
O Header possui **DOIS controles separados**:

| Controle | Localização | Função | Estado |
|----------|-------------|--------|--------|
| **Viewport Toggle** | Centro | `activeViewport` - Qual layout está sendo editado | desktop/mobile |
| **View Mode Toggle** | Direita | `viewMode` - Como o canvas é renderizado | desktop/mobile |

Isso causa confusão:
- O usuário pode estar editando "Mobile" mas visualizando no formato "Desktop"
- Dois controles para o mesmo conceito lógico é redundante e confuso

### Comportamento Esperado (Unificado)
Um **ÚNICO controle** que faz ambas as funções:
- Quando seleciona "Desktop": edita seções desktop + visualiza no formato desktop
- Quando seleciona "Mobile": edita seções mobile + visualiza no formato mobile

---

## Análise de Soluções (RISE V3 - Seção 4.4)

### Solução A: Remover ViewMode e Usar Apenas ActiveViewport
- Manutenibilidade: 9/10 (simplifica o código)
- Zero DT: 8/10 (elimina redundância mas perde flexibilidade futura)
- Arquitetura: 8/10 (menos conceitos)
- Escalabilidade: 7/10 (se no futuro precisar separar novamente...)
- Segurança: 10/10
- **NOTA FINAL: 8.4/10**
- Tempo estimado: 1 hora

### Solução B: Sincronizar ViewMode Automaticamente com ActiveViewport
- Manutenibilidade: 10/10 (mantém flexibilidade para casos especiais)
- Zero DT: 10/10 (comportamento correto imediato)
- Arquitetura: 10/10 (conceitos separados mas sincronizados por padrão)
- Escalabilidade: 10/10 (pode desacoplar no futuro se necessário)
- Segurança: 10/10
- **NOTA FINAL: 10.0/10**
- Tempo estimado: 45 minutos

### DECISÃO: Solução B (10.0/10)

Sincronizar automaticamente `viewMode` com `activeViewport` quando o usuário troca de viewport. Mantém a flexibilidade do sistema mas elimina a confusão do usuário.

---

## Implementação Técnica

### Mudança Principal

Quando o usuário clica em "Desktop" ou "Mobile" no centro do Header:
1. `activeViewport` muda (já acontece)
2. `viewMode` muda JUNTO automaticamente (NOVO)

Isso é feito alterando o handler de `SET_ACTIVE_VIEWPORT` no state machine.

### Arquivos a Modificar

#### 1. `src/modules/members-area-builder/machines/builderMachine.ts`
Modificar a action de `SET_ACTIVE_VIEWPORT` para também atualizar `viewMode`:

```typescript
// ANTES (linha 128)
SET_ACTIVE_VIEWPORT: { 
  actions: assign({ 
    activeViewport: ({ event }) => event.viewport, 
    selectedSectionId: () => null 
  }) 
},

// DEPOIS
SET_ACTIVE_VIEWPORT: { 
  actions: assign({ 
    activeViewport: ({ event }) => event.viewport,
    viewMode: ({ event }) => event.viewport, // ← SINCRONIZAÇÃO AUTOMÁTICA
    selectedSectionId: () => null 
  }) 
},
```

#### 2. `src/modules/members-area-builder/components/header/BuilderHeader.tsx`
Remover o segundo toggle de View Mode (direita) pois agora é redundante:

**ANTES:**
```text
┌──────────────────────────────────────────────────────────────────────────┐
│  [Voltar]  │  Personalizar...  │  [Desktop|Mobile] [Sync] │ [Desktop|Mobile] [Preview] [Salvar] │
│            │                   │      (EDIÇÃO)            │    (VISUALIZAÇÃO)                   │
└──────────────────────────────────────────────────────────────────────────┘
```

**DEPOIS:**
```text
┌──────────────────────────────────────────────────────────────────────────┐
│  [Voltar]  │  Personalizar...  │  [Desktop|Mobile] [Sync]  │  [Preview] [Salvar] │
│            │                   │  (EDIÇÃO + VISUALIZAÇÃO)  │                     │
└──────────────────────────────────────────────────────────────────────────┘
```

**Mudanças específicas:**
- Remover o bloco do "View Mode Toggle" (linhas 176-195)
- Manter apenas: Preview toggle e botão Salvar

---

## Código das Mudanças

### builderMachine.ts (linha 128)
```typescript
SET_ACTIVE_VIEWPORT: { 
  actions: assign({ 
    activeViewport: ({ event }) => event.viewport,
    viewMode: ({ event }) => event.viewport,
    selectedSectionId: () => null 
  }) 
},
```

### BuilderHeader.tsx (remover linhas 176-197)
Remover completamente:
```tsx
{/* View Mode Toggle (for preview) */}
<div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
  <Button ... onClick={() => actions.setViewMode('desktop')}>
    Desktop
  </Button>
  <Button ... onClick={() => actions.setViewMode('mobile')}>
    Mobile
  </Button>
</div>

<Separator orientation="vertical" className="h-6" />
```

---

## Resultado Visual

### Header Simplificado
```text
┌────────────────────────────────────────────────────────────────────────────────────┐
│ ← Voltar │ Personalizar Área de Membros │ [Desktop(2)] [Mobile(2)] [Sync] │ [Preview] [Salvar] │
└────────────────────────────────────────────────────────────────────────────────────┘
```

### Comportamento Unificado
| Ação do Usuário | activeViewport | viewMode | Canvas |
|-----------------|----------------|----------|--------|
| Clica "Desktop" | desktop | desktop | Edita seções desktop + formato desktop |
| Clica "Mobile" | mobile | mobile | Edita seções mobile + formato mobile |

---

## Impacto

| Componente | Mudança |
|------------|---------|
| `builderMachine.ts` | 1 linha: sincronizar viewMode com activeViewport |
| `BuilderHeader.tsx` | Remover ~20 linhas do segundo toggle |
| `BuilderCanvas.tsx` | Nenhuma mudança necessária |
| `useMembersAreaState.ts` | Nenhuma mudança necessária |

---

## Conformidade RISE V3

| Critério | Nota | Justificativa |
|----------|------|---------------|
| LEI SUPREMA (4.1) | 10/10 | Solução unificada, não workaround |
| Manutenibilidade Infinita | 10/10 | Menos código, menos confusão |
| Zero Dívida Técnica | 10/10 | Comportamento correto imediato |
| Arquitetura Correta | 10/10 | Mantém conceitos separados mas sincronizados |
| Escalabilidade | 10/10 | Pode desacoplar no futuro se necessário |
| Segurança | 10/10 | Não afeta segurança |

**NOTA FINAL: 10.0/10**

---

## Resultado Esperado

### Antes:
- 2 controles separados causando confusão
- Possível editar Mobile mas visualizar Desktop
- UX confusa

### Depois:
- 1 único controle Desktop/Mobile
- Edição e visualização sempre sincronizadas
- UX intuitiva e limpa

