
# Limitar Parcelamento do Mercado Pago a 9x

## Problema

O dropdown de parcelamento no checkout exibe opcoes de 1x ate 12x. O produtor deseja limitar o parcelamento via Mercado Pago a no maximo **9 parcelas**.

## Causa Raiz

O valor `maxInstallments` esta definido como `12` em tres locais diferentes do codigo, e o backend nao valida o limite maximo de parcelas recebido do frontend.

## Alteracoes Necessarias

### 1. Hook de Estado do Formulario (Frontend - Gerador de Parcelas)

**Arquivo:** `src/lib/payment-gateways/gateways/mercado-pago/hooks/useCardFormState.ts`

Na linha 61, a chamada `generateInstallments(amount)` nao passa `maxInstallments`, herdando o default de 12. Sera alterada para:

```text
generateInstallments(amount, { maxInstallments: 9 })
```

Este e o ponto principal -- e aqui que a lista de parcelas visivel no checkout e gerada.

### 2. Definicao do Gateway Mercado Pago

**Arquivo:** `src/lib/payment-gateways/gateways/mercado-pago/index.ts`

Na linha 17, o default do parametro `maxInstallments` sera alterado de `12` para `9`, garantindo que qualquer chamada a `mercadoPagoGateway.generateInstallments(amount)` respeite o novo limite.

### 3. Configuracao do Brick (componente legado)

**Arquivo:** `src/integrations/gateways/mercadopago/Brick.tsx`

Na linha 91, `maxInstallments: 12` sera alterado para `maxInstallments: 9`.

### 4. Validacao no Backend (Edge Function)

**Arquivo:** `supabase/functions/mercadopago-create-payment/handlers/card-handler.ts`

Adicionar validacao na funcao `handleCardPayment` para rejeitar requisicoes com `installments > 9`. Isso impede que um usuario mal-intencionado envie um valor manipulado diretamente na API, ignorando a restricao do frontend.

```text
Se installments > 9 → retorna erro 400 com mensagem clara
```

## Secao Tecnica

### Arquivos alterados (4 arquivos, 0 criados, 0 deletados)

```text
src/lib/payment-gateways/gateways/mercado-pago/hooks/useCardFormState.ts  (linha 61)
src/lib/payment-gateways/gateways/mercado-pago/index.ts                   (linha 17)
src/integrations/gateways/mercadopago/Brick.tsx                            (linha 91)
supabase/functions/mercadopago-create-payment/handlers/card-handler.ts     (apos linha 105)
```

### Impacto

- O dropdown de parcelamento passara a exibir opcoes de 1x ate 9x (maximo)
- A API rejeitara qualquer tentativa de parcelamento acima de 9x
- Zero breaking changes -- apenas reduz o range de opcoes
- Stripe nao e afetado (mantem seus proprios limites separadamente)
