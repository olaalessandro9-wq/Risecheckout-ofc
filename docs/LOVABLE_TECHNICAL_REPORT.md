# Relatório Técnico: Erro `Card Token not found` no Mercado Pago

> **📅 DOCUMENTO HISTÓRICO**  
> Este relatório foi criado em Dezembro de 2025 durante investigação de bug.  
> O problema foi resolvido - consulte `docs/VALIDATION_REPORT.md` para a solução aplicada.  
> Para a arquitetura atual, consulte `docs/ARCHITECTURE.md`.

**Data:** 17 de Dezembro de 2025  
**Autor:** Manus, Agente de IA  
**Para:** Equipe Lovable

## 1. Resumo Executivo

Este relatório detalha a investigação do erro `Card Token not found` (código 2006) que ocorre de forma intermitente durante o processamento de pagamentos com cartão de crédito via Mercado Pago no ambiente de **Sandbox**. Apesar de todas as configurações de credenciais (Public Key e Access Token) estarem corretas e alinhadas para o ambiente de teste, a API do Mercado Pago rejeita o token gerado pelo SDK React `@mercadopago/sdk-react`.

A análise aprofundada, documentada abaixo, eliminou causas comuns como credenciais incorretas, falhas na Edge Function e erros de validação de CPF. A evidência aponta para um possível problema de **timing ou instabilidade no próprio SDK do Mercado Pago** ou na forma como os tokens de uso único são gerenciados entre o frontend e a API.

## 2. Descrição do Problema

Ao tentar finalizar um pagamento com cartão de crédito usando os dados de teste fornecidos pelo Mercado Pago, o sistema exibe a mensagem "Erro ao processar pagamento". A análise dos logs revela que a requisição do frontend para a Edge Function do Supabase é bem-sucedida, mas a chamada subsequente da Edge Function para a API do Mercado Pago (`/v1/payments`) falha com um erro 400 (Bad Request).

O corpo do erro retornado pelo Mercado Pago é consistentemente o seguinte:

```json
{
  "message": "Card Token not found",
  "error": "bad_request",
  "status": 400,
  "cause": [
    {
      "code": 2006,
      "description": "Card Token not found"
    }
  ]
}
```

Este erro ocorre mesmo quando o token do cartão é gerado com sucesso no frontend segundos antes de ser enviado ao backend.

## 3. Ambiente e Configuração

| Componente | Detalhe |
| :--- | :--- |
| **Frontend** | React, Next.js, TypeScript |
| **Backend** | Supabase Edge Function (Deno) |
| **Gateway SDK** | `@mercadopago/sdk-react` |
| **Ambiente** | Sandbox (Teste) |
| **Vendor ID** | `ccff612c-93e6-4acc-85d9-7c9d978a7e4e` |
| **Public Key (Sandbox)** | `TEST-d28d3ff2-04ab-4580-b99a-4162ebe21ef0` |
| **Access Token (Sandbox)**| `TEST-2354396684039370-121410-72667dcc9efd3870c675f7decbf0bca1-3002802852` |


## 4. Investigação e Evidências

A investigação seguiu uma abordagem de eliminação de hipóteses, conforme detalhado abaixo.

### 4.1. Hipótese 1: Erro de Validação de CPF (Descartada)

- **Sintoma Inicial:** O primeiro erro observado no console do navegador foi "CPF inválido".
- **Análise:** A validação no componente `MercadoPagoCardForm.tsx` verificava se o CPF continha exatamente 11 dígitos. Logs de debug confirmaram que o CPF estava sendo formatado e validado corretamente no frontend.
- **Conclusão:** O erro de CPF era um sintoma secundário. O problema real foi identificado como um erro 502 (Bad Gateway) na chamada para a Edge Function, mascarando o erro da API do Mercado Pago.

### 4.2. Hipótese 2: Falha na Edge Function (Descartada)

- **Sintoma:** A chamada para a Edge Function `mercadopago-create-payment` retornava um erro 502.
- **Análise:** Foi identificado um `import` quebrado para um módulo de rate limiting (`../_shared/rate-limit.ts`) que não existia no ambiente de deploy. O código foi corrigido e a função foi deployada com sucesso (versão 650 e posteriores).
- **Conclusão:** Após a correção, a Edge Function passou a executar corretamente, revelando o erro 400 "Card Token not found" vindo diretamente da API do Mercado Pago.

### 4.3. Hipótese 3: Inconsistência de Credenciais (Descartada)

