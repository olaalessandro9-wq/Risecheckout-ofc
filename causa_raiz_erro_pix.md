# Causa Raiz do Erro: "Dados do pagamento não retornados"

## Problema Identificado

O erro ocorre devido a uma **incompatibilidade no formato de resposta** entre a Edge Function e o Frontend.

### Edge Function (`mercadopago-create-payment`)

A função retorna a resposta no seguinte formato:

```typescript
return createSuccessResponse(responseData);

// Que gera:
{
  "success": true,
  "data": {
    "paymentId": 123456,
    "status": "pending",
    "statusDetail": "pending_waiting_payment",
    "pix": {
      "qrCode": "...",
      "qrCodeBase64": "...",
      "ticketUrl": "..."
    }
  }
}
```

### Frontend (`MercadoPagoPayment.tsx`)

O frontend espera o seguinte formato (ERRADO):

```typescript
// Linha 97-100
if (!data?.success) {
  throw new Error(data?.error || "Erro ao criar pagamento");
}

// Linha 102-105  
if (!data?.paymentId) {  // ❌ ERRO AQUI!
  throw new Error("Dados do pagamento não retornados");
}
```

O frontend está tentando acessar `data.paymentId` diretamente, mas o formato correto é `data.data.paymentId` (aninhado dentro de `data`).

## Solução

O frontend precisa ser ajustado para acessar os dados corretamente:

```typescript
// ANTES (ERRADO)
if (!data?.paymentId) {
  throw new Error("Dados do pagamento não retornados");
}

setPaymentId(data.paymentId.toString());

if (data.pix) {
  setQrCode(data.pix.qrCode || "");
  setQrCodeBase64(data.pix.qrCodeBase64 || "");
}

// DEPOIS (CORRETO)
if (!data?.data?.paymentId) {
  throw new Error("Dados do pagamento não retornados");
}

setPaymentId(data.data.paymentId.toString());

if (data.data.pix) {
  setQrCode(data.data.pix.qrCode || "");
  setQrCodeBase64(data.data.pix.qrCodeBase64 || "");
}
```

## Impacto

- **Severidade**: Alta
- **Escopo**: Apenas a página `MercadoPagoPayment.tsx`
- **Risco da Correção**: Baixo (alteração simples e direta)
