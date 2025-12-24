# Análise Completa do Projeto RiseCheckout

## Introdução

O projeto **RiseCheckout** é uma aplicação de checkout e processamento de pagamentos, com foco em produtos digitais, que utiliza o **Supabase** como *backend-as-a-service* (BaaS) e o **Mercado Pago** como gateway de pagamento. A análise foi realizada após a clonagem do repositório `olaalessandro9-wq/risecheckout-84776` e focou na estrutura geral do código e nas recentes refatorações identificadas nas funções do Supabase.

## 1. Estrutura do Projeto

O projeto segue uma estrutura de aplicação web moderna, provavelmente utilizando **React** ou **Next.js** (indicado pela presença de arquivos `.tsx` e a organização em `src/pages`, `src/components`, `src/hooks`, etc.), com uma forte separação de responsabilidades.

| Diretório | Descrição | Componentes Chave |
| :--- | :--- | :--- |
| `src/assets` | Arquivos estáticos como imagens e ícones. | `logo.svg`, `favicon.ico` |
| `src/components` | Componentes de interface reutilizáveis. | `payment/CreditCardForm.tsx`, `products/ProductsTable.tsx`, `ui/*` (Componentes Shadcn/UI ou similar) |
| `src/hooks` | Lógica de estado e *side effects* customizada. | `useAuth.tsx`, `useCheckoutLogic.ts`, `useProduct.tsx` |
| `src/integrations/supabase` | Configuração e tipagem do cliente Supabase. | `client.ts`, `types-extended.ts`, `types.ts` |
| `src/layouts` | Estrutura de layout da aplicação. | `AppShell.tsx` |
| `src/lib` | Funções utilitárias e bibliotecas de domínio. | `auth.ts`, `money.ts`, `checkout/*`, `supabase/*` |
| `src/pages` | Páginas da aplicação (rotas). | `PublicCheckout.tsx`, `ProductEdit.tsx`, `Auth.tsx`, `MercadoPagoPayment.tsx` |
| `src/providers` | Provedores de contexto globais. | `UnsavedChangesGuard.tsx`, `theme.tsx` |
| `src/services` | Lógica de negócio que interage com APIs ou serviços. | `offers.ts`, `pushinpay.ts` |
| `supabase` | Configuração e funções de *Edge Functions* do Supabase. | `config.toml`, `functions/*` |

## 2. Análise da Refatoração (Supabase Edge Functions)

A refatoração concentrou-se nas *Edge Functions* do Supabase, que são cruciais para o processamento de pagamentos e o sistema de webhooks. Foram identificadas quatro funções refatoradas:

1.  `dispatch-webhook`
2.  `mercadopago-create-payment`
3.  `mercadopago-webhook`
4.  `trigger-webhooks`

A principal característica da refatoração é a adoção de um código mais modular, com funções auxiliares bem definidas (`logInfo`, `createSuccessResponse`, `validateAuth`, etc.) e uma estrutura de *handler* principal clara, dividida em etapas numeradas.

### 2.1. `dispatch-webhook` (Disparo de Webhook)

Esta função é responsável por enviar um webhook para um URL externo, registrando a tentativa no banco de dados.

| Funcionalidade Refatorada | Detalhe da Implementação |
| :--- | :--- |
| **Autenticação Reforçada** | Adição de `validateAuth` para verificar tanto o `SUPABASE_SERVICE_ROLE_KEY` quanto um `INTERNAL_WEBHOOK_SECRET`, garantindo que apenas serviços internos ou o próprio Supabase possam acionar o *dispatch*. |
| **Assinatura HMAC** | Implementação de `generateHmacSignature` e inclusão do cabeçalho `X-Rise-Signature` no request de saída, aumentando a segurança e a integridade dos dados enviados. |
| **Deduplicação** | A função `checkDuplicateDelivery` verifica se um webhook para o mesmo `order_id`, `event_type` e `product_id` já foi enviado com sucesso, evitando disparos repetidos. |
| **Log de Entrega** | As funções `createDeliveryLog` e `updateDeliveryLog` garantem o registro detalhado (status, resposta, corpo truncado) de cada tentativa de entrega no banco de dados (`webhook_deliveries`). |
| **Timeout Controlado** | Uso de `AbortController` e `setTimeout` para garantir que o *fetch* do webhook não exceda 30 segundos (`WEBHOOK_TIMEOUT`), prevenindo travamentos. |

### 2.2. `mercadopago-create-payment` (Criação de Pagamento MP)

Esta função é o ponto de entrada para criar pagamentos (PIX ou Cartão de Crédito) via API do Mercado Pago.

| Funcionalidade Refatorada | Detalhe da Implementação |
| :--- | :--- |
| **Cálculo de Preço Server-Side** | A função agora busca os preços dos produtos no banco de dados (`products` e `order_items`) e calcula o valor total (`finalAmount`) no servidor. Isso é uma **melhoria crítica de segurança**, pois impede que o cliente manipule o preço final. |
| **Lógica de Seleção de Itens** | Implementação de uma lógica defensiva (`DEFENSIVE ITEM SELECTION LOGIC`) para determinar a lista final de produtos (`finalItemsList`), priorizando dados do request (se mais completos) ou do banco de dados (para proteger *Order Bumps*). |
| **Sincronização de DB** | Antes de criar o pagamento, a função deleta e reinsere os `order_items` no banco de dados, garantindo que o pedido reflita exatamente os itens que serão cobrados. |
| **Credenciais Dinâmicas** | Busca as credenciais do Mercado Pago (`accessToken`) do perfil do vendedor (`profiles` ou `vendor_integrations`), suportando modos de **Teste** e **Produção** de forma segura. |
| **Estrutura de Pagamento MP** | Montagem detalhada do payload para a API do Mercado Pago, incluindo dados do pagador (e-mail, nome, documento), referência externa (`orderId`) e itens. |

