# Status da Refatoração - RiseCheckout

**Data:** 29 de Novembro de 2025
**Analista:** Manus AI

## 📊 Visão Geral

Este documento registra o estado atual da refatoração para arquitetura modular (Feature Folders) do projeto RiseCheckout.

## ✅ Concluído (100%)

### Tracking Integrations

Todas as integrações de rastreamento foram migradas para `src/integrations/tracking/` seguindo o padrão modular:

| Integração | Status | Localização | Arquivos |
|:---|:---:|:---|:---|
| **Facebook Pixel** | ✅ | `tracking/facebook/` | Pixel.tsx, events.ts, hooks.ts, types.ts, index.ts, README.md |
| **UTMify** | ✅ | `tracking/utmify/` | Tracker.tsx, events.ts, hooks.ts, types.ts, index.ts, README.md |
| **Google Ads** | ✅ | `tracking/google-ads/` | Tracker.tsx, events.ts, hooks.ts, types.ts, index.ts, README.md |
| **TikTok Pixel** | ✅ | `tracking/tiktok/` | Pixel.tsx, events.ts, hooks.ts, types.ts, index.ts, README.md |
| **Kwai Pixel** | ✅ | `tracking/kwai/` | Pixel.tsx, events.ts, hooks.ts, types.ts, index.ts, README.md |

**Padrão Estabelecido:**
```
tracking/{integration}/
├── index.ts          # Barrel export
├── types.ts          # TypeScript interfaces
├── events.ts         # Event tracking functions
├── hooks.ts          # React hooks
├── Pixel.tsx         # React component
└── README.md         # Documentation
```

**Uso no PublicCheckout.tsx:**
```typescript
import * as Facebook from "@/integrations/tracking/facebook";
import * as UTMify from "@/integrations/tracking/utmify";
// etc...
```

## ⚠️ Em Progresso (50%)

### Gateway Integrations

#### Mercado Pago (50% - Estrutura criada, migração pendente)

**Status:** Estrutura modular criada em `src/integrations/gateways/mercadopago/`

**Arquivos Novos:**
- ✅ `index.ts` - Barrel export
- ✅ `types.ts` - Interfaces TypeScript
- ✅ `api.ts` - Funções de API
- ✅ `hooks.ts` - React hooks
- ✅ `Brick.tsx` - Componente do formulário
- ✅ `README.md` - Documentação completa

**Arquivos Antigos (A VERIFICAR/REMOVER):**
- ⚠️ `src/hooks/useMercadoPagoBrick.ts` - Provavelmente obsoleto
- ⚠️ `src/components/financeiro/MercadoPagoConfig.tsx` - Config antiga
- ⚠️ `src/components/payment/CustomCardForm.tsx` - Verificar se usa novo módulo
- ⚠️ `src/components/payment/CreditCardBrick.tsx` - Verificar duplicação

**Ações Pendentes:**
1. Confirmar se `PublicCheckout.tsx` está usando `import * as MercadoPago`
2. Verificar se componentes de pagamento usam o novo `Brick.tsx`
3. Remover arquivos obsoletos após confirmação
4. Testar fluxo completo de pagamento

#### PushinPay (0% - Não iniciado)

**Status:** Código antigo ainda em uso

**Arquivos Atuais:**
- 📦 `src/services/pushinpay.ts` - Lógica de API
- 📦 `src/components/pix/PushinPayLegal.tsx` - Componente legal
- 📦 `src/components/pix/QRCanvas.tsx` - QR Code (pode ser compartilhado)

**Estrutura Proposta:**
```
src/integrations/gateways/pushinpay/
├── index.ts          # Barrel export
├── types.ts          # Interfaces (PIX, QR Code)
├── api.ts            # Funções de API (criar PIX, consultar status)
├── hooks.ts          # usePushinPayConfig, usePushinPayPix
├── components/
│   ├── PixPayment.tsx    # Componente principal
│   ├── QRCode.tsx        # QR Code canvas
│   └── Legal.tsx         # Termos legais
└── README.md         # Documentação
```

**Ações Necessárias:**
1. Criar estrutura de pastas `gateways/pushinpay/`
2. Migrar lógica de `src/services/pushinpay.ts` para `api.ts`
3. Criar hooks para configuração e criação de PIX
4. Mover componentes para `components/`
5. Criar barrel export em `index.ts`
6. Documentar no README.md
7. Atualizar imports no `PublicCheckout.tsx`
8. Remover arquivos antigos

## 🗑️ Limpeza Pendente

### Arquivos/Pastas Obsoletos (A CONFIRMAR)

Após a migração completa, os seguintes arquivos/pastas podem ser removidos:

**Tracking (já migrado):**
- ❌ `src/lib/facebook-pixel-helpers.ts` (se não usado)
- ❌ `src/lib/facebook-conversions-api.ts` (se não usado)
- ❌ `src/lib/utmify-helper.ts` (se não usado)
- ❌ `src/components/integrations/` (pasta inteira, se vazia)

**Gateways (após migração):**
- ❌ `src/hooks/useMercadoPagoBrick.ts`
- ❌ `src/services/pushinpay.ts`
- ❌ `src/components/pix/PushinPayLegal.tsx`
- ❌ Componentes duplicados de pagamento

## 📋 Checklist de Finalização

### Mercado Pago
- [ ] Verificar uso do novo módulo em `PublicCheckout.tsx`
- [ ] Verificar uso do novo `Brick.tsx` nos componentes de pagamento
- [ ] Testar fluxo de pagamento com cartão
- [ ] Remover `useMercadoPagoBrick.ts` antigo
- [ ] Remover componentes obsoletos
- [ ] Atualizar documentação

### PushinPay
- [ ] Criar estrutura de pastas
- [ ] Migrar `api.ts`
- [ ] Criar `hooks.ts`
- [ ] Migrar componentes
- [ ] Criar barrel export
- [ ] Documentar README
- [ ] Atualizar imports
- [ ] Testar fluxo PIX
- [ ] Remover arquivos antigos

### Limpeza Geral
- [ ] Remover pastas `src/lib/facebook*` (se obsoletas)
- [ ] Remover `src/components/integrations/` (se vazia)
- [ ] Verificar e remover backups (`.backup`, `.bak`)
- [ ] Atualizar imports globais
- [ ] Executar linter
- [ ] Executar testes

## 🎯 Objetivo Final

Ter toda a lógica de integrações (tracking e gateways) organizada em:

```
src/integrations/
├── tracking/
│   ├── facebook/
│   ├── utmify/
│   ├── google-ads/
│   ├── tiktok/
│   └── kwai/
└── gateways/
    ├── mercadopago/
    └── pushinpay/
```

Com imports limpos:
```typescript
import * as Facebook from "@/integrations/tracking/facebook";
import * as MercadoPago from "@/integrations/gateways/mercadopago";
import * as PushinPay from "@/integrations/gateways/pushinpay";
```

## 📝 Notas

- O padrão de Feature Folders está funcionando perfeitamente para tracking
- A estrutura do Mercado Pago está bem documentada e serve como template
- PushinPay deve seguir exatamente o mesmo padrão
- Todos os módulos devem ter README.md completo
- Barrel exports (`index.ts`) são essenciais para imports limpos
