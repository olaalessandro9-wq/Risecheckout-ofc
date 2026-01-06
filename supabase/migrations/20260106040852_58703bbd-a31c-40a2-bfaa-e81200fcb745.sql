
-- Dados de demonstração temporários para screenshot
-- IMPORTANTE: Deletar depois com: DELETE FROM orders WHERE customer_email = 'demo_screenshot@temp.fake';

-- Orders PAID: 400 x R$29,90 + 500 x R$47,90 + 200 x R$67,90 + 50 x R$97,90 = R$ 54.385
-- Orders PENDING: 146 x R$47,90 = R$ 6.993,40 (≈R$ 7.000)
-- Ticket médio PAID: R$ 54.385 / 1.150 = R$ 47,29 (próximo de R$ 47,90)

-- 400 orders de R$ 29,90
INSERT INTO orders (vendor_id, product_id, amount_cents, status, gateway, customer_email, customer_name, paid_at, created_at)
SELECT 
  '63f041b6-8890-4625-bac9-5f7bb7dd410a'::uuid,
  'd66d30bf-6aa4-4e33-a0ce-d96afe3694aa'::uuid,
  2990,
  'PAID',
  'pushinpay',
  'demo_screenshot@temp.fake',
  'Demo User ' || gs,
  NOW() - (gs * interval '1 hour'),
  NOW() - (gs * interval '1 hour')
FROM generate_series(1, 400) gs;

-- 500 orders de R$ 47,90
INSERT INTO orders (vendor_id, product_id, amount_cents, status, gateway, customer_email, customer_name, paid_at, created_at)
SELECT 
  '63f041b6-8890-4625-bac9-5f7bb7dd410a'::uuid,
  'd66d30bf-6aa4-4e33-a0ce-d96afe3694aa'::uuid,
  4790,
  'PAID',
  'pushinpay',
  'demo_screenshot@temp.fake',
  'Demo User ' || (400 + gs),
  NOW() - ((gs * 0.7) * interval '1 hour'),
  NOW() - ((gs * 0.7) * interval '1 hour')
FROM generate_series(1, 500) gs;

-- 200 orders de R$ 67,90
INSERT INTO orders (vendor_id, product_id, amount_cents, status, gateway, customer_email, customer_name, paid_at, created_at)
SELECT 
  '63f041b6-8890-4625-bac9-5f7bb7dd410a'::uuid,
  'd66d30bf-6aa4-4e33-a0ce-d96afe3694aa'::uuid,
  6790,
  'PAID',
  'pushinpay',
  'demo_screenshot@temp.fake',
  'Demo User ' || (900 + gs),
  NOW() - ((gs * 2) * interval '1 hour'),
  NOW() - ((gs * 2) * interval '1 hour')
FROM generate_series(1, 200) gs;

-- 50 orders de R$ 97,90
INSERT INTO orders (vendor_id, product_id, amount_cents, status, gateway, customer_email, customer_name, paid_at, created_at)
SELECT 
  '63f041b6-8890-4625-bac9-5f7bb7dd410a'::uuid,
  'd66d30bf-6aa4-4e33-a0ce-d96afe3694aa'::uuid,
  9790,
  'PAID',
  'pushinpay',
  'demo_screenshot@temp.fake',
  'Demo User ' || (1100 + gs),
  NOW() - ((gs * 5) * interval '1 hour'),
  NOW() - ((gs * 5) * interval '1 hour')
FROM generate_series(1, 50) gs;

-- 146 orders PENDING de R$ 47,90 (≈R$ 7.000)
INSERT INTO orders (vendor_id, product_id, amount_cents, status, gateway, customer_email, customer_name, created_at)
SELECT 
  '63f041b6-8890-4625-bac9-5f7bb7dd410a'::uuid,
  'd66d30bf-6aa4-4e33-a0ce-d96afe3694aa'::uuid,
  4790,
  'pending',
  'pushinpay',
  'demo_screenshot@temp.fake',
  'Demo Pending ' || gs,
  NOW() - ((gs * 0.5) * interval '1 hour')
FROM generate_series(1, 146) gs;
