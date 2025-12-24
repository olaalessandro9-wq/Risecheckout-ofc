# Relatório de Análise Completa: Projeto RiseCheckout

**Data:** 29 de Novembro de 2025
**Analista:** Manus AI

## 1. Sumário Executivo

Este relatório apresenta uma análise completa do projeto RiseCheckout, um sistema de pagamentos construído com React, TypeScript e Supabase. A análise abrange a arquitetura de frontend e backend, a estrutura do banco de dados e os principais fluxos de negócio. O projeto demonstra uma arquitetura funcional e robusta, com um sistema de checkout altamente customizável e suporte a múltiplos gateways de pagamento. 

O código-fonte revela um projeto que passou por várias iterações e correções, resultando em uma base de código funcional, porém complexa. Foram identificadas oportunidades significativas para refatoração, visando a redução da complexidade, o aumento da manutenibilidade e o aprimoramento da segurança. O documento `analise_completa_codigo.md`, encontrado no repositório, já continha um diagnóstico preciso, cujas conclusões são validadas e expandidas neste relatório.

As principais recomendações incluem a refatoração de componentes monolíticos no frontend, o fortalecimento de práticas de segurança, como a criptografia de credenciais, e a otimização de funções de backend para maior clareza e eficiência.

## 2. Arquitetura Geral

A aplicação segue um modelo cliente-servidor moderno, utilizando tecnologias JAMstack. O frontend é uma Single-Page Application (SPA) em React, o backend é composto por Edge Functions serverless no Supabase, e o banco de dados é o PostgreSQL, também gerenciado pelo Supabase.

```mermaid
graph TD
    subgraph Frontend (React + Vite)
        A[Usuário no Navegador] --> B{Página de Checkout};
        B --> C[Componentes React];
        C --> D{Hooks Customizados};
        D --> E[Chamadas de API];
    end

    subgraph Backend (Supabase)
        E --> F[Edge Functions];
        F --> G[Banco de Dados PostgreSQL];
        F --> H[APIs Externas];
    end

    subgraph APIs Externas
        H -->> I[Mercado Pago];
        H -->> J[PushinPay];
        H -->> K[Facebook CAPI, UTMify, etc.];
    end

    G -- Retorna Dados --> F;
    F -- Retorna Resposta --> E;
    E -- Atualiza UI --> C;
```

**Componentes da Arquitetura:**

| Componente | Tecnologia | Responsabilidade |
| :--- | :--- | :--- |
| **Frontend** | React, Vite, TypeScript, ShadCN/UI | Renderização da interface do usuário, captura de dados do cliente, interação com o checkout e gerenciamento de estado local. |
| **Backend** | Supabase Edge Functions (Deno) | Orquestração da lógica de negócio, processamento de pagamentos, comunicação com APIs de terceiros e persistência de dados. |
| **Banco de Dados** | Supabase (PostgreSQL) | Armazenamento de todos os dados da aplicação, incluindo produtos, checkouts, pedidos, usuários e configurações. |
| **Serviços Externos** | Mercado Pago, PushinPay, etc. | Processamento de transações financeiras e serviços de tracking de marketing. |

## 3. Análise do Backend (Edge Functions)

O backend é composto por um conjunto de Supabase Edge Functions que lidam com a lógica de negócio crítica. As funções são escritas em TypeScript e executadas no Deno.

