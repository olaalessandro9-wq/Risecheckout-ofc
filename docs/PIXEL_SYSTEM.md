# Sistema de Pixels - RiseCheckout

> **Nota:** Para visão geral do sistema de Trackeamento (Pixels + UTMify), consulte [`TRACKING_MODULE.md`](./TRACKING_MODULE.md).

## 1. Visão Geral

O Sistema de Pixels permite rastreamento de conversões multi-plataforma para vendedores do RiseCheckout. Suporta as principais plataformas de anúncios do mercado brasileiro.

### Plataformas Suportadas

| Plataforma | Script Global | Evento de Compra | Conversions API |
|------------|---------------|------------------|-----------------|
| Facebook   | `fbq`         | Purchase         | ✅ Sim          |
| TikTok     | `ttq`         | CompletePayment  | ✅ Sim          |
| Google Ads | `gtag`        | conversion       | ❌ Não          |
| Kwai       | `kwaiq`       | PlaceOrder       | ❌ Não          |
| UTMify     | API REST      | Webhook          | ✅ Nativo       |

---

## 2. Arquitetura

### 2.1 Diagrama de Camadas

```
┌─────────────────────────────────────────────────────────────┐
│                    CAMADA DE APRESENTAÇÃO                    │
├─────────────────────────────────────────────────────────────┤
│  PixelLibrary   │   PixelCard   │   PixelForm   │ Platform  │
│  (CRUD UI)      │   (Display)   │   (Form)      │ Icon      │
└────────┬────────┴───────────────┴───────────────┴───────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                    CAMADA DE LÓGICA (HOOKS)                  │
├─────────────────────────────────────────────────────────────┤
│  useVendorPixels      │   useProductPixels    │  useCheckout│
│  (Biblioteca CRUD)    │   (Links produto)     │  Pixels     │
└────────┬──────────────┴───────────┬───────────┴─────────────┘
         │                          │
         ▼                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    CAMADA DE TRACKING                        │
├─────────────────────────────────────────────────────────────┤
│  Facebook   │   TikTok   │   Google Ads   │   Kwai   │UTMify│
│  Pixel.tsx  │  Pixel.tsx │  Tracker.tsx   │Pixel.tsx │Track │
└─────────────┴────────────┴────────────────┴──────────┴──────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                    CAMADA DE PERSISTÊNCIA                    │
├─────────────────────────────────────────────────────────────┤
│     vendor_pixels (Supabase)   │   product_pixels (Supabase)│
└────────────────────────────────┴────────────────────────────┘
```

### 2.2 Estrutura de Arquivos

> **Nota (2026-01-21):** A estrutura foi migrada para `src/modules/pixels/` com XState como SSOT.

```
src/
├── modules/pixels/              # Módulo de Pixels (XState SSOT)
│   ├── machines/                
│   │   ├── pixelsMachine.ts     # State Machine principal
│   │   └── index.ts             
│   ├── context/                 
│   │   ├── PixelsContext.tsx    # Provider + hook
│   │   └── index.ts             
│   ├── components/              
│   │   ├── PixelLibrary.tsx     # Lista de pixels
│   │   ├── PixelCard.tsx        # Card individual
│   │   ├── PixelForm.tsx        # Formulário CRUD
│   │   └── index.ts             
│   └── types.ts                 
│
├── hooks/
│   ├── useVendorPixels.ts       # CRUD da biblioteca de pixels
│   ├── useProductPixels.ts      # Links pixel ↔ produto
│   └── checkout/
│       └── useCheckoutProductPixels.ts  # Pixels no checkout público
│
└── integrations/tracking/       # Módulos de tracking por plataforma
    ├── facebook/
    ├── tiktok/
    ├── google-ads/
    ├── kwai/
    └── utmify/
```

### 2.3 Navegação

- **Rota:** `/dashboard/trackeamento` (Tab: Pixels)
- **Grupo de Navegação:** Configurações

---

## 3. Modelo de Dados

### 3.1 Tabela `vendor_pixels`

Armazena a biblioteca de pixels do vendedor.

| Coluna           | Tipo        | Null | Default          | Descrição                    |
|------------------|-------------|------|------------------|------------------------------|
| id               | uuid        | NO   | gen_random_uuid  | PK                           |
| vendor_id        | uuid        | NO   | -                | FK → auth.users              |
| platform         | text        | NO   | -                | facebook/tiktok/google_ads/kwai |
| name             | text        | NO   | -                | Nome amigável                |
| pixel_id         | text        | NO   | -                | ID do pixel na plataforma    |
| access_token     | text        | YES  | null             | Token para Conversions API   |
| conversion_label | text        | YES  | null             | Label (Google Ads only)      |
| domain           | text        | YES  | null             | Domínio (Facebook only)      |
| is_active        | boolean     | NO   | true             | Ativo/Inativo                |
| created_at       | timestamptz | NO   | now()            | Criação                      |
| updated_at       | timestamptz | NO   | now()            | Atualização                  |

### 3.2 Tabela `product_pixels`

