
# Plano de Refatoração Estrutural: Módulo UTMify (RISE V3 Compliance)

## Diagnóstico Atual

### Violações RISE V3 Identificadas

| Arquivo | Linhas | Status | Problema |
|---------|--------|--------|----------|
| `_shared/utmify-dispatcher.ts` | 515 | **VIOLAÇÃO CRÍTICA** | "God Object" - contém tipos, helpers, main function, database helpers, convenience wrappers |
| `vault-save/index.ts` | 308 | **VIOLAÇÃO MARGINAL** | Ligeiramente acima, mas aceitável por ser edge function |

### Duplicação de Lógica (Dívida Técnica)

A mesma lógica de sanitização aparece em **3 locais diferentes**:

```text
1. vault-save/index.ts (linhas 182-196)
   .replace(/[\r\n\t]/g, '').replace(/\s+/g, '').replace(/^["']|["']$/g, '').trim()

2. utmify-dispatcher.ts (linhas 185-189)
   .replace(/[\r\n\t]/g, '').replace(/\s+/g, '').replace(/^["']|["']$/g, '').trim()

3. utmify-conversion/index.ts (linhas 117-121)
   .replace(/[\r\n\t]/g, '').replace(/\s+/g, '').replace(/^["']|["']$/g, '').trim()
```

Esta duplicação:
- Cria inconsistências (se uma é corrigida, as outras não)
- Dificulta debugging (qual versão está sendo usada?)
- Viola o princípio DRY

### Tipos Duplicados

`utmify-dispatcher.ts` define seus próprios tipos que são quase idênticos aos de `utmify-conversion/types.ts`:
- `UTMifyOrderData` vs `UTMifyConversionRequest`
- `UTMifyEventType` definido inline
- `STATUS_MAP` duplicado

---

## Arquitetura Proposta (RISE V3 - Nota 10.0/10)

### Nova Estrutura de Arquivos

```text
supabase/functions/_shared/utmify/
├── index.ts                    (~30 linhas)  - Barrel export
├── types.ts                    (~80 linhas)  - Tipos unificados
├── constants.ts                (~25 linhas)  - URL, status map, platform
├── token-normalizer.ts         (~60 linhas)  - SSOT normalização de token
├── date-formatter.ts           (~35 linhas)  - Formatação UTC
├── payment-mapper.ts           (~30 linhas)  - Mapeamento de métodos
├── config-checker.ts           (~60 linhas)  - Verificação habilitado/produtos
├── token-retriever.ts          (~50 linhas)  - Recuperação do Vault
├── payload-builder.ts          (~80 linhas)  - Construção do payload API
├── order-fetcher.ts            (~50 linhas)  - Busca pedido no DB
├── dispatcher.ts               (~90 linhas)  - Função principal de disparo
└── tests/
    ├── token-normalizer.test.ts
    ├── payload-builder.test.ts
    └── dispatcher.test.ts
```

**Total estimado**: ~590 linhas → **10 arquivos (~59 linhas média)**

### Responsabilidades Claras (Single Responsibility)

| Arquivo | Responsabilidade |
|---------|------------------|
| `types.ts` | Todas as interfaces e tipos UTMify |
| `constants.ts` | URL da API, STATUS_MAP, PLATFORM_NAME |
| `token-normalizer.ts` | **SSOT** - Normalização de tokens (Unicode, invisíveis, aspas) |
| `date-formatter.ts` | Formatação de datas para UTC conforme API |
| `payment-mapper.ts` | Mapeamento pix/credit_card/boleto |
| `config-checker.ts` | Verifica se evento está habilitado para vendor/produtos |
| `token-retriever.ts` | Recupera e normaliza token do Vault |
| `payload-builder.ts` | Constrói payload conforme especificação UTMify |
| `order-fetcher.ts` | Busca dados do pedido com order_items |
| `dispatcher.ts` | Orquestra: verifica config → token → payload → envia |

---

## Detalhamento por Arquivo

