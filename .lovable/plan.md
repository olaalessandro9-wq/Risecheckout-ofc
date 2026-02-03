
# Plano: Checkout Publico - Arquitetura de Elite (Performance + Resiliencia)

## Status Atual

**RISE V3 Score Pre-Refatoracao: 7.5/10**

O checkout publico atual tem os seguintes problemas identificados:

| Problema | Categoria | Severidade |
|----------|-----------|------------|
| Bundle inclui `@dnd-kit/core` no modo public | Bundle Bloat | CRITICO |
| 4+ requisicoes HTTP em cascata | Performance | CRITICO |
| SDKs de pagamento carregados estaticamente | Bundle Bloat | ALTO |
| Zero retry automatico no BFF | Resiliencia | ALTO |
| Zero cache de dados | Performance | MEDIO |
| Tracking bloqueia thread principal | Performance | MEDIO |
| Zero circuit breaker | Resiliencia | ALTO |
| Zero fallback para erros de rede | Resiliencia | ALTO |

## Analise de Solucoes (RISE Protocol V3 Secao 4.4)

### Solucao A: Otimizacoes Pontuais

- Manutenibilidade: 7/10
- Zero DT: 5/10 (problemas estruturais permanecem)
- Arquitetura: 6/10 (nao resolve raiz)
- Escalabilidade: 7/10
- Seguranca: 10/10
- **NOTA FINAL: 6.8/10**
- Tempo estimado: 3 dias

### Solucao B: Performance + Lazy Loading

- Manutenibilidade: 8/10
- Zero DT: 7/10
- Arquitetura: 8/10
- Escalabilidade: 8/10
- Seguranca: 10/10
- **NOTA FINAL: 8.1/10**
- Tempo estimado: 2 semanas

### Solucao C: Arquitetura de Elite (Performance + Resiliencia + Estabilidade)

Redesenho completo com TRES pilares:

**Pilar 1: Performance Extrema**
- BFF Super-Unificado (1 requisicao)
- Gateway SDKs Dinamicos (lazy load)
- Bundle Splitting Agressivo
- Zero dependencias de builder no checkout publico
- Tracking 100% deferido

**Pilar 2: Resiliencia Total**
- Retry automatico com backoff exponencial
- Circuit breaker para proteger contra falhas em cascata
- Fallback UI para estados degradados
- Error boundaries especificos para checkout
- Offline detection com feedback ao usuario

**Pilar 3: Estabilidade Absoluta**
- Validacao Zod em runtime para TODOS os dados
- Logging estruturado para debug em producao
- Metricas de performance em tempo real
- Testes E2E completos para fluxo critico
- Zero breaking changes na API publica

- Manutenibilidade: 10/10 (modulos isolados)
- Zero DT: 10/10 (arquitetura perfeita)
- Arquitetura: 10/10 (SOLID completo)
- Escalabilidade: 10/10 (independente)
- Seguranca: 10/10 (sem impacto)
- **NOTA FINAL: 10.0/10**
- Tempo estimado: 4-6 semanas

### DECISAO: Solucao C (Nota 10.0)

Conforme Lei Suprema Secao 4.6: A melhor solucao VENCE. SEMPRE.

---

## Arquitetura Proposta

```text
                    ┌──────────────────────────────────────────────────┐
                    │              CHECKOUT PUBLICO V2                  │
                    │           (Arquitetura de Elite)                  │
                    └──────────────────────────────────────────────────┘
                                         │
          ┌──────────────────────────────┼──────────────────────────────┐
          │                              │                              │
          ▼                              ▼                              ▼
┌──────────────────┐        ┌──────────────────┐        ┌──────────────────┐
│   PERFORMANCE    │        │   RESILIENCIA    │        │   ESTABILIDADE   │
│                  │        │                  │        │                  │
│ - BFF Unificado  │        │ - Retry + Backoff│        │ - Zod Validation │
│ - Lazy Gateways  │        │ - Circuit Breaker│        │ - Error Boundary │
│ - Bundle Split   │        │ - Offline Mode   │        │ - E2E Tests      │
│ - Defer Tracking │        │ - Fallback UI    │        │ - Metrics        │
└──────────────────┘        └──────────────────┘        └──────────────────┘
```

---

## Plano de Implementacao (6 Fases)

### Fase 1: Eliminar Dependencias Pesadas do Checkout Publico (Semana 1)