| Função | Descrição | Pontos Fortes | Pontos de Melhoria |
| :--- | :--- | :--- | :--- |
| `create-order` | Responsável por receber os dados do checkout, validar a oferta, calcular o valor total (incluindo order bumps) e criar o registro do pedido (`orders`) e seus itens (`order_items`) no banco de dados. | Lógica de cálculo de preço no servidor; validação de dados de entrada; inserção em lote dos itens do pedido. | Validação de `checkout_id` foi removida para contornar um bug, necessitando investigação da causa raiz. |
| `mercadopago-create-payment` | Inicia uma transação de pagamento com o Mercado Pago. Busca as credenciais do vendedor, os itens do pedido no banco (fonte da verdade) e envia a requisição para a API do Mercado Pago. | Utiliza os dados do banco como fonte da verdade para o valor, prevenindo manipulação pelo cliente; lógica defensiva para seleção de credenciais. | A lógica para determinar a fonte dos itens é complexa e pode ser simplificada e extraída para uma função auxiliar. |
| `trigger-webhooks` | Dispara webhooks para sistemas externos após a ocorrência de eventos no pedido (ex: compra aprovada). Busca os webhooks configurados para o vendedor e o produto e envia o payload. | Lógica robusta para encontrar os webhooks corretos associados a um pedido; implementação de timeout para as requisições. | Não assina os payloads de webhook enviados, o que dificulta a validação da autenticidade pelo sistema que o recebe. |

## 4. Análise do Frontend (React)

O frontend é construído em React e utiliza uma estrutura moderna com hooks para gerenciamento de estado e lógica. A complexidade está concentrada principalmente na página de checkout pública.

- **`PublicCheckout.tsx`**: Este é o componente central da aplicação. Com mais de 1500 linhas (conforme análise prévia), ele orquestra a busca de dados do checkout, a renderização de todos os subcomponentes (sumário do pedido, formulários, order bumps), o carregamento de scripts de tracking (Facebook, Google, etc.) e a lógica de submissão do formulário. Sua complexidade o torna um candidato principal para refatoração.

- **`useCheckoutLogic.ts`**: Um hook customizado que abstrai a maior parte da lógica de negócio do checkout, como validação de formulário, cálculo de totais, seleção de order bumps e a chamada à Edge Function `create-order`. O uso deste hook é uma boa prática, mas ele próprio é bastante complexo.

- **`CustomCardForm.tsx` e `useMercadoPagoBrick.ts`**: O formulário de cartão de crédito é implementado utilizando o SDK do Mercado Pago (Bricks). O hook `useMercadoPagoBrick.ts` encapsula a complexa inicialização e interação com o SDK, que não foi projetado nativamente para React. Isso leva a soluções complexas, como polling para detectar o foco em iframes, para contornar as limitações do SDK. A recomendação de usar o wrapper oficial `@mercadopago/sdk-react` é altamente pertinente.

## 5. Análise do Banco de Dados

A estrutura do banco de dados no Supabase é bem projetada e normalizada, com um foco claro na flexibilidade e customização do checkout. Todas as tabelas utilizam RLS (Row Level Security), uma prática de segurança essencial.

**Tabelas Notáveis:**

- **`products`**: Armazena as informações básicas dos produtos à venda.
- **`checkouts`**: Tabela central para a customização. Cada registro representa uma versão de uma página de checkout, com configurações detalhadas de design (cores, fontes) e gateways de pagamento (`pix_gateway`, `credit_card_gateway`).
- **`checkout_rows` e `checkout_components`**: Implementam um sistema de layout flexível, permitindo que os usuários construam a aparência do checkout adicionando e organizando componentes como textos, imagens, selos e temporizadores.
- **`orders` e `order_items`**: Armazenam as informações das transações. `orders` contém os dados do cliente e o valor total, enquanto `order_items` detalha cada item da compra, incluindo o produto principal e os order bumps.
- **`order_bumps`**: Permite a configuração de ofertas adicionais que podem ser adicionadas ao carrinho no momento do checkout.
- **`vendor_integrations` e `payment_gateway_settings`**: Armazenam credenciais e configurações para integrações com serviços de terceiros, como gateways de pagamento e ferramentas de marketing.

## 6. Fluxo de Pagamento Principal (Cartão de Crédito)