### 1. `types.ts` (~80 linhas)
```typescript
// Tipos unificados para UTMify
export type UTMifyEventType = 
  | "pix_generated" | "purchase_approved" | "purchase_refused" | "refund" | "chargeback";

export interface UTMifyCustomer { ... }
export interface UTMifyProduct { ... }
export interface UTMifyTrackingParameters { ... }
export interface UTMifyCommission { ... }
export interface UTMifyOrderData { ... }
export interface UTMifyDispatchResult { ... }
export interface DatabaseOrder { ... }
export interface TokenNormalizationResult { ... }
```

### 2. `constants.ts` (~25 linhas)
```typescript
export const UTMIFY_API_URL = "https://api.utmify.com.br/api-credentials/orders";
export const PLATFORM_NAME = "RiseCheckout";

export const STATUS_MAP: Record<UTMifyEventType, string> = {
  pix_generated: "waiting_payment",
  purchase_approved: "paid",
  purchase_refused: "refused",
  refund: "refunded",
  chargeback: "chargedback",
};
```

### 3. `token-normalizer.ts` (~60 linhas) **SSOT CRÍTICO**
```typescript
/**
 * Normaliza token UTMify removendo caracteres problemáticos
 * 
 * REGRAS (ordem importa):
 * 1. NFKC normalization (unicode "parecido")
 * 2. Remove invisible chars (U+200B-200F, U+FEFF, NBSP, control)
 * 3. Trim bordas
 * 4. Remove aspas envolventes (1 ou mais: /^["']+|["']+$/g)
 * 5. NÃO remove espaços internos (podem ser significativos)
 */
export interface TokenNormalizationResult {
  normalized: string;
  originalLength: number;
  normalizedLength: number;
  changes: string[];
}

export function normalizeUTMifyToken(raw: string): TokenNormalizationResult;
export function computeTokenFingerprint(token: string): string; // SHA-256 primeiros 12 chars
```

### 4. `date-formatter.ts` (~35 linhas)
```typescript
/**
 * Formata data para UTMify (YYYY-MM-DD HH:mm:ss UTC)
 */
export function formatDateUTC(date: Date | string): string;
```

### 5. `payment-mapper.ts` (~30 linhas)
```typescript
export function mapPaymentMethod(method: string): string;
```

### 6. `config-checker.ts` (~60 linhas)
```typescript
export async function isEventEnabled(
  supabase: SupabaseClient,
  vendorId: string,
  eventType: UTMifyEventType,
  productIds?: string[]
): Promise<boolean>;
```

### 7. `token-retriever.ts` (~50 linhas)
```typescript
import { normalizeUTMifyToken, computeTokenFingerprint } from './token-normalizer.ts';

export interface TokenRetrievalResult {
  token: string | null;
  fingerprint: string | null;
  normalizationApplied: boolean;
}

export async function getUTMifyToken(
  supabase: SupabaseClient,
  vendorId: string
): Promise<TokenRetrievalResult>;
```

### 8. `payload-builder.ts` (~80 linhas)
```typescript
export function buildUTMifyPayload(orderData: UTMifyOrderData, eventType: UTMifyEventType): UTMifyAPIPayload;
export function buildUTMifyOrderData(order: DatabaseOrder, overrides?: Partial<UTMifyOrderData>): UTMifyOrderData;
```

### 9. `order-fetcher.ts` (~50 linhas)
```typescript
export async function fetchOrderForUTMify(
  supabase: SupabaseClient,
  orderId: string
): Promise<DatabaseOrder | null>;
```

### 10. `dispatcher.ts` (~90 linhas)
```typescript
export async function dispatchUTMifyEvent(
  supabase: SupabaseClient,
  eventType: UTMifyEventType,
  orderData: UTMifyOrderData,
  productIds?: string[]
): Promise<UTMifyDispatchResult>;

export async function dispatchUTMifyEventForOrder(
  supabase: SupabaseClient,
  orderId: string,
  eventType: UTMifyEventType,
  overrides?: Partial<UTMifyOrderData>
): Promise<UTMifyDispatchResult>;
```

### 11. `index.ts` (~30 linhas) - Barrel Export
```typescript
// Re-export everything for easy imports
export * from './types.ts';
export * from './constants.ts';
export * from './token-normalizer.ts';
export * from './dispatcher.ts';
export { fetchOrderForUTMify } from './order-fetcher.ts';
export { buildUTMifyOrderData } from './payload-builder.ts';
```