**PROBLEMA CRITICO IDENTIFICADO:**
O `CheckoutMasterLayout` importa `@dnd-kit/core` mesmo no modo `public`. Isso adiciona ~50KB ao bundle do checkout publico sem necessidade.

#### 1.1 Criar CheckoutPublicLayout (Componente Leve)

Criar novo componente SEM dependencias de builder:

```text
src/modules/checkout-public/components/layout/
├── CheckoutPublicLayout.tsx          # Layout sem @dnd-kit
├── PublicComponentRenderer.tsx       # Renderizador leve
└── index.ts
```

**Diferenca:**
- `CheckoutMasterLayout`: Usa `useDroppable` do @dnd-kit (BUILDER)
- `CheckoutPublicLayout`: Renderiza estaticamente (PUBLICO)

#### 1.2 Modificar CheckoutPublicContent.tsx

Substituir import:

**ANTES:**
```typescript
import { CheckoutMasterLayout } from "@/components/checkout/unified";
```

**DEPOIS:**
```typescript
import { CheckoutPublicLayout } from "./layout";
```

### Fase 2: BFF Super-Unificado com Resiliencia (Semana 1-2)

#### 2.1 Expandir resolve-and-load-handler.ts

Adicionar ao BFF:
- `productPixels` - Buscar pixels junto
- `vendorIntegration` - Config UTMify junto
- `visitId` - Track visit server-side (elimina chamada HTTP)

```text
supabase/functions/checkout-public-data/handlers/resolve-and-load-handler.ts
```

**ANTES**: 4 requisicoes
**DEPOIS**: 1 requisicao

#### 2.2 Adicionar Retry com Backoff ao publicApi

Criar novo cliente com resiliencia:

```text
src/lib/api/resilient-client.ts
```

```typescript
interface ResilientOptions {
  maxRetries?: number;          // default: 3
  retryDelay?: number;          // default: 1000ms
  backoffMultiplier?: number;   // default: 2
  timeout?: number;             // default: 30000ms
  circuitBreakerThreshold?: number; // default: 5 falhas
}

async function callWithRetry<T>(
  fn: string,
  body: unknown,
  options: ResilientOptions
): Promise<ApiResponse<T>>
```

#### 2.3 Atualizar Actor de Fetch

```text
src/modules/checkout-public/machines/checkoutPublicMachine.actors.ts
```

Usar cliente resiliente em vez de publicApi simples.

### Fase 3: Gateway SDKs Dinamicos (Semana 2-3)

#### 3.1 Criar Wrappers Dinamicos

```text
src/lib/payment-gateways/dynamic/
├── index.ts
├── DynamicMercadoPagoForm.tsx
├── DynamicStripeForm.tsx
├── GatewaySkeleton.tsx
└── hooks/
    ├── useGatewayLoader.ts
    └── useGatewayReadiness.ts
```

**Exemplo de Wrapper:**
```typescript
// DynamicMercadoPagoForm.tsx
const MercadoPagoCardForm = lazy(() => 
  import('@/lib/payment-gateways/gateways/mercado-pago')
    .then(m => ({ default: m.MercadoPagoCardForm }))
);

export const DynamicMercadoPagoForm: React.FC<Props> = (props) => (
  <Suspense fallback={<GatewaySkeleton />}>
    <MercadoPagoCardForm {...props} />
  </Suspense>
);
```

#### 3.2 Atualizar GatewayCardForm

```text
src/components/checkout/payment/GatewayCardForm.tsx
```

Usar componentes dinamicos com fallback visual.

### Fase 4: Error Boundaries e Fallback UI (Semana 3)

#### 4.1 Criar CheckoutErrorBoundary

```text
src/modules/checkout-public/components/CheckoutErrorBoundary.tsx
```

Error boundary especifico para o checkout com:
- Retry automatico para erros de rede
- Fallback UI amigavel
- Logging para debug

#### 4.2 Criar OfflineIndicator

```text
src/modules/checkout-public/components/OfflineIndicator.tsx
```

Detecta perda de conexao e mostra feedback visual.

#### 4.3 Criar PaymentGatewayFallback

```text
src/modules/checkout-public/components/PaymentGatewayFallback.tsx
```

Se o SDK nao carregar, mostra mensagem amigavel com opcao de tentar novamente.

### Fase 5: Tracking Deferido e Nao-Bloqueante (Semana 3-4)

#### 5.1 Criar Hook de Tracking Deferido

```text
src/hooks/checkout/useDeferredTracking.ts
```

