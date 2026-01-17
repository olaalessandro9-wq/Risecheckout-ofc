# Guia de State Machines - XState

**Última Atualização:** 17 de Janeiro de 2026  
**Versão XState:** 5.x  
**Versão @xstate/react:** 4.x

---

## Introdução

Este projeto utiliza XState para gerenciamento de estado complexo. State machines garantem:

- **Estados impossíveis são impossíveis** - Não há como estar em "saving" e "loading" ao mesmo tempo
- **Transições explícitas** - Todas as mudanças de estado são documentadas
- **Debuggability** - Estados são visualizáveis e rastreáveis
- **Type Safety** - TypeScript integral com eventos tipados

---

## Instalação

```bash
npm install xstate@5 @xstate/react@4
```

---

## Estrutura de uma Machine

### 1. Tipos (machine.types.ts)

```typescript
// Contexto - dados gerenciados pela máquina
interface MyContext {
  items: Item[];
  selectedId: string | null;
  error: string | null;
}

// Eventos - ações que causam transições
type MyEvent =
  | { type: "LOAD" }
  | { type: "LOAD_SUCCESS"; items: Item[] }
  | { type: "LOAD_ERROR"; error: string }
  | { type: "SELECT"; id: string };
```

### 2. Helpers (machine.helpers.ts)

```typescript
// Funções puras para cálculos
export function createInitialContext(): MyContext {
  return {
    items: [],
    selectedId: null,
    error: null,
  };
}

export function findItemById(items: Item[], id: string): Item | undefined {
  return items.find(item => item.id === id);
}
```

### 3. Machine (machine.ts)

```typescript
import { createMachine, assign } from "xstate";

export const myMachine = createMachine({
  id: "myMachine",
  initial: "idle",
  context: createInitialContext(),
  types: {} as {
    context: MyContext;
    events: MyEvent;
  },
  
  states: {
    idle: {
      on: {
        LOAD: { target: "loading" },
      },
    },
    
    loading: {
      on: {
        LOAD_SUCCESS: {
          target: "ready",
          actions: assign({
            items: ({ event }) => event.items,
            error: () => null,
          }),
        },
        LOAD_ERROR: {
          target: "error",
          actions: assign({
            error: ({ event }) => event.error,
          }),
        },
      },
    },
    
    ready: {
      on: {
        SELECT: {
          actions: assign({
            selectedId: ({ event }) => event.id,
          }),
        },
        LOAD: { target: "loading" },
      },
    },
    
    error: {
      on: {
        LOAD: { target: "loading" },
      },
    },
  },
});
```

### 4. Hook (useMachine.ts)

```typescript
import { useMachine } from "@xstate/react";
import { useCallback } from "react";
import { myMachine } from "./machine";

export function useMyMachine() {
  const [snapshot, send] = useMachine(myMachine);
  
  const context = snapshot.context;
  const stateValue = snapshot.value as string;
  
  // Helpers de status
  const isLoading = stateValue === "loading";
  const isReady = stateValue === "ready";
  const isError = stateValue === "error";
  
  // Actions tipadas
  const load = useCallback(() => {
    send({ type: "LOAD" });
  }, [send]);
  
  const select = useCallback((id: string) => {
    send({ type: "SELECT", id });
  }, [send]);
  
  return {
    // Estado
    items: context.items,
    selectedId: context.selectedId,
    error: context.error,
    
    // Status
    isLoading,
    isReady,
    isError,
    
    // Actions
    load,
    select,
  };
}
```

---

## Padrões Utilizados

### Guards (Condições)

```typescript
// Inline guard
error: {
  on: {
    RETRY: {
      target: "loading",
      guard: ({ context }) => context.retryCount < 3,
    },
  },
},
```

### Actions com assign

```typescript
// Atualização de contexto
actions: assign({
  // Valor estático
  isLoading: () => true,
  
  // Usando evento
  items: ({ event }) => event.items,
  
  // Usando contexto + evento
  items: ({ context, event }) => [...context.items, event.newItem],
}),
```

### Transições Múltiplas

```typescript
// Múltiplas transições baseadas em guards
SUBMIT: [
  {
    guard: ({ context }) => context.isValid,
    target: "submitting",
  },
  {
    target: "invalid",
  },
],
```

---

## Machines do Projeto

### productFormMachine

**Localização:** `src/modules/products/machines/`

**Estados:**
- `idle` - Aguardando inicialização
- `loading` - Carregando dados do servidor
- `editing` - Usuário editando formulário
- `validating` - Validando antes de salvar
- `saving` - Salvando no servidor
- `saved` - Salvo com sucesso
- `error` - Erro ocorreu

**Uso:**
```typescript
import { useProductFormMachine } from "@/modules/products/machines";

const {
  isEditing,
  isDirty,
  editedData,
  updateGeneral,
  requestSave,
} = useProductFormMachine();
```

---

## Best Practices

### 1. Estados como Substantivos

```typescript
// ✅ BOM - estados descrevem "o que é"
states: {
  idle: {},
  loading: {},
  editing: {},
  saving: {},
}

// ❌ RUIM - estados como verbos
states: {
  load: {},
  edit: {},
  save: {},
}
```

### 2. Eventos como Verbos/Ações

```typescript
// ✅ BOM - eventos descrevem "o que aconteceu"
type Events =
  | { type: "LOAD_REQUESTED" }
  | { type: "DATA_RECEIVED"; data: Data }
  | { type: "SAVE_CLICKED" };

// ❌ RUIM - eventos muito genéricos
type Events =
  | { type: "UPDATE" }
  | { type: "SET_DATA" };
```

### 3. Contexto Mínimo

```typescript
// ✅ BOM - apenas dados necessários
interface Context {
  items: Item[];
  error: string | null;
}

// ❌ RUIM - dados deriváveis
interface Context {
  items: Item[];
  itemCount: number; // Derivável: items.length
  hasItems: boolean; // Derivável: items.length > 0
}
```

### 4. Guards Descritivos

```typescript
// ✅ BOM - guard com nome claro
guard: ({ context }) => context.saveAttempts < 3,
// Ou extraído:
guard: "canRetry",

// ❌ RUIM - lógica complexa inline
guard: ({ context }) => 
  context.x > 0 && context.y < 100 && context.z !== null,
```

---

## Debugging

### XState Inspector

```typescript
import { inspect } from "@xstate/inspect";

// Em desenvolvimento
if (import.meta.env.DEV) {
  inspect({ iframe: false });
}
```

### Console Logging

```typescript
const [snapshot, send] = useMachine(myMachine);

useEffect(() => {
  console.log("[Machine State]", snapshot.value, snapshot.context);
}, [snapshot]);
```

---

## Recursos

- [XState Documentation](https://stately.ai/docs)
- [XState Visualizer](https://stately.ai/viz)
- [XState TypeScript Guide](https://stately.ai/docs/typescript)
