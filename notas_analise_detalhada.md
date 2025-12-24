# Notas da Análise Detalhada - RiseCheckout

## Stack Tecnológica Identificada

### Frontend Framework
- **React 18.3.1** com **TypeScript 5.8.3**
- **Vite 5.4.19** como bundler e dev server
- **React Router DOM 6.30.1** para roteamento

### UI Framework
- **Radix UI** (componentes primitivos acessíveis)
- **Tailwind CSS 3.4.17** com plugins:
  - `tailwindcss-animate`
  - `@tailwindcss/typography`
- **Shadcn/UI** (inferido pela estrutura de componentes em `src/components/ui`)
- **Lucide React** para ícones
- **Framer Motion** para animações

### Gerenciamento de Estado e Dados
- **@tanstack/react-query 5.83.0** (React Query para cache e sincronização de dados)
- **React Hook Form 7.61.1** com **Zod 3.25.76** para validação de formulários
- **@hookform/resolvers** para integração

### Backend/BaaS
- **@supabase/supabase-js 2.81.1** (cliente Supabase)

### Integrações de Pagamento
- **@mercadopago/sdk-react 1.0.6** (SDK oficial do Mercado Pago)

### Bibliotecas Auxiliares
- **date-fns 3.6.0** (manipulação de datas)
- **qrcode 1.5.4** (geração de QR codes para PIX)
- **dompurify 3.3.0** (sanitização de HTML)
- **recharts 2.15.4** (gráficos e visualizações)
- **sonner 1.7.4** (notificações toast)
- **@dnd-kit** (drag and drop)
- **embla-carousel-react** (carrosséis)
- **vaul** (drawers)
- **cmdk** (command palette)

---

## Componentes Principais (src/components)

### Análise Pendente
- Checkout components
- Payment components
- Product management
- Webhooks configuration
- UI primitives


---

## Schema do Banco de Dados (Supabase)

O projeto possui **49 tabelas/funções** no schema público do Supabase.

### Tabelas Principais Identificadas

#### 1. Produtos e Ofertas
- **products**: Produtos principais (id, name, description, price, user_id, image_url, required_fields, default_payment_method)
- **offers**: Ofertas/variações de produtos (id, product_id, name, price em centavos, description)
- **order_bumps**: Ofertas adicionais no checkout (id, checkout_id, product_id, offer_id, discount_price, active)
- **upsells**: Ofertas de upsell pós-compra
- **downsells**: Ofertas de downsell

#### 2. Checkouts e Customização
- **checkouts**: Configuração de páginas de checkout (id, product_id, slug, name, design, theme, pix_gateway, credit_card_gateway, seller_name, is_default)
- **checkout_rows**: Linhas de layout do checkout (id, checkout_id, row_order, layout)
- **checkout_components**: Componentes dentro das linhas (id, row_id, type, content, component_order)
- **checkout_links**: Relacionamento entre checkouts e links de pagamento
- **checkout_visits**: Rastreamento de visitas (id, checkout_id, visited_at, utm_source, utm_medium, utm_campaign, ip_address, user_agent, referrer)
- **checkout_sessions**: Sessões ativas de checkout (id, vendor_id, order_id, status, started_at, last_seen_at)

#### 3. Pedidos e Pagamentos
- **orders**: Pedidos criados (id, vendor_id, product_id, customer_name, customer_email, customer_phone, customer_document, amount_cents, currency, status, gateway, payment_method, gateway_payment_id, pix_qr_code, pix_id, pix_status)
- **order_items**: Itens do pedido (id, order_id, product_id, product_name, amount_cents, quantity, is_bump)
- **order_events**: Histórico de eventos do pedido
- **pix_transactions**: Transações PIX específicas
- **payments_map**: Mapeamento de pagamentos

#### 4. Links de Pagamento
- **payment_links**: Links de pagamento gerados (id, checkout_id, slug, name, active)

#### 5. Cupons
- **coupons**: Cupons de desconto (id, code, discount_type, discount_value, active)
- **coupon_products**: Relacionamento entre cupons e produtos

#### 6. Webhooks
- **outbound_webhooks**: Webhooks configurados pelo vendedor (id, vendor_id, name, url, events, active, secret)
- **webhook_deliveries**: Log de entregas de webhook (id, webhook_id, order_id, event_type, payload, status, response_status, response_body, attempts, product_id)
- **webhook_products**: Relacionamento entre webhooks e produtos (filtro por produto)

#### 7. Integrações
- **vendor_integrations**: Integrações de terceiros (id, vendor_id, integration_type, config, active)
  - Tipos: MERCADOPAGO, FACEBOOK_PIXEL, UTMIFY, etc.
- **payment_gateway_settings**: Configurações de gateway de pagamento
- **payment_provider_credentials**: Credenciais de provedores de pagamento
- **mercadopago_split_config**: Configuração de split do Mercado Pago

