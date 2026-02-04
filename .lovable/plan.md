
# Plano de Implementação: Edge Function `utmify-validate-credentials`

## Objetivo

Criar uma Edge Function de diagnóstico que valida tokens UTMify fazendo um teste real contra a API oficial. Esta função permitirá:
1. Identificar se o token está correto no Vault
2. Ver o fingerprint SHA-256 do token (para comparação)
3. Verificar se a API UTMify aceita o token
4. Obter detalhes do erro da API (se houver)

---

## Análise de Soluções (RISE V3 §4.4)

### Solução A: Função simples de teste direto
- Manutenibilidade: 7/10
- Zero DT: 6/10
- Arquitetura: 6/10
- Escalabilidade: 8/10
- Segurança: 7/10
- **NOTA FINAL: 6.8/10**

### Solução B: Função modular reutilizando SSOT existente
- Manutenibilidade: 10/10
- Zero DT: 10/10
- Arquitetura: 10/10
- Escalabilidade: 10/10
- Segurança: 10/10
- **NOTA FINAL: 10.0/10**

### DECISÃO: Solução B (10.0/10)
Reutiliza o módulo `_shared/utmify/` existente, mantém consistência com a arquitetura e não cria código duplicado.

---

## Especificação Técnica

### Endpoint
```text
POST /functions/v1/utmify-validate-credentials
```

### Request Body
```typescript
interface ValidateRequest {
  vendorId: string;  // UUID do vendor a validar
}
```

### Response (Sucesso)
```typescript
interface ValidateResponse {
  valid: boolean;
  message: string;
  details: {
    fingerprint: string;        // SHA-256 primeiros 12 chars
    tokenLength: number;        // Tamanho do token normalizado
    normalizationApplied: boolean;
    normalizationChanges: string[];
    apiTest: {
      performed: boolean;
      statusCode?: number;
      response?: string;       // Resposta da API (truncada)
    };
    configStatus: {
      hasToken: boolean;
      eventsEnabled: string[];  // Lista de eventos habilitados
    };
  };
}
```

---

## Diagrama de Fluxo

```text
┌─────────────────────────────────────────────────────────────┐
│   utmify-validate-credentials                                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│   1. AUTENTICAÇÃO                                            │
│   - Validar sessão via unified-auth-v2                      │
│   - Verificar vendorId pertence ao usuário                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│   2. RECUPERAR TOKEN                                         │
│   - Usar getUTMifyToken() do módulo SSOT                    │
│   - Obter fingerprint e normalizationChanges                │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │ Token encontrado?             │
              └───────────────┬───────────────┘
                   │                    │
                   │ Não                │ Sim
                   ▼                    ▼
┌──────────────────────────┐   ┌──────────────────────────┐
│ Retornar:                │   │ 3. VERIFICAR CONFIG      │
│ valid: false             │   │ - Listar eventos         │
│ "Nenhum token"           │   │   habilitados            │
└──────────────────────────┘   └──────────────────────────┘
                                          │
                                          ▼
                               ┌──────────────────────────┐
                               │ 4. TESTE NA API UTMIFY   │
                               │ - Enviar request isTest  │
                               │ - Capturar status/resp   │
                               └──────────────────────────┘
                                          │
                                          ▼
                               ┌──────────────────────────┐
                               │ 5. RETORNAR DIAGNÓSTICO  │
                               │ - valid: true/false      │
                               │ - details completos      │
                               └──────────────────────────┘
```

---

## Estrutura de Arquivos

```text
supabase/functions/
├── utmify-validate-credentials/
│   └── index.ts                (~120 linhas)
└── _shared/utmify/
    ├── index.ts                 (já existe - adicionar export)
    ├── token-retriever.ts       (reutilizar)
    ├── config-checker.ts        (adicionar função listEnabledEvents)
    └── constants.ts             (reutilizar UTMIFY_API_URL)
```

---

## Implementação Detalhada

### Arquivo 1: `supabase/functions/utmify-validate-credentials/index.ts`

```typescript
/**
 * Edge Function: utmify-validate-credentials
 * 
 * @version 1.0.0 - RISE Protocol V3
 * 
 * Diagnóstico de tokens UTMify:
 * - Recupera token do Vault via SSOT
 * - Exibe fingerprint (SHA-256 12 chars)
 * - Testa contra API UTMify
 * - Retorna diagnóstico completo
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { handleCorsV2 } from "../_shared/cors-v2.ts";
import { createLogger } from "../_shared/logger.ts";
import { createServiceClient } from "../_shared/supabase-client.ts";
import { validateAndGetVendorSession } from "../_shared/unified-auth-v2.ts";
import { 
  getUTMifyToken, 
  UTMIFY_API_URL,
  PLATFORM_NAME 
} from "../_shared/utmify/index.ts";
import { listEnabledEvents } from "../_shared/utmify/config-checker.ts";

const log = createLogger("utmify-validate-credentials");

interface ValidateRequest {
  vendorId: string;
}

// ... implementação completa
```

