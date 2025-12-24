# Análise das Tabelas do Supabase - RiseCheckout

## Tabelas Principais Identificadas

### 1. **products** (15 registros)
Tabela central do sistema que armazena os produtos.

**Campos principais:**
- `id` (uuid, PK)
- `name`, `description`, `price`, `image_url`
- `user_id` (FK para auth.users)
- `status` (active, blocked, deleted)
- `support_name`, `support_email`
- `required_fields` (jsonb) - campos obrigatórios no checkout
- `default_payment_method` (pix, credit_card)
- `created_at`, `updated_at`

**Relacionamentos:**
- Relaciona-se com: offers, coupons, order_items, checkouts, affiliates, outbound_webhooks, webhook_products, order_bumps, orders

---

### 2. **checkouts** (16 registros)
Armazena as páginas de checkout personalizadas.

**Campos principais:**
- `id` (uuid, PK)
- `product_id` (FK para products)
- `name`, `slug` (único)
- `status` (active, deleted, draft)
- `is_default` (boolean)
- `visits_count` (integer)
- `design` (jsonb) - configurações de estilo global
- `components` (jsonb) - array de componentes
- `top_components`, `bottom_components` (jsonb)
- Múltiplas cores customizáveis (primary_color, secondary_color, etc.)
- `pix_gateway` (pushinpay, mercadopago)
- `credit_card_gateway` (mercadopago)
- Configurações de cores para campos de cartão de crédito

**Relacionamentos:**
- Relaciona-se com: orders, checkout_links, checkout_visits, order_bumps, downsells, upsells, checkout_rows

---

### 3. **checkout_rows** (0 registros)
Sistema de layout em linhas para componentes do checkout.

**Campos:**
- `id` (uuid, PK)
- `checkout_id` (FK)
- `row_order` (integer)
- `layout` (single, two-columns, two-columns-asymmetric, three-columns)

---

### 4. **checkout_components** (0 registros)
Componentes individuais dentro das linhas do checkout.

**Campos:**
- `id` (uuid, PK)
- `row_id` (FK)
- `component_order` (integer)
- `type` (text, image, advantage, seal, timer, testimonial)
- `content` (jsonb)

---

### 5. **coupons** (0 registros)
Sistema de cupons de desconto.

**Campos:**
- `id` (uuid, PK)
- `code` (text, único)
- `discount_type` (percentage, fixed)
- `discount_value` (numeric)
- `max_uses`, `uses_count`
- `active` (boolean)
- `expires_at`

---

### 6. **profiles** (7 registros)
Perfis de usuários do sistema.

**Campos:**
- `id` (uuid, PK, FK para auth.users)
- `name`, `phone`, `cpf_cnpj`
- `test_mode_enabled` (boolean)
- `test_public_key`, `test_access_token`

---

### 7. **user_roles** (8 registros)
Controle de permissões.

**Campos:**
- `id` (uuid, PK)
- `user_id` (FK)
- `role` (admin, user)

---

### 8. **affiliates** (0 registros)
Sistema de afiliados.

**Campos:**
- `id` (uuid, PK)
- `product_id` (FK)
- `name`, `email`
- `commission_percentage`
- `code` (único)
- `active`

---

## Observações Importantes

1. **Sistema de Customização Avançado**: O checkout possui um sistema robusto de customização com cores específicas para cada estado (selecionado/não selecionado) de botões e boxes.

2. **Multi-Gateway**: Suporte para múltiplos gateways de pagamento:
   - PIX: PushinPay, MercadoPago
   - Cartão de Crédito: MercadoPago

3. **Sistema de Componentes**: Arquitetura baseada em linhas e componentes (checkout_rows, checkout_components) para construção flexível de páginas.

4. **Modo de Teste**: Sistema possui suporte para modo de teste com chaves separadas.

5. **RLS Habilitado**: Todas as tabelas têm Row Level Security habilitado.

6. **Soft Delete**: Uso de status 'deleted' ao invés de exclusão física.
