# Análise Arquitetural Detalhada do Projeto RiseCheckout

## 1. Introdução

Esta análise aprofundada do projeto **RiseCheckout** visa fornecer uma compreensão completa de sua arquitetura, fluxos de dados, tecnologias e práticas de segurança. O objetivo é criar uma base de conhecimento sólida para facilitar futuras atualizações, manutenções e a evolução do sistema. A análise foi conduzida examinando o código-fonte do frontend, as Edge Functions do Supabase e a estrutura do banco de dados.

## 2. Arquitetura Geral e Stack Tecnológica

O RiseCheckout é uma aplicação web monolítica com uma arquitetura moderna, utilizando um *framework* de frontend reativo (React) que se comunica com um *backend-as-a-service* (Supabase). Esta abordagem combina a agilidade de desenvolvimento do BaaS com a flexibilidade de funções serverless (Edge Functions) para lógica de negócio crítica.

| Categoria | Tecnologia | Versão/Detalhe |
| :--- | :--- | :--- |
| **Frontend** | React com TypeScript | `react@18.3.1`, `typescript@5.8.3` |
| **Build Tool** | Vite | `vite@5.4.19` |
| **Roteamento** | React Router | `react-router-dom@6.30.1` |
| **UI & Estilização** | Tailwind CSS, Radix UI, Shadcn/UI | `tailwindcss@3.4.17`, `lucide-react` para ícones |
| **Formulários** | React Hook Form com Zod | `react-hook-form@7.61.1`, `zod@3.25.76` |
| **Gerenciamento de Estado**| TanStack Query (React Query) | `@tanstack/react-query@5.83.0` |
| **Backend (BaaS)** | Supabase | `supabase-js@2.81.1` |
| **Banco de Dados** | PostgreSQL 17 | `wivbtmtgpsxupfjwwovf` em `sa-east-1` |
| **Gateway de Pagamento**| Mercado Pago, PushinPay | `@mercadopago/sdk-react@1.0.6` |
| **Animações** | Framer Motion | `framer-motion@12.23.24` |

## 3. Estrutura do Banco de Dados (Supabase)

O schema do banco de dados é o núcleo do sistema, com **49 tabelas e funções** no schema `public`. A utilização massiva de **Row Level Security (RLS)** em todas as tabelas principais é um pilar da arquitetura, garantindo que os vendedores (usuários) só possam acessar e modificar seus próprios dados.

### Modelo de Dados Chave

-   **`products`**: A entidade central. Contém informações sobre o produto, preço (em Reais), e configurações como campos obrigatórios no checkout (`required_fields`).
-   **`checkouts`**: O coração da customização. Cada produto pode ter múltiplos checkouts, mas um é o `is_default`. Esta tabela armazena mais de 50 colunas de design (cores, fontes, background), além da estrutura de componentes em JSON (`design`, `components`).
-   **`orders`**: Registra cada transação. Inicia com status `pending` e é atualizada pelos webhooks dos gateways. Armazena dados do cliente e o valor total em centavos (`amount_cents`).
-   **`order_items`**: Detalha os itens de um pedido, diferenciando o produto principal de `order_bumps` através do booleano `is_bump`.
-   **`vendor_integrations`**: Tabela polimórfica que armazena configurações para integrações de terceiros (Mercado Pago, Facebook Pixel, UTMify), identificadas por `integration_type`.
-   **`outbound_webhooks` e `webhook_deliveries`**: Sistema robusto para notificações. `outbound_webhooks` armazena a configuração (URL, eventos, segredo HMAC), enquanto `webhook_deliveries` funciona como um log detalhado de cada tentativa de envio.

## 4. Fluxos de Dados Principais

### 4.1. Fluxo de Checkout Público

