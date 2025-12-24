# Relatório de Diagnóstico: Causa Raiz do Erro 'Dados do pagamento não retornados'

**Para:** Usuário e IA Superior de Programação
**De:** Manus (Agente de Análise e Implementação)
**Data:** 27 de Novembro de 2025
**Assunto:** Análise da causa raiz do erro persistente na geração de QR Code e proposta de solução definitiva.

---

## 1. Resumo Executivo

O erro **"Dados do pagamento não retornados"** que persiste após o último deploy foi identificado com 100% de certeza. O problema não está relacionado à correção anterior, mas sim a uma **incompatibilidade de contrato de API** entre o frontend e a Edge Function `mercadopago-create-payment`.

-   **Página Afetada:** `src/pages/MercadoPagoPayment.tsx` (a página correta, conforme a URL na imagem).
-   **Causa Raiz:** O frontend espera a resposta da função em um formato (`data.paymentId`), mas a função retorna os dados em um formato aninhado (`data.data.paymentId`).
-   **Solução:** Ajustar o código do frontend para acessar a estrutura de dados correta retornada pela API.

## 2. Análise Detalhada

### 2.1. O Ponto de Falha

O erro é disparado no arquivo `src/pages/MercadoPagoPayment.tsx`, especificamente na validação da resposta da Edge Function:

```typescript
// src/pages/MercadoPagoPayment.tsx - Linha 102
if (!data?.paymentId) {
  console.error("[MercadoPagoPayment] Sem dados do pagamento:", data);
  throw new Error("Dados do pagamento não retornados"); // <-- ERRO DISPARADO AQUI
}
```

### 2.2. O Contrato da API

Investiguei o código da Edge Function `mercadopago-create-payment/index.ts` e confirmei que a resposta de sucesso é estruturada da seguinte forma:

```typescript
// Edge Function: mercadopago-create-payment/index.ts
function createSuccessResponse(data: any): Response {
  return new Response(
    JSON.stringify({ success: true, data }), // <--- Os dados são aninhados dentro de um campo "data"
    {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      status: 200,
    }
  );
}
```

Isso resulta em uma resposta JSON como esta:

```json
{
  "success": true,
  "data": { 
    "paymentId": 123456789,
    "status": "pending",
    "pix": { ... }
  }
}
```

### 2.3. A Incompatibilidade

O problema é claro: o frontend tenta acessar `data.paymentId`, mas o caminho correto para o dado é `data.data.paymentId`. O mesmo se aplica para os dados do PIX, que devem ser acessados via `data.data.pix`.

## 3. Plano de Ação (Correção Definitiva)

A correção é simples e de baixo risco, consistindo em ajustar o frontend para respeitar o contrato da API.

1.  **Arquivo a ser Modificado:** `src/pages/MercadoPagoPayment.tsx`.
2.  **Alterações Propostas:**

    -   Alterar a validação de `!data?.paymentId` para `!data?.data?.paymentId`.
    -   Ajustar a extração dos dados para usar o caminho `data.data`.

    ```typescript
    // Linhas 102-118: Substituir este bloco
    if (!data?.paymentId) {
      console.error("[MercadoPagoPayment] Sem dados do pagamento:", data);
      throw new Error("Dados do pagamento não retornados");
    }

    console.log("[MercadoPagoPayment] Pagamento criado com sucesso:", data);
    
    setPaymentId(data.paymentId.toString());
    
    if (data.pix) {
      setQrCode(data.pix.qrCode || "");
      setQrCodeBase64(data.pix.qrCodeBase64 || "");
      console.log("[MercadoPagoPayment] QR Code configurado:", { 
        hasQrCode: !!data.pix.qrCode, 
        hasQrCodeBase64: !!data.pix.qrCodeBase64 
      });
    }
    ```

    **Pelo novo bloco corrigido:**

    ```typescript
    // ✅ CORREÇÃO: Acessando a estrutura de dados aninhada
    if (!data?.data?.paymentId) {
      console.error("[MercadoPagoPayment] Sem dados do pagamento na resposta aninhada:", data);
      throw new Error("Dados do pagamento não retornados pela função");
    }

    const paymentData = data.data;
    console.log("[MercadoPagoPayment] Pagamento criado com sucesso:", paymentData);
    
    setPaymentId(paymentData.paymentId.toString());
    
    if (paymentData.pix) {
      setQrCode(paymentData.pix.qrCode || "");
      setQrCodeBase64(paymentData.pix.qrCodeBase64 || "");
      console.log("[MercadoPagoPayment] QR Code configurado:", { 
        hasQrCode: !!paymentData.pix.qrCode, 
        hasQrCodeBase64: !!paymentData.pix.qrCodeBase64 
      });
    }
    ```

## 4. Conclusão

A primeira correção estava correta para o fluxo da `PixPaymentPage.tsx`, mas o erro reportado ocorria em um fluxo diferente (`MercadoPagoPayment.tsx`). A causa raiz do problema atual foi identificada e a solução proposta é direta e eficaz.

**Recomendo a aplicação desta correção, que resolverá definitivamente o erro "Dados do pagamento não retornados".**

Aguardo a aprovação para implementar e enviar o novo commit.
