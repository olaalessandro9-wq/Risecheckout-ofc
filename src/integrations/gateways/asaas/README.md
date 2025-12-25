# Asaas Gateway Module

> Módulo de integração frontend para o gateway de pagamentos Asaas.
> Suporta **PIX** e **Cartão de Crédito**.

---

## 📁 Estrutura do Módulo

```
src/integrations/gateways/asaas/
├── index.ts           # Barrel exports
├── types.ts           # Interfaces TypeScript
├── api.ts             # Funções de API (chamadas às Edge Functions)
├── hooks.ts           # React Hooks para gerenciar estado
└── components/
    └── ConfigForm.tsx # Formulário de configuração do gateway
```

---

## 🔧 Tipos (types.ts)

### Ambientes

```typescript
type AsaasEnvironment = 'sandbox' | 'production';
```

### Configuração

```typescript
interface AsaasConfig {
  apiKey: string;
  environment: AsaasEnvironment;
  isConfigured: boolean;
  walletId?: string;      // Necessário para split de pagamentos
  accountName?: string;
}
```

### Dados do Cliente

```typescript
interface AsaasCustomerData {
  name: string;
  email: string;
  cpfCnpj: string;
  phone?: string;
}
```

### Request de Pagamento

```typescript
interface AsaasPaymentRequest {
  vendorId: string;
  amountCents: number;
  description: string;
  customer: AsaasCustomerData;
  paymentMethod: 'pix' | 'credit_card';
  orderId?: string;
  // Específicos para cartão
  cardToken?: string;
  installments?: number;
}
```

### Response de Pagamento

```typescript
interface AsaasPaymentResponse {
  success: boolean;
  transactionId?: string;
  status?: 'pending' | 'approved' | 'refused' | 'processing';
  // Campos PIX
  qrCode?: string;
  qrCodeText?: string;
  pixId?: string;
  // Erro
  errorMessage?: string;
}
```

---

## 📡 API (api.ts)

Funções que chamam as Edge Functions do Supabase.

### Validação de Credenciais

```typescript
import { validateAsaasCredentials } from '@/integrations/gateways/asaas';

const result = await validateAsaasCredentials(apiKey, 'production');

if (result.valid) {
  console.log('Conta:', result.accountName);
  console.log('Wallet ID:', result.walletId);
}
```

### Criar Pagamento PIX

```typescript
import { createAsaasPixPayment } from '@/integrations/gateways/asaas';

const response = await createAsaasPixPayment({
  vendorId: 'vendor-uuid',
  amountCents: 9900, // R$ 99,00
  description: 'Produto XYZ',
  customer: {
    name: 'João Silva',
    email: 'joao@email.com',
    cpfCnpj: '12345678900',
  },
  paymentMethod: 'pix',
  orderId: 'order-uuid',
});

if (response.success) {
  // Exibir QR Code
  console.log('QR Code:', response.qrCode);
  console.log('Código PIX:', response.qrCodeText);
}
```

### Criar Pagamento Cartão

```typescript
import { createAsaasCreditCardPayment } from '@/integrations/gateways/asaas';

const response = await createAsaasCreditCardPayment({
  vendorId: 'vendor-uuid',
  amountCents: 9900,
  description: 'Produto XYZ',
  customer: {
    name: 'João Silva',
    email: 'joao@email.com',
    cpfCnpj: '12345678900',
  },
  paymentMethod: 'credit_card',
  cardToken: 'token-from-asaas-js',
  installments: 3,
  orderId: 'order-uuid',
});
```

### Gerenciar Configuração

```typescript
import { 
  getAsaasSettings,
  saveAsaasSettings,
  disconnectAsaas,
  isAsaasConnected 
} from '@/integrations/gateways/asaas';

// Verificar se está conectado
const connected = await isAsaasConnected(vendorId);

// Obter configuração atual
const settings = await getAsaasSettings(vendorId);

// Salvar nova configuração
await saveAsaasSettings(vendorId, {
  api_key: '$aact_...',
  environment: 'production',
  wallet_id: 'uuid-wallet',
});

// Desconectar
await disconnectAsaas(vendorId);
```

---

## 🪝 Hooks (hooks.ts)

React Hooks para gerenciar estado e operações assíncronas.

### useAsaasConfig

Carrega a configuração atual do vendedor.

```typescript
import { useAsaasConfig } from '@/integrations/gateways/asaas';

function MyComponent() {
  const { config, isLoading, error, refetch } = useAsaasConfig();

  if (isLoading) return <Spinner />;
  if (!config?.isConfigured) return <SetupForm />;

  return <div>Conectado como: {config.accountName}</div>;
}
```

### useAsaasValidation

Valida credenciais antes de salvar.

```typescript
import { useAsaasValidation } from '@/integrations/gateways/asaas';

function ConfigForm() {
  const { validate, isValidating, lastResult } = useAsaasValidation();

  const handleValidate = async () => {
    const result = await validate(apiKey, environment);
    if (result.valid) {
      toast.success(`Conta: ${result.accountName}`);
    }
  };

  return (
    <Button onClick={handleValidate} disabled={isValidating}>
      {isValidating ? 'Validando...' : 'Validar'}
    </Button>
  );
}
```

### useAsaasSaveConfig

Salva a configuração do gateway.

```typescript
import { useAsaasSaveConfig } from '@/integrations/gateways/asaas';

function ConfigForm() {
  const { save, isSaving } = useAsaasSaveConfig();

  const handleSave = async () => {
    const result = await save({
      api_key: apiKey,
      environment: 'production',
      wallet_id: walletId,
      validated_at: new Date().toISOString(),
    });

    if (result.success) {
      toast.success('Configuração salva!');
    }
  };
}
```

### useAsaasDisconnect

