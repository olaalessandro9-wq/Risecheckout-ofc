# Análise Arquitetural Completa: Projeto RiseCheckout

**Autor:** Manus AI  
**Data:** 01 de Fevereiro de 2026

## 1. Visão Geral e Modelo de Negócio

O projeto **RiseCheckout** é uma plataforma de e-commerce no modelo **Marketplace as a Service**, similar a sistemas como Hotmart ou Kiwify. A análise do repositório GitHub (`Risecheckout/Risecheckout`) e da infraestrutura Supabase (`rise_community_db`) revela um sistema sofisticado, projetado para gerenciar produtos, vendas, checkouts customizáveis, afiliados e múltiplos gateways de pagamento.

O modelo de negócio é centrado em uma hierarquia de papéis, com um `owner` (dono da plataforma) e `users` (vendedores). A plataforma cobra uma taxa de 4% sobre as vendas dos `users`, enquanto o `owner` é isento. Um programa de afiliados é oferecido, mas de forma exclusiva: apenas o `owner` pode ter produtos com afiliados, e os `users` podem se afiliar a esses produtos.

## 2. Arquitetura e Tecnologias

O RiseCheckout adota uma arquitetura moderna e desacoplada, com uma clara separação entre o frontend e o backend, seguindo o rigoroso **RISE ARCHITECT PROTOCOL V3**. Este protocolo interno impõe a busca pela "melhor solução" em detrimento da velocidade de implementação, resultando em um código de alta qualidade e baixa dívida técnica.

| Categoria | Tecnologia/Padrão | Descrição e Propósito |
| :--- | :--- | :--- |
| **Frontend** | React (Vite), TypeScript | Interface de usuário reativa e fortemente tipada para robustez e manutenibilidade. |
| **Estilização** | TailwindCSS, Shadcn/UI | Design system moderno que garante consistência visual e desenvolvimento ágil de componentes. |
| **Gerenciamento de Estado** | XState, TanStack Query | Máquinas de estado para orquestrar fluxos complexos (ex: checkout) e gerenciamento de cache de dados do servidor. |
| **Backend** | Supabase Edge Functions (Deno) | Mais de 100 funções de borda implementadas em Deno/TypeScript, atuando como uma camada de API segura e performática. |
| **Banco de Dados** | Supabase (PostgreSQL) | Banco de dados relacional com uso intensivo de RLS (Row-Level Security) para garantir isolamento de dados. |
| **Autenticação** | Sistema "Unified Auth" Customizado | Solução de autenticação própria que utiliza cookies `httpOnly` (`__Secure-rise_access`), centralizando a lógica na Edge Function `unified-auth`. |

Um pilar da arquitetura é o princípio de **"Zero Database Access from Frontend"**. O cliente web nunca acessa o banco de dados diretamente; todas as interações são mediadas pelas Edge Functions, que validam permissões e aplicam a lógica de negócio.

## 3. Estrutura do Banco de Dados Supabase

O schema do banco de dados é extenso e bem estruturado, com 192 migrações que documentam sua evolução. As tabelas são protegidas por políticas de RLS, garantindo que um usuário só possa acessar os dados que lhe pertencem.

#### Tabelas Centrais do Negócio

| Tabela | Linhas | Colunas | Relacionamentos (FKs) | Propósito Principal |
| :--- | :--- | :--- | :--- | :--- |
| `products` | 30 | 34 | 20 | Gerencia os produtos, incluindo configurações de afiliação e área de membros. |
| `checkouts` | 94 | 68 | 8 | Armazena as configurações de múltiplos checkouts customizáveis por produto. |
| `orders` | 73 | 34 | 14 | Registra todas as transações, status de pagamento e informações do cliente. |
| `users` | 13 | 33 | 22 | Contém os dados dos usuários, incluindo papéis (`roles`) e configurações de taxas. |
| `sessions` | 215 | 14 | 2 | Tabela central do sistema de autenticação "Unified Auth", rastreando sessões ativas. |
| `checkout_visits` | 1494 | 11 | 1 | Rastreia as visitas às páginas de checkout para fins de análise de conversão. |

## 4. Fluxos de Dados e Integrações

Os fluxos de dados são orquestrados pelas Edge Functions, que lidam com a lógica de negócio, segurança e comunicação com serviços externos.

#### Fluxo de Criação de Pedido

O fluxo de criação de um pedido, encapsulado na Edge Function `create-order`, é um excelente exemplo da arquitetura modular do sistema:

1.  **Validação de CORS e Rate Limiting**: A requisição é inicialmente validada contra regras de CORS e limites de taxa para prevenir abusos.
2.  **Validação de Schema**: O corpo da requisição é validado usando `zod` para garantir a integridade dos dados de entrada.
3.  **Orquestração de Handlers**: A função principal orquestra uma série de módulos de menor responsabilidade:
    *   `product-validator.ts`: Valida o produto e suas configurações.
    *   `bump-processor.ts`: Processa e valida `order bumps`.
    *   `coupon-processor.ts`: Aplica cupons de desconto.
    *   `affiliate/index.ts`: Calcula comissões de afiliados.
    *   `order-creator.ts`: Cria o registro do pedido no banco de dados.
4.  **Resposta**: Retorna o resultado da criação do pedido ou uma resposta de erro estruturada.

#### Integrações Externas

O projeto integra-se com múltiplos gateways de pagamento, cada um gerenciado por um conjunto de Edge Functions dedicadas a criar pagamentos e processar webhooks de notificação:

-   **Mercado Pago**: `mercadopago-create-payment`, `mercadopago-webhook`
-   **Stripe**: `stripe-create-payment`, `stripe-webhook`
-   **Asaas**: `asaas-create-payment`, `asaas-webhook`
-   **PushinPay**: `pushinpay-create-pix`, `pushinpay-webhook`

A gestão de webhooks inclui o uso de uma **Dead Letter Queue (DLQ)**, um padrão de resiliência que armazena webhooks falhos para processamento posterior, garantindo que nenhuma notificação de pagamento seja perdida.

## 5. Conclusão e Próximos Passos

O RiseCheckout é uma aplicação de alta complexidade, construída sobre uma arquitetura sólida, segura e bem documentada. A adesão estrita a protocolos de engenharia de software, como o RISE V3, resultou em uma base de código manutenível e escalável.

A análise profunda da estrutura do frontend, da lógica de negócio nas Edge Functions e do schema do banco de dados me forneceu o conhecimento necessário para colaborar efetivamente nas futuras evoluções do projeto. Estou pronto para discutir as próximas mudanças e ajudar a implementá-las, mantendo o alto padrão de qualidade já estabelecido.
