# Análise Completa do Projeto: RiseCheckout

**Autor:** Manus AI  
**Data:** 31 de Janeiro de 2026

## 1. Visão Geral do Projeto

O projeto, denominado **RiseCheckout**, é uma plataforma de checkout de alta performance construída no modelo de **Marketplace**. A análise do repositório `olaalessandro9-wq/biz-bridge-bliss` e da infraestrutura Supabase associada revela um sistema robusto e bem-documentado, projetado para gerenciar vendas, produtos, afiliados e pagamentos de forma segura e eficiente.

A plataforma permite que vendedores (`producers`) criem produtos e checkouts personalizados, enquanto a plataforma (o `owner`) gerencia o ecossistema, incluindo um programa de afiliados exclusivo e a cobrança de taxas sobre as transações.

## 2. Arquitetura e Tecnologias

O RiseCheckout adota uma arquitetura moderna, separando claramente o frontend, o backend e a infraestrutura de banco de dados. A seguir, uma tabela com as principais tecnologias e padrões identificados.

| Categoria | Tecnologia/Padrão | Descrição |
| :--- | :--- | :--- |
| **Frontend** | React (Vite), TypeScript | Interface de usuário reativa e tipada, com build otimizado pelo Vite. |
| **Estilização** | TailwindCSS, Shadcn/UI | Design system moderno e customizável para uma UI consistente. |
| **Backend** | Supabase Edge Functions (Deno) | Lógica de negócio implementada em Deno, executada na borda para baixa latência. |
| **Banco de Dados** | Supabase (PostgreSQL) | Banco de dados relacional com políticas de segurança RLS (Row-Level Security). |
| **Gerenciamento de Estado** | XState, TanStack Query | Máquinas de estado para fluxos complexos e gerenciamento de cache de dados do servidor. |
| **Roteamento** | React Router | Navegação modular e protegida por guards de autenticação e autorização. |

Um princípio fundamental da arquitetura é o **"Zero Database Access (Frontend)"**. O frontend nunca acessa o banco de dados diretamente. Todas as interações são mediadas por mais de 100 Edge Functions, que atuam como uma camada de API segura, validando permissões e tratando da lógica de negócio.

## 3. Estrutura do Código-Fonte

O código está organizado de forma modular e intuitiva, facilitando a manutenção e o desenvolvimento de novas funcionalidades.

- **/src**: Contém todo o código-fonte do frontend.
  - `components/`: Componentes de UI reutilizáveis.
  - `features/`: Lógica de negócio específica de funcionalidades.
  - `hooks/`: Hooks customizados do React.
  - `layouts/`: Estruturas de página principais (ex: `AppShell`).
  - `modules/`: Agrupamento de componentes, hooks e máquinas de estado por domínio (ex: `dashboard`, `products`).
  - `pages/`: Componentes de página completos.
  - `routes/`: Definição das rotas da aplicação, separadas por contexto (público, dashboard, etc.).
- **/supabase**: Contém a infraestrutura de backend.
  - `functions/`: Código-fonte de todas as Edge Functions, incluindo um diretório `_shared` com lógica comum.
  - `migrations/`: Scripts de migração do banco de dados que definem a evolução do schema.
  - `config.toml`: Arquivo de configuração central do Supabase, que define o comportamento das Edge Functions.
- **/docs**: Documentação extensa sobre arquitetura, decisões de design, modelo de negócio e guias de segurança.

## 4. Análise do Backend e Supabase

A configuração do Supabase é o coração do sistema e apresenta um alto grau de maturidade.

### Autenticação Unificada (RISE V3)

O projeto implementa um sistema de autenticação customizado e unificado, chamado **"Unified Auth"**. Em vez de usar o JWT padrão do Supabase para autenticar requisições às Edge Functions, o sistema utiliza cookies `httpOnly` (`__Secure-rise_access` e `__Secure-rise_refresh`).

> A Edge Function `unified-auth` centraliza todas as operações de identidade (login, registro, refresh, troca de contexto), e um módulo compartilhado (`_shared/unified-auth-v2.ts`) valida as sessões em todas as funções protegidas. Por este motivo, o arquivo `supabase/config.toml` define `verify_jwt = false` para todas as funções, delegando a autenticação para esta camada customizada.

### Estrutura do Banco de Dados

O banco de dados é bem estruturado, com tabelas principais que refletem o modelo de negócio da plataforma. As tabelas mais importantes incluem:

- `products`: Gerencia os produtos à venda.
- `checkouts`: Armazena as configurações de múltiplos checkouts por produto.
- `orders` e `order_items`: Registram todas as transações.
- `users`: Contém os dados dos usuários, incluindo seu papel (`role`) e taxas customizadas.
- `sessions`: Tabela central do sistema de autenticação unificado.
- `affiliates`: Gerencia as afiliações (disponível apenas para o `owner`).

Políticas de RLS (Row-Level Security) são aplicadas para garantir que os usuários só possam acessar os dados aos quais têm permissão.

### Modelo de Negócio e Pagamentos

O documento `docs/MODELO_NEGOCIO.md` detalha as regras financeiras:

- **Taxa da Plataforma:** Uma taxa padrão de **4%** é aplicada sobre as vendas de vendedores comuns, sendo direcionada ao `owner` da plataforma.
- **Isenção do Owner:** O `owner` é isento da taxa de 4% ao vender seus próprios produtos diretamente.
- **Programa de Afiliados:** Exclusivo para o `owner`. Apenas produtos do `owner` podem ter afiliados. Vendedores comuns podem se afiliar aos produtos do `owner`, mas não podem criar seus próprios programas de afiliação.
- **Split de Pagamento (Modelo CAKTO):** A comissão do afiliado é calculada sobre o valor líquido da venda, após a dedução da taxa da plataforma.

## 5. Conclusão e Recomendações

O projeto **RiseCheckout** é uma aplicação complexa, bem arquitetada e com uma base de código sólida. A documentação abrangente, a estrutura modular e a implementação de padrões de segurança robustos (como o sistema de autenticação unificado e o uso intensivo de Edge Functions) são pontos de destaque.

Com base nesta análise, estou pronto para auxiliar nas futuras mudanças e evoluções do projeto. A compreensão profunda da arquitetura e das regras de negócio permitirá a implementação de novas funcionalidades de forma consistente e segura.