---

## Atualização dos Consumidores

### Antes (import atual)
```typescript
import { 
  dispatchUTMifyEventForOrder, 
  type UTMifyEventType 
} from '../_shared/utmify-dispatcher.ts';
```

### Depois (import refatorado)
```typescript
import { 
  dispatchUTMifyEventForOrder, 
  type UTMifyEventType 
} from '../_shared/utmify/index.ts';
```

### Arquivos a Atualizar (8 consumidores)
1. `_shared/webhook-post-refund.ts`
2. `_shared/webhook-post-payment.ts`
3. `mercadopago-webhook/index.ts`
4. `mercadopago-create-payment/index.ts`
5. `pushinpay-create-pix/handlers/post-pix.ts`
6. `stripe-create-payment/handlers/post-payment.ts`
7. `asaas-create-payment/handlers/charge-creator.ts`
8. `stripe-webhook/index.ts`

---

## Atualização do `vault-save/index.ts`

Remover sanitização inline e usar o SSOT:

```typescript
// ANTES (linhas 182-196)
vaultCredentials.api_token = original
  .replace(/[\r\n\t]/g, '')
  .replace(/\s+/g, '')
  .replace(/^["']|["']$/g, '')
  .trim();

// DEPOIS
import { normalizeUTMifyToken } from '../_shared/utmify/token-normalizer.ts';

const result = normalizeUTMifyToken(original);
vaultCredentials.api_token = result.normalized;
if (result.changes.length > 0) {
  log.warn("Token UTMify normalizado", {
    changes: result.changes,
    originalLength: result.originalLength,
    normalizedLength: result.normalizedLength
  });
}
```

---

## Atualização do `utmify-conversion/index.ts`

Remover sanitização inline e usar o SSOT:

```typescript
// ANTES (linhas 117-121)
const token = rawToken
  .replace(/[\r\n\t]/g, '')
  .replace(/\s+/g, '')
  .replace(/^["']|["']$/g, '')
  .trim();

// DEPOIS
import { normalizeUTMifyToken } from '../_shared/utmify/token-normalizer.ts';

const { normalized: token, changes } = normalizeUTMifyToken(rawToken);
if (changes.length > 0) {
  log.warn("Token UTMify normalizado", { changes });
}
```

---

## Testes Unitários

### `token-normalizer.test.ts`
```typescript
Deno.test("normalizeUTMifyToken removes tabs and newlines", () => { ... });
Deno.test("normalizeUTMifyToken removes NBSP", () => { ... });
Deno.test("normalizeUTMifyToken removes multiple surrounding quotes", () => { ... });
Deno.test("normalizeUTMifyToken preserves internal spaces", () => { ... });
Deno.test("normalizeUTMifyToken removes zero-width chars", () => { ... });
Deno.test("computeTokenFingerprint returns 12 char hex", () => { ... });
```

---

## Documentação

### Atualização do `docs/EDGE_FUNCTIONS_REGISTRY.md`

Adicionar seção:
```markdown
### UTMify Shared Module (RISE V3)

| Arquivo | Linhas | Responsabilidade |
|---------|--------|------------------|
| `_shared/utmify/types.ts` | ~80 | Tipos unificados |
| `_shared/utmify/constants.ts` | ~25 | Constantes |
| `_shared/utmify/token-normalizer.ts` | ~60 | SSOT normalização |
| `_shared/utmify/dispatcher.ts` | ~90 | Função principal |
| ... | ... | ... |

> **Regra**: Token nunca aparece em logs; apenas fingerprint (SHA-256 primeiros 12 chars)
```

---

## Ordem de Execução

