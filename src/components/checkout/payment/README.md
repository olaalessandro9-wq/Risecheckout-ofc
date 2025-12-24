# 🚀 Arquitetura Multi-Gateway de Pagamento

## 📋 Visão Geral

Este módulo implementa uma **arquitetura escalável e modular** para suportar múltiplos gateways de pagamento no RiseCheckout. A arquitetura foi projetada seguindo os princípios do **Rise Architect Protocol**: Clean Code, SOLID, DRY e máxima reutilização de código.

### ✨ Características Principais

- **80% de código compartilhado** entre gateways
- **20% específico** de cada gateway (iframes/elements)
- **Type-safe** com TypeScript
- **Fácil adição** de novos gateways
- **Validação robusta** com algoritmos matemáticos
- **Zero gambiarras** - código limpo e profissional

### 🎯 Gateways Suportados

| Gateway | Status | Observações |
|---------|--------|-------------|
| **Mercado Pago** | ✅ Implementado | Totalmente funcional |
| **Stripe** | 🔄 Planejado | Estrutura pronta |
| **PagSeguro** | 🔄 Planejado | Estrutura pronta |
| **Outros** | 📝 Futuro | Fácil de adicionar |

---

## 📁 Estrutura de Arquivos

```
src/components/checkout/payment/
├── README.md                          # Esta documentação
├── index.ts                           # Barrel export principal
├── CreditCardForm.tsx                 # Componente wrapper universal
│
├── core/                              # Tipos e constantes compartilhadas
│   ├── types.ts                       # Interfaces e tipos
│   └── constants.ts                   # Classes CSS e constantes
│
├── fields/                            # Campos do formulário
│   ├── shared/                        # Campos compartilhados (80%)
│   │   ├── CardHolderNameField.tsx    # Nome do titular
│   │   ├── CPFField.tsx               # CPF/CNPJ com validação
│   │   ├── InstallmentsField.tsx      # Seletor de parcelas
│   │   ├── SecurityBadge.tsx          # Selo de segurança
│   │   └── index.ts                   # Barrel export
│   │
│   └── gateways/                      # Campos específicos (20%)
│       ├── MercadoPagoFields.tsx      # 3 iframes do Mercado Pago
│       ├── StripeFields.tsx           # (Futuro) Elements do Stripe
│       ├── PagSeguroFields.tsx        # (Futuro) Campos do PagSeguro
│       └── index.ts                   # Barrel export
│
├── hooks/                             # Hooks reutilizáveis
│   ├── useGatewayManager.ts           # Gerenciador de gateways
│   └── index.ts                       # Barrel export
│
├── examples/                          # Exemplos de uso
│   └── BasicUsage.tsx                 # Exemplos práticos
│
└── services/                          # (Futuro) Serviços auxiliares
    └── tokenization.ts                # Lógica de tokenização
```

---

## 🏗️ Arquitetura

### Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────┐
│                    CreditCardForm                           │
│                   (Wrapper Universal)                        │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │           Campos Compartilhados (80%)                  │ │
│  │  • CardHolderNameField                                 │ │
│  │  • CPFField (com validação matemática)                 │ │
│  │  • InstallmentsField                                   │ │
│  │  • SecurityBadge                                       │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │      Campos Específicos do Gateway (20%)               │ │
│  │                                                         │ │
│  │  Mercado Pago:          Stripe:                        │ │
│  │  • Número (iframe)      • Número (element)             │ │
│  │  • Validade (iframe)    • Validade (element)           │ │
│  │  • CVV (iframe)         • CVV (element)                │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Fluxo de Dados

```
1. Usuário preenche formulário
   ↓
2. CreditCardForm valida campos compartilhados
   ↓
3. Gateway-specific fields tokeniza cartão
   ↓
4. CreditCardForm combina dados e chama onSubmit
   ↓
5. Backend processa pagamento
```

---

## 🚀 Como Usar

### Exemplo Básico

```tsx
import { CreditCardForm, useGatewayManager } from '@/components/checkout/payment';

function CheckoutPage() {
  const formRef = useRef<CreditCardFormRef>(null);
  
  // Configuração do gateway
  const gatewayConfig = {
    gateway: 'mercadopago',
    publicKey: 'APP_USR-xxxxxxxx',
    amount: 10000, // R$ 100,00 em centavos
    payerEmail: 'customer@example.com',
  };
  
  // Gerenciador carrega SDK automaticamente
  const { isReady, isLoading } = useGatewayManager({
    config: gatewayConfig,
    enabled: true,
  });
  
  const handleSubmit = async (tokenData: CardTokenData) => {
    // Enviar para backend
    await fetch('/api/process-payment', {
      method: 'POST',
      body: JSON.stringify(tokenData),
    });
  };
  
  if (isLoading) return <div>Carregando...</div>;
  if (!isReady) return <div>Inicializando...</div>;
  
  return (
    <div>
      <CreditCardForm
        ref={formRef}
        gateway="mercadopago"
        publicKey={gatewayConfig.publicKey}
        amount={gatewayConfig.amount}
        payerEmail={gatewayConfig.payerEmail}
        onSubmit={handleSubmit}
      />
      
      <button onClick={() => formRef.current?.submit()}>
        Pagar
      </button>
    </div>
  );
}
```