1.  **Carregamento**: O usuário acessa `/:slug`. A página `PublicCheckout.tsx` é renderizada.
2.  **Busca de Dados**: O `useEffect` principal chama `loadCheckout()`, que por sua vez executa a RPC `get_checkout_by_payment_slug` para buscar os dados do checkout, produto e order bumps associados.
3.  **Inicialização do Estado**: O hook `useCheckoutLogic` é inicializado, recuperando dados do formulário do `localStorage` via `useCheckoutFormPersistence`.
4.  **Inicialização de Pagamento**: O `vendorId` é extraído e usado para buscar a chave pública do Mercado Pago (via RPC `get_vendor_public_key`). O SDK do Mercado Pago é inicializado.
5.  **Tracking**: O evento `ViewContent` do Facebook Pixel é disparado.
6.  **Interação do Usuário**:
    *   Preenchimento do formulário: O estado é atualizado via `logic.updateField`.
    *   Seleção de Order Bump: `logic.toggleBump` é chamado, atualizando o `Set` de `selectedBumps`.
    *   O total é recalculado dinamicamente via `logic.calculateTotal`.
7.  **Submissão**: O usuário clica em pagar.

### 4.2. Fluxo de Criação de Pagamento

1.  **Validação**: `logic.validateForm()` é chamado.
2.  **Criação do Pedido**: `logic.createOrder()` é invocado, que chama a Edge Function `create-order`.
    *   **`create-order`**:
        *   Recebe IDs de produto e bumps.
        *   **Busca o preço do produto principal no DB (Fonte da Verdade).**
        *   Cria o registro na tabela `orders`.
        *   Itera sobre os `order_bump_ids`, busca o preço de cada um (de `offers` ou `products`) e os insere em `order_items`.
        *   Atualiza o `amount_cents` final na tabela `orders`.
        *   Retorna `order_id` e `amount_cents`.
3.  **Criação no Gateway**:
    *   Com o `order_id` e o valor final, o frontend chama a Edge Function `mercadopago-create-payment`.
    *   **`mercadopago-create-payment`**:
        *   **Valida o preço novamente no servidor**, recalculando o total a partir dos `order_items` no banco de dados (dupla verificação de segurança).
        *   Busca as credenciais do Mercado Pago (de `vendor_integrations` ou `profiles` para modo teste).
        *   Monta o payload e envia para a API do Mercado Pago.
        *   Salva o `gateway_payment_id` e, se for PIX, o `pix_qr_code` na tabela `orders`.
        *   Retorna os dados do pagamento (QR Code para PIX, status para cartão) para o frontend.
4.  **Redirecionamento**: O frontend exibe a página de pagamento PIX (`PixPaymentPage`) ou de sucesso/falha.

### 4.3. Fluxo de Webhooks (Notificação de Status)

1.  **Recepção**: O Mercado Pago envia uma notificação para a Edge Function `mercadopago-webhook`.
2.  **`mercadopago-webhook`**:
    *   Valida a assinatura HMAC (com fallback permissivo).
    *   Extrai o `paymentId`.
    *   **Busca o pagamento na API do Mercado Pago** para obter o status confiável.
    *   Busca o pedido correspondente em `orders` pelo `gateway_payment_id`.
    *   Mapeia o status do MP para o status interno (e.g., `approved` -> `PAID`).
    *   Atualiza o status na tabela `orders`.
3.  **Disparo Automático**: Um **trigger no banco de dados** na tabela `orders` detecta a mudança de status e invoca a Edge Function `trigger-webhooks`.
4.  **`trigger-webhooks`**:
    *   Recebe `order_id` e `event_type`.
    *   Busca todos os webhooks ativos para o `vendor_id` do pedido.
    *   Filtra os webhooks que escutam o `event_type` específico.
    *   Filtra novamente por produto, se aplicável.
    *   Para cada webhook correspondente, invoca a função `dispatch-webhook` em paralelo (`Promise.all`).
5.  **`dispatch-webhook`**:
    *   Cria um registro em `webhook_deliveries` com status `pending`.
    *   Gera a assinatura HMAC (`X-Rise-Signature`) com o segredo do webhook.
    *   Envia a requisição POST para a URL do cliente.
    *   Atualiza o registro em `webhook_deliveries` com o resultado (`success` ou `failed`) e o corpo da resposta.

## 5. Arquitetura do Frontend

O frontend é bem estruturado, com uma clara separação de responsabilidades entre componentes, hooks e páginas.