1.  **Carregamento da Página**: O usuário acessa a URL do checkout (`/pay/:slug`). O componente `PublicCheckout.tsx` é montado.
2.  **Busca de Dados**: O componente busca os dados do checkout, do produto associado e as configurações de design no Supabase.
3.  **Renderização**: A página é renderizada com o tema e os componentes customizados. O SDK do Mercado Pago é carregado e o formulário de cartão de crédito (`CustomCardForm.tsx`) é inicializado via `useMercadoPagoBrick.ts`.
4.  **Preenchimento do Formulário**: O usuário preenche seus dados (nome, email, etc.) e as informações do cartão. O hook `useCheckoutLogic.ts` gerencia o estado do formulário.
5.  **Seleção de Bumps**: O usuário pode selecionar um ou mais `OrderBumps`, e o `useCheckoutLogic.ts` recalcula o valor total em tempo real.
6.  **Submissão**: O usuário clica em "Pagar".
7.  **Tokenização do Cartão**: `CustomCardForm.tsx` chama o SDK do Mercado Pago para validar os dados do cartão e gerar um token de pagamento seguro.
8.  **Criação do Pedido**: Com o token em mãos, `useCheckoutLogic.ts` chama a Edge Function `create-order`, enviando os dados do cliente e os IDs dos bumps selecionados.
9.  **Processamento no Backend**: A `create-order` valida os dados, calcula o valor final e salva o pedido com status "pending" no banco de dados.
10. **Criação do Pagamento**: Após criar o pedido, o frontend chama a Edge Function `mercadopago-create-payment`, passando o `orderId` e o token do cartão.
11. **Comunicação com Gateway**: A `mercadopago-create-payment` busca as credenciais do vendedor e envia a requisição de pagamento para a API do Mercado Pago.
12. **Confirmação e Redirecionamento**: Se o pagamento for aprovado, o Mercado Pago envia um webhook de confirmação (processado por outra função), e o frontend redireciona o usuário para a página de sucesso (`/success/:orderId`).

## 7. Recomendações e Roadmap

As recomendações a seguir, baseadas na análise do código e no arquivo `analise_completa_codigo.md`, visam aprimorar a qualidade, segurança e manutenibilidade do projeto.

### Fase 1: Segurança (Prioridade Alta)

- **Criptografar Credenciais de Gateway**: As credenciais de API (ex: Access Token do Mercado Pago) devem ser criptografadas no banco de dados. Utilizar as funções de criptografia do Supabase ou `crypto.subtle` nas Edge Functions para proteger esses dados sensíveis.
- **Sanitização de Entradas (XSS)**: Implementar sanitização em todos os campos renderizados que provêm do usuário ou do banco de dados (ex: nome do cliente, descrição do produto) usando bibliotecas como `DOMPurify` para prevenir ataques de Cross-Site Scripting (XSS).
- **Rate Limiting**: Implementar um sistema de limite de requisições nas Edge Functions mais críticas (`create-order`, `mercadopago-create-payment`) para mitigar ataques de negação de serviço (DoS) e spam.

### Fase 2: Refatoração (Prioridade Média)

- **Dividir `PublicCheckout.tsx`**: Extrair a lógica de tracking, carregamento de SDKs e gerenciamento de estado para hooks customizados específicos (ex: `useTracking`, `useMercadoPago`). Extrair seções da UI para componentes menores e mais focados (ex: `CheckoutHeader`, `OrderSummaryContainer`).
- **Adotar `@mercadopago/sdk-react`**: Substituir a implementação manual (`useMercadoPagoBrick.ts`) pelo wrapper oficial do Mercado Pago para React. Isso eliminará a necessidade de gambiarras (como o polling de foco) e simplificará drasticamente o `CustomCardForm.tsx`.
- **Isolar Lógica de Cálculo**: Centralizar toda a lógica de cálculo de preços e parcelas em módulos dedicados no `lib/`, garantindo uma única fonte da verdade e facilitando testes.

### Fase 3: Otimização e Boas Práticas (Prioridade Baixa)

- **Investigar TODOs**: Investigar e resolver os `TODOs` deixados no código, como a validação de `checkout_id` na função `create-order`.
- **Remover Logs de Debug**: Substituir os `console.log` em produção por um sistema de logging configurável que só exiba logs detalhados em ambiente de desenvolvimento.
- **Tipagem Estrita**: Revisar o uso de `any` no código e substituí-lo por tipos e interfaces específicas do TypeScript para aumentar a segurança e a previsibilidade do código.
