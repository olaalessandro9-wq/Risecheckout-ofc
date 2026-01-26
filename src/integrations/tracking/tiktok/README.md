# TikTok Pixel Module

> **Versão:** 2.0.0 - RISE Protocol V3 Compliant  
> **Última atualização:** Janeiro 2026

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
src/integrations/tracking/tiktok/
├── index.ts      # Barrel export
├── Pixel.tsx     # Componente React que injeta o script do TikTok Pixel
├── events.ts     # Funções para disparar eventos (trackPurchase, trackViewContent, etc.)
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
│  3. Checkout carrega pixels via useCheckoutProductPixels    │
│     └── Edge Function: checkout-loader                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  4. TrackingManager renderiza componente <Pixel />          │
│     └── Injeta script do TikTok Pixel no DOM                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  5. Eventos são disparados via funções do events.ts         │
│     └── trackPurchase(), trackViewContent(), etc.           │
└─────────────────────────────────────────────────────────────┘
```

## Tabelas do Banco de Dados

| Tabela | Descrição |
|--------|-----------|
| `vendor_pixels` | Cadastro de pixels do vendedor (pixel_id, platform, etc.) |
| `product_pixels` | Vinculação pixel ↔ produto (fire_on_pix, fire_on_card, etc.) |

## Uso do Componente

```tsx
import * as TikTok from "@/integrations/tracking/tiktok";

// Renderizar o pixel (feito pelo TrackingManager)
<TikTok.Pixel config={pixelConfig} />

// Disparar evento de compra
TikTok.trackPurchase({
  value: 99.90,
  currency: "BRL",
  contents: [{ content_id: "product-123", quantity: 1, price: 99.90 }],
});
```

## Eventos Disponíveis

| Função | Evento TikTok | Descrição |
|--------|---------------|-----------|
| `trackPurchase()` | `CompletePayment` | Conversão de compra |
| `trackViewContent()` | `ViewContent` | Visualização de produto |
| `trackInitiateCheckout()` | `InitiateCheckout` | Início do checkout |
| `trackAddToCart()` | `AddToCart` | Adição ao carrinho |
| `trackPlaceOrder()` | `PlaceAnOrder` | Pedido realizado |

## Conformidade RISE V3

- ✅ Zero `console.log` (usa `createLogger`)
- ✅ Zero `: any`
- ✅ Zero `@ts-ignore`
- ✅ Limite de 300 linhas respeitado
- ✅ Backend-only mutations (via Edge Functions)
- ✅ SSOT via XState para gerenciamento de pixels

## Changelog

### v2.0.0 (Janeiro 2026)
- ✅ Migração para novo sistema vendor_pixels + product_pixels
- ✅ Remoção de hooks anteriores (useTikTokConfig, shouldRunTikTok)
- ✅ Documentação atualizada para RISE V3

### v1.0.0 (Novembro 2025)
- ✅ Implementação inicial