Vincula pixels a produtos específicos com configurações de disparo.

| Coluna                    | Tipo        | Null | Default          | Descrição                    |
|---------------------------|-------------|------|------------------|------------------------------|
| id                        | uuid        | NO   | gen_random_uuid  | PK                           |
| product_id                | uuid        | NO   | -                | FK → products                |
| pixel_id                  | uuid        | NO   | -                | FK → vendor_pixels           |
| fire_on_initiate_checkout | boolean     | NO   | true             | Disparar em InitiateCheckout |
| fire_on_purchase          | boolean     | NO   | true             | Disparar em Purchase         |
| fire_on_pix               | boolean     | NO   | true             | Disparar em pagamento PIX    |
| fire_on_card              | boolean     | NO   | true             | Disparar em cartão           |
| fire_on_boleto            | boolean     | NO   | true             | Disparar em boleto           |
| custom_value_percent      | integer     | NO   | 100              | % do valor para relatório    |
| created_at                | timestamptz | NO   | now()            | Criação                      |

### 3.3 Diagrama de Relacionamento

```
vendor_pixels (1) ←────→ (N) product_pixels (N) ←────→ (1) products
      │                                                      │
      └──────────────────────┬───────────────────────────────┘
                             │
                      RLS: vendor_id
```

---

## 4. Hooks

### 4.1 `useVendorPixels`

**Propósito:** CRUD completo da biblioteca de pixels do vendedor.

**Retorno:**
```typescript
{
  pixels: VendorPixel[];
  isLoading: boolean;
  createPixel: (data: CreatePixelData) => Promise<void>;
  updatePixel: (id: string, data: UpdatePixelData) => Promise<void>;
  deletePixel: (id: string) => Promise<void>;
  refetch: () => void;
}
```

**Uso:**
```typescript
const { pixels, createPixel } = useVendorPixels();

await createPixel({
  platform: 'facebook',
  name: 'Meu Pixel Principal',
  pixel_id: '123456789012345',
  access_token: 'EAAxxxxxx' // opcional
});
```

### 4.2 `useProductPixels`

**Propósito:** Gerenciar vínculos entre pixels e produtos.

**Retorno:**
```typescript
{
  vendorPixels: VendorPixel[];        // Biblioteca disponível
  linkedPixels: LinkedPixel[];        // Vinculados ao produto
  linkPixel: (data: LinkData) => Promise<void>;
  unlinkPixel: (linkId: string) => Promise<void>;
  updateLink: (linkId: string, data: UpdateLinkData) => Promise<void>;
  isLoading: boolean;
}
```

**Uso:**
```typescript
const { linkedPixels, linkPixel } = useProductPixels(productId);

await linkPixel({
  pixel_id: 'uuid-do-pixel',
  fire_on_purchase: true,
  fire_on_pix: true,
  fire_on_card: true,
  fire_on_boleto: false,
  custom_value_percent: 100
});
```

### 4.3 `useCheckoutProductPixels`

**Propósito:** Carregar pixels para disparo no checkout público.

**Retorno:**
```typescript
{
  pixels: CheckoutPixel[];
  isLoading: boolean;
  error: Error | null;
}
```

**Contexto:** Usado internamente pelo `TrackingManager` no checkout.

---

## 5. Módulos de Tracking

Cada plataforma segue estrutura modular padronizada:

```
integrations/tracking/{platform}/
├── index.ts       # Barrel export
├── types.ts       # Interfaces específicas
├── events.ts      # Funções de disparo (trackPurchase, etc.)
├── hooks.ts       # useConfig, shouldRun
├── Pixel.tsx      # Componente de injeção do script
└── README.md      # Documentação do módulo
```

### Eventos por Plataforma

| Plataforma  | PageView | InitiateCheckout | Purchase |
|-------------|----------|------------------|----------|
| Facebook    | PageView | InitiateCheckout | Purchase |
| TikTok      | ViewContent | InitiateCheckout | CompletePayment |
| Google Ads  | page_view | begin_checkout | conversion |
| Kwai        | - | - | PlaceOrder |
| UTMify      | - | - | Webhook |

---

## 6. Fluxo de Disparo

