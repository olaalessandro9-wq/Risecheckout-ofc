
# Plano: Testes E2E Críticos para Fluxo de Compra

## Visão Geral

Este plano cria testes E2E completos para os 4 cenários críticos de produção:

1. **Compra Aprovada** (PIX e Cartão)
2. **Compra Recusada** (Cartão declinado)
3. **Cupom Aplicado Corretamente**
4. **Redirect Correto** (Sucesso / Erro)

## Análise de Soluções (RISE V3 - Seção 4)

### Solução A: Testes Integrados em Arquivo Único
- Manutenibilidade: 7/10 (arquivo grande, difícil navegação)
- Zero DT: 6/10 (tendência a crescer demais)
- Arquitetura: 6/10 (viola SRP)
- Escalabilidade: 5/10 (difícil adicionar novos gateways)
- Segurança: 10/10 (não aplicável)
- **NOTA FINAL: 6.8/10**
- Tempo estimado: 2-3 horas

### Solução B: Spec Modular com Page Objects Dedicados
- Manutenibilidade: 10/10 (arquivos focados, fácil manutenção)
- Zero DT: 10/10 (estrutura extensível)
- Arquitetura: 10/10 (segue SRP, um spec por cenário)
- Escalabilidade: 10/10 (adicionar gateway = adicionar bloco)
- Segurança: 10/10 (não aplicável)
- **NOTA FINAL: 10.0/10**
- Tempo estimado: 4-5 horas

### DECISÃO: Solução B (Nota 10.0)
A Solução A é inferior por violar o princípio de responsabilidade única e criar dificuldades de manutenção futuras.

## Arquivos a Serem Criados/Modificados

```
e2e/
├── specs/
│   ├── critical/
│   │   ├── happy-path-pix.spec.ts         # NOVO - Fluxo PIX aprovado
│   │   ├── happy-path-card.spec.ts        # NOVO - Fluxo Cartão aprovado
│   │   ├── card-declined.spec.ts          # NOVO - Cartão recusado
│   │   ├── coupon-validation.spec.ts      # NOVO - Cupom aplicado
│   │   └── redirect-validation.spec.ts    # NOVO - Redirects corretos
└── fixtures/
    ├── test-data.ts                       # MODIFICAR - Adicionar dados de gateways
    └── pages/
        └── CheckoutPage.ts                # MODIFICAR - Adicionar métodos helper
```

## Detalhamento dos Testes

### 1. Happy Path PIX (`happy-path-pix.spec.ts`)

Fluxo completo de compra via PIX para cada gateway:

```
describe("Happy Path PIX - Fluxo Completo de Compra")
├── "should complete PIX purchase and navigate to PIX page"
│   ├── Navegar para /pay/{slug}
│   ├── Aguardar checkout carregar (waitForCheckoutReady)
│   ├── Preencher formulário (nome, email, telefone, CPF)
│   ├── Selecionar PIX como método de pagamento
│   ├── Clicar no botão de submit
│   ├── Aguardar navegação para /pay/pix/{orderId}
│   ├── Verificar QR Code visível
│   └── Verificar botão "Copiar código" funcional
│
├── "should display PIX amount correctly"
│   └── Verificar valor do pedido na página PIX
│
└── "should show PIX expiration timer"
    └── Verificar timer de expiração visível
```

Gateways testados:
- PushinPay (gateway PIX padrão)
- MercadoPago
- Asaas

### 2. Happy Path Cartão (`happy-path-card.spec.ts`)

Fluxo completo de compra via Cartão para cada gateway:

```
describe("Happy Path Card - Fluxo Completo de Compra")
├── "should complete card purchase and navigate to success page"
│   ├── Navegar para /pay/{slug}
│   ├── Aguardar checkout carregar
│   ├── Preencher formulário cliente
│   ├── Selecionar Cartão como método de pagamento
│   ├── Aguardar formulário de cartão aparecer
│   ├── Preencher dados do cartão de teste APROVADO
│   ├── Selecionar parcelas
│   ├── Submeter pagamento
│   ├── Aguardar navegação para /success/{orderId}
│   └── Verificar indicadores de sucesso na página
│
└── "should display order details on success page"
    ├── Verificar nome do produto
    ├── Verificar valor pago
    └── Verificar email do cliente
```