### Exemplo com Múltiplos Gateways

```tsx
function MultiGatewayCheckout() {
  const [gateway, setGateway] = useState<'mercadopago' | 'stripe'>('mercadopago');
  
  const configs = {
    mercadopago: { publicKey: 'APP_USR-xxx', gateway: 'mercadopago' },
    stripe: { publicKey: 'pk_test_xxx', gateway: 'stripe' },
  };
  
  const currentConfig = configs[gateway];
  
  return (
    <div>
      {/* Seletor de Gateway */}
      <select onChange={(e) => setGateway(e.target.value)}>
        <option value="mercadopago">Mercado Pago</option>
        <option value="stripe">Stripe</option>
      </select>
      
      {/* Formulário Universal */}
      <CreditCardForm
        gateway={currentConfig.gateway}
        publicKey={currentConfig.publicKey}
        amount={10000}
        payerEmail="customer@example.com"
        onSubmit={handleSubmit}
      />
    </div>
  );
}
```

---

## ➕ Como Adicionar um Novo Gateway

### Passo 1: Criar Campos Específicos

Crie um arquivo `src/components/checkout/payment/fields/gateways/StripeFields.tsx`:

```tsx
import { forwardRef, useImperativeHandle } from 'react';

export interface StripeFieldsProps {
  publicKey: string;
  amount: number;
  onReady?: () => void;
  onError?: (error: string) => void;
}

export interface StripeFieldsRef {
  createToken: () => Promise<{
    token: string;
    paymentMethodId: string;
  }>;
}

export const StripeFields = forwardRef<StripeFieldsRef, StripeFieldsProps>(
  ({ publicKey, amount, onReady, onError }, ref) => {
    
    // Inicializar Stripe Elements
    // ...
    
    useImperativeHandle(ref, () => ({
      createToken: async () => {
        // Tokenizar cartão via Stripe
        // ...
      },
    }));
    
    return (
      <div>
        {/* Renderizar Stripe Elements */}
        <div id="stripe-card-element"></div>
      </div>
    );
  }
);
```

### Passo 2: Adicionar Loader no useGatewayManager

Edite `src/components/checkout/payment/hooks/useGatewayManager.ts`:

```tsx
async function loadStripeSDK(publicKey: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    if (window.Stripe) {
      resolve(true);
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/';
    script.async = true;
    
    script.onload = () => {
      if (window.Stripe) {
        window.Stripe(publicKey);
        resolve(true);
      } else {
        reject(new Error('Stripe não carregado'));
      }
    };
    
    script.onerror = () => reject(new Error('Erro ao carregar Stripe'));
    document.head.appendChild(script);
  });
}
```

### Passo 3: Adicionar no CreditCardForm

Edite `src/components/checkout/payment/CreditCardForm.tsx`:

```tsx
import { StripeFields, type StripeFieldsRef } from './fields/gateways';

// Adicionar ref
const stripeFieldsRef = useRef<StripeFieldsRef>(null);

// Adicionar no render
{gateway === 'stripe' && (
  <StripeFields
    ref={stripeFieldsRef}
    publicKey={publicKey}
    amount={amount}
    onReady={() => console.log('Stripe pronto')}
    onError={onError}
  />
)}

// Adicionar no handleSubmit
if (gateway === 'stripe') {
  const stripeToken = await stripeFieldsRef.current.createToken();
  tokenData = {
    token: stripeToken.token,
    installments: selectedInstallments,
    paymentMethodId: stripeToken.paymentMethodId,
    cardholderName,
    cardholderDocument: cardholderDocument.replace(/\D/g, ''),
  };
}
```

### Passo 4: Testar

```tsx
<CreditCardForm
  gateway="stripe"
  publicKey="pk_test_xxx"
  amount={10000}
  payerEmail="customer@example.com"
  onSubmit={handleSubmit}
/>
```

✅ **Pronto!** Novo gateway adicionado com sucesso.

---

## 🧪 Validações

### CPF/CNPJ

A validação de CPF/CNPJ usa o **algoritmo matemático oficial da Receita Federal**:

```typescript
// CPF: 000.000.000-00
// Valida dígitos verificadores usando módulo 11

// CNPJ: 00.000.000/0000-00
// Valida dígitos verificadores usando módulo 11
```

**Características:**
- ✅ Validação matemática (não apenas formato)
- ✅ Rejeita CPFs/CNPJs com todos os dígitos iguais
- ✅ Máscara automática durante digitação
- ✅ maxLength dinâmico (14 para CPF, 18 para CNPJ)

### Nome do Titular

```typescript
// Remove números e caracteres especiais
// Permite apenas letras, espaços e acentos
// Mínimo 3 caracteres
```

### Parcelamento

```typescript
// Valida se foi selecionado
// Formata valores em BRL
// Indica se tem juros
```

---

## 🎨 Customização

### Classes CSS

Todas as classes CSS estão centralizadas em `core/constants.ts`:

