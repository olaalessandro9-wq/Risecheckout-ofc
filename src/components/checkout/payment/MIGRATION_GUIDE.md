# 📦 Guia de Migração - Arquitetura Multi-Gateway

## 🎯 Objetivo

Este guia explica como migrar do código atual (Mercado Pago específico) para a nova arquitetura multi-gateway, **sem quebrar** o sistema em produção.

---

## 🔍 Situação Atual

### Código Existente

Atualmente, o RiseCheckout usa:

```
src/integrations/gateways/mercadopago/
├── components/
│   └── CardForm.tsx              # Formulário específico do MP
├── hooks.ts                      # useMercadoPagoBrick
└── api.ts                        # Funções de API

src/pages/PublicCheckoutV2.tsx    # Usa CardForm diretamente
src/hooks/v2/usePaymentGateway.ts # Orquestra pagamento
```

**Características:**
- ✅ Funcional e estável
- ✅ Mercado Pago totalmente integrado
- ❌ Código acoplado ao Mercado Pago
- ❌ Difícil adicionar novos gateways

### Nova Arquitetura

```
src/components/checkout/payment/
├── CreditCardForm.tsx            # Wrapper universal
├── fields/
│   ├── shared/                   # 80% compartilhado
│   └── gateways/                 # 20% específico
├── hooks/
│   └── useGatewayManager.ts      # Gateway-agnostic
└── core/
    ├── types.ts
    └── constants.ts
```

**Características:**
- ✅ Modular e escalável
- ✅ 80% de código reutilizado
- ✅ Fácil adicionar novos gateways
- ✅ Type-safe

---

## 🚀 Estratégia de Migração

### Opção 1: Migração Gradual (Recomendado)

**Vantagens:**
- ✅ Zero downtime
- ✅ Testar em paralelo
- ✅ Rollback fácil

**Desvantagens:**
- ⏱️ Mais tempo
- 📦 Código duplicado temporariamente

### Opção 2: Migração Completa

**Vantagens:**
- ⚡ Mais rápido
- 🧹 Remove código antigo imediatamente

**Desvantagens:**
- ⚠️ Risco maior
- 🐛 Bugs podem afetar produção

---

## 📋 Plano de Migração Gradual

### Fase 1: Preparação (Concluída ✅)

- [x] Criar nova arquitetura
- [x] Implementar CreditCardForm
- [x] Implementar campos compartilhados
- [x] Implementar MercadoPagoFields
- [x] Criar documentação

### Fase 2: Testes em Ambiente de Dev

**Objetivo:** Validar que a nova arquitetura funciona

#### Passo 1: Criar Página de Teste

Crie `src/pages/TestCheckout.tsx`:

```tsx
import { useRef } from 'react';
import { CreditCardForm, useGatewayManager } from '@/components/checkout/payment';
import type { CreditCardFormRef, CardTokenData } from '@/components/checkout/payment';

export default function TestCheckout() {
  const formRef = useRef<CreditCardFormRef>(null);
  
  const gatewayConfig = {
    gateway: 'mercadopago' as const,
    publicKey: 'APP_USR-xxxxxxxx', // Sua chave de teste
    amount: 10000,
    payerEmail: 'test@example.com',
  };
  
  const { isReady, isLoading, error } = useGatewayManager({
    config: gatewayConfig,
    enabled: true,
  });
  
  const handleSubmit = async (tokenData: CardTokenData) => {
    console.log('Token recebido:', tokenData);
    // Testar com seu backend
  };
  
  if (isLoading) return <div>Carregando...</div>;
  if (error) return <div>Erro: {error}</div>;
  if (!isReady) return <div>Inicializando...</div>;
  
  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Teste - Nova Arquitetura</h1>
      
      <CreditCardForm
        ref={formRef}
        gateway="mercadopago"
        publicKey={gatewayConfig.publicKey}
        amount={gatewayConfig.amount}
        payerEmail={gatewayConfig.payerEmail}
        onSubmit={handleSubmit}
      />
      
      <button
        onClick={() => formRef.current?.submit()}
        className="w-full mt-4 bg-blue-600 text-white py-3 rounded-lg"
      >
        Testar Pagamento
      </button>
    </div>
  );
}
```

#### Passo 2: Adicionar Rota

Em `src/App.tsx` ou seu router:

```tsx
<Route path="/test-checkout" element={<TestCheckout />} />
```

#### Passo 3: Testar Funcionalidades

**Checklist de Testes:**

- [ ] SDK do Mercado Pago carrega corretamente
- [ ] Campos renderizam sem erros
- [ ] Validação de CPF/CNPJ funciona
- [ ] Validação de nome funciona
- [ ] Parcelas são carregadas
- [ ] Token é criado com sucesso
- [ ] Erros são exibidos corretamente
- [ ] Formulário reseta após submit

**Cartões de Teste:**

```
Mastercard: 5031 4332 1540 6351
Visa: 4235 6477 2802 5682
CVV: 123
Validade: 11/25
```

### Fase 3: Integração com PublicCheckoutV2

**Objetivo:** Substituir CardForm antigo pelo novo CreditCardForm

#### Opção A: Feature Flag (Mais Seguro)

Adicione uma feature flag para controlar qual versão usar:

```tsx
// src/pages/PublicCheckoutV2.tsx

const USE_NEW_PAYMENT_ARCHITECTURE = false; // Mude para true quando testar

// ...

{selectedPayment === 'credit_card' && (
  USE_NEW_PAYMENT_ARCHITECTURE ? (
    // NOVA ARQUITETURA
    <CreditCardForm
      ref={cardFormRef}
      gateway="mercadopago"
      publicKey={checkout?.mercadopago_public_key || ''}
      amount={calculateTotal()}
      payerEmail={formData.email}
      onSubmit={handleNewCardSubmit}
    />
  ) : (
    // ARQUITETURA ANTIGA (mantém funcionando)
    <CardForm
      ref={cardFormRef}
      amount={calculateTotal()}
      payerEmail={formData.email}
      mercadoPagoPublicKey={checkout?.mercadopago_public_key || ''}
      onSubmit={handleCardSubmit}
    />
  )
)}
```

#### Opção B: Substituição Direta

Se estiver confiante após testes:

```tsx
// src/pages/PublicCheckoutV2.tsx

// ANTES:
import { CardForm } from '@/integrations/gateways/mercadopago/components/CardForm';

// DEPOIS:
import { CreditCardForm, useGatewayManager } from '@/components/checkout/payment';
import type { CreditCardFormRef, CardTokenData } from '@/components/checkout/payment';

// ...

// Adicionar gerenciador de gateway
const gatewayConfig = {
  gateway: 'mercadopago' as const,
  publicKey: checkout?.mercadopago_public_key || '',
  amount: calculateTotal(),
  payerEmail: formData.email,
};

const { isReady: isGatewayReady } = useGatewayManager({
  config: gatewayConfig,
  enabled: selectedPayment === 'credit_card',
});

// Atualizar handler
const handleNewCardSubmit = async (tokenData: CardTokenData) => {
  if (!validateForm()) return;
  
  setProcessing(true);
  try {
    fireInitiateCheckout(selectedBumps, orderBumps || []);
    
    await submitPayment(
      tokenData.token,
      tokenData.installments,
      tokenData.paymentMethodId,
      tokenData.issuerId
    );
  } catch (error) {
    console.error('Erro ao processar cartão:', error);
  } finally {
    setProcessing(false);
  }
};

// Renderizar novo componente
{selectedPayment === 'credit_card' && isGatewayReady && (
  <CreditCardForm
    ref={cardFormRef}
    gateway="mercadopago"
    publicKey={checkout?.mercadopago_public_key || ''}
    amount={calculateTotal()}
    payerEmail={formData.email}
    onSubmit={handleNewCardSubmit}
  />
)}
```

### Fase 4: Testes em Staging

**Checklist:**

- [ ] Fluxo completo de checkout funciona
- [ ] Pagamento é processado com sucesso
- [ ] Order bumps funcionam
- [ ] Cupons funcionam
- [ ] Tracking funciona (Facebook, Google Ads, etc.)
- [ ] Redirecionamento para /success funciona
- [ ] Redirecionamento para /pix funciona (se aplicável)

### Fase 5: Deploy em Produção

**Antes do Deploy:**

1. ✅ Todos os testes passaram
2. ✅ Code review completo
3. ✅ Backup do banco de dados
4. ✅ Plano de rollback pronto

**Durante o Deploy:**