Gateways e cartões de teste:
- MercadoPago: `5031 4332 1540 6351` (Mastercard aprovado)
- Stripe: `4242 4242 4242 4242` (Visa aprovado)
- Asaas: `4111 1111 1111 1111` (Visa aprovado)

### 3. Cartão Recusado (`card-declined.spec.ts`)

Teste de pagamento recusado e tratamento de erro:

```
describe("Card Declined - Tratamento de Erros")
├── "should show error message for declined card"
│   ├── Navegar para checkout
│   ├── Preencher formulário
│   ├── Selecionar Cartão
│   ├── Preencher cartão de teste RECUSADO
│   ├── Submeter pagamento
│   ├── Aguardar mensagem de erro (não navegar para sucesso)
│   ├── Verificar erro visível na UI
│   └── Verificar que permaneceu na página de checkout
│
├── "should allow retry after declined payment"
│   ├── Após recusa, dados do formulário preservados
│   ├── Preencher novo cartão (aprovado)
│   └── Verificar que pode submeter novamente
│
└── "should show user-friendly error messages"
    ├── Testar diferentes códigos de recusa
    └── Verificar mensagens em português
```

Cartões de recusa por gateway:
- MercadoPago: `5031 7557 3453 0604` (recusado)
- Stripe: `4000 0000 0000 0002` (cartão recusado genérico)
- Asaas: Simular via mock de API

### 4. Cupom Aplicado (`coupon-validation.spec.ts`)

Teste completo do fluxo de cupom:

```
describe("Coupon Validation - Aplicação de Cupom")
├── "should apply valid coupon and show discount"
│   ├── Navegar para checkout
│   ├── Verificar input de cupom visível
│   ├── Digitar código de cupom válido
│   ├── Clicar em "Aplicar"
│   ├── Aguardar feedback de sucesso (toast ou mensagem)
│   ├── Verificar desconto aplicado no total
│   └── Verificar que cupom aparece como aplicado
│
├── "should show error for invalid coupon"
│   ├── Digitar cupom inválido
│   ├── Clicar em "Aplicar"
│   └── Verificar mensagem de erro
│
├── "should show error for expired coupon"
│   ├── Digitar cupom expirado
│   └── Verificar mensagem "cupom expirado"
│
├── "should allow removing applied coupon"
│   ├── Aplicar cupom válido
│   ├── Clicar em remover
│   └── Verificar total voltou ao original
│
└── "should maintain coupon through payment flow"
    ├── Aplicar cupom
    ├── Preencher formulário
    ├── Submeter PIX
    └── Verificar desconto aplicado na página PIX
```

### 5. Redirect Validation (`redirect-validation.spec.ts`)

Verificação de todos os redirects do fluxo:

```
describe("Redirect Validation - Navegação Correta")
├── describe("Success Redirects")
│   ├── "PIX payment should redirect to /pay/pix/{orderId}"
│   │   ├── Submeter pagamento PIX
│   │   └── Verificar URL contém /pay/pix/
│   │
│   ├── "Card approved should redirect to /success/{orderId}"
│   │   ├── Submeter cartão aprovado
│   │   └── Verificar URL contém /success/
│   │
│   └── "Success page should have valid orderId in URL"
│       ├── Extrair orderId da URL
│       └── Verificar formato UUID válido
│
├── describe("Error Redirects")
│   ├── "Declined card should NOT redirect (stay on checkout)"
│   │   ├── Submeter cartão recusado
│   │   └── Verificar permanece em /pay/{slug}
│   │
│   └── "Network error should show error and stay on checkout"
│       ├── Simular erro de rede
│       └── Verificar permanece na página
│
└── describe("State Preservation on Redirect")
    ├── "PIX page should receive order data via state"
    │   ├── Navegar para PIX page
    │   └── Verificar QR Code (indica dados recebidos)
    │
    └── "Success page should load order details"
        ├── Navegar para success page
        └── Verificar detalhes do pedido carregados
```

