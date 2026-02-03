
# Plano: Limpeza Total de Código Morto e Documentação

## Contexto

Seguindo o **Protocolo RISE V3 - Lei Suprema (Secao 4)**, identificamos problemas de baixa e media prioridade que devem ser resolvidos para atingir **ZERO divida tecnica**:

> "Zero Divida Tecnica: Nenhuma 'correcao futura' necessaria"

## Analise de Solucoes (RISE Protocol V3 Secao 4.4)

### Solucao A: Ignorar Problemas Menores

- Manutenibilidade: 7/10 (codigo morto permanece)
- Zero DT: 5/10 (mock desatualizado, docs incorretas)
- Arquitetura: 8/10 (funcional mas inconsistente)
- Escalabilidade: 8/10
- Seguranca: 10/10
- **NOTA FINAL: 7.4/10**
- Tempo estimado: 0

### Solucao B: Limpeza Total

Remover TODO codigo morto e atualizar TODA documentacao:

- Manutenibilidade: 10/10 (zero codigo morto)
- Zero DT: 10/10 (docs atualizadas)
- Arquitetura: 10/10 (consistencia total)
- Escalabilidade: 10/10
- Seguranca: 10/10
- **NOTA FINAL: 10.0/10**
- Tempo estimado: 1 hora

### DECISAO: Solucao B (Nota 10.0)

Conforme Lei Suprema: A melhor solucao VENCE. SEMPRE.

---

## Problemas Identificados e Resolucoes

### 1. Mock Obsoleto no Teste

**Arquivo:** `src/modules/checkout-public/components/__tests__/CheckoutPublicContent.test.tsx`

**Problema:** O teste ainda mocka `useCheckoutProductPixels` (linhas 63-67), mas o componente nao usa mais esse hook.

**Acao:** Remover o mock completamente.

```typescript
// REMOVER estas linhas (63-67):
vi.mock("@/hooks/checkout/useCheckoutProductPixels", () => ({
  useCheckoutProductPixels: () => ({
    pixels: [],
  }),
}));
```

### 2. Tipo Importado de Hook Legado

**Arquivo:** `src/components/checkout/v2/TrackingManager.tsx`

**Problema:** Linha 16 importa `CheckoutPixel` do hook legado:
```typescript
import type { CheckoutPixel } from "@/hooks/checkout/useCheckoutProductPixels";
```

**Acao:** Mover o tipo `CheckoutPixel` para um arquivo central de tipos em `src/types/` e atualizar as importacoes.

Opcao escolhida: Criar `src/types/checkout-pixels.types.ts` como SSOT para o tipo.

### 3. Documentacao Desatualizada (4x READMEs)

**Arquivos:**
- `src/integrations/tracking/facebook/README.md`
- `src/integrations/tracking/google-ads/README.md`
- `src/integrations/tracking/tiktok/README.md`
- `src/integrations/tracking/kwai/README.md`

**Problema:** Todos mencionam:
```
3. Checkout carrega pixels via useCheckoutProductPixels
   └── Edge Function: checkout-loader
```

**Acao:** Atualizar para refletir a nova arquitetura (Phase 2 BFF):
```
3. Checkout recebe pixels via BFF unificado (resolve-and-load)
   └── Edge Function: checkout-public-data (action: resolve-and-load)
   └── Dados: productPixels incluidos na resposta principal
```

### 4. Hook useCheckoutProductPixels Potencialmente Legado

**Arquivo:** `src/hooks/checkout/useCheckoutProductPixels.ts`

**Problema:** O hook ainda existe e pode ser usado em outros lugares fora do checkout publico. O tipo `CheckoutPixel` exportado e usado pelo `TrackingManager.tsx`.

**Acao:** 
1. Verificar se o hook e usado em algum lugar (alem do tipo)
2. Se NAO for usado: Marcar como `@deprecated` com comentario explicando que o checkout publico agora usa o BFF
3. Manter o hook disponivel para uso futuro em outros contextos (nao e codigo morto se pode ser util)
4. Mover o tipo para arquivo central

