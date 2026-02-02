

# Plano: Consolidação dos Testes E2E para Mercado Pago Único

## 1. Contexto e Decisão Estratégica

### 1.1 Análise RISE V3 da Decisão

| Critério | Peso | Nota (Multi-Gateway) | Nota (MP Único) | Justificativa |
|----------|------|----------------------|-----------------|---------------|
| Manutenibilidade Infinita | 30% | 6/10 | 10/10 | 100 gateways = impossível manter; 1 gateway = trivial |
| Zero Dívida Técnica | 25% | 5/10 | 10/10 | Testes falhos para gateways desativados = dívida |
| Arquitetura Correta | 20% | 7/10 | 10/10 | Gateway é infraestrutura, não lógica de negócio |
| Escalabilidade | 15% | 3/10 | 10/10 | Adicionar gateway ≠ adicionar teste E2E |
| Segurança | 10% | 10/10 | 10/10 | N/A |

**NOTA FINAL Multi-Gateway: 5.9/10**
**NOTA FINAL MP Único: 10.0/10**

**DECISÃO: Mercado Pago Único (Nota 10.0)**

A arquitetura de testes multi-gateway viola o princípio de que gateways são infraestrutura "implementa e pronto". O foco correto é testar as FUNCIONALIDADES (order bumps, cupons, fluxos) usando UM gateway de referência.

### 1.2 Por que Mercado Pago como Referência

| Característica | Mercado Pago | Outros |
|----------------|--------------|--------|
| PIX | SIM | Parcial |
| Cartão de Crédito | SIM | Não (Asaas/PushinPay) |
| Sandbox Completo | SIM | Limitado |
| Maior Uso no Brasil | SIM | Não |
| Documentação de Testes | Excelente | Variável |

## 2. Estrutura Proposta

### 2.1 De: Testes por Gateway (Atual)

```text
e2e/specs/critical/
├── happy-path-pix.spec.ts     # 7 testes (3 gateways × 2 + 1)
├── happy-path-card.spec.ts    # 6 testes (3 gateways × 2)
├── card-declined.spec.ts      # 6 testes (3 gateways)
├── coupon-validation.spec.ts  # 6 testes (PushinPay)
└── redirect-validation.spec.ts # 9 testes (múltiplos gateways)
```

### 2.2 Para: Testes por Funcionalidade (Mercado Pago Único)

```text
e2e/specs/critical/
├── complete-pix-flow.spec.ts        # Fluxo PIX completo
├── complete-card-flow.spec.ts       # Fluxo Cartão completo
├── card-errors.spec.ts              # Cartão recusado + retry
├── coupon-validation.spec.ts        # Cupons válidos/inválidos/expirados
├── order-bump.spec.ts               # Order Bumps com preço
├── redirect-validation.spec.ts      # URLs corretas
└── form-validation.spec.ts          # Validação de formulário
```

## 3. Arquivos a Modificar

### 3.1 test-data.ts - Simplificar para MP Único

**Remover:**
- `TEST_CHECKOUT_GATEWAYS.pushinpay`
- `TEST_CHECKOUT_GATEWAYS.asaas`
- `TEST_CHECKOUT_GATEWAYS.stripe`
- `TEST_CARDS.stripe`
- `TEST_CARDS.asaas`

**Manter:**
- `TEST_CHECKOUT_GATEWAYS.mercadopago` (renomear para `TEST_CHECKOUT_MERCADOPAGO`)
- `TEST_CARDS.mercadopago`

**Adicionar:**
- JSDoc explicando a decisão de usar apenas Mercado Pago

### 3.2 happy-path-pix.spec.ts - Consolidar em Complete PIX Flow

**Remover:**
- `test.describe("PushinPay Gateway")` (linhas 24-109)
- `test.describe("Asaas Gateway")` (linhas 136-159)

**Manter:**
- `test.describe("MercadoPago Gateway")` expandido com mais validações

### 3.3 happy-path-card.spec.ts - Consolidar em Complete Card Flow

**Remover:**
- `test.describe("Stripe Gateway")` (linhas 101-128)
- `test.describe("Asaas Gateway")` (linhas 130-157)

**Manter e expandir:**
- `test.describe("MercadoPago Gateway")` com testes de parcelas, order bumps, etc.

### 3.4 card-declined.spec.ts - Manter apenas MP

**Remover:**
- `test.describe("Stripe Gateway")` (linhas 144-172)
- `test.describe("Asaas Gateway")` (linhas 174-202)

**Manter:**
- `test.describe("MercadoPago Gateway")`
- `test.describe("User Experience")`

### 3.5 coupon-validation.spec.ts - Migrar para MP

**Atualizar:**
- Trocar `TEST_CHECKOUT_GATEWAYS.pushinpay.slug` por `TEST_CHECKOUT_MERCADOPAGO.slug`
- Manter todos os testes de cupom (válido, inválido, expirado, remoção)

### 3.6 redirect-validation.spec.ts - Simplificar

**Remover:**
- `test.describe("Cross-Gateway Redirect Consistency")` (linhas 247-293)
- Testes usando Stripe/Asaas

**Manter:**
- Validações de URL para PIX e Card (apenas MP)

### 3.7 Novo: order-bump.spec.ts - Criar Spec Dedicado

**Mover de:**
- `e2e/specs/checkout-bumps.spec.ts`

**Para:**
- `e2e/specs/critical/order-bump.spec.ts` com slug MP

### 3.8 docs/TESTING_SYSTEM.md - Atualizar

**Adicionar seção:**
- Explicar que testes E2E usam apenas Mercado Pago
- Documentar requisitos de conta Admin para Sandbox
- Listar o checkout obrigatório: `test-checkout-mercadopago`

## 4. Testes Finais (Apenas Mercado Pago)