## Dados de Teste (test-data.ts)

Adições ao arquivo existente:

```typescript
// Gateways de teste com checkouts configurados
export const TEST_CHECKOUT_GATEWAYS = {
  pushinpay: {
    slug: "test-checkout-pushinpay",
    pixEnabled: true,
    cardEnabled: false,
  },
  mercadopago: {
    slug: "test-checkout-mercadopago", 
    pixEnabled: true,
    cardEnabled: true,
  },
  asaas: {
    slug: "test-checkout-asaas",
    pixEnabled: true,
    cardEnabled: true,
  },
  stripe: {
    slug: "test-checkout-stripe",
    pixEnabled: true,
    cardEnabled: true,
  },
} as const;

// Cartões de teste por gateway
export const TEST_CARDS = {
  mercadopago: {
    approved: {
      number: "5031 4332 1540 6351",
      expiry: "11/30",
      cvv: "123",
      holder: "APRO",
    },
    declined: {
      number: "5031 7557 3453 0604",
      expiry: "11/30", 
      cvv: "123",
      holder: "OTHE",
    },
  },
  stripe: {
    approved: {
      number: "4242 4242 4242 4242",
      expiry: "12/30",
      cvv: "123",
      holder: "Test User",
    },
    declined: {
      number: "4000 0000 0000 0002",
      expiry: "12/30",
      cvv: "123",
      holder: "Test User",
    },
  },
  asaas: {
    approved: {
      number: "4111 1111 1111 1111",
      expiry: "12/30",
      cvv: "123",
      holder: "Test User",
    },
  },
} as const;

// Cupons de teste
export const TEST_COUPONS = {
  valid: {
    code: "VALID10",
    discountType: "percentage",
    discountValue: 10,
  },
  invalid: {
    code: "INVALIDCOUPON999",
  },
  expired: {
    code: "EXPIRED2020",
  },
} as const;
```

## Page Object Additions (CheckoutPage.ts)

Novos métodos a serem adicionados:

```typescript
// Card form helpers
async fillCardForm(card: {
  number: string;
  expiry: string;
  cvv: string;
  holder: string;
}): Promise<void> {
  const cardNumber = this.page.locator('input[name="cardNumber"]');
  const cardExpiry = this.page.locator('input[name="cardExpiry"]');
  const cardCvv = this.page.locator('input[name="cardCvv"]');
  const cardHolder = this.page.locator('input[name="cardHolder"]');

  await cardNumber.fill(card.number.replace(/\s/g, ''));
  await cardExpiry.fill(card.expiry);
  await cardCvv.fill(card.cvv);
  await cardHolder.fill(card.holder);
}

async selectInstallments(count: number): Promise<void> {
  const select = this.page.locator('select[name="installments"]');
  if (await select.isVisible({ timeout: 2000 }).catch(() => false)) {
    await select.selectOption({ value: String(count) });
  }
}

async waitForPaymentError(): Promise<void> {
  const errorLocator = this.page.locator(
    '[data-testid="payment-error"], :has-text("recusado"), :has-text("erro"), [role="alert"]'
  ).first();
  await expect(errorLocator).toBeVisible({ timeout: 10000 });
}

async getAppliedCouponDiscount(): Promise<string> {
  return await this.discountAmount.textContent() ?? "";
}
```

## Fluxo de Execução dos Testes

