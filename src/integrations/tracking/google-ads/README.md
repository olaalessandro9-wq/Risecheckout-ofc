# Google Ads Module

> **Versão:** 2.1.0 - RISE Protocol V3 Compliant  
> **Última atualização:** Fevereiro 2026

## Arquitetura

Este módulo é parte do sistema de tracking do RiseCheckout.

### Sistema Atual (vendor_pixels + product_pixels)

Os pixels são gerenciados centralmente via **XState State Machine**:

| Responsabilidade | Localização |
|------------------|-------------|
| **Cadastro de Pixels** | `src/modules/pixels/` (SSOT via `pixelsMachine`) |
| **Vinculação ao Produto** | `ProductPixelsSelector` (apenas seleciona) |
| **Renderização no Checkout** | `TrackingManager.tsx` (usa prop `productPixels`) |
| **Disparo de Eventos** | `events.ts` deste módulo |

### Estrutura do Módulo

```
src/integrations/tracking/google-ads/
├── index.ts      # Barrel export
├── Tracker.tsx   # Componente React que injeta o script gtag.js
├── events.ts     # Funções para disparar eventos (trackPurchase, trackLead, etc.)
├── types.ts      # Interfaces TypeScript
└── README.md     # Esta documentação
```

## Fluxo de Dados

```
┌─────────────────────────────────────────────────────────────┐
│  1. Produtor cadastra pixel em /dashboard/integracoes       │
│     └── pixelsMachine (XState) → vendor_pixels              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  2. Vincula pixel ao produto via ProductPixelsSelector      │
│     └── product_pixels (tabela de junção)                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  3. Checkout recebe pixels via BFF unificado (Phase 2)      │
│     └── Edge Function: checkout-public-data                 │
│     └── Action: resolve-and-load                            │
│     └── Dados: productPixels[] incluídos na resposta        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  4. TrackingManager renderiza componente <Tracker />        │
│     └── Injeta script gtag.js no DOM                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  5. Eventos são disparados via funções do events.ts         │
│     └── trackPurchase(), trackLead(), etc.                  │
└─────────────────────────────────────────────────────────────┘
```

## Tabelas do Banco de Dados

| Tabela | Descrição |
|--------|-----------|
| `vendor_pixels` | Cadastro de pixels do vendedor (pixel_id, conversion_label, etc.) |
| `product_pixels` | Vinculação pixel ↔ produto (fire_on_pix, fire_on_card, etc.) |

## Uso do Componente

```tsx
import * as GoogleAds from "@/integrations/tracking/google-ads";

// Renderizar o tracker (feito pelo TrackingManager)
<GoogleAds.Tracker integration={googleAdsIntegration} />

// Disparar evento de conversão
GoogleAds.trackPurchase({
  conversionId: "AW-123456789",
  conversionLabel: "abc123",
  value: 99.90,
  currency: "BRL",
  transactionId: "order-123",
});
```

## Eventos Disponíveis

| Função | Evento Google Ads | Descrição |
|--------|-------------------|-----------|
| `trackPurchase()` | `conversion` | Conversão de compra |
| `trackLead()` | `conversion` | Geração de lead |
| `trackPageView()` | `page_view` | Visualização de página |

## Configuração de Conversão

O Google Ads requer um `conversion_label` para cada tipo de evento. Este label é configurado no cadastro do pixel e armazenado em `vendor_pixels.conversion_label`.

## Conformidade RISE V3

- ✅ Zero `console.log` (usa `createLogger`)
- ✅ Zero `: any`
- ✅ Zero `@ts-ignore`
- ✅ Limite de 300 linhas respeitado
- ✅ Backend-only mutations (via Edge Functions)
- ✅ SSOT via XState para gerenciamento de pixels

## Changelog

### v2.1.0 (Fevereiro 2026)
- ✅ Documentação atualizada para Phase 2 BFF architecture
- ✅ Fluxo de dados corrigido: resolve-and-load action

### v2.0.0 (Janeiro 2026)
- ✅ Migração para novo sistema vendor_pixels + product_pixels
- ✅ Remoção de hooks anteriores (useGoogleAdsConfig, shouldRunGoogleAds)
- ✅ Documentação atualizada para RISE V3

### v1.0.0 (Novembro 2025)
- ✅ Implementação inicial
