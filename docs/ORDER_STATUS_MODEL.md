# Sistema de Status de Pedidos - RiseCheckout

## Padrão de Mercado: Hotmart/Kiwify

O RiseCheckout segue o modelo de status **padrão de mercado** utilizado por plataformas como Hotmart e Kiwify. Neste modelo:

> **Uma venda pendente NUNCA se torna "cancelada" ou "expirada" na interface do usuário.**

Isso permite:
1. **Métricas de conversão precisas** - Vendas perdidas são analisadas separadamente
2. **Recuperação de vendas** - PIX expirado pode ser reprocessado
3. **Consistência com mercado** - Mesma experiência que plataformas líderes

---

## Arquitetura Dual-Layer

O sistema utiliza duas camadas de status:

| Camada | Campo | Propósito | Visibilidade |
|--------|-------|-----------|--------------|
| **Pública** | `status` | UI e clientes | Dashboard, relatórios |
| **Técnica** | `technical_status` | Diagnóstico interno | Apenas backend |

### Campos no Banco de Dados

```sql
-- Coluna principal (4 valores possíveis)
status TEXT NOT NULL DEFAULT 'pending'
  CHECK (status IN ('paid', 'pending', 'refunded', 'chargeback'))

-- Coluna técnica (6 valores possíveis)
technical_status TEXT DEFAULT 'active'
  CHECK (technical_status IN ('active', 'expired', 'gateway_cancelled', 
         'gateway_timeout', 'gateway_error', 'abandoned'))

-- Timestamp de expiração
expired_at TIMESTAMPTZ
```

---

## Status Canônicos (Camada Pública)

Apenas **4 status** são exibidos ao usuário:

| Status | Display | Cor | Descrição |
|--------|---------|-----|-----------|
| `paid` | Pago | 🟢 Verde | Pagamento confirmado |
| `pending` | Pendente | 🟡 Amarelo | Aguardando pagamento |
| `refunded` | Reembolso | 🔵 Azul | Valor devolvido |
| `chargeback` | Chargeback | 🔴 Vermelho | Contestação de cartão |

### Cores CSS

```typescript
const STATUS_COLORS = {
  paid: { bg: 'bg-emerald-100', text: 'text-emerald-800', dot: 'bg-emerald-500' },
  pending: { bg: 'bg-amber-100', text: 'text-amber-800', dot: 'bg-amber-500' },
  refunded: { bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-500' },
  chargeback: { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-500' },
};
```

---

## Technical Status (Camada Interna)

Para diagnóstico e relatórios avançados, **6 status técnicos**:

| Technical Status | Descrição | Status Público |
|------------------|-----------|----------------|
| `active` | PIX/boleto ativo, aguardando | `pending` |
| `expired` | PIX/boleto expirou | `pending` |
| `gateway_cancelled` | Cancelado pelo gateway | `pending` |
| `gateway_timeout` | Timeout na comunicação | `pending` |
| `gateway_error` | Erro no processamento | `pending` |
| `abandoned` | Checkout abandonado | `pending` |

**Importante:** Todos os status técnicos negativos resultam em `status = 'pending'`.

---

## Diagrama de Transições

```mermaid
stateDiagram-v2
    [*] --> pending: Pedido criado
    
    pending --> paid: Webhook payment.approved
    pending --> pending: PIX expirou (technical_status = expired)
    pending --> pending: Gateway error (technical_status = gateway_error)
    
    paid --> refunded: Reembolso processado
    paid --> chargeback: Contestação recebida
    
    refunded --> [*]: Estado final
    chargeback --> [*]: Estado final
```

---

## Mapeamento de Gateways

### Mercado Pago

| Status MP | Status Canônico | Technical Status |
|-----------|-----------------|------------------|
| `approved` | `paid` | - |
| `pending` | `pending` | `active` |
| `in_process` | `pending` | `active` |
| `rejected` | `pending` | `gateway_cancelled` |
| `cancelled` | `pending` | `gateway_cancelled` |
| `refunded` | `refunded` | - |
| `charged_back` | `chargeback` | - |

### Asaas

| Status Asaas | Status Canônico | Technical Status |
|--------------|-----------------|------------------|
| `RECEIVED` | `paid` | - |
| `CONFIRMED` | `paid` | - |
| `PENDING` | `pending` | `active` |
| `OVERDUE` | `pending` | `expired` |
| `REFUNDED` | `refunded` | - |

### PushinPay

| Status PushinPay | Status Canônico | Technical Status |
|------------------|-----------------|------------------|
| `paid` | `paid` | - |
| `pending` | `pending` | `active` |
| `expired` | `pending` | `expired` |
| `canceled` | `pending` | `gateway_cancelled` |
| `refunded` | `refunded` | - |

---

## Uso no Código

### Normalização de Status

```typescript
import { orderStatusService } from '@/lib/order-status';

// Normaliza qualquer status de gateway para canônico
const canonical = orderStatusService.normalize('rejected'); // 'pending'

// Obtém label para exibição
const label = orderStatusService.getDisplayLabel('paid'); // 'Pago'

// Obtém cores
const colors = orderStatusService.getColorScheme('pending');
// { bg: 'bg-amber-100', text: 'text-amber-800', ... }
```

### Tipos TypeScript

```typescript
// Apenas estes 4 valores são válidos
type CanonicalOrderStatus = 'paid' | 'pending' | 'refunded' | 'chargeback';

// Para rastreamento interno
type TechnicalOrderStatus = 
  | 'active' 
  | 'expired' 
  | 'gateway_cancelled' 
  | 'gateway_timeout' 
  | 'gateway_error' 
  | 'abandoned';
```

---

## Casos de Uso

### 1. Dashboard de Vendas

```sql
-- Vendas aprovadas
SELECT COUNT(*) FROM orders WHERE status = 'paid';

-- Vendas pendentes (inclui expiradas!)
SELECT COUNT(*) FROM orders WHERE status = 'pending';
```

### 2. Relatório de Vendas Perdidas

```sql
-- PIX que expiraram
SELECT * FROM orders 
WHERE status = 'pending' 
  AND technical_status = 'expired';
```

### 3. Recuperação de Vendas

```sql
-- Candidatas para email de recuperação
SELECT * FROM orders 
WHERE status = 'pending' 
  AND technical_status IN ('expired', 'abandoned')
  AND created_at > NOW() - INTERVAL '7 days';
```

---

## Migração Histórica

Em **17 de Janeiro de 2026**, foi executada migração:

- **14 pedidos** com `status = 'cancelled'` → `status = 'pending'`, `technical_status = 'expired'`
- **0 pedidos** com `status = 'failed'` precisaram migração

---

## Código Fonte

| Arquivo | Propósito |
|---------|-----------|
| `src/lib/order-status/types.ts` | Tipos e constantes |
| `src/lib/order-status/service.ts` | Serviço de normalização |
| `src/lib/order-status/index.ts` | Barrel export |
| `supabase/functions/_shared/webhook-helpers.ts` | Mapeamento de gateways |

---

## Referências

- [RISE ARCHITECT PROTOCOL V3](../RISE_PROTOCOL.md)
- [Changelog v3.2.0](./CHANGELOG.md)
- [Arquitetura Geral](./ARCHITECTURE.md)