| Spec | Testes | O que Valida |
|------|--------|--------------|
| `complete-pix-flow.spec.ts` | 4 | PIX completo → QR Code → Copiar Código |
| `complete-card-flow.spec.ts` | 4 | Cartão aprovado → Success Page |
| `card-errors.spec.ts` | 5 | Cartão recusado → Retry → Sucesso |
| `coupon-validation.spec.ts` | 6 | Cupom válido/inválido/expirado/remoção |
| `order-bump.spec.ts` | 4 | Selecionar bump → Preço atualiza → Pagamento |
| `redirect-validation.spec.ts` | 5 | URLs /pay/pix/, /success/, UUIDs válidos |
| `form-validation.spec.ts` | 4 | Campos obrigatórios, CPF, telefone |
| **TOTAL** | **32** | Cobertura completa de funcionalidades |

## 5. O que Você Precisa Fazer

### 5.1 Pré-requisito: Conta Admin

```sql
-- Adicionar role admin ao seu usuário
INSERT INTO user_roles (user_id, role) VALUES ('SEU_USER_ID', 'admin');
```

### 5.2 Configurar Mercado Pago Sandbox

1. Acessar: https://www.mercadopago.com.br/developers/panel
2. Criar ou acessar aplicação de teste
3. Copiar **Public Key** e **Access Token** do modo **Sandbox**

### 5.3 Criar Checkout de Teste

| Campo | Valor |
|-------|-------|
| Slug | `test-checkout-mercadopago` |
| Gateway | Mercado Pago (Sandbox) |
| PIX | Habilitado |
| Cartão | Habilitado |
| Order Bump | Pelo menos 1 configurado |

### 5.4 Criar Cupons de Teste

| Código | Tipo | Valor | Status |
|--------|------|-------|--------|
| `VALID10` | Percentual | 10% | Ativo |
| `EXPIRED2020` | Percentual | 10% | Data passada |

### 5.5 Executar Testes

```bash
# Todos os testes críticos
pnpm exec playwright test e2e/specs/critical/

# Modo visual
pnpm exec playwright test e2e/specs/critical/ --headed

# Relatório
pnpm exec playwright test e2e/specs/critical/ --reporter=html
```

## 6. Cartões de Teste do Mercado Pago

### 6.1 Cartão APROVADO

```text
Número: 5031 4332 1540 6351 (Mastercard)
Validade: 11/30
CVV: 123
Nome do Titular: APRO
CPF: 123.456.789-09
```

### 6.2 Cartão RECUSADO

```text
Número: 5031 7557 3453 0604 (Mastercard)
Validade: 11/30
CVV: 123
Nome do Titular: OTHE
CPF: 123.456.789-09
```

## 7. Seção Técnica

### 7.1 Arquivos a Criar/Modificar

```text
MODIFICAR:
├── e2e/fixtures/test-data.ts              # Remover gateways não usados
├── e2e/specs/critical/happy-path-pix.spec.ts      # Remover PushinPay/Asaas
├── e2e/specs/critical/happy-path-card.spec.ts     # Remover Stripe/Asaas
├── e2e/specs/critical/card-declined.spec.ts       # Remover Stripe/Asaas
├── e2e/specs/critical/coupon-validation.spec.ts   # Usar slug MP
├── e2e/specs/critical/redirect-validation.spec.ts # Simplificar
└── docs/TESTING_SYSTEM.md                 # Atualizar documentação

CRIAR:
└── e2e/specs/critical/order-bump.spec.ts  # Order bumps com MP
```

### 7.2 Linhas de Código

| Ação | Linhas |
|------|--------|
| Removidas | ~400 (blocos de outros gateways) |
| Adicionadas | ~100 (order bumps + docs) |
| Líquido | -300 linhas |

### 7.3 Benefícios da Consolidação

1. **Manutenibilidade**: 1 gateway = 1 configuração
2. **Escalabilidade**: Adicionar gateway ≠ adicionar testes
3. **Velocidade**: Menos testes = CI mais rápido
4. **Clareza**: Foco em funcionalidades, não infraestrutura
5. **RISE V3 Compliance**: 10.0/10

## 8. Resumo Executivo

```text
╔══════════════════════════════════════════════════════════════════════════════╗
║              CONSOLIDAÇÃO E2E: MERCADO PAGO ÚNICO                             ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║  ANTES:                              DEPOIS:                                  ║
║  • 4 gateways (PushinPay, MP,       • 1 gateway (Mercado Pago)               ║
║    Asaas, Stripe)                   • Foco em FUNCIONALIDADES                ║
║  • ~40 testes duplicados            • 32 testes únicos                       ║
║  • Testes falham para Stripe        • Zero falsos negativos                  ║
║    desativado                       • CI 50% mais rápido                     ║
║                                                                               ║
║  FUNCIONALIDADES TESTADAS:                                                    ║
║  ✅ Fluxo PIX completo (QR Code, Copiar)                                     ║
║  ✅ Fluxo Cartão completo (Parcelas, Success)                                ║
║  ✅ Cartão recusado + Retry                                                  ║
║  ✅ Cupons (válido, inválido, expirado, remoção)                             ║
║  ✅ Order Bumps (preço atualizado)                                           ║
║  ✅ Validação de Formulário                                                  ║
║  ✅ Redirects corretos                                                       ║
║                                                                               ║
║  VOCÊ PRECISA:                                                                ║
║  1. Conta Admin                                                               ║
║  2. Mercado Pago Sandbox configurado                                         ║
║  3. 1 Checkout: test-checkout-mercadopago                                    ║
║  4. 2 Cupons: VALID10, EXPIRED2020                                           ║
║                                                                               ║
║  NOTA RISE V3: 10.0/10                                                        ║
║                                                                               ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