Desconecta o gateway.

```typescript
import { useAsaasDisconnect } from '@/integrations/gateways/asaas';

function Settings() {
  const { disconnect, isDisconnecting } = useAsaasDisconnect();

  const handleDisconnect = async () => {
    const result = await disconnect();
    if (result.success) {
      toast.success('Desconectado');
    }
  };
}
```

### useAsaasConnectionStatus

Verifica status de conexão.

```typescript
import { useAsaasConnectionStatus } from '@/integrations/gateways/asaas';

function StatusBadge() {
  const { isConnected, isLoading, refetch } = useAsaasConnectionStatus();

  return (
    <Badge variant={isConnected ? 'success' : 'secondary'}>
      {isConnected ? 'Conectado' : 'Desconectado'}
    </Badge>
  );
}
```

---

## 🎨 Componentes

### ConfigForm

Formulário completo para configuração do Asaas no painel administrativo.

```typescript
import { ConfigForm } from '@/integrations/gateways/asaas';

function GatewaySettings() {
  const handleConnectionChange = () => {
    // Atualizar estado do app
    refetchPaymentMethods();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurar Asaas</CardTitle>
      </CardHeader>
      <CardContent>
        <ConfigForm onConnectionChange={handleConnectionChange} />
      </CardContent>
    </Card>
  );
}
```

**Funcionalidades:**
- Seleção de ambiente (Sandbox/Produção) - apenas para admin
- Input de API Key com toggle de visibilidade
- Input de Wallet ID (necessário para split)
- Validação de credenciais em tempo real
- Feedback visual de status
- Botão de desconexão

---

## 🔄 Fluxo de Pagamento PIX

```
┌─────────────────────────────────────────────────────────────────┐
│                      FLUXO PIX ASAAS                            │
└─────────────────────────────────────────────────────────────────┘

[Cliente]                  [Frontend]              [Edge Function]              [Asaas API]
    │                          │                         │                          │
    │  Clica "Pagar PIX"       │                         │                          │
    │ ─────────────────────────►                         │                          │
    │                          │                         │                          │
    │                          │  createAsaasPixPayment  │                          │
    │                          │ ────────────────────────►                          │
    │                          │                         │                          │
    │                          │                         │   POST /payments (PIX)   │
    │                          │                         │ ────────────────────────►│
    │                          │                         │                          │
    │                          │                         │    { qrCode, pixId }     │
    │                          │                         │ ◄────────────────────────│
    │                          │                         │                          │
    │                          │   { qrCode, qrCodeText }│                          │
    │                          │ ◄────────────────────────                          │
    │                          │                         │                          │
    │    Exibe QR Code         │                         │                          │
    │ ◄─────────────────────────                         │                          │
    │                          │                         │                          │
    │  [Cliente paga via app]  │                         │                          │
    │                          │                         │                          │
    │                          │                         │       Webhook            │
    │                          │                         │ ◄────────────────────────│
    │                          │                         │                          │
    │                          │                         │  Atualiza order.status   │
    │                          │                         │                          │
    │    Redireciona           │                         │                          │
    │ ◄─────────────────────────                         │                          │
```

---

## 🔄 Fluxo de Pagamento Cartão

```
[Cliente]                  [Frontend]              [Edge Function]              [Asaas API]
    │                          │                         │                          │
    │  Preenche dados cartão   │                         │                          │
    │ ─────────────────────────►                         │                          │
    │                          │                         │                          │
    │                          │  Tokeniza via Asaas.js  │                          │
    │                          │ ────────────────────────────────────────────────────►
    │                          │                         │                          │
    │                          │       cardToken         │                          │
    │                          │ ◄────────────────────────────────────────────────────
    │                          │                         │                          │
    │                          │createAsaasCreditCardPayment                        │
    │                          │ ────────────────────────►                          │
    │                          │                         │                          │
    │                          │                         │  POST /payments (CARD)   │
    │                          │                         │ ────────────────────────►│
    │                          │                         │                          │
    │                          │                         │    { status, id }        │
    │                          │                         │ ◄────────────────────────│
    │                          │                         │                          │
    │                          │  { status: approved }   │                          │
    │                          │ ◄────────────────────────                          │
    │                          │                         │                          │
    │   Redireciona Thank You  │                         │                          │
    │ ◄─────────────────────────                         │                          │
```

---

## ⚠️ Tratamento de Erros

Todos os métodos retornam objetos com estrutura consistente:

```typescript
// Sucesso
{
  success: true,
  data: { ... }
}

// Erro
{
  success: false,
  error: 'Mensagem de erro legível',
  errorCode?: 'ASAAS_ERROR_CODE'
}
```

### Erros Comuns

| Código | Descrição | Solução |
|--------|-----------|---------|
| `invalid_api_key` | API Key inválida | Verificar chave no painel Asaas |
| `customer_not_found` | CPF/CNPJ não encontrado | Verificar documento do cliente |
| `insufficient_balance` | Saldo insuficiente (split) | Verificar wallet_id |
| `payment_refused` | Pagamento recusado | Tentar outro cartão |

---

## 🔐 Segurança

1. **API Keys** são armazenadas criptografadas na tabela `vendor_integrations`
2. **Validação** é feita sempre antes de salvar credenciais
3. **Ambiente Sandbox** só é acessível para usuários `admin`
4. **Wallet ID** é necessário para split de pagamentos funcionar

---

## 📚 Referências

- [Documentação Asaas API](https://docs.asaas.com/)
- [Edge Function: asaas-create-payment](../../../supabase/functions/asaas-create-payment/README.md)
- [Edge Function: asaas-webhook](../../../supabase/functions/asaas-webhook/README.md)
- [Arquitetura de Pagamentos](../../../docs/ARCHITECTURE.md)