```
┌─────────────────────────────────────────────────────────────┐
│                    TESTE: Happy Path PIX                     │
└─────────────────────────────────────────────────────────────┘
                              │
    ┌─────────────────────────┴─────────────────────────┐
    │                                                   │
    ▼                                                   ▼
┌─────────────────┐                         ┌─────────────────┐
│ Checkout Page   │                         │ PIX Payment Page│
│ - Preencher form│                         │ - QR Code       │
│ - Selecionar PIX│                         │ - Copiar código │
│ - Submeter      │                         │ - Timer         │
└────────┬────────┘                         └─────────────────┘
         │                                           ▲
         │  navigate(/pay/pix/{orderId})            │
         └───────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────┐
│                   TESTE: Happy Path Card                     │
└─────────────────────────────────────────────────────────────┘
                              │
    ┌─────────────────────────┴─────────────────────────┐
    │                                                   │
    ▼                                                   ▼
┌─────────────────┐                         ┌─────────────────┐
│ Checkout Page   │                         │ Success Page    │
│ - Preencher form│                         │ - Ícone sucesso │
│ - Cartão válido │                         │ - Detalhes ordem│
│ - Submeter      │                         │ - Valor pago    │
└────────┬────────┘                         └─────────────────┘
         │                                           ▲
         │  navigate(/success/{orderId})            │
         └───────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────┐
│                  TESTE: Card Declined                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                   ┌─────────────────┐
                   │ Checkout Page   │
                   │ - Preencher form│
                   │ - Cartão recusa │
                   │ - Submeter      │
                   │ ─────────────── │
                   │ - Erro exibido  │
                   │ - Permanece aqui│
                   └─────────────────┘
```

## Requisitos de Ambiente

Para os testes funcionarem corretamente:

1. **Checkouts de teste no banco:**
   - Criar checkouts com slugs específicos para cada gateway
   - Configurar cada checkout com o gateway correspondente

2. **Gateways em modo sandbox:**
   - PushinPay: API de teste
   - MercadoPago: Credenciais de teste (Access Token de teste)
   - Stripe: Chaves pk_test_* / sk_test_*
   - Asaas: Ambiente sandbox habilitado

3. **Cupons de teste:**
   - Criar cupom `VALID10` (10% desconto, ativo)
   - Criar cupom `EXPIRED2020` (expirado)

## Métricas de Sucesso

| Cenário | Antes | Depois |
|---------|-------|--------|
| Compra PIX completa (E2E) | 0% | 100% |
| Compra Cartão completa (E2E) | 0% | 100% |
| Cartão Recusado (E2E) | ~35% (parcial) | 100% |
| Cupom Aplicado (E2E) | ~40% (parcial) | 100% |
| Redirect Correto (E2E) | 0% | 100% |
| **Cobertura Fluxo Crítico** | **~20%** | **100%** |

## Ordem de Implementação

1. **P0 - Crítico:** `happy-path-pix.spec.ts` (70%+ das vendas são PIX)
2. **P0 - Crítico:** `happy-path-card.spec.ts` (valida fluxo de cartão)
3. **P1 - Alto:** `card-declined.spec.ts` (UX de erro)
4. **P1 - Alto:** `redirect-validation.spec.ts` (navegação correta)
5. **P2 - Médio:** `coupon-validation.spec.ts` (funcionalidade auxiliar)

## Seção Técnica

### Dependências
- Playwright 1.57+ (já instalado)
- Page Objects existentes (CheckoutPage, PixPaymentPage, SuccessPage)

### Execução dos Testes
```bash
# Todos os testes críticos
pnpm test:e2e e2e/specs/critical/

# Apenas Happy Path
pnpm test:e2e --grep "Happy Path"

# Apenas PIX
pnpm test:e2e --grep "Happy Path PIX"

# Apenas Cartão
pnpm test:e2e --grep "Happy Path Card"

# Apenas Recusados
pnpm test:e2e --grep "Declined"
```

### Integração CI/CD
Os testes críticos devem ser executados em toda PR que altere:
- `src/modules/checkout-public/`
- `supabase/functions/create-order/`
- `supabase/functions/*-create-payment/`
- `src/pages/Pix*` ou `src/pages/Payment*`

### Estimativa de Tempo
- Total: ~4-5 horas de implementação
- Por arquivo: ~45-60 minutos