```typescript
export const INPUT_BASE_CLASS = 'w-full h-10 px-3 rounded-lg border...';
export const INPUT_ERROR_CLASS = 'ring-2 ring-red-500 border-red-500';
export const LABEL_CLASS = 'text-xs text-gray-500 font-medium';
```

**Para customizar:**

1. Edite as constantes em `core/constants.ts`
2. Ou sobrescreva com Tailwind no componente pai

### Limitações dos Iframes

⚠️ **Importante:** Os iframes do Mercado Pago **não permitem** customização completa de estilo, especialmente `font-family`. Isso é uma limitação de segurança do gateway.

**O que pode customizar:**
- ✅ Cores (`color`)
- ✅ Tamanho da fonte (`fontSize`)
- ✅ Padding e margin do container

**O que NÃO pode customizar:**
- ❌ Font-family (usa fonte padrão do gateway)
- ❌ Estilos internos do iframe

---

## 🔒 Segurança

### Tokenização

- ✅ Dados do cartão **nunca** passam pelo seu servidor
- ✅ Tokenização feita direto no navegador via SDK
- ✅ Token é enviado para o gateway via HTTPS
- ✅ Conformidade com PCI-DSS

### Validação

- ✅ Validação client-side para UX
- ✅ Validação server-side obrigatória (no backend)
- ✅ Algoritmos matemáticos oficiais (CPF/CNPJ)

### Chaves

- ✅ Use **public keys** no frontend
- ✅ **Access tokens** apenas no backend
- ✅ Nunca exponha credenciais sensíveis

---

## 📊 Performance

### Lazy Loading

O SDK do gateway é carregado apenas quando necessário:

```typescript
const { isReady } = useGatewayManager({
  config: gatewayConfig,
  enabled: showPaymentForm, // Só carrega quando true
});
```

### Memoização

Componentes usam `memo()` para evitar re-renders:

```typescript
export const CardHolderNameField = memo<CardHolderNameFieldProps>(({ ... }) => {
  // ...
});
```

### Code Splitting

Use lazy loading para carregar o módulo sob demanda:

```typescript
const CreditCardForm = lazy(() => 
  import('@/components/checkout/payment').then(m => ({ 
    default: m.CreditCardForm 
  }))
);
```

---

## 🐛 Troubleshooting

### SDK não carrega

**Problema:** Gateway não inicializa

**Solução:**
1. Verifique se a `publicKey` está correta
2. Verifique console do navegador para erros
3. Teste conexão com internet
4. Verifique se o domínio está autorizado no gateway

### Validação falha

**Problema:** Formulário não submete

**Solução:**
1. Abra DevTools e veja erros no console
2. Verifique se todos os campos estão preenchidos
3. Teste CPF/CNPJ válidos (ex: 123.456.789-09)
4. Verifique se o cartão é válido

### Token não é criado

**Problema:** `createToken()` falha

**Solução:**
1. Verifique se os 3 campos do gateway estão preenchidos
2. Verifique se o cartão é válido
3. Veja mensagens de erro do SDK no console
4. Teste com cartões de teste do gateway

---

## 📚 Referências

### Mercado Pago
- [Card Form API](https://www.mercadopago.com.br/developers/pt/docs/checkout-api/integration-configuration/card/integrate-via-cardform)
- [Cartões de Teste](https://www.mercadopago.com.br/developers/pt/docs/checkout-api/additional-content/test-cards)

### Stripe
- [Elements](https://stripe.com/docs/payments/elements)
- [Payment Intents](https://stripe.com/docs/payments/payment-intents)

### PagSeguro
- [Checkout Transparente](https://dev.pagseguro.uol.com.br/reference/checkout-transparente)

---

## 🤝 Contribuindo

### Adicionando um Gateway

1. Crie `fields/gateways/NomeGatewayFields.tsx`
2. Adicione loader em `hooks/useGatewayManager.ts`
3. Adicione lógica em `CreditCardForm.tsx`
4. Adicione testes
5. Atualize esta documentação

### Code Review Checklist

- [ ] TypeScript sem erros
- [ ] Componentes memoizados
- [ ] Validação robusta
- [ ] Sem console.log em produção
- [ ] Documentação atualizada
- [ ] Exemplos funcionando

---

## 📝 Changelog

### v1.0.0 (2024-12-17)
- ✅ Arquitetura multi-gateway implementada
- ✅ Mercado Pago totalmente funcional
- ✅ Campos compartilhados (80% reutilização)
- ✅ Validação matemática de CPF/CNPJ
- ✅ Hook useGatewayManager
- ✅ Documentação completa
- ✅ Exemplos de uso

### Próximas Versões
- 🔄 v1.1.0: Adicionar Stripe
- 🔄 v1.2.0: Adicionar PagSeguro
- 🔄 v1.3.0: Adicionar mais gateways

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Consulte esta documentação
2. Veja exemplos em `examples/BasicUsage.tsx`
3. Abra uma issue no repositório

---

**Desenvolvido com ❤️ seguindo o Rise Architect Protocol**

*Sem gambiarras. Apenas código limpo e profissional.*
