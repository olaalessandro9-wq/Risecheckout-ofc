

# Plano: Remoção do Código Morto (setViewMode)

## Diagnóstico Confirmado

A auditoria identificou que após a sincronização automática de `viewMode` com `activeViewport`, o evento `SET_VIEW_MODE` e toda sua infraestrutura tornaram-se **CÓDIGO MORTO** que viola o RISE V3.

### Código Morto Identificado

| Arquivo | Linha | Código Morto |
|---------|-------|--------------|
| `builder-state.types.ts` | 65 | `setViewMode: (mode: ViewMode) => void;` |
| `useMembersAreaState.ts` | 170-172 | Callback `setViewMode` |
| `useMembersAreaState.ts` | 248 | Export no objeto `actions` |
| `builderMachine.types.ts` | 91 | Evento `SET_VIEW_MODE` |
| `builderMachine.ts` | 119 | Handler `SET_VIEW_MODE` |

---

## Análise de Soluções (RISE V3 - Seção 4.4)

### Solução A: Remover Todo o Código Morto
- Manutenibilidade: 10/10 (sem confusão futura)
- Zero DT: 10/10 (nenhum código sem uso)
- Arquitetura: 10/10 (interface limpa)
- Escalabilidade: 10/10 (menos código = menos bugs)
- Segurança: 10/10
- **NOTA FINAL: 10.0/10**
- Tempo estimado: 15 minutos

### Solução B: Manter o Código para "Flexibilidade Futura"
- Manutenibilidade: 5/10 (código confuso)
- Zero DT: 0/10 (DÍVIDA TÉCNICA EXPLÍCITA)
- Arquitetura: 4/10 (viola Single Responsibility)
- Escalabilidade: 6/10
- Segurança: 10/10
- **NOTA FINAL: 5.0/10**
- Tempo estimado: 0 minutos

### DECISÃO: Solução A (10.0/10)

Remover completamente todo o código morto. Código sem uso é **DÍVIDA TÉCNICA** que viola diretamente a LEI SUPREMA.

---

## Implementação Técnica

### 1. `builder-state.types.ts` (linha 65)

**ANTES:**
```typescript
// View
setViewMode: (mode: ViewMode) => void;
togglePreviewMode: () => void;
toggleMenuCollapse: () => void;
```

**DEPOIS:**
```typescript
// View
togglePreviewMode: () => void;
toggleMenuCollapse: () => void;
```

### 2. `useMembersAreaState.ts` (linhas 170-172 e 248)

**REMOVER callback (linhas 170-172):**
```typescript
const setViewMode = useCallback((mode: ViewMode) => {
  send({ type: 'SET_VIEW_MODE', mode });
}, [send]);
```

**REMOVER do objeto actions (linha 248):**
```typescript
setViewMode,  // ← REMOVER
```

### 3. `builderMachine.types.ts` (linha 91)

**ANTES:**
```typescript
// View
| { type: "SET_VIEW_MODE"; mode: ViewMode }
| { type: "TOGGLE_PREVIEW_MODE" }
| { type: "TOGGLE_MENU_COLLAPSE" }
```

**DEPOIS:**
```typescript
// View
| { type: "TOGGLE_PREVIEW_MODE" }
| { type: "TOGGLE_MENU_COLLAPSE" }
```

### 4. `builderMachine.ts` (linha 119)

**ANTES:**
```typescript
on: {
  REFRESH: { target: "loading", actions: assign({ loadError: () => null }) },
  SET_VIEW_MODE: { actions: assign({ viewMode: ({ event }) => event.mode }) },
  TOGGLE_PREVIEW_MODE: { actions: assign({ isPreviewMode: ({ context }) => !context.isPreviewMode }) },
```

**DEPOIS:**
```typescript
on: {
  REFRESH: { target: "loading", actions: assign({ loadError: () => null }) },
  TOGGLE_PREVIEW_MODE: { actions: assign({ isPreviewMode: ({ context }) => !context.isPreviewMode }) },
```

---

## Limpeza Adicional: Imports

### `useMembersAreaState.ts` (linha 20)

O tipo `ViewMode` era usado apenas no callback `setViewMode`. Verificar se ainda é usado em `BuilderState` (sim, na linha 35 de `builder-state.types.ts`), então **MANTER** o import.

---

## Resultado Esperado

### Estado Atual (9.4/10)
- Código funciona
- Código morto presente
- Dívida técnica explícita

### Estado Final (10.0/10)
- Código funciona
- Zero código morto
- Zero dívida técnica
- Interface limpa

---

## Conformidade RISE V3

| Critério | Nota | Justificativa |
|----------|------|---------------|
| LEI SUPREMA (4.1) | 10/10 | Remoção completa, não parcial |
| Manutenibilidade Infinita | 10/10 | Menos código = menos confusão |
| Zero Dívida Técnica | 10/10 | Nenhum código sem uso |
| Arquitetura Correta | 10/10 | Interface reflete realidade |
| Escalabilidade | 10/10 | Base limpa para futuras features |
| Segurança | 10/10 | Não afeta segurança |

**NOTA FINAL: 10.0/10**

---

## Checklist de Validação Pós-Implementação

Após a remoção, validar:

- [ ] Build compila sem erros
- [ ] Nenhuma referência a `setViewMode` restante
- [ ] Nenhuma referência a `SET_VIEW_MODE` restante
- [ ] Toggle Desktop/Mobile no Header funciona
- [ ] Canvas muda de formato ao trocar viewport
- [ ] Seções são editadas no viewport correto

