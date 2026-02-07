
# Exibir Valor Parcelado no Total do Checkout e na Pagina de Sucesso

## Problema

Quando o cliente seleciona parcelamento (ex: 9x), o resumo do pedido exibe o valor total cheio (ex: "Total R$ 49,90"). Isso confunde o cliente, que pensa que nao parcelou. O correto e exibir "Total 9x de R$ 7,01" -- assim como concorrentes (Cakto, Kiwify) fazem.

O mesmo problema ocorre na pagina de sucesso: exibe "Total Pago R$ 49,90" sem informar quantas parcelas o cliente esta pagando.

## Analise de Solucoes

### Solucao A: Apenas frontend (passar installments via props)

- Manutenibilidade: 7/10 -- funciona no checkout mas a pagina de sucesso nao tem acesso ao dado de parcelas (nao esta salvo no banco)
- Zero DT: 5/10 -- pagina de sucesso fica sem a info, criando inconsistencia
- Arquitetura: 6/10 -- dado de parcelas nao e persistido, perdendo rastreabilidade
- Escalabilidade: 5/10 -- qualquer nova pagina que precise exibir parcelas nao tera o dado
- Seguranca: 10/10
- **NOTA FINAL: 6.2/10**

### Solucao B: Frontend + Backend (persistir installments no banco + exibir em ambos os locais)

- Manutenibilidade: 10/10 -- dado persistido, disponivel em qualquer contexto
- Zero DT: 10/10 -- checkout e sucesso exibem corretamente, dado disponivel para relatorios futuros
- Arquitetura: 10/10 -- o numero de parcelas e um atributo do pedido e DEVE ser persistido
- Escalabilidade: 10/10 -- emails, relatorios, dashboard, webhooks podem usar o dado
- Seguranca: 10/10
- **NOTA FINAL: 10.0/10**

### DECISAO: Solucao B (Nota 10.0)

A Solucao A e inferior porque o numero de parcelas e um dado transacional que pertence ao pedido. Nao persisti-lo cria divida tecnica imediata (pagina de sucesso sem info, relatorios incompletos, webhooks sem dado de parcelas).

## O que sera feito

### 1. Adicionar coluna `installments` na tabela `orders` (Migration)

Coluna `integer`, default `1`, para armazenar o numero de parcelas escolhido pelo cliente.

### 2. Salvar installments no backend ao processar pagamento

Na Edge Function `mercadopago-create-payment`, ao atualizar a order apos pagamento aprovado, incluir o campo `installments` no `updateData`.

### 3. Exibir valor parcelado no Total do checkout (SharedOrderSummary)

- Adicionar props `selectedPaymentMethod` e `selectedInstallment` ao `SharedOrderSummary`
- Quando `selectedPaymentMethod === 'credit_card'` e `selectedInstallment > 1`, o Total exibe: "9x de R$ 7,01"
- Quando PIX ou 1x, continua exibindo: "R$ 49,90"
- O calculo da parcela usa a funcao `generateInstallments` ja existente para garantir consistencia com o dropdown

### 4. Propagar installments do formulario ate o SharedOrderSummary

- `SharedCheckoutLayout` recebe `selectedPaymentMethod` (ja recebe) e `selectedInstallment` (novo)
- `CheckoutPublicContent` extrai o `selectedInstallment` do `cardFormData` no contexto da maquina ou via um state local sincronizado com o formulario de cartao

### 5. Exibir valor parcelado na pagina de sucesso (PaymentSuccessPage)

- O `order-handler.ts` agora inclui `installments` no SELECT da query
- O frontend `PaymentSuccessPage` exibe "9x de R$ 7,01" quando `installments > 1`

### 6. Recalcular parcela no frontend para exibicao

Criar uma funcao utilitaria `formatInstallmentDisplay(totalCents, installments)` que:
- Calcula o valor da parcela com juros usando a mesma logica de `generateInstallments`
- Retorna string formatada: "9x de R$ 7,01"

## Secao Tecnica

### Arquivos alterados

```text
Banco de dados:
  - Migration: ALTER TABLE orders ADD COLUMN installments integer DEFAULT 1

Backend (Edge Functions):
  - supabase/functions/mercadopago-create-payment/index.ts (salvar installments no updateData)
  - supabase/functions/checkout-public-data/handlers/order-handler.ts (incluir installments no SELECT)

Frontend:
  - src/lib/payment-gateways/installments.ts (adicionar funcao formatInstallmentDisplay)
  - src/components/checkout/shared/SharedOrderSummary.tsx (receber e exibir installments)
  - src/components/checkout/shared/SharedCheckoutLayout.tsx (propagar selectedInstallment)
  - src/modules/checkout-public/components/CheckoutPublicContent.tsx (extrair e passar installment)
  - src/pages/PaymentSuccessPage.tsx (exibir parcelas na pagina de sucesso)
```

Total: 1 migration + 2 backend + 5 frontend = 8 alteracoes

### Detalhes de cada mudanca

**Migration (SQL):**
```text
ALTER TABLE orders ADD COLUMN installments integer DEFAULT 1;
```

**mercadopago-create-payment/index.ts (~linha 255-261):**
- No `updateData`, adicionar: `installments: installments || 1`
- Isso persiste o numero de parcelas ao atualizar a order

**order-handler.ts (~linha 27-55):**
- Adicionar `installments` ao SELECT da query que busca dados para a pagina de sucesso

**installments.ts (funcao nova):**
```text
formatInstallmentDisplay(totalCents: number, installments: number, interestRate?: number): string
- Se installments === 1: retorna formatCentsToBRL(totalCents)
- Se installments > 1: calcula valor da parcela com juros e retorna "Nx de R$ X,XX"
```

**SharedOrderSummary.tsx:**
- Novas props: `selectedPaymentMethod?: 'pix' | 'credit_card'`, `selectedInstallment?: number`
- Na seção Total: se credit_card e installment > 1, usa `formatInstallmentDisplay`
- No editor/preview (mode !== 'public'), nenhuma mudanca visual

**SharedCheckoutLayout.tsx:**
- Nova prop: `selectedInstallment?: number`
- Propaga para SharedOrderSummary

**CheckoutPublicContent.tsx:**
- O `selectedInstallment` vem do estado local do formulario de cartao
- Precisa de uma forma de comunicar o installment selecionado do `MercadoPagoCardForm` ate o `SharedOrderSummary`
- Solucao: usar um state local `selectedInstallment` com callback `onInstallmentChange` passado ao card form

**PaymentSuccessPage.tsx:**
- Adicionar `installments` ao tipo `OrderDetails`
- Na secao "Total Pago": se `installments > 1`, exibir "Nx de R$ X,XX" ao lado do total

### Fluxo de dados

```text
[MercadoPagoCardForm] --onChange--> [CheckoutPublicContent (state local)]
                                          |
                                          v
                                   [SharedCheckoutLayout]
                                          |
                                          v
                                   [SharedOrderSummary]
                                    "Total: 9x de R$ 7,01"
```

```text
[mercadopago-create-payment] --save--> [orders.installments]
                                          |
                                          v
                                   [order-handler.ts SELECT]
                                          |
                                          v
                                   [PaymentSuccessPage]
                                    "Total Pago: 9x de R$ 7,01"
```

### Impacto

- A exibicao e puramente visual -- o valor cobrado nao muda
- PIX continua exibindo valor cheio (nao tem parcelamento)
- Cartao 1x (a vista) tambem exibe valor cheio
- Apenas parcelamento 2x+ muda a exibicao do Total
- Zero breaking changes nos componentes de editor/preview
- Dado de installments fica disponivel para futuros usos (relatorios, webhooks, emails)