#### 8. Afiliados
- **affiliates**: Sistema de afiliados (id, code, name, email, commission_percentage, product_id, active)

#### 9. Usuários e Permissões
- **profiles**: Perfis de usuários/vendedores (id, test_mode_enabled, test_public_key, test_access_token)
- **user_roles**: Papéis de usuário

#### 10. Sistema
- **app_settings**: Configurações globais da aplicação
- **platform_settings**: Configurações da plataforma
- **system_health_logs**: Logs de saúde do sistema
- **trigger_debug_logs**: Logs de debug de triggers
- **edge_function_errors**: Erros de Edge Functions

### Funções RPC Identificadas
- **get_vendor_public_key**: Retorna chave pública do Mercado Pago do vendedor (acesso anônimo)
- **get_checkout_by_payment_slug**: Busca checkout por slug de pagamento
- **attach_offer_to_checkout_smart**: Vincula oferta a checkout
- **clone_checkout_deep**: Clona checkout com todos os componentes
- **clone_checkout_layout**: Clona apenas layout
- **duplicate_checkout_shallow**: Duplica checkout (shallow)
- **create_payment_link_for_offer**: Cria link de pagamento para oferta
- **generate_link_slug**: Gera slug único para link
- **generate_unique_payment_slug**: Gera slug único para pagamento
- **has_active_payment_link_for_checkout**: Verifica se checkout tem link ativo
- **has_role**: Verifica papel do usuário
- **increment_checkout_visits**: Incrementa contador de visitas
- **log_system_metric**: Registra métrica do sistema
- **offer_is_exposed_via_active_link**: Verifica se oferta está exposta
- **product_has_active_checkout**: Verifica se produto tem checkout ativo

---

## Fluxo de Criação de Pedido (create-order)

### Etapas Identificadas

1. **Validação de Campos Obrigatórios**: product_id, offer_id, checkout_id, customer_name, customer_email
2. **Busca do Produto**: Obtém preço e vendor_id do produto principal
3. **Criação do Pedido**: Insere registro na tabela `orders` com status 'pending'
4. **Inserção do Item Principal**: Adiciona produto principal em `order_items` com is_bump=false
5. **Processamento de Order Bumps**:
   - Para cada bump_id recebido:
     - Busca dados do bump (validação de checkout_id foi REMOVIDA - Solução A)
     - Obtém preço de `offers` (se offer_id) ou `products` (se product_id)
     - Aplica desconto se discount_enabled=true
     - Insere em `order_items` com is_bump=true
     - Soma ao total do pedido
6. **Atualização do Total**: Atualiza amount_cents do pedido com soma de todos os itens
7. **Retorno**: Retorna order_id, amount_cents, vendor_id

### Observação Crítica (Comentário no Código)
- **Solução A (Gemini)**: Validação `.eq('checkout_id', checkout_id)` foi REMOVIDA da busca de bumps
- **Motivo**: Mismatch entre IDs impedia bumps de serem encontrados
- **TODO**: Investigar causa raiz na RPC `get_checkout_by_payment_slug`

---

## Hooks Customizados Identificados

### useCheckoutLogic
**Localização**: `src/hooks/useCheckoutLogic.ts`

**Responsabilidades**:
- Gerenciamento de estado unificado do checkout (formData, formErrors, selectedBumps, processing)
- Persistência automática de dados do formulário via `useCheckoutFormPersistence`
- Validação centralizada de formulário (nome, email, telefone, CPF)
- Toggle de order bumps (adicionar/remover)
- Cálculo de preço total (produto + bumps selecionados) - SEMPRE EM CENTAVOS
- Criação de pedido via Edge Function `create-order`
- Tracking de conversão (Facebook Pixel e Conversions API)

**Uso de Refs**: Utiliza `stateRef` para evitar "Stale Closures" (problema que fazia bumps sumirem)

### useCheckoutTheme
**Localização**: `src/hooks/useCheckoutTheme.ts`

**Responsabilidades**: Aplicar tema CSS ao checkout (cores, fontes, background)

### useCheckoutFormPersistence
**Localização**: `src/hooks/useCheckoutFormPersistence.ts`

**Responsabilidades**: Salvar/recuperar dados do formulário no localStorage

### usePublicCheckoutConfig
**Localização**: `src/hooks/usePublicCheckoutConfig.ts`

**Responsabilidades**: Carregar configuração pública do checkout (função `loadPublicCheckoutData`)

### useFacebookPixelIntegration
**Responsabilidades**: Carregar configuração do Facebook Pixel do vendedor

### useUTMifyIntegration
**Responsabilidades**: Carregar configuração do UTMify e enviar conversões

