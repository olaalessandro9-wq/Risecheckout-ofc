

# Remover Asaas da Opcao de Cartao de Credito

## Diagnostico

No arquivo `src/config/payment-gateways.ts`, linha 58, o gateway Asaas esta configurado com:

```typescript
supportedMethods: ['pix', 'credit_card'],
```

O componente `GatewaySelector` chama `getActiveGatewaysByMethod('credit_card')` que filtra gateways cujo `supportedMethods` inclui `'credit_card'`. Como Asaas tem esse metodo listado, ele aparece na secao "Cartao de Credito".

A implementacao de cartao de credito via Asaas ainda nao foi feita, entao o gateway nao deveria aparecer ali.

## Plano de Execucao

### EDITAR `src/config/payment-gateways.ts`

**Linha 58** - Remover `'credit_card'` do `supportedMethods` do Asaas:

```typescript
// DE:
supportedMethods: ['pix', 'credit_card'],

// PARA:
supportedMethods: ['pix'],
```

**Linhas 59-66** - Remover o bloco `credit_card` dos `fees` do Asaas:

```typescript
// DE:
fees: {
  pix: {
    percentage: 0.99,
  },
  credit_card: {
    percentage: 3.49,
    transaction: 49,
  },
},

// PARA:
fees: {
  pix: {
    percentage: 0.99,
  },
},
```

**Linha 302** - Atualizar o tipo `CreditCardGatewayId`:

```typescript
// DE:
export type CreditCardGatewayId = 'asaas' | 'mercadopago' | 'stripe';

// PARA:
export type CreditCardGatewayId = 'mercadopago' | 'stripe';
```

### Tambem verificar: `src/config/payment-gateways.test.ts`

O teste na linha 139-145 espera que Asaas apareca nos gateways de credit_card. Sera atualizado para refletir a remocao.

### Nenhum outro arquivo precisa de alteracao

O `GatewaySelector` e dinamico -- ele consulta o registry. Ao remover `credit_card` do `supportedMethods` do Asaas, ele automaticamente para de aparecer na secao "Cartao de Credito", sem tocar em nenhum componente de UI.

O Asaas continua aparecendo normalmente na secao PIX (nenhuma mudanca la).

## Arvore de Arquivos

```text
src/config/
  payment-gateways.ts       -- EDITAR (supportedMethods, fees, CreditCardGatewayId)
  payment-gateways.test.ts  -- EDITAR (atualizar teste que espera asaas em credit_card)
```

## Resultado Esperado

| Secao | Antes | Depois |
|-------|-------|--------|
| PIX | Asaas, Mercado Pago, PushinPay | Asaas, Mercado Pago, PushinPay (sem mudanca) |
| Cartao de Credito | Asaas, Mercado Pago, Stripe | Mercado Pago, Stripe |