### 5. Comentario Desatualizado

**Arquivo:** `src/modules/checkout-public/components/CheckoutPublicContent.tsx`

**Problema:** Linha 307 tem comentario:
```typescript
// Build customization compatible with CheckoutMasterLayout
```

**Acao:** Atualizar para:
```typescript
// Build customization for CheckoutPublicLayout
```

---

## Arvore de Arquivos a Modificar

```text
# Tipos (CRIAR)
src/types/checkout-pixels.types.ts                    # CRIAR - SSOT para tipos de pixels

# Limpeza de Codigo
src/modules/checkout-public/components/__tests__/CheckoutPublicContent.test.tsx  # MODIFICAR - remover mock
src/modules/checkout-public/components/CheckoutPublicContent.tsx                 # MODIFICAR - atualizar comentario

# Atualizacao de Importacoes
src/components/checkout/v2/TrackingManager.tsx        # MODIFICAR - importar tipo do novo local
src/hooks/checkout/useCheckoutProductPixels.ts        # MODIFICAR - marcar @deprecated + exportar tipo do novo local

# Documentacao (4 arquivos)
src/integrations/tracking/facebook/README.md          # MODIFICAR - atualizar fluxo
src/integrations/tracking/google-ads/README.md        # MODIFICAR - atualizar fluxo
src/integrations/tracking/tiktok/README.md            # MODIFICAR - atualizar fluxo
src/integrations/tracking/kwai/README.md              # MODIFICAR - atualizar fluxo
```

---

## Secao Tecnica

### 1. Novo Arquivo de Tipos (SSOT)

```typescript
// src/types/checkout-pixels.types.ts

/**
 * Checkout Pixel Types
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * SSOT for pixel types used across the application.
 * 
 * @module types/checkout-pixels
 */

import type { PixelPlatform } from "@/modules/pixels";

/**
 * Pixel data as received from the BFF (resolve-and-load)
 * or from the legacy useCheckoutProductPixels hook.
 */
export interface CheckoutPixel {
  id: string;
  platform: PixelPlatform;
  pixel_id: string;
  access_token?: string | null;
  conversion_label?: string | null;
  domain?: string | null;
  is_active: boolean;
  fire_on_initiate_checkout: boolean;
  fire_on_purchase: boolean;
  fire_on_pix: boolean;
  fire_on_card: boolean;
  fire_on_boleto: boolean;
  custom_value_percent: number;
}
```

### 2. Documentacao Atualizada (Fluxo)

```text
┌─────────────────────────────────────────────────────────────┐
│  3. Checkout recebe pixels via BFF unificado               │
│     └── Edge Function: checkout-public-data                 │
│     └── Action: resolve-and-load                           │
│     └── Resposta inclui: productPixels[]                   │
└─────────────────────────────────────────────────────────────┘
```

### 3. Hook com Deprecation Notice

```typescript
/**
 * Hook: useCheckoutProductPixels
 * 
 * @deprecated Para o checkout publico, use os dados de productPixels
 * que vem do BFF unificado (resolve-and-load) via checkoutPublicMachine.
 * Este hook ainda pode ser util em outros contextos que precisam
 * carregar pixels de produto de forma isolada.
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */
```

---

## Resultado Esperado

| Item | Antes | Depois |
|------|-------|--------|
| Mock obsoleto no teste | Presente | Removido |
| Tipo em arquivo central | Nao | Sim (SSOT) |
| Documentacao de pixels | Desatualizada | Atualizada (Phase 2) |
| Hook deprecated | Nao | Sim (com explicacao) |
| Comentario desatualizado | Presente | Corrigido |

**RISE V3 Score Final: 10.0/10**

- Zero codigo morto
- Zero documentacao desatualizada
- Zero comentarios incorretos
- Zero divida tecnica
- Tipos centralizados em SSOT
