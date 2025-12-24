# Guia: Como Adicionar um Novo Gateway de Pagamento

Este documento descreve o processo passo a passo para adicionar um novo gateway de pagamento ao RiseCheckout.

## Arquitetura Resumida

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
├─────────────────────────────────────────────────────────────┤
│  src/config/payment-gateways.ts    ← Registry Central       │
│  src/types/payment-types.ts        ← Tipos Unificados       │
│  src/components/checkout/payment/  ← Componentes de Form    │
│    ├── GatewayCardForm.tsx         ← Factory para Cartão    │
│    └── pix/PixGatewayForm.tsx      ← Factory para PIX       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        BACKEND                               │
├─────────────────────────────────────────────────────────────┤
│  supabase/functions/_shared/payment-gateways/               │
│    ├── types.ts                    ← Tipos (sincronizados)  │
│    ├── PaymentFactory.ts           ← Factory Backend        │
│    └── adapters/                   ← Adapters por Gateway   │
│        ├── MercadoPagoAdapter.ts                            │
│        ├── PushinPayAdapter.ts                              │
│        └── StripeAdapter.ts        ← Exemplo futuro         │
└─────────────────────────────────────────────────────────────┘
```

## Checklist Completo

### 1. Registry Central (Frontend)

**Arquivo:** `src/config/payment-gateways.ts`

```typescript
// Adicionar no objeto PAYMENT_GATEWAYS:
novoGateway: {
  id: 'novoGateway',
  name: 'novoGateway',
  displayName: 'Novo Gateway',
  description: 'Descrição do gateway',
  status: 'coming_soon', // Mudar para 'active' quando pronto
  supportedMethods: ['pix', 'credit_card'], // Métodos suportados
  fees: {
    pix: { percentage: 0.99 },
    credit_card: { percentage: 3.99, transaction: 39 },
  },
  requiresCredentials: true,
  credentialsFields: ['public_key', 'secret_key'],
  documentationUrl: 'https://docs.novogateway.com',
},
```

### 2. Tipos (Se necessário)

**Arquivo:** `src/types/payment-types.ts`

```typescript
// Adicionar ao type PaymentGatewayId:
export type PaymentGatewayId = 
  | 'mercadopago' 
  | 'pushinpay'
  | 'stripe' 
  | 'novoGateway' // ← Adicionar aqui
  // ...
```

### 3. Frontend - Componente de Cartão (Se suportar cartão)

**Criar:** `src/components/checkout/payment/gateways/CardFormNovoGateway.tsx`

```typescript
import { type CardFormProps } from '@/types/payment-types';

export function CardFormNovoGateway({ 
  publicKey,
  amountCents,
  payerEmail,
  onSubmit,
  onReady,
  onError,
  loading,
  colors 
}: Omit<CardFormProps, 'gatewayId'>) {
  // Implementar campos de cartão usando SDK do gateway
  // ou inputs customizados com tokenização
  
  return (
    <div>
      {/* Campos do cartão */}
    </div>
  );
}
```

**Atualizar:** `src/components/checkout/payment/GatewayCardForm.tsx`

```typescript
// Adicionar import
import { CardFormNovoGateway } from './gateways/CardFormNovoGateway';

// Adicionar case no switch
case 'novoGateway':
  return <CardFormNovoGateway {...props} />;
```

### 4. Frontend - Componente de PIX (Se suportar PIX)

**Criar:** `src/components/checkout/payment/pix/gateways/PixFormNovoGateway.tsx`

```typescript
import { type PixPaymentData } from '@/types/payment-types';

interface PixFormNovoGatewayProps {
  amountCents: number;
  orderId: string;
  onPaymentCreated: (data: PixPaymentData) => void;
  onError?: (error: Error) => void;
}

export function PixFormNovoGateway(props: PixFormNovoGatewayProps) {
  // Implementar lógica de criação de PIX
  return null;
}
```

**Atualizar:** `src/components/checkout/payment/pix/PixGatewayForm.tsx`

```typescript
// Adicionar case
case 'novoGateway':
  return <PixFormNovoGateway {...props} />;
```

### 5. Backend - Adapter

**Criar:** `supabase/functions/_shared/payment-gateways/adapters/NovoGatewayAdapter.ts`

```typescript
import { 
  IPaymentGateway, 
  PaymentRequest, 
  PaymentResponse,
  GatewayCredentials 
} from '../types.ts';

export class NovoGatewayAdapter implements IPaymentGateway {
  private credentials: GatewayCredentials | null = null;

  async initialize(credentials: GatewayCredentials): Promise<void> {
    this.credentials = credentials;
    // Inicializar SDK se necessário
  }

  async createPixPayment(request: PaymentRequest): Promise<PaymentResponse> {
    // Implementar chamada à API do gateway
    throw new Error('PIX não implementado para NovoGateway');
  }

  async createCardPayment(request: PaymentRequest): Promise<PaymentResponse> {
    // Implementar chamada à API do gateway
    throw new Error('Cartão não implementado para NovoGateway');
  }
}
```

### 6. Backend - Factory

**Atualizar:** `supabase/functions/_shared/payment-gateways/PaymentFactory.ts`

```typescript
// Adicionar import
import { NovoGatewayAdapter } from './adapters/NovoGatewayAdapter.ts';

// Adicionar case no switch
case 'novoGateway':
  return new NovoGatewayAdapter();
```

### 7. Edge Function (Se necessário endpoint específico)

**Criar:** `supabase/functions/novogateway-create-payment/index.ts`

Seguir o padrão das funções existentes (`pushinpay-create-pix`, `mercadopago-create-payment`).

### 8. Banco de Dados (Se necessário)

Atualizar enums no banco se necessário:
- `pix_gateway_type`
- `credit_card_gateway_type`

### 9. UI de Configuração

O `GatewaySelector` já renderiza automaticamente gateways do registry.
Para mostrar o novo gateway:
1. Mudar `status: 'coming_soon'` para `status: 'active'`
2. O componente aparece automaticamente nas configurações

### 10. Credenciais

Adicionar campos de credenciais na página Financeiro se o gateway precisar de configuração específica.

## Testes

1. **Unit Test:** Testar adapter isoladamente
2. **Integration Test:** Testar fluxo completo de pagamento
3. **E2E Test:** Testar checkout público com o novo gateway

## Exemplo: Adicionando Stripe

```bash
# 1. Registry
src/config/payment-gateways.ts → Adicionar configuração Stripe

# 2. Frontend
src/components/checkout/payment/gateways/CardFormStripe.tsx → Criar
src/components/checkout/payment/GatewayCardForm.tsx → Atualizar switch

# 3. Backend  
supabase/functions/_shared/payment-gateways/adapters/StripeAdapter.ts → Criar
supabase/functions/_shared/payment-gateways/PaymentFactory.ts → Atualizar

# 4. Edge Function (opcional)
supabase/functions/stripe-create-payment/index.ts → Criar se necessário

# 5. Ativar
src/config/payment-gateways.ts → status: 'active'
```

## Dicas

- Sempre usar tipos de `src/types/payment-types.ts`
- Manter logs consistentes com prefixo `[NomeGateway]:`
- Tratar erros de forma padronizada
- Documentar particularidades do gateway no código
- Testar em sandbox antes de produção
