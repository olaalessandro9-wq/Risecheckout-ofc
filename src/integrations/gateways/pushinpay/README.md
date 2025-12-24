# PushinPay Gateway Integration

Módulo de integração com o gateway de pagamento **PushinPay** para processamento de pagamentos via **PIX**.

## 📁 Estrutura

```
src/integrations/gateways/pushinpay/
├── api.ts              # Funções de API (criar PIX, verificar status, etc.)
├── hooks.ts            # React hooks (configuração, disponibilidade)
├── types.ts            # Interfaces TypeScript
├── index.ts            # Barrel export
├── components/
│   ├── PixPayment.tsx  # Componente principal de pagamento PIX
│   ├── QRCanvas.tsx    # Canvas para renderizar QR Code
│   ├── Legal.tsx       # Aviso legal da PushinPay
│   └── ConfigForm.tsx  # Formulário de configuração (painel admin)
└── README.md           # Este arquivo
```

## 🚀 Uso

### Importação

```typescript
import * as PushinPay from "@/integrations/gateways/pushinpay";
```

### Componente de Pagamento PIX

```typescript
// No checkout público
<PushinPay.PixPayment
  orderId={orderId}
  amount={amount}
  onSuccess={() => console.log("Pagamento aprovado")}
  onError={(error) => console.error(error)}
/>
```

### Formulário de Configuração (Admin)

```typescript
// No painel administrativo
<PushinPay.ConfigForm />
```

### Hooks

```typescript
// Verificar se PushinPay está disponível
const isAvailable = PushinPay.usePushinPayAvailable();

// Obter configuração
const config = PushinPay.usePushinPayConfig();
```

### API Functions

```typescript
// Criar cobrança PIX
const result = await PushinPay.createPixCharge({
  orderId: "123",
  valueInCents: 10000,
  description: "Produto XYZ"
});

// Verificar status
const status = await PushinPay.getPixStatus(pixId);

// Salvar configuração
await PushinPay.savePushinPaySettings({
  pushinpay_token: "token_aqui",
  environment: "production"
});
```

## 📋 Tipos Principais

### `PushinPayConfig`
Configuração do gateway (token, ambiente).

### `PixChargeRequest`
Dados para criar uma cobrança PIX.

### `PixChargeResponse`
Resposta da API ao criar PIX (contém QR Code).

### `PixStatus`
Status do pagamento PIX (pending, paid, expired, etc.).

### `PushinPayEnvironment`
Ambiente: `"sandbox"` ou `"production"`.

## 🔧 Configuração

1. Acesse o painel administrativo em `/financeiro`
2. Clique no card "PushinPay"
3. Informe o **API Token** fornecido pela PushinPay
4. Selecione o ambiente (Sandbox para testes, Produção para vendas reais)
5. Clique em "Salvar integração"

## 🔐 Segurança

- ✅ Token armazenado criptografado no banco de dados
- ✅ Validação server-side via Edge Functions
- ✅ Suporte a RLS (Row Level Security) do Supabase
- ✅ Mascaramento de credenciais na UI

## 📊 Fluxo de Pagamento

```
1. Cliente escolhe PIX no checkout
   ↓
2. createPixCharge() gera QR Code
   ↓
3. QRCanvas renderiza o código
   ↓
4. Cliente paga no app do banco
   ↓
5. Webhook da PushinPay notifica o sistema
   ↓
6. Status atualizado para "PAID"
   ↓
7. Cliente redirecionado para página de sucesso
```

## 🧪 Testes

### Sandbox
- Ambiente: `sandbox`
- Token: Solicite no suporte da PushinPay
- PIX de teste não cobra valor real

### Produção
- Ambiente: `production`
- Token: Credenciais de produção
- PIX real com cobrança efetiva

## 🐛 Troubleshooting

### QR Code não aparece
- Verifique se o token está configurado
- Confirme se o ambiente está correto
- Veja logs no console do navegador

### Pagamento não confirma
- Verifique se o webhook está configurado
- Confirme se a Edge Function `pushinpay-webhook` está ativa
- Veja logs no Supabase

### Erro "Token inválido"
- Verifique se o token está correto
- Confirme se não expirou
- Teste no ambiente sandbox primeiro

## 📝 Changelog

### v2.0.0 (2024)
- ✅ Migração para arquitetura modular
- ✅ Criação de `ConfigForm.tsx` (admin)
- ✅ Isolamento completo em `src/integrations/gateways/pushinpay/`
- ✅ Remoção de código legado (`src/services/pushinpay.ts`)
- ✅ Padronização com Mercado Pago

### v1.0.0 (2024)
- Implementação inicial
- Suporte a PIX via PushinPay
- Integração com checkout

## 🔗 Links Úteis

- [Documentação PushinPay](https://pushinpay.com.br/docs)
- [Suporte PushinPay](https://pushinpay.com.br/suporte)

## 👥 Manutenção

Este módulo segue o padrão **Feature Folders** estabelecido no projeto RiseCheckout.

Qualquer alteração deve:
- ✅ Manter compatibilidade com a API
- ✅ Atualizar tipos TypeScript
- ✅ Documentar mudanças neste README
- ✅ Testar em sandbox antes de produção