```
┌─────────────────────────────────────────────────────────────────────┐
│                     FLUXO: DISPARO DE CONVERSÃO                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. CHECKOUT CARREGA                                                │
│     │                                                               │
│     ▼                                                               │
│  ┌─────────────────────────────────────────┐                        │
│  │ useCheckoutProductPixels(productId)     │                        │
│  │ → Busca product_pixels + vendor_pixels  │                        │
│  └────────────────┬────────────────────────┘                        │
│                   │                                                 │
│  2. INJETA SCRIPTS                                                  │
│     │                                                               │
│     ▼                                                               │
│  ┌─────────────────────────────────────────┐                        │
│  │ TrackingManager                         │                        │
│  │ → Renderiza Facebook.Pixel, TikTok.Pixel│                        │
│  │ → Scripts injetados no <head>           │                        │
│  └────────────────┬────────────────────────┘                        │
│                   │                                                 │
│  3. PAGAMENTO CONFIRMADO                                            │
│     │                                                               │
│     ▼                                                               │
│  ┌─────────────────────────────────────────┐                        │
│  │ Webhook do gateway                      │                        │
│  │ → Atualiza order status = paid          │                        │
│  └────────────────┬────────────────────────┘                        │
│                   │                                                 │
│  4. DISPARA EVENTO                                                  │
│     │                                                               │
│     ▼                                                               │
│  ┌─────────────────────────────────────────┐                        │
│  │ Facebook.trackPurchase()                │                        │
│  │ TikTok.trackPurchase()                  │                        │
│  │ GoogleAds.trackPurchase()               │                        │
│  └─────────────────────────────────────────┘                        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 7. Segurança (RLS)

### Políticas Aplicadas

```sql
-- vendor_pixels: Vendedor visualiza apenas seus pixels
CREATE POLICY "Vendor can view own pixels"
ON vendor_pixels FOR SELECT
USING (vendor_id = auth.uid());

-- vendor_pixels: Vendedor gerencia apenas seus pixels
CREATE POLICY "Vendor can manage own pixels"
ON vendor_pixels FOR ALL
USING (vendor_id = auth.uid());

-- product_pixels: Acesso via propriedade do produto
CREATE POLICY "Access via product ownership"
ON product_pixels FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM products p
    WHERE p.id = product_id
    AND p.vendor_id = auth.uid()
  )
);
```

### Dados Sensíveis

| Campo          | Proteção                          |
|----------------|-----------------------------------|
| access_token   | RLS + nunca exposto no frontend   |
| pixel_id       | RLS apenas                        |
| conversion_label | RLS apenas                      |

---

## 8. Guia: Adicionar Nova Plataforma

### Passo 1: Criar Módulo

```bash
mkdir -p src/integrations/tracking/{nova-plataforma}
```

### Passo 2: Criar Arquivos

```typescript
// types.ts
export interface NovaPlataformaConfig {
  pixelId: string;
  accessToken?: string;
}

// events.ts
export function trackPurchase(value: number, currency: string) {
  // Implementar disparo
}

// hooks.ts
export function useConfig(pixelId: string) {
  // Retornar configuração
}

// Pixel.tsx
export function Pixel({ pixelId }: { pixelId: string }) {
  // Injetar script no head
}

// index.ts
export * from './types';
export * from './events';
export * from './hooks';
export { Pixel } from './Pixel';
```

### Passo 3: Adicionar ao Enum de Plataformas

```typescript
// src/components/pixels/types.ts
export type PixelPlatform = 
  | 'facebook' 
  | 'tiktok' 
  | 'google_ads' 
  | 'kwai' 
  | 'nova_plataforma';

export const PLATFORM_INFO: Record<PixelPlatform, PlatformInfo> = {
  // ...existentes
  nova_plataforma: {
    label: 'Nova Plataforma',
    color: '#hexcolor',
    description: 'Descrição da plataforma',
    requiresAccessToken: true,
    requiresConversionLabel: false,
    requiresDomain: false,
  },
};
```

### Passo 4: Integrar no TrackingManager

```typescript
// src/components/checkout/v2/TrackingManager.tsx
import * as NovaPlataforma from "@/integrations/tracking/nova-plataforma";

// No render, adicionar:
{novaPlataformaPixels.map(pixel => (
  <NovaPlataforma.Pixel key={pixel.id} pixelId={pixel.pixel_id} />
))}
```

### Passo 5: Atualizar Banco de Dados

Adicionar novo valor ao enum (se necessário) via migration.

---

## 9. Conformidade RISE ARCHITECT PROTOCOL

| Regra                        | Status | Evidência                           |
|------------------------------|--------|-------------------------------------|
| Limite 300 linhas            | ✅     | Todos arquivos < 200 linhas         |
| Single Responsibility        | ✅     | Hooks separados por contexto        |
| Zero Secrets Expostos        | ✅     | access_token protegido por RLS      |
| TypeScript Rigoroso          | ✅     | Todas interfaces definidas          |
| Nomenclatura Inglês          | ✅     | Padrão consistente                  |
| Zero Gambiarras              | ✅     | Sem try-catch genéricos             |
| Desacoplamento               | ✅     | Camadas independentes               |

---

## 10. Troubleshooting

### Pixel não dispara

1. Verificar se o pixel está vinculado ao produto (`product_pixels`)
2. Verificar se `is_active = true` na `vendor_pixels`
3. Verificar se o evento específico está habilitado (`fire_on_purchase`, etc.)
4. Verificar console do navegador por erros de script

### Valor incorreto no relatório

1. Verificar `custom_value_percent` no vínculo
2. Fórmula: `valor_reportado = valor_real × (custom_value_percent / 100)`

### Token de acesso inválido (Facebook/TikTok)

1. Tokens expiram - verificar validade
2. Gerar novo token com permissões corretas
3. Atualizar via `useVendorPixels.updatePixel()`

---

**Última Atualização:** 12/01/2026
**Autor:** Rise Architect Protocol