1. Deploy em horário de baixo tráfego
2. Monitorar logs em tempo real
3. Monitorar taxa de conversão
4. Estar pronto para rollback

**Após o Deploy:**

1. Testar checkout em produção
2. Monitorar por 24-48h
3. Verificar taxa de conversão
4. Coletar feedback

### Fase 6: Limpeza (Opcional)

Após 1-2 semanas de produção estável:

1. Remover código antigo:
   - `src/integrations/gateways/mercadopago/components/CardForm.tsx`
   - Hooks antigos não utilizados

2. Atualizar imports em todo o projeto

3. Remover feature flags

---

## 🔄 Rollback

Se algo der errado:

### Com Feature Flag

```tsx
const USE_NEW_PAYMENT_ARCHITECTURE = false; // Voltar para false
```

### Sem Feature Flag

```bash
# Reverter commit
git revert HEAD

# Ou fazer deploy da versão anterior
git checkout <commit-anterior>
git push --force
```

---

## 📊 Comparação: Antes vs Depois

### Antes (Código Antigo)

```tsx
// Específico do Mercado Pago
<CardForm
  amount={amount}
  payerEmail={email}
  mercadoPagoPublicKey={publicKey}
  onSubmit={(tokenData) => {
    // Processar
  }}
/>
```

**Limitações:**
- ❌ Acoplado ao Mercado Pago
- ❌ Difícil adicionar Stripe
- ❌ Código duplicado para cada gateway

### Depois (Nova Arquitetura)

```tsx
// Universal - funciona com qualquer gateway
<CreditCardForm
  gateway="mercadopago" // ou "stripe", "pagseguro", etc.
  publicKey={publicKey}
  amount={amount}
  payerEmail={email}
  onSubmit={(tokenData) => {
    // Processar
  }}
/>
```

**Vantagens:**
- ✅ Gateway-agnostic
- ✅ 80% código compartilhado
- ✅ Fácil adicionar novos gateways
- ✅ Type-safe

---

## 🆕 Adicionando Stripe (Exemplo)

Com a nova arquitetura, adicionar Stripe é simples:

### 1. Criar StripeFields.tsx

```tsx
// src/components/checkout/payment/fields/gateways/StripeFields.tsx

export const StripeFields = forwardRef<StripeFieldsRef, StripeFieldsProps>(
  ({ publicKey, amount, onReady }, ref) => {
    // Inicializar Stripe Elements
    // ...
    
    return (
      <div>
        <div id="stripe-card-element"></div>
      </div>
    );
  }
);
```

### 2. Atualizar useGatewayManager

```tsx
// src/components/checkout/payment/hooks/useGatewayManager.ts

async function loadStripeSDK(publicKey: string): Promise<boolean> {
  // Carregar SDK do Stripe
  // ...
}

const GATEWAY_LOADERS = {
  mercadopago: loadMercadoPagoSDK,
  stripe: loadStripeSDK, // Adicionar
  // ...
};
```

### 3. Usar no Checkout

```tsx
<CreditCardForm
  gateway="stripe" // Só mudar isso!
  publicKey={stripePublicKey}
  amount={amount}
  payerEmail={email}
  onSubmit={handleSubmit}
/>
```

✅ **Pronto!** Stripe funcionando com o mesmo formulário.

---

## 🐛 Problemas Comuns

### "SDK não carrega"

**Causa:** Public key incorreta ou rede bloqueada

**Solução:**
```tsx
const { error } = useGatewayManager({ config, enabled: true });
console.log('Erro:', error); // Ver detalhes
```

### "Token não é criado"

**Causa:** Campos do gateway não preenchidos

**Solução:**
- Verificar se os 3 campos (número, validade, CVV) estão visíveis
- Verificar console do navegador para erros do SDK

### "Validação falha"

**Causa:** CPF/CNPJ inválido

**Solução:**
- Usar CPF de teste válido: `123.456.789-09`
- Verificar se a máscara está aplicando corretamente

---

## 📞 Suporte

Dúvidas sobre migração?

1. Consulte esta documentação
2. Veja exemplos em `examples/BasicUsage.tsx`
3. Consulte `README.md` principal
4. Abra uma issue no repositório

---

**Boa sorte com a migração! 🚀**

*Desenvolvido com ❤️ seguindo o Rise Architect Protocol*