### useVendorIntegrations
**Responsabilidades**: Gerenciar integrações de terceiros do vendedor

### useAuth
**Localização**: `src/hooks/useAuth.tsx`

**Responsabilidades**: Autenticação de usuários (login, logout, sessão)

### useProduct
**Localização**: `src/hooks/useProduct.tsx`

**Responsabilidades**: Gerenciar produtos (CRUD)

### useDashboardAnalytics
**Responsabilidades**: Carregar analytics do dashboard

---

## Componentes de Pagamento Identificados

### 1. CreditCardFormSecure
**Localização**: `src/components/payment/CreditCardFormSecure.tsx`

**Tipo**: Formulário de cartão de crédito seguro (tokenização manual)

### 2. CreditCardBrick
**Localização**: `src/components/payment/CreditCardBrick.tsx`

**Tipo**: Brick oficial do Mercado Pago (componente pré-construído)

### 3. CustomCardForm
**Localização**: `src/components/payment/CustomCardForm.tsx`

**Tipo**: Formulário customizado de cartão

### 4. CreditCardFormBricks
**Localização**: `src/components/payment/CreditCardFormBricks.tsx`

**Tipo**: Formulário usando Bricks do Mercado Pago

### 5. PixPayment
**Localização**: `src/components/checkout/PixPayment.tsx`

**Tipo**: Componente de pagamento PIX (exibe QR Code)

---

## Integrações Externas Identificadas

### 1. Mercado Pago
- **SDK**: `@mercadopago/sdk-react`
- **Funções**:
  - `mercadopago-create-payment`: Cria pagamento (PIX ou Cartão)
  - `mercadopago-webhook`: Recebe notificações de status
  - `mercadopago-oauth-callback`: Callback de autenticação OAuth

### 2. Facebook Pixel
- **Componente**: `FacebookPixel` (`src/components/FacebookPixel`)
- **Eventos Rastreados**:
  - ViewContent (visualização de checkout)
  - InitiateCheckout (início de checkout)
  - AddToCart (adição de bump)
  - Purchase (compra finalizada)

### 3. Facebook Conversions API
- **Função**: `sendPurchaseToFacebookConversionsAPI` (`src/lib/facebook-conversions-api.ts`)
- **Objetivo**: Tracking server-side para contornar bloqueadores de ads

### 4. UTMify
- **Hook**: `useUTMifyIntegration`
- **Função**: `sendUTMifyConversion` (`src/lib/utmify-helper.ts`)
- **Objetivo**: Rastreamento de conversões e atribuição de UTMs

### 5. PushinPay
- **Serviço**: `src/services/pushinpay.ts`
- **Objetivo**: Gateway PIX alternativo ao Mercado Pago
- **Componente Legal**: `PushinPayLegal` (`src/components/pix/PushinPayLegal.tsx`)

---

## Arquitetura de Segurança Identificada

### 1. Cálculo de Preço Server-Side
- **Frontend**: Envia apenas IDs (product_id, order_bump_ids)
- **Backend**: Busca preços no banco de dados (fonte da verdade)
- **Vantagem**: Impossível manipular preço no cliente

### 2. Validação de Bumps
- **Problema Identificado**: Mismatch de checkout_id impedia validação
- **Solução Temporária**: Validação de checkout_id removida (bump_id já é único)
- **TODO**: Investigar causa raiz

### 3. Autenticação de Edge Functions
- **Service Role Key**: Funções internas usam SUPABASE_SERVICE_ROLE_KEY
- **Internal Secret**: Algumas funções aceitam x-internal-secret adicional
- **RPC Pública**: `get_vendor_public_key` permite acesso anônimo (necessário para checkout público)

### 4. Assinatura HMAC de Webhooks
- **Saída**: Webhooks enviados incluem `X-Rise-Signature` (SHA-256)
- **Entrada**: Validação de assinatura do Mercado Pago (com fallback permissivo)

### 5. Sanitização de HTML
- **Biblioteca**: DOMPurify
- **Uso**: Prevenir XSS em conteúdo customizado

---

## Observações sobre Refatoração

### Padrões Aplicados
1. **Separação de Responsabilidades**: Funções auxiliares (logging, validação, resposta)
2. **Error Handling Centralizado**: Try-catch global em todas as Edge Functions
3. **Logging Estruturado**: Prefixos consistentes, níveis (INFO, WARN, ERROR)
4. **Deduplicação**: Verificação de webhooks/pagamentos duplicados
5. **Timeout Management**: AbortController para prevenir travamentos
6. **Código Limpo**: Comentários numerados, seções delimitadas

### Pontos de Atenção
1. **Validação de Bumps**: Solução temporária pode permitir bumps de outros checkouts
2. **Validação de Assinatura MP**: Fallback permissivo pode ser risco de segurança
3. **Persistência de Formulário**: Dados sensíveis no localStorage (considerar sessionStorage)


