# Coding Standards - Rise Checkout

> **RISE ARCHITECT PROTOCOL V3**  
> Última atualização: 2026-01-27  
> Status: ✅ 100% COMPLIANT

---

## 1. Logging Centralizado

### Regra Absoluta

**PROIBIDO** usar `console.log/error/warn` diretamente em qualquer arquivo.

### 1.1 Status da Migração

| Escopo | Status | Arquivos Migrados |
|--------|--------|-------------------|
| Frontend (`src/`) | ✅ Completo | 176+ arquivos |
| Backend (`supabase/functions/`) | ✅ Completo | 110+ arquivos |

**Data de Conclusão:** 2026-01-19

A migração foi concluída com sucesso em todos os arquivos de produção.

### Frontend (`src/`)

Usar `createLogger` de `src/lib/logger.ts`:

```typescript
import { createLogger } from '@/lib/logger';

const log = createLogger('ComponentName');

// Uso correto:
log.trace('Dados muito detalhados', data);  // Apenas dev
log.debug('Debug de desenvolvimento');       // Apenas dev
log.info('Operação normal');                 // Apenas dev
log.warn('Situação inesperada');             // Apenas dev
log.error('Erro crítico', error);            // Sempre + Sentry
```

### Backend (Edge Functions - `supabase/functions/`)

Usar `createLogger` de `_shared/logger.ts`:

```typescript
import { createLogger } from "../_shared/logger.ts";

const log = createLogger("function-name");

// Uso correto:
log.debug("Dados detalhados", { data });  // Apenas se LOG_LEVEL=debug
log.info("Operação iniciada", { orderId });
log.warn("Situação inesperada", { details });
log.error("Erro crítico", error);
```

### Níveis de Log

| Nível | Frontend (Dev) | Frontend (Prod) | Backend | Uso |
|-------|----------------|-----------------|---------|-----|
| trace | ✅ | ❌ | ❌ | Dados muito verbosos |
| debug | ✅ | ❌ | Configurável | Debug de desenvolvimento |
| info | ✅ | ❌ | Configurável | Operações normais |
| warn | ✅ | ❌ | ✅ | Situações inesperadas |
| error | ✅ | ✅ + Sentry | ✅ | Erros críticos |

---

## 2. Padrões Proibidos

### ❌ Logging Direto

```typescript
// PROIBIDO - Violação RISE V3
console.log("[Component] mensagem");
console.error("[Component] erro");
console.warn("[Component] aviso");
```

### ❌ Helpers Locais de Logging

```typescript
// PROIBIDO - Criar helpers locais
const logStep = (step: string) => console.log(`[FUNC] ${step}`);
```

### ❌ Prefixos Manuais

```typescript
// PROIBIDO - O logger já inclui contexto
log.info("[stripe-webhook] Evento recebido");  // ❌

// CORRETO
log.info("Evento recebido");  // ✅ Logger adiciona contexto automaticamente
```

---

## 3. Lint Rules Ativas

### Frontend (ESLint)

```javascript
// eslint.config.js
rules: {
  "no-console": ["error", { allow: [] }],
}
```

Exceção: `src/lib/logger.ts` tem override para permitir console.

### Backend (Deno)

Script `supabase/functions/lint-console.sh` valida que nenhum arquivo usa `console.*` diretamente.

---

## 4. Migração de Código Legado

Ao encontrar código com `console.log/error/warn`:

1. Adicionar import do logger centralizado
2. Substituir todas as chamadas
3. Remover prefixos redundantes das mensagens
4. Remover helpers locais de logging

**Antes:**
```typescript
const logStep = (step: string) => console.log(`[FUNC] ${step}`);
logStep("Iniciando");
console.error("[FUNC] Erro:", error);
```

**Depois:**
```typescript
import { createLogger } from "../_shared/logger.ts";
const log = createLogger("func-name");

log.info("Iniciando");
log.error("Erro:", error);
```

---

## 5. Verificação de Conformidade

Para verificar se o código está em conformidade:

```bash
# Frontend - ESLint reportará violações
npm run lint

# Backend - Script de validação
./supabase/functions/lint-console.sh
```

---

## 6. Exceções Permitidas (Backend)

Os seguintes arquivos são **EXPLICITAMENTE PERMITIDOS** a usar `console.*`:

| Arquivo | Motivo | Tipo |
|---------|--------|------|
| `_shared/logger.ts` | Fonte da verdade do sistema de logging | Infraestrutura |
| `_shared/platform-secrets.ts` | Uso em JSDoc (documentação de código) | Documentação |
| `_shared/payment-gateways/PaymentFactory.ts` | Uso em JSDoc (documentação de código) | Documentação |
| `mercadopago-oauth-callback/templates/html-responses.ts` | JavaScript client-side (executado no navegador) | Frontend embed |

**Nota:** Estas exceções são permanentes e validadas pelo script `lint-console.sh`.

---

## 7. React Patterns

### 7.1 Estabilização de Callbacks com useRef

#### Regra Absoluta

Callbacks externos passados para hooks de data fetching **NUNCA** devem ser incluídos no array de dependências de `useCallback` ou `useEffect`.

#### Problema

Quando um callback (ex: `onBack`, `onSave`) é passado como prop e incluído nas dependências:

```typescript
// PROIBIDO - Causa loop infinito
const loadData = useCallback(async () => {
  // ... fetch data
  if (error) onBack(); // callback usado
}, [contentId, onBack]); // onBack nas dependências

useEffect(() => {
  loadData();
}, [loadData]); // Re-executa quando loadData muda
```

**Cadeia de eventos do loop:**
1. Parent renderiza e cria nova referência de `onBack`
2. `loadData` é recriado (nova dependência)
3. `useEffect` detecta mudança e executa `loadData()`
4. `setIsLoading(true)` causa re-render
5. Volta ao passo 1 - LOOP INFINITO

#### Solução Correta

Usar `useRef` para armazenar callbacks de ação:

```typescript
import { useState, useEffect, useCallback, useRef } from "react";

export function useDataFetchingHook({
  dataId,
  onBack,  // Callback externo
}: Props) {
  // RISE V3: Ref para callbacks que NÃO devem influenciar data fetching
  const onBackRef = useRef(onBack);
  
  // Manter ref atualizada sem causar re-execução
  useEffect(() => {
    onBackRef.current = onBack;
  }, [onBack]);

  const loadData = useCallback(async () => {
    try {
      const { data, error } = await api.call("endpoint", { dataId });
      
      if (error) {
        toast.error("Erro ao carregar");
        // RISE V3: Usar ref.current - não afeta dependências
        onBackRef.current();
        return;
      }
      
      // ... processar dados
    } catch (err) {
      log.error("Exception:", err);
    }
  }, [dataId]); // onBack REMOVIDO das dependências

  useEffect(() => {
    loadData();
  }, [loadData]);
  
  // ...
}
```

#### Quando Aplicar

| Cenário | Usar useRef? |
|---------|--------------|
| Callback de navegação (`onBack`, `onClose`) | Sim |
| Callback de sucesso (`onSave`, `onSuccess`) | Sim |
| Callback de atualização de estado local | Não (usar useCallback no parent) |
| Funções do React Router (`navigate`, `setSearchParams`) | Não (já são estáveis) |

#### Padrão Complementar: useCallback no Parent

Além do `useRef` no hook, o componente pai deve estabilizar seus callbacks:

```typescript
// MembersAreaLayout.tsx - Parent Component
const handleContentEditorBack = useCallback(() => {
  // Usar function form para evitar dependência de state
  setSearchParams((prev) => {
    const newParams = new URLSearchParams(prev);
    newParams.delete("mode");
    return newParams;
  });
}, [setSearchParams]); // setSearchParams é estável
```

### 7.2 Estabilização de Handlers com useCallback

#### Regra

Handlers que atualizam estado e são passados para componentes filhos devem usar `useCallback`:

```typescript
// CORRETO - Handler estável
const handleTitleChange = useCallback((value: string) => {
  setContent((prev) => ({ ...prev, title: value }));
}, []); // Array vazio - usa function form de setState

const handleAttachmentsChange = useCallback((newAttachments: Attachment[]) => {
  setAttachments(newAttachments);
}, []); // setAttachments de useState é estável por design
```

#### Anti-pattern

```typescript
// PROIBIDO - Handler inline recriado a cada render
<Input 
  onChange={(e) => setContent({ ...content, title: e.target.value })}
/>
```

---

## Changelog

| Data | Alteração |
|------|-----------|
| 2026-01-27 | Adicionada Seção 7: React Patterns - useRef para callbacks, useCallback para handlers |
| 2026-01-19 | Migração de logging 100% completa - documentação de exceções permitidas |
| 2026-01-19 | Criação do documento com padrões de logging |
