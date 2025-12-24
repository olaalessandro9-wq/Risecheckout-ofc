# 🔒 Guia: Validando Webhooks no N8N com Assinatura de Segurança

Este guia explica como configurar seu workflow no N8N para verificar a assinatura digital (`X-Rise-Signature`) enviada pelos webhooks do RiseCheckout. Isso garante que apenas requisições autênticas e íntegras sejam processadas, prevenindo fraudes e ataques.

## Contexto

A função `dispatch-webhook` (versão 94 em diante) agora gera uma assinatura criptográfica **HMAC-SHA256** para cada webhook enviado. A assinatura é criada usando o **Secret do Webhook** (que você define no painel do RiseCheckout) e o corpo (`payload`) da requisição.

O N8N receberá essa assinatura no cabeçalho `X-Rise-Signature`. Seu trabalho é recriar essa assinatura do seu lado e compará-la com a que foi recebida. Se as duas forem idênticas, o webhook é legítimo.

## Passo a Passo no N8N

Siga as etapas abaixo para adicionar a camada de segurança ao seu workflow.

### 1. Copie o Secret do seu Webhook

Antes de ir para o N8N, você precisa do "segredo" usado para gerar a assinatura.

1.  Acesse seu painel do **RiseCheckout**.
2.  Navegue até **Integrações > Webhooks**.
3.  Localize o webhook que você está usando no seu workflow N8N.
4.  Copie o valor do campo **Secret**. Ele deve começar com `whsec_`.

![Exemplo de Secret de Webhook](https://i.imgur.com/ABCDE12.png) *<-- Imagem de exemplo, o seu secret será diferente.*

### 2. Adicione um Nó de Código (Code Node)

No seu workflow do N8N, logo após o nó de gatilho **Webhook**, adicione um novo nó do tipo **Code**.

-   Clique no `+` após o Webhook Node.
-   Procure por "Code" e selecione-o.

Seu workflow ficará assim:

```
[Webhook Trigger] -> [Code Node] -> (Resto do seu fluxo)
```

### 3. Insira o Código de Verificação

Selecione o nó **Code** que você acabou de criar e cole o seguinte código JavaScript no editor:

```javascript
const crypto = require('crypto');

// --------------------------------------------------------------------------
// COLE O SECRET DO SEU WEBHOOK AQUI
// Substitua 'whsec_SEU_SECRET_DO_RISECHECKOUT' pelo secret que você copiou
// --------------------------------------------------------------------------
const secret = 'whsec_SEU_SECRET_DO_RISECHECKOUT';

// O N8N recebe todos os cabeçalhos (headers) em letras minúsculas
const signatureHeader = $input.first().json.headers['x-rise-signature'];
const body = $input.first().json.body;

// Se não houver assinatura, bloqueia por segurança
if (!signatureHeader) {
  throw new Error('ALERTA DE SEGURANÇA: Requisição recebida sem assinatura (X-Rise-Signature). Bloqueando fluxo.');
}

// Passo 1: Recriar a assinatura HMAC-SHA256 usando o mesmo segredo
const hmac = crypto.createHmac('sha256', secret);

// Importante: O corpo (body) precisa ser uma string idêntica à original
const calculatedSignature = hmac.update(JSON.stringify(body)).digest('hex');

// Passo 2: Comparar a assinatura recebida com a que acabamos de calcular
// Usamos crypto.timingSafeEqual para prevenir ataques de "timing attack"
const areSignaturesEqual = crypto.timingSafeEqual(
  Buffer.from(calculatedSignature, 'hex'),
  Buffer.from(signatureHeader, 'hex')
);

if (areSignaturesEqual) {
  // ✅ Assinatura VÁLIDA! A requisição é autêntica.
  // Retorna os dados para que o resto do workflow possa continuar.
  console.log("✅ Assinatura validada com sucesso!");
  return $input.all();
} else {
  // ⛔ Assinatura INVÁLIDA! A requisição pode ser uma fraude.
  // Lança um erro, o que interrompe a execução do workflow.
  console.error("⛔ ALERTA DE SEGURANÇA: Assinatura de webhook inválida! Tentativa de fraude detectada.");
  throw new Error('Assinatura de webhook inválida. A execução foi interrompida por segurança.');
}
```

**Não se esqueça de substituir `whsec_SEU_SECRET_DO_RISECHECKOUT` pelo seu secret real!**

### 4. Teste a Configuração

Com o código no lugar, ative seu workflow e realize uma compra de teste no seu checkout. Observe os logs de execução no N8N:

-   **Se tudo estiver correto:** O nó de código será executado com sucesso e o fluxo continuará para os próximos nós.
-   **Se houver um erro:** O nó de código falhará com a mensagem "Assinatura de webhook inválida", e o fluxo será interrompido. Isso é o esperado se a assinatura não corresponder.

## Conclusão

Pronto! Seu workflow N8N agora está protegido contra requisições não autorizadas. Qualquer tentativa de injetar dados falsos em seu sistema será bloqueada automaticamente por esta verificação de segurança.