---

## Detalhes do Schema do Supabase (Via MCP)

### Projeto Identificado
- **Nome**: rise_community_db
- **ID**: wivbtmtgpsxupfjwwovf
- **Região**: sa-east-1 (São Paulo)
- **Status**: ACTIVE_HEALTHY
- **Versão PostgreSQL**: 17.6.1.021

### Tabelas Principais com Detalhes

#### products (15 registros)
**Colunas Principais**:
- id (UUID, PK)
- name (text, 1-100 chars)
- description (text, max 500 chars, nullable)
- price (numeric, > 0) - **EM REAIS**
- image_url (text, nullable)
- user_id (UUID, FK para auth.users)
- status (enum: active, blocked, deleted) - default: active
- support_name, support_email (text, nullable)
- required_fields (jsonb) - default: {name: true, email: true, phone: false, cpf: false}
- default_payment_method (enum: pix, credit_card) - default: pix

**RLS**: Habilitado

**Relacionamentos**:
- Referenciado por: order_bumps, order_items, outbound_webhooks, webhook_products, orders, offers, coupon_products, affiliates, checkouts

#### checkouts (16 registros)
**Colunas Principais**:
- id (UUID, PK)
- product_id (UUID, FK, nullable)
- name (text)
- slug (text, unique, nullable)
- visits_count (integer, default: 0)
- is_default (boolean, default: false)
- status (enum: active, deleted, draft) - default: active
- design (jsonb) - Configurações globais de estilo
- components (jsonb, default: []) - Array de componentes
- top_components, bottom_components (jsonb, default: [])
- theme (text, default: custom)
- pix_gateway (enum: pushinpay, mercadopago) - default: pushinpay
- credit_card_gateway (enum: mercadopago) - default: mercadopago

**Cores Customizáveis** (50+ campos de cor):
- primary_color, secondary_color, background_color, text_color
- button_color, button_text_color, form_background_color
- selected_payment_color, icon_color, active_text_color
- Cores de botões (selected/unselected): bg, text, icon
- Cores de boxes (selected/unselected): header_bg, header_primary_text, header_secondary_text, bg, primary_text, secondary_text
- Cores de campos de cartão: text, placeholder, border, background, focus_border, focus_text
- payment_button_bg_color, payment_button_text_color

**Imagem de Fundo**:
- background_image_url (text, nullable)
- background_image_fixed, background_image_repeat, background_image_expand (boolean)

**RLS**: Habilitado

**Relacionamentos**:
- FK para products
- Referenciado por: downsells, checkout_links, checkout_visits, order_bumps, upsells, checkout_rows

#### checkout_rows (0 registros)
**Estrutura de Layout**:
- id (UUID, PK)
- checkout_id (UUID, FK)
- row_order (integer)
- layout (enum: single, two-columns, two-columns-asymmetric, three-columns)

**RLS**: Habilitado

#### checkout_components (0 registros)
**Tipos de Componentes**:
- id (UUID, PK)
- row_id (UUID, FK)
- component_order (integer)
- type (enum: text, image, advantage, seal, timer, testimonial)
- content (jsonb, default: {})

**RLS**: Habilitado

#### profiles (7 registros)
**Colunas**:
- id (UUID, PK, FK para auth.users)
- name (text)
- phone (text, nullable)
- cpf_cnpj (text, nullable)
- test_mode_enabled (boolean, default: false)
- test_public_key (text, nullable)
- test_access_token (text, nullable)

**RLS**: Habilitado

**Observação**: Perfis de vendedores com suporte a modo de teste do Mercado Pago

#### user_roles (8 registros)
**Colunas**:
- id (UUID, PK)
- user_id (UUID, FK para auth.users)
- role (enum: admin, user)

**RLS**: Habilitado

---

## Análise de Enums Identificados

### pix_gateway_type
- pushinpay (default)
- mercadopago

### credit_card_gateway_type
- mercadopago (único)

### app_role
- admin
- user

### Status de Produtos
- active (visível)
- blocked (bloqueado)
- deleted (soft delete)

### Status de Checkouts
- active (público)
- deleted (soft delete)
- draft (em construção)

### Tipos de Desconto (Cupons)
- percentage
- fixed

### Layouts de Checkout Rows
- single
- two-columns
- two-columns-asymmetric
- three-columns

### Tipos de Componentes de Checkout
- text
- image
- advantage
- seal
- timer
- testimonial

---

## Observações sobre RLS (Row Level Security)

**Todas as tabelas principais têm RLS habilitado**, indicando uma arquitetura de segurança robusta onde:
- Usuários só podem acessar seus próprios dados
- Políticas de segurança são aplicadas no nível do banco de dados
- Reduz risco de vazamento de dados entre vendedores