- **Sintoma:** O erro "Card Token not found" pode ocorrer se a Public Key (usada para criar o token) e o Access Token (usado para processar o pagamento) pertencerem a ambientes ou contas diferentes.
- **Análise:**
    1. **Verificação da UI:** O painel do RiseCheckout confirmava que o "Modo Sandbox" estava ativo.
    2. **Verificação do Banco de Dados:** Consultas SQL na tabela `vendor_integrations` confirmaram que o `vendor_id` (`ccff612c...`) estava configurado com `is_test: true` e utilizava a Public Key e o Access Token corretos para o ambiente de Sandbox.
    3. **Logs da Edge Function:** Logs adicionados confirmaram que a função estava carregando as credenciais de Sandbox (`is_test=true`).

- **Conclusão:** As credenciais estão consistentes e corretamente configuradas para o ambiente de Sandbox.

### 4.4. Hipótese 4: Problema de Timing ou no SDK (Causa Provável)

- **Sintoma:** O token é gerado com sucesso no frontend, mas é considerado inválido pelo backend segundos depois.
- **Análise:**
    - **Logs do Frontend:** Mostram a criação bem-sucedida do token. Ex: `[MercadoPagoCardForm] Token criado: f53bdf310af39921d19bd5f048b92e13`.
    - **Logs da Edge Function:** Mostram o recebimento do mesmo token. Ex: `[INFO] Token recebido do frontend {"token":"f53bdf310af39921d19bd5f048b92e13..."}`.
    - **Erro da API:** Imediatamente após, a API do Mercado Pago retorna o erro 2006.

- **Conclusão:** O fluxo de dados está correto. O problema reside na validade do token no momento em que a API do Mercado Pago o processa. Isso pode ser devido a:
    - **Expiração Ultra-Rápida:** O token pode estar expirando em um tempo menor do que o necessário para a comunicação entre o frontend, a Edge Function e a API do MP.
    - **Bug no SDK:** O SDK `@mercadopago/sdk-react` pode estar gerando um token que não é consistentemente válido no ambiente de Sandbox.
    - **Problema de Uso Único:** O token pode estar sendo invalidado ou consumido por algum processo antes da chamada final de pagamento.


## 5. Código Relevante

### 5.1. Criação do Token no Frontend (`MercadoPagoCardForm.tsx`)

O token é criado dentro da função `handleSubmit`, que é acionada pelo clique no botão de pagamento. Isso garante que o token seja gerado apenas no momento da ação do usuário.

```typescript
// ... dentro de handleSubmit
try {
  // Criar token usando SDK React
  const token = await createCardToken({
    cardholderName: currentName.toUpperCase(),
    identificationType: 'CPF',
    identificationNumber: currentCPF.replace(/\D/g, ''),
  });

  if (token && token.id) {
    console.log('[MercadoPagoCardForm] Token criado:', token.id);
    const result: CardTokenResult = {
      token: token.id,
      // ... outros dados
    };
    onSubmit(result); // Envia para o hook usePaymentGateway
  } else {
    throw new Error('Token não foi gerado');
  }
} catch (error: any) {
  console.error('[MercadoPagoCardForm] Erro ao criar token:', error);
  // ... tratamento de erro
}
```

### 5.2. Processamento na Edge Function (`mercadopago-create-payment/index.ts`)

A Edge Function recebe o token e o repassa para a API do Mercado Pago.

```typescript
// ... dentro do handler principal
const { token, ... } = body;

logInfo('Token recebido do frontend', { token: token.substring(0, 20) + '...', length: token.length });

const cardPayload: any = {
  transaction_amount: calculatedTotalCents / 100,
  token: token, // O token recebido é usado aqui
  description: `Pedido #${orderId.slice(0, 8)}`,
  installments: installments || 1,
  payment_method_id: 'master', // Será sobrescrito pelo token
  payer: { /* ... dados do pagador ... */ }
};

const cardResponse = await fetch('https://api.mercadopago.com/v1/payments', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    'X-Idempotency-Key': `${orderId}-card`
  },
  body: JSON.stringify(cardPayload)
});

const cardData = await cardResponse.json();

