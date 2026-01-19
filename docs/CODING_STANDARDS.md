# Coding Standards - Rise Checkout

> **RISE ARCHITECT PROTOCOL V3**  
> Última atualização: 2026-01-19  
> Status: OBRIGATÓRIO

---

## 1. Logging Centralizado

### Regra Absoluta

**PROIBIDO** usar `console.log/error/warn` diretamente em qualquer arquivo.

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

## Changelog

| Data | Alteração |
|------|-----------|
| 2026-01-19 | Criação do documento com padrões de logging |