### Arquivo 2: Adicionar função em `config-checker.ts`

```typescript
/**
 * Lista todos os eventos habilitados para um vendor
 * (Nova função para diagnóstico)
 */
export async function listEnabledEvents(
  supabase: SupabaseClient,
  vendorId: string
): Promise<string[]> {
  // Verificar cada evento e retornar lista dos habilitados
}
```

### Arquivo 3: Atualizar `index.ts` (barrel export)

Adicionar export da nova função `listEnabledEvents`.

---

## Lógica do Teste na API UTMify

Baseado na documentação oficial:
- Usar `isTest: true` no payload
- Enviar pedido mínimo válido
- Verificar resposta HTTP

```typescript
const testPayload = {
  orderId: `test_${Date.now()}`,
  platform: PLATFORM_NAME,
  paymentMethod: "pix",
  status: "waiting_payment",
  createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
  customer: {
    name: "Test Customer",
    email: "test@risecheckout.com",
    phone: null,
    document: null,
    country: "BR",
    ip: "127.0.0.1",
  },
  products: [{
    id: "test_product",
    name: "Test Product",
    planId: null,
    planName: null,
    quantity: 1,
    priceInCents: 1000,
  }],
  trackingParameters: {
    src: null, sck: null,
    utm_source: null, utm_campaign: null,
    utm_medium: null, utm_content: null, utm_term: null,
  },
  commission: {
    totalPriceInCents: 1000,
    gatewayFeeInCents: 0,
    userCommissionInCents: 1000,
    currency: "BRL",
  },
  isTest: true,  // <-- Flag de teste
};

const response = await fetch(UTMIFY_API_URL, {
  method: "POST",
  headers: {
    "x-api-token": token,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(testPayload),
});
```

---

## Segurança

1. **Autenticação obrigatória**: Usa `unified-auth-v2`
2. **Validação de propriedade**: Verifica se vendorId pertence ao usuário logado
3. **Token nunca exposto**: Apenas fingerprint SHA-256 nos logs e resposta
4. **Request de teste**: Usa `isTest: true` para não criar registros reais

---

## Documentação

### Atualizar `docs/EDGE_FUNCTIONS_REGISTRY.md`

Adicionar à tabela de Tracking & Analytics:
```markdown
| `utmify-validate-credentials` | `.../utmify-validate-credentials` | ✅ | sessions | Diagnóstico de tokens UTMify |
```

---

## Ordem de Execução

1. Adicionar função `listEnabledEvents` em `config-checker.ts`
2. Atualizar barrel export em `index.ts`
3. Criar `utmify-validate-credentials/index.ts`
4. Atualizar `docs/EDGE_FUNCTIONS_REGISTRY.md`
5. Deploy e teste

---

## Métricas RISE V3

| Métrica | Status |
|---------|--------|
| Linhas de código | ~120 (< 300) |
| Single Responsibility | ✅ Apenas diagnóstico |
| Reutilização de código | ✅ Usa módulo SSOT |
| Segurança | ✅ Auth + fingerprint |
| Testabilidade | ✅ Função pura |
| Documentação | ✅ Atualizar Registry |

---

## Exemplo de Resposta

### Token Válido
```json
{
  "valid": true,
  "message": "Token válido e funcionando",
  "details": {
    "fingerprint": "a1b2c3d4e5f6",
    "tokenLength": 64,
    "normalizationApplied": false,
    "normalizationChanges": [],
    "apiTest": {
      "performed": true,
      "statusCode": 200,
      "response": "{\"success\": true}"
    },
    "configStatus": {
      "hasToken": true,
      "eventsEnabled": ["pix_generated", "purchase_approved", "refund"]
    }
  }
}
```

### Token Inválido (rejeitado pela API)
```json
{
  "valid": false,
  "message": "Token rejeitado pela API UTMify",
  "details": {
    "fingerprint": "x9y8z7w6v5u4",
    "tokenLength": 64,
    "normalizationApplied": true,
    "normalizationChanges": ["trimmed_edges", "removed_surrounding_quotes"],
    "apiTest": {
      "performed": true,
      "statusCode": 401,
      "response": "Unauthorized"
    },
    "configStatus": {
      "hasToken": true,
      "eventsEnabled": []
    }
  }
}
```

### Sem Token Configurado
```json
{
  "valid": false,
  "message": "Nenhum token UTMify configurado para este vendor",
  "details": {
    "fingerprint": null,
    "tokenLength": 0,
    "normalizationApplied": false,
    "normalizationChanges": [],
    "apiTest": {
      "performed": false
    },
    "configStatus": {
      "hasToken": false,
      "eventsEnabled": []
    }
  }
}
```