1. **Criar diretório e arquivos base** (`_shared/utmify/`)
2. **Extrair tipos e constantes** (types.ts, constants.ts)
3. **Criar normalizador SSOT** (token-normalizer.ts) - **CRÍTICO**
4. **Extrair helpers** (date-formatter, payment-mapper)
5. **Extrair lógica de config** (config-checker.ts)
6. **Extrair token retrieval** (token-retriever.ts) - usa normalizador
7. **Extrair payload builder** (payload-builder.ts)
8. **Extrair order fetcher** (order-fetcher.ts)
9. **Criar dispatcher refatorado** (dispatcher.ts) - orquestra tudo
10. **Criar barrel export** (index.ts)
11. **Atualizar consumidores** (8 arquivos)
12. **Atualizar vault-save** (usar normalizeUTMifyToken)
13. **Atualizar utmify-conversion** (usar normalizeUTMifyToken)
14. **Deletar arquivo antigo** (utmify-dispatcher.ts)
15. **Adicionar testes** (token-normalizer.test.ts, etc)
16. **Atualizar docs** (EDGE_FUNCTIONS_REGISTRY.md)

---

## Métricas de Sucesso (RISE V3)

| Métrica | Antes | Depois | Status |
|---------|-------|--------|--------|
| Arquivo maior | 515 linhas | ~90 linhas | **COMPLIANT** |
| Duplicação sanitização | 3 locais | 1 (SSOT) | **ZERO DT** |
| Single Responsibility | Violado | Respeitado | **SOLID** |
| Testabilidade | Baixa | Alta | **10/10** |
| Rastreabilidade (fingerprint) | Nenhuma | SHA-256 | **Auditável** |

---

## Detalhamento Técnico: `token-normalizer.ts`

Este é o arquivo mais crítico - resolve o problema de debugging atual:

```typescript
/**
 * Token Normalizer - SSOT (Single Source of Truth)
 * 
 * @module _shared/utmify/token-normalizer
 * @version 1.0.0 - RISE Protocol V3
 * 
 * Centraliza TODA a lógica de normalização de tokens UTMify.
 * Usado por:
 * - vault-save (no momento de salvar)
 * - token-retriever (no momento de recuperar)
 * - utmify-conversion (compatibilidade)
 */

export interface TokenNormalizationResult {
  normalized: string;
  originalLength: number;
  normalizedLength: number;
  changes: string[];
}

/**
 * Regex para caracteres invisíveis conhecidos
 */
const INVISIBLE_CHARS_REGEX = /[\u0000-\u001F\u007F\u00A0\u200B-\u200F\uFEFF\u2028\u2029]/g;

/**
 * Normaliza token UTMify removendo caracteres problemáticos
 * 
 * REGRAS (ordem importa):
 * 1. NFKC normalization (unicode "parecido")
 * 2. Remove invisible chars
 * 3. Trim bordas
 * 4. Remove aspas envolventes (múltiplas)
 * 5. NÃO remove espaços internos (podem ser significativos)
 */
export function normalizeUTMifyToken(raw: string): TokenNormalizationResult {
  const changes: string[] = [];
  let token = raw;
  const originalLength = raw.length;
  
  // 1. NFKC normalization
  const nfkc = token.normalize('NFKC');
  if (nfkc !== token) {
    changes.push('applied_nfkc');
    token = nfkc;
  }
  
  // 2. Remove invisible chars
  const noInvisible = token.replace(INVISIBLE_CHARS_REGEX, '');
  if (noInvisible !== token) {
    changes.push(`removed_${token.length - noInvisible.length}_invisible_chars`);
    token = noInvisible;
  }
  
  // 3. Remove tabs, CR, LF (explícito)
  const noWhitespace = token.replace(/[\r\n\t]/g, '');
  if (noWhitespace !== token) {
    changes.push('removed_tabs_or_newlines');
    token = noWhitespace;
  }
  
  // 4. Trim bordas (espaços normais)
  const trimmed = token.trim();
  if (trimmed !== token) {
    changes.push('trimmed_edges');
    token = trimmed;
  }
  
  // 5. Remove aspas envolventes (múltiplas)
  const noQuotes = token.replace(/^["']+|["']+$/g, '');
  if (noQuotes !== token) {
    changes.push('removed_surrounding_quotes');
    token = noQuotes;
  }
  
  return {
    normalized: token,
    originalLength,
    normalizedLength: token.length,
    changes,
  };
}

/**
 * Computa fingerprint seguro do token (para logs)
 * Retorna primeiros 12 caracteres do SHA-256 hex
 */
export async function computeTokenFingerprint(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex.substring(0, 12);
}
```
