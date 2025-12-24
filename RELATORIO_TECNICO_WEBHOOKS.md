# Relatório Técnico: Investigação e Correção de Webhooks para Order Bumps

**Data:** 24 de Novembro de 2025
**Autor:** Manus AI

## 1. Objetivo

O objetivo desta investigação foi diagnosticar e corrigir um problema onde os webhooks de "Compra Aprovada" não estavam sendo disparados para produtos adicionais (order bumps) adquiridos em um checkout, disparando apenas para o produto principal.

## 2. Resumo das Investigações e Correções

A investigação passou por múltiplas fases, descobrindo e corrigindo uma cascata de problemas subjacentes. Abaixo está um resumo cronológico das descobertas e ações tomadas.

### Fase 1: Análise Inicial e Hipótese Incorreta

- **Problema Inicial:** Webhooks disparavam apenas para o produto principal.
- **Hipótese Inicial:** O sistema não suportava múltiplos produtos por webhook. A solução seria criar uma tabela de junção (`webhook_products`) ou armazenar um array de IDs de produtos.
- **Status:** **Hipótese Incorreta.** Uma análise mais profunda revelou que a tabela `webhook_products` já existia e estava sendo populada corretamente pelo frontend.

### Fase 2: Correção do Backend (trigger-webhooks)

- **Descoberta:** O problema real era um **bug de lógica** na Edge Function `trigger-webhooks`. Ela consultava apenas a coluna legada `product_id` na tabela `outbound_webhooks`, ignorando completamente a tabela de relacionamento `webhook_products`.
- **Correção 1 (Backend):** A função `trigger-webhooks` foi atualizada para realizar uma consulta híbrida:
  1.  Buscar webhooks usando a tabela de relacionamento `webhook_products` (método correto).
  2.  Manter a consulta ao campo `product_id` para compatibilidade com webhooks antigos.
- **Correção 2 (Backend):** Foi identificado e corrigido um bug no método `.contains()` do Supabase JS, que não funcionava para colunas do tipo `ARRAY` no PostgreSQL. A lógica foi alterada para filtrar os eventos em memória (JavaScript), garantindo a correta identificação dos webhooks a serem disparados.
- **Status:** **Backend Corrigido.** A função `trigger-webhooks` (versão 46) agora é capaz de encontrar e disparar webhooks para múltiplos produtos associados.

### Fase 3: Correção do Frontend (Duplicação de Pedidos)

- **Descoberta:** Mesmo com o backend corrigido, o problema persistia. A investigação revelou um **bug crítico de duplicação de pedidos** no frontend (`PublicCheckout.tsx`). Duas ordens eram criadas quase simultaneamente:
  - **Pedido 1 (Correto):** Continha o produto principal + todos os order bumps, mas ficava com status `pending` e nunca era pago.
  - **Pedido 2 (Incorreto):** Continha apenas o produto principal, era enviado para o Mercado Pago, aprovado (`PAID`), e consequentemente, o único a disparar webhook.
- **Correção 3 (Frontend):** O fluxo de pagamento no `PublicCheckout.tsx` foi refatorado para eliminar a duplicação. A função `handleCustomCardSubmit` foi modificada para receber e reutilizar o `order_id` criado pela função `handlePayment`, em vez de criar um novo pedido.
- **Status:** **Frontend Corrigido.** A duplicação de pedidos foi resolvida. A última compra de teste (`9d6043ec`) gerou um **único pedido** no banco de dados.

## 3. Problema Atual e Análise da Causa Raiz

Apesar de todas as correções, o problema final persiste: os webhooks ainda disparam apenas para o produto principal.

- **Evidência:** A última compra (`gateway_payment_id: '1342687527'`) gerou o pedido `9d6043ec-70a6-4dac-954b-e8680914e866`.
- **Análise dos Logs (`mercadopago-webhook`):** A função reportou ter encontrado **apenas 1 produto** neste pedido.
  ```
  📦 Encontrados 1 produto(s) no pedido
  ```
- **Análise do Banco de Dados:** Uma consulta direta ao banco confirmou que a tabela `order_items` está **vazia** para este pedido. Nenhum item (nem principal, nem bumps) foi salvo.

**Causa Raiz Identificada:**

> O problema atual reside na função responsável por criar o pedido e seus itens (`mercadopago-create-payment` ou uma função similar). Por algum motivo, ela **falha em salvar os registros na tabela `order_items`**, embora o processo de pagamento continue e seja aprovado no Mercado Pago. Como não há itens no banco, a função `mercadopago-webhook` (que dispara os webhooks) utiliza um fallback, pegando o `product_id` diretamente da tabela `orders`, resultando no disparo de um único webhook.

## 4. Hipótese e Próximos Passos

**Hipótese Principal:**

Existe um **erro silencioso** na função `mercadopago-create-payment`. A lógica que insere os dados na tabela `order_items` está falhando, mas o erro não está sendo capturado ou não impede que a função prossiga para criar o pagamento no Mercado Pago. Isso explica por que o pagamento é bem-sucedido, mas os dados no banco de dados local ficam incompletos.

**Próximos Passos Recomendados:**

1.  **Analisar os Logs da Função `mercadopago-create-payment`:** É crucial obter os logs detalhados desta função, filtrando pelo horário da última compra (aproximadamente 17:30). Os logs devem revelar o erro exato que está impedindo a inserção dos dados na tabela `order_items`.
2.  **Revisar o Código da `mercadopago-create-payment`:** Com base no erro encontrado nos logs, revisar a lógica de inserção. A falha pode estar na construção do array de itens, em alguma violação de constraint do banco (ex: `NOT NULL`) ou em um erro de sintaxe na chamada do Supabase client.

## 5. Tabela de Resumo

| Problema Identificado                                | Causa Raiz                                                                    | Solução Aplicada                                                                                                | Status      |
| ---------------------------------------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ----------- |
| Webhooks não disparam para order bumps.              | Função `trigger-webhooks` ignorava a tabela `webhook_products`.                 | **Backend:** Corrigida a lógica para consultar a tabela de relacionamento e filtrar por produto.                  | ✅ Resolvido |
| Query de webhooks falhava.                           | Método `.contains()` do Supabase JS com bug para arrays PostgreSQL.             | **Backend:** Removido `.contains()` e implementado filtro de eventos em memória (JavaScript).                     | ✅ Resolvido |
| Pedido correto ficava `pending`, um 2º era aprovado. | Duplicação de pedidos no frontend (`PublicCheckout.tsx`).                       | **Frontend:** Refatorado o fluxo de pagamento para evitar a criação de um segundo pedido.                        | ✅ Resolvido |
| **(Atual)** Webhooks ainda disparam só para 1 produto. | **`order_items` não estão sendo salvos no banco de dados** durante a criação do pedido. | **Pendente:** Necessário analisar os logs da função `mercadopago-create-payment` para identificar o erro de inserção. | ❌ **Pendente** |