-   **Componentes**: Adoção do padrão **Shadcn/UI**, que utiliza componentes primitivos do **Radix UI** e os estiliza com **Tailwind CSS**. Isso oferece alta customização e acessibilidade. A estrutura em `src/components/ui` confirma essa abordagem.
-   **Gerenciamento de Estado**: O **TanStack Query** é usado para gerenciar o estado do servidor (cache de dados de produtos, integrações, etc.), enquanto o estado local da UI é gerenciado com `useState` e centralizado em hooks customizados, como o `useCheckoutLogic`.
-   **Lógica de Negócio**: O hook `useCheckoutLogic` é o cérebro do checkout, centralizando a validação, o cálculo de preço e a orquestração das chamadas às Edge Functions. O uso de `useRef` para `stateRef` é uma solução inteligente para evitar o problema de *stale closures* com os order bumps.
-   **Customização de Checkout**: A página `CheckoutCustomizer.tsx` implementa um editor visual complexo, utilizando **@dnd-kit** para a funcionalidade de arrastar e soltar, permitindo que os vendedores montem seus checkouts visualmente. A estrutura de dados (`CheckoutCustomization`) é salva como JSON na tabela `checkouts`.

## 6. Integrações de Terceiros

O sistema foi projetado para ser extensível através da tabela `vendor_integrations`.

-   **Mercado Pago**: Integração profunda, cobrindo criação de pagamento, webhooks e OAuth2 para conexão de contas de vendedores. A função `mercadopago-oauth-callback` lida com a troca do código de autorização por um `access_token` e `refresh_token`, que são armazenados de forma segura.
-   **PushinPay**: Configurado como um gateway PIX alternativo, com suas próprias Edge Functions para criar cobranças e consultar status.
-   **Facebook Pixel & Conversions API**: Implementação dupla (client-side e server-side) para tracking de eventos (`ViewContent`, `InitiateCheckout`, `Purchase`), garantindo a resiliência contra bloqueadores de anúncios.
-   **UTMify**: Integração para rastreamento de conversões com parâmetros UTM, invocando uma Edge Function (`utmify-conversion`) para enviar os dados.

## 7. Segurança

-   **Row Level Security (RLS)**: Habilitado em todas as tabelas sensíveis, é a principal linha de defesa contra acesso indevido a dados.
-   **Cálculo de Preço Server-Side**: Prática essencial que impede a manipulação de preços pelo cliente. A dupla verificação em `mercadopago-create-payment` é um reforço excelente.
-   **Autenticação de Edge Functions**: Uso consistente da `SUPABASE_SERVICE_ROLE_KEY` para proteger funções internas.
-   **Segredos e Chaves**: Todas as chaves secretas (`MERCADOPAGO_CLIENT_SECRET`, tokens de API) são acessadas exclusivamente no backend via `Deno.env.get()`, nunca expostas no frontend.
-   **Assinatura de Webhooks**: O envio de webhooks de saída com assinatura HMAC (`X-Rise-Signature`) permite que os clientes verifiquem a autenticidade das notificações.

## 8. Pontos de Melhoria e Observações

-   **Validação de Assinatura do Mercado Pago**: O fallback permissivo na função `mercadopago-webhook` (que permite a passagem do webhook mesmo se a assinatura falhar) deve ser revisto. Embora possa ser uma medida de compatibilidade, representa um vetor de risco e deve ser tornado mais estrito se possível.
-   **Validação de Order Bumps**: O comentário `// TODO: Investigar causa raiz na RPC get_checkout_by_payment_slug` na função `create-order` é crítico. A remoção da validação de `checkout_id` na busca de bumps, embora funcional, pode teoricamente permitir que um bump de um checkout seja adicionado a um pedido de outro. A causa do *mismatch* de IDs deve ser investigada e corrigida.
-   **Persistência de Dados do Formulário**: O uso de `localStorage` em `useCheckoutFormPersistence` é conveniente, mas `sessionStorage` poderia ser uma alternativa mais segura para dados de formulário, pois é limpo quando a aba é fechada, reduzindo a superfície de ataque para scripts maliciosos (XSS).

## 9. Conclusão

O RiseCheckout é uma aplicação sofisticada e bem arquitetada. A refatoração recente das Edge Functions elevou significativamente a maturidade do projeto, introduzindo padrões de código limpo, segurança robusta e alta confiabilidade. A arquitetura é escalável e modular, pronta para suportar novas funcionalidades e integrações. Os pontos de melhoria identificados são ajustes finos em um sistema já sólido. Com esta compreensão detalhada, estou pronto para auxiliar nas próximas atualizações do projeto.