### 2.3. `mercadopago-webhook` (Recepção de Webhook MP)

Esta função recebe notificações de status de pagamento do Mercado Pago e atualiza o pedido no Supabase.

| Funcionalidade Refatorada | Detalhe da Implementação |
| :--- | :--- |
| **Validação de Assinatura** | Implementação de `validateMercadoPagoSignature` para verificar a autenticidade do webhook do Mercado Pago usando `x-signature` e `MERCADOPAGO_WEBHOOK_SECRET`. Embora a validação falhe em alguns casos (idade do webhook, formato), o código opta por **permitir a passagem** (`valid: true, skipped: true`), o que pode ser uma medida de compatibilidade, mas é um ponto de atenção para segurança. |
| **Busca de Pagamento** | Após receber a notificação, a função consulta a API do Mercado Pago (`/v1/payments/{paymentId}`) para obter o status oficial, evitando confiar apenas nos dados da notificação. |
| **Mapeamento de Status** | A função `mapPaymentStatusToOrderStatus` traduz o status do Mercado Pago (`approved`, `rejected`, etc.) para o status interno do pedido (`PAID`, `CANCELLED`, etc.) e define o `eventType` para o sistema de webhooks. |
| **Deduplicação** | Verifica se o status do pedido no banco de dados já é o mesmo que o novo status, ignorando webhooks duplicados. |
| **Atualização do Pedido** | Atualiza o status do pedido na tabela `orders`. O disparo de webhooks subsequentes é delegado a um **trigger de banco de dados** (mencionado no código), indicando uma arquitetura baseada em eventos. |

### 2.4. `trigger-webhooks` (Acionamento de Webhooks)

Esta função é o motor do sistema de webhooks, provavelmente acionada por um *trigger* do Supabase após a atualização de um pedido.

| Funcionalidade Refatorada | Detalhe da Implementação |
| :--- | :--- |
| **Autenticação de Serviço** | Exige autenticação via `SUPABASE_SERVICE_ROLE_KEY`, garantindo que apenas o serviço de banco de dados ou outro serviço interno possa acioná-la. |
| **Busca e Filtragem de Webhooks** | Busca todos os webhooks ativos do vendedor e os filtra por `event_type` (`filterWebhooksByEvent`) e, crucialmente, por `product_id` (`filterWebhooksByProduct`). |
| **Filtragem por Produto** | A função `filterWebhooksByProduct` suporta a filtragem de webhooks por produto, verificando tanto a nova tabela de relacionamento (`webhook_products`) quanto a coluna antiga (`product_id`) para compatibilidade. |
| **Construção de Payload** | A função `buildWebhookPayload` cria o objeto de dados padronizado que será enviado ao cliente, contendo informações do pedido, cliente e pagamento. |
| **Disparo Paralelo** | Utiliza `Promise.all` para disparar os webhooks correspondentes em paralelo, chamando a função `dispatch-webhook` internamente, o que otimiza a performance. |

## 3. Conclusão da Análise

O projeto **RiseCheckout** demonstra uma arquitetura robusta e bem organizada, com uma clara separação entre a lógica de frontend (em `src`) e a lógica de backend crítica (em `supabase/functions`).

A refatoração recente nas *Edge Functions* do Supabase é um **avanço significativo** em termos de segurança, confiabilidade e modularidade. As principais melhorias são:

*   **Segurança de Pagamento:** A mudança para o cálculo de preço *server-side* em `mercadopago-create-payment` elimina a possibilidade de fraude por manipulação de preço no cliente.
*   **Confiabilidade de Webhook:** A implementação de deduplicação, log de entrega e assinatura HMAC em `dispatch-webhook` e `trigger-webhooks` torna o sistema de notificação mais robusto e rastreável.
*   **Modularidade:** A divisão das funções em etapas e o uso de funções auxiliares facilitam a manutenção e a compreensão do código.

O projeto está bem estruturado para um checkout de alta conversão, com recursos como:

*   **Customização de Checkout:** Presença de `CheckoutCustomizer.tsx` e lógica de temas (`themePresets.ts`).
*   **Order Bumps/Ofertas:** Estruturas como `OrderBumpDialog.tsx`, `OffersManager.tsx` e a lógica de seleção de itens no `mercadopago-create-payment` confirmam o suporte a ofertas adicionais.
*   **Integrações:** Suporte a Mercado Pago e menção a integrações como Facebook Conversions API e Pixel (`facebook-conversions-api.ts`, `facebook-pixel-helpers.ts`).

O único ponto de atenção é a decisão de **permitir a passagem** em caso de falha na validação da assinatura do Mercado Pago, o que pode ser um risco de segurança se não for intencional (por exemplo, para compatibilidade com versões antigas do MP).

O código está em um bom estado, refletindo um esforço de engenharia para torná-lo mais seguro e escalável.