```typescript
export function useDeferredTracking(callback: () => void, deps: unknown[]) {
  useEffect(() => {
    if ('requestIdleCallback' in window) {
      const id = requestIdleCallback(() => callback(), { timeout: 2000 });
      return () => cancelIdleCallback(id);
    }
    const id = setTimeout(callback, 100);
    return () => clearTimeout(id);
  }, deps);
}
```

#### 5.2 Modificar useVisitTracker

```text
src/hooks/checkout/useVisitTracker.ts
```

Usar `useDeferredTracking` em vez de useEffect direto.

#### 5.3 Modificar TrackingManager

```text
src/components/checkout/v2/TrackingManager.tsx
```

Renderizar scripts de forma nao-bloqueante com `requestIdleCallback`.

### Fase 6: Bundle Splitting e Metricas (Semana 4-5)

#### 6.1 Configurar Vite para Splitting Agressivo

```text
vite.config.ts
```

```typescript
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        // Checkout publico isolado
        'checkout-public': [
          'src/modules/checkout-public',
          'src/components/checkout/shared',
          'src/components/checkout/payment',
        ],
        // SDKs de pagamento separados
        'gateway-mercadopago': ['src/lib/payment-gateways/gateways/mercado-pago'],
        'gateway-stripe': ['src/lib/payment-gateways/gateways/stripe'],
        // Dashboard separado (nao carrega no checkout)
        'dashboard': ['recharts', '@tiptap', '@dnd-kit'],
      },
    },
  },
}
```

#### 6.2 Implementar Metricas de Performance

```text
src/modules/checkout-public/hooks/usePerformanceMetrics.ts
```

```typescript
export function usePerformanceMetrics() {
  useEffect(() => {
    // Web Vitals
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          // Log to analytics
        }
      });
      observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input'] });
    }
  }, []);
}
```

#### 6.3 Testes E2E de Performance

```text
e2e/specs/checkout-performance.spec.ts
```

Validar:
- LCP < 1.5s
- TTI < 2s
- Bundle size < 200KB gzipped

---

## Arvore de Arquivos Final

```text
# Fase 1: Layout Leve
src/modules/checkout-public/components/layout/
├── CheckoutPublicLayout.tsx          # CRIAR
├── PublicComponentRenderer.tsx       # CRIAR
└── index.ts                          # CRIAR

# Fase 2: BFF Resiliente
supabase/functions/checkout-public-data/handlers/resolve-and-load-handler.ts  # MODIFICAR
src/lib/api/resilient-client.ts                                               # CRIAR
src/modules/checkout-public/machines/checkoutPublicMachine.actors.ts          # MODIFICAR
src/modules/checkout-public/contracts/resolveAndLoadResponse.schema.ts        # MODIFICAR
src/modules/checkout-public/mappers/mapResolveAndLoad.ts                      # MODIFICAR

# Fase 3: Gateways Dinamicos
src/lib/payment-gateways/dynamic/
├── index.ts                          # CRIAR
├── DynamicMercadoPagoForm.tsx        # CRIAR
├── DynamicStripeForm.tsx             # CRIAR
├── GatewaySkeleton.tsx               # CRIAR
└── hooks/
    ├── useGatewayLoader.ts           # CRIAR
    └── useGatewayReadiness.ts        # CRIAR
src/components/checkout/payment/GatewayCardForm.tsx  # MODIFICAR

# Fase 4: Resiliencia
src/modules/checkout-public/components/
├── CheckoutErrorBoundary.tsx         # CRIAR
├── OfflineIndicator.tsx              # CRIAR
└── PaymentGatewayFallback.tsx        # CRIAR

# Fase 5: Tracking Deferido
src/hooks/checkout/useDeferredTracking.ts           # CRIAR
src/hooks/checkout/useVisitTracker.ts               # MODIFICAR
src/components/checkout/v2/TrackingManager.tsx      # MODIFICAR

# Fase 6: Bundle e Metricas
vite.config.ts                                      # MODIFICAR
src/modules/checkout-public/hooks/usePerformanceMetrics.ts  # CRIAR
e2e/specs/checkout-performance.spec.ts              # CRIAR

# Componente Principal
src/modules/checkout-public/components/CheckoutPublicContent.tsx  # MODIFICAR
```

---

## Secao Tecnica: Detalhes de Implementacao

### Metricas de Sucesso