if (!cardResponse.ok) {
  logError('Erro na API do Mercado Pago (Cartão)', cardData);
  return createErrorResponse(/* ... */);
}
```

## 6. Logs Relevantes

A sequência de logs abaixo demonstra o fluxo completo desde a criação do token até o erro final.

**1. Console do Navegador (Frontend):**
```
[MercadoPagoCardForm] Token criado: f53bdf310af39921d19bd5f048b92e13
[usePaymentGateway] Iniciando processamento...
[usePaymentGateway] Pedido criado: ef9b11fa-0566-4a34-b899-a5d98ab8ecb6
[usePaymentGateway] Processando cartão via mercadopago...
POST https://wivbtmtgpsxupfjwwovf.supabase.co/functions/v1/mercadopago-create-payment 502 (Bad Gateway)
[usePaymentGateway] Erro no pagamento: Error: Erro ao processar pagamento.
```

**2. Logs da Edge Function (Backend - Supabase):**
```json
// Log 1: Recebimento do token
{
  "event_message": "[mercadopago-create-payment] [INFO] Token recebido do frontend {\"token\":\"f53bdf310af39921d19bd5f048b92e13...\",\"length\":32}",
  "level": "info",
  "version": "652"
}

// Log 2: Erro retornado pela API do Mercado Pago
{
  "event_message": "[mercadopago-create-payment] [ERROR] Erro na API do Mercado Pago (Cartão) {\n  message: \"Card Token not found\",\n  error: \"bad_request\",\n  status: 400,\n  cause: [\n    {\n      code: 2006,\n      description: \"Card Token not found\"\n    }\n  ]\n}",
  "level": "error",
  "version": "652"
}
```

## 7. Conclusão e Recomendações

O erro "Card Token not found" não parece ser causado por uma falha na lógica da aplicação RiseCheckout, mas sim por um comportamento inesperado ou um bug no ambiente de Sandbox do Mercado Pago ou em seu SDK.

**Recomendações para a Equipe Lovable:**

1.  **Contato com o Suporte do Mercado Pago:** Abrir um chamado de suporte técnico detalhado com o Mercado Pago, fornecendo este relatório, os logs completos e o `request_id` das chamadas falhas. O problema parece estar do lado da API deles.

2.  **Testar API de Token Manual:** Como alternativa, implementar uma chamada direta à API de criação de token do Mercado Pago (sem usar o SDK `@mercadopago/sdk-react`) para isolar o problema e verificar se o SDK é o culpado. A documentação para isso pode ser encontrada [aqui](https://www.mercadopago.com.br/developers/pt/reference/card_tokens/_card_tokens/post).

3.  **Verificar Versão do SDK:** Garantir que a versão mais recente do `@mercadopago/sdk-react` está sendo utilizada e verificar o changelog ou issues do repositório por problemas similares.

4.  **Monitoramento em Produção:** Embora o problema esteja ocorrendo em Sandbox, é crucial monitorar se erros similares (código 2006) ocorrem no ambiente de Produção, o que indicaria um problema mais grave.

Este relatório fornece um ponto de partida sólido para que a equipe de desenvolvimento possa interagir com o suporte do Mercado Pago e encontrar uma resolução definitiva.

## 8. Anexos

### 8.1. Evidências Visuais

Todas as capturas de tela relevantes foram salvas no diretório `docs/evidencias/` do repositório. As imagens mais relevantes incluem:

- **`pasted_file_P6Sh0z_image.png`**: Logs completos da Edge Function mostrando o erro 2006 do Mercado Pago.
- **`pasted_file_iclgOW_image.png`**: Configuração do Mercado Pago no painel mostrando "Modo Sandbox Ativo".
- **`pasted_file_FwWjYk_image.png`**: Console do navegador mostrando a criação bem-sucedida do token e o erro subsequente.

### 8.2. Informações de Suporte

Para facilitar o contato com o suporte do Mercado Pago, seguem as informações relevantes:

| Campo | Valor |
| :--- | :--- |
| **Código do Erro** | 2006 |
| **Mensagem** | "Card Token not found" |
| **Ambiente** | Sandbox (Teste) |
| **Public Key** | `TEST-d28d3ff2-04ab-4580-b99a-4162ebe21ef0` |
| **Access Token (primeiros 20 caracteres)** | `TEST-2354396684039370...` |
| **Exemplo de Token Gerado** | `f53bdf310af39921d19bd5f048b92e13` |
| **Timestamp do Erro** | 2025-12-17T20:56:27.256Z |
| **Request ID (exemplo)** | `296a2305-f185-4fd7-b21f-47bdca8d51e2` |

### 8.3. Dados de Teste Utilizados

Conforme documentação oficial do Mercado Pago:

- **Número do Cartão:** 5031 4332 1540 6351 (Mastercard de teste)
- **Validade:** 11/30
- **CVV:** 123
- **Nome:** APRO (para simular aprovação)
- **CPF:** 123.456.789-09

---

**Fim do Relatório**
