# Relatório de Análise Completa do Sistema de Webhooks

Conforme solicitado, realizei uma investigação aprofundada em todo o seu sistema de webhooks, desde o banco de dados até o código das Edge Functions. A análise revelou alguns pontos críticos que estão impedindo o funcionamento correto do sistema.

## 1. Resumo Executivo (TL;DR)

O sistema de webhooks está bem estruturado, mas **atualmente inoperante** devido a dois problemas principais:

1.  **Inconsistência Crítica de Código:** A função que recebe notificações do Mercado Pago (`mercadopago-webhook`) tenta chamar uma função central chamada `trigger-webhooks`. No entanto, esta função **não existe no seu repositório do GitHub**, embora exista uma versão dela implantada no Supabase. Isso significa que o código que você tem localmente está dessincronizado com o que está em produção, tornando a depuração e o funcionamento imprevisíveis.

2.  **Falta de Credenciais de Integração:** Não há nenhuma integração do **Mercado Pago** ativa registrada no banco de dados (`vendor_integrations`). Sem as credenciais (access token), a função `mercadopago-webhook` não consegue validar as notificações de pagamento, interrompendo o fluxo antes mesmo de tentar disparar seus webhooks.

Em resumo, o sistema não funciona porque o código está quebrado em um ponto crucial e faltam as configurações essenciais para operar.

---

## 2. Arquitetura e Fluxo de Funcionamento

Para entender os problemas, é importante conhecer o fluxo de dados do sistema:

**Passo 1: Notificação do Gateway**
- O Mercado Pago envia uma notificação para a Edge Function `mercadopago-webhook` sempre que um evento ocorre (ex: pagamento aprovado).

**Passo 2: Processamento Interno (`mercadopago-webhook`)**
- Esta função recebe a notificação, encontra o pedido correspondente no seu banco de dados e atualiza o status (ex: de `PENDING` para `PAID`).
- Em seguida, ela deveria chamar a próxima função no fluxo, a `trigger-webhooks`.

**Passo 3: Disparo Central (`trigger-webhooks`) - PONTO DE FALHA**
- Esta função (que está faltando no seu código) deveria:
  - Receber o ID do pedido e o tipo de evento (ex: `purchase_approved`).
  - Consultar a tabela `outbound_webhooks` para encontrar todos os webhooks que você configurou no painel para aquele evento.
  - Para cada webhook encontrado, chamar a função `dispatch-webhook`.

**Passo 4: Envio Final (`dispatch-webhook`)**
- Esta função é a responsável final por enviar os dados para a URL que você cadastrou. Ela monta o `payload`, assina a requisição com o `secret` e registra o resultado (sucesso ou falha) na tabela `webhook_deliveries`.

![Fluxo do Webhook](https://i.imgur.com/8a6E3jD.png)

---

## 3. Análise Detalhada dos Problemas

### Problema 1: A Função `trigger-webhooks` Inexistente (Inconsistência de Código)

A análise do código da função `mercadopago-webhook` mostra claramente uma chamada para `trigger-webhooks` na linha 148:

```typescript
// trecho de /supabase/functions/mercadopago-webhook/index.ts
const triggerResponse = await fetch(
  `${Deno.env.get('SUPABASE_URL')}/functions/v1/trigger-webhooks`,
  {
    // ... corpo da requisição
  }
);
```

No entanto, uma busca no seu repositório do GitHub confirma que **não existe uma pasta ou arquivo chamado `trigger-webhooks`** dentro de `supabase/functions/`. Embora uma função com esse nome exista no ambiente do Supabase, a ausência do código-fonte no seu projeto impede qualquer manutenção ou entendimento de sua lógica.

**Impacto:** Crítico. O elo principal da corrente está quebrado. A notificação do Mercado Pago chega, mas o sistema não sabe como encontrar e disparar os seus webhooks cadastrados.

### Problema 2: Ausência de Integração Ativa do Mercado Pago

Uma consulta na tabela `vendor_integrations` revelou que não há nenhuma integração ativa para o `MERCADOPAGO`. A função `mercadopago-webhook` depende de encontrar um `access_token` nesta tabela para consultar os detalhes do pagamento na API do Mercado Pago e validar a notificação.

**Impacto:** Crítico. Mesmo que o Problema 1 fosse resolvido, o fluxo falharia no início, pois a função não tem autorização para se comunicar com o Mercado Pago. Isso se aplica tanto ao ambiente de produção quanto ao de **sandbox**. A função precisa das credenciais corretas (de produção ou de teste) para funcionar.

### Problema 3: Logs de Falhas Antigas

Encontrei registros na tabela `webhook_deliveries` de falhas ocorridas por volta do dia 17 de Novembro. A mensagem de erro era `Failed due to missing INTERNAL_WEBHOOK_SECRET configuration`. Isso indica que, em algum momento, uma variável de ambiente essencial para a segurança entre as funções não estava configurada. Embora a mensagem indique que isso foi corrigido, reforça a instabilidade geral do sistema.

---

## 4. Validação do Ambiente Sandbox

Você perguntou se os webhooks disparam em modo sandbox. **A resposta é sim, o sistema foi projetado para isso**, mas ele depende da configuração correta.

- A tabela `vendor_integrations` possui um campo `config->'test_mode'` (booleano).
- As funções que interagem com o Mercado Pago (`mercadopago-create-payment`, `mercadopago-webhook`, etc.) deveriam usar essa flag para decidir se usam as credenciais de produção ou as credenciais de teste (sandbox).

No entanto, como não há nenhuma integração do Mercado Pago configurada, **atualmente o sistema não funciona nem em produção, nem em sandbox**.

## 5. Plano de Ação Recomendado

Para resolver esses problemas e tornar seus webhooks funcionais e confiáveis, proponho o seguinte plano:

1.  **Restaurar a Função `trigger-webhooks`:** A primeira e mais crucial etapa é obter o código-fonte da função `trigger-webhooks` que está implantada no Supabase e adicioná-la de volta ao seu repositório do GitHub. Sem isso, qualquer outra correção será inútil.

2.  **Refatorar e Simplificar o Fluxo:** Uma vez com o código, proponho unificar a lógica. Em vez de `mercadopago-webhook` -> `trigger-webhooks` -> `dispatch-webhook`, podemos simplificar para que a `trigger-webhooks` (ou uma nova função) busque os webhooks a serem disparados e os coloque em uma fila no próprio banco de dados, e a `dispatch-webhook` processe essa fila. Isso torna o sistema mais resiliente.

3.  **Corrigir a Interface de Integração:** Garantir que, ao salvar as credenciais do Mercado Pago pelo seu painel, a integração seja corretamente inserida na tabela `vendor_integrations` e marcada como `active`.

4.  **Implementar Testes de Ponta a Ponta:** Criar um script de teste que simule um pagamento em sandbox e verifique se o webhook correspondente é disparado e recebido com sucesso em um serviço de teste como o [Webhook.site](https://webhook.site/).

Estou pronto para começar a trabalhar no passo 1, mas precisarei da sua ajuda para obter o código da função `trigger-webhooks` do seu ambiente Supabase, ou da sua permissão para recriá-la com base na lógica esperada do sistema.