| Metrica | Atual (Estimado) | Meta | Justificativa |
|---------|------------------|------|---------------|
| Bundle Size (Checkout) | ~800KB gzipped | < 150KB gzipped | -80% para carregamento rapido |
| Requisicoes HTTP (load) | 4+ | 1 | -75% latencia |
| Time to Interactive (3G) | ~3-4s | < 1.5s | Conversao critica |
| LCP | ~2.5s | < 1.2s | Core Web Vital |
| Retry Success Rate | 0% (nenhum) | 95%+ | Resiliencia |
| Uptime SLA | N/A | 99.9% | Estabilidade |

### Exemplo: Cliente Resiliente

```typescript
// src/lib/api/resilient-client.ts

const DEFAULT_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000,
  backoffMultiplier: 2,
  timeout: 30000,
};

export async function callWithRetry<T>(
  functionName: string,
  body: unknown,
  options: Partial<typeof DEFAULT_CONFIG> = {}
): Promise<ApiResponse<T>> {
  const config = { ...DEFAULT_CONFIG, ...options };
  let lastError: ApiError | null = null;

  for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
    const result = await publicApi.call<T>(functionName, body, {
      timeout: config.timeout,
    });

    if (result.data) {
      return result;
    }

    lastError = result.error;

    // Nao fazer retry para erros nao-transientes
    if (!isRetryableError(result.error)) {
      break;
    }

    // Backoff exponencial
    if (attempt < config.maxRetries) {
      const delay = config.retryDelay * Math.pow(config.backoffMultiplier, attempt - 1);
      await wait(delay);
    }
  }

  return { data: null, error: lastError };
}
```

### Exemplo: Layout Leve sem DND

```typescript
// src/modules/checkout-public/components/layout/CheckoutPublicLayout.tsx

// ZERO imports de @dnd-kit
import React from 'react';
import { PublicComponentRenderer } from './PublicComponentRenderer';
import type { CheckoutCustomization } from '@/hooks/useCheckoutEditor';
import type { ThemePreset } from '@/types/theme';

interface Props {
  design: ThemePreset;
  customization?: CheckoutCustomization;
  children: React.ReactNode;
}

export const CheckoutPublicLayout: React.FC<Props> = ({
  design,
  customization,
  children,
}) => {
  const hasTop = customization?.topComponents?.length;
  const hasBottom = customization?.bottomComponents?.length;

  return (
    <div 
      className="min-h-screen py-4 px-2 md:py-8 md:px-4"
      style={{
        fontFamily: 'Inter, system-ui, sans-serif',
        backgroundColor: design.colors.background,
      }}
    >
      <div className="max-w-7xl mx-auto">
        {hasTop && (
          <div className="mb-4 md:mb-6">
            {customization.topComponents.map((c) => (
              <PublicComponentRenderer key={c.id} component={c} design={design} />
            ))}
          </div>
        )}

        {children}

        {hasBottom && (
          <div className="mt-4 md:mt-6">
            {customization.bottomComponents.map((c) => (
              <PublicComponentRenderer key={c.id} component={c} design={design} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
```

---

## Riscos e Mitigacoes

| Risco | Probabilidade | Impacto | Mitigacao |
|-------|---------------|---------|-----------|
| SDK de pagamento falha ao carregar | Baixa | Alto | Retry automatico + fallback UI |
| BFF timeout | Baixa | Alto | Retry com backoff + timeout otimizado |
| Usuario perde conexao no meio | Media | Alto | Offline detection + queue local |
| Breaking change em API externa | Baixa | Alto | Versoes fixas + testes E2E |
| Chunk nao carrega | Baixa | Alto | lazyWithRetry ja existe + Error Boundary |

---

## Validacao Final

### Checklist de Qualidade RISE V3

| Pergunta | Resposta |
|----------|----------|
| Esta e a MELHOR solucao possivel? | Sim, nota 10.0/10 |
| Existe alguma solucao com nota maior? | Nao |
| Isso cria divida tecnica? | Zero |
| Precisaremos "melhorar depois"? | Nao |
| O codigo sobrevive 10 anos sem refatoracao? | Sim |
| Estou escolhendo isso por ser mais rapido? | Nao |

### Resultado Final Esperado

**RISE V3 Score: 10.0/10**

- Zero requisicoes em cascata
- Bundle minimo (< 150KB)
- SDKs carregados sob demanda
- Tracking 100% nao-bloqueante
- Retry automatico com backoff
- Error boundaries especificos
- Offline detection
- Fallback UI amigavel
- Metricas em tempo real
- Testes E2E de performance
- Zero dependencias de builder no checkout publico
