
-- LIMPAR DADOS ANTERIORES E INSERIR NOVOS
DELETE FROM orders WHERE product_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
DELETE FROM products WHERE id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

-- Recriar produto
INSERT INTO products (id, name, user_id, status, price, description)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Curso Completo de Marketing Digital',
  'd8095b47-bd91-4e41-925d-b116df22352e',
  'active',
  4700,
  'Curso completo com aulas práticas'
);

-- Inserir vendas com valores variados para ticket médio de R$ 51,30
-- Total: ~1272 vendas para atingir ~R$ 65.253,92 (ticket = 51,30)

-- Grupo 1: 500 vendas de R$ 47,00
INSERT INTO orders (vendor_id, product_id, product_name, customer_email, customer_name, amount_cents, gateway, status, payment_method, created_at, updated_at, paid_at)
SELECT 
  'd8095b47-bd91-4e41-925d-b116df22352e',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Curso Completo de Marketing Digital',
  'cliente' || n || '@gmail.com',
  (ARRAY['João Silva','Maria Santos','Carlos Oliveira','Ana Costa','Pedro Lima','Fernanda Souza','Lucas Martins','Juliana Alves','Rafael Pereira','Camila Rodrigues','Bruno Ferreira','Larissa Gomes','Thiago Cardoso','Amanda Ribeiro','Gustavo Mendes'])[1 + (n % 15)],
  4700,
  'mercadopago',
  CASE WHEN n % 15 = 0 THEN 'pending' ELSE 'paid' END,
  CASE WHEN n % 3 = 0 THEN 'credit_card' ELSE 'pix' END,
  NOW() - ((30 - (n * 30 / 500))::int * INTERVAL '1 day') + ((8 + (n % 14))::int * INTERVAL '1 hour') + ((n % 59)::int * INTERVAL '1 minute'),
  NOW() - ((30 - (n * 30 / 500))::int * INTERVAL '1 day') + ((8 + (n % 14))::int * INTERVAL '1 hour') + ((n % 59)::int * INTERVAL '1 minute'),
  CASE WHEN n % 15 = 0 THEN NULL ELSE NOW() - ((30 - (n * 30 / 500))::int * INTERVAL '1 day') + ((8 + (n % 14))::int * INTERVAL '1 hour') + ((n % 59)::int * INTERVAL '1 minute') END
FROM generate_series(1, 500) AS n;

-- Grupo 2: 400 vendas de R$ 57,00
INSERT INTO orders (vendor_id, product_id, product_name, customer_email, customer_name, amount_cents, gateway, status, payment_method, created_at, updated_at, paid_at)
SELECT 
  'd8095b47-bd91-4e41-925d-b116df22352e',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Curso Completo de Marketing Digital',
  'user' || (500 + n) || '@hotmail.com',
  (ARRAY['Patricia Nunes','Ricardo Barros','Vanessa Campos','Eduardo Dias','Isabela Moreira','Felipe Castro','Carla Teixeira','Marcos Araújo','Renata Freitas','André Barbosa','Gabriela Pinto','Vinícius Rocha','Letícia Carvalho','Roberto Monteiro','Daniela Vieira'])[1 + (n % 15)],
  5700,
  'mercadopago',
  CASE WHEN n % 18 = 0 THEN 'pending' ELSE 'paid' END,
  CASE WHEN n % 4 = 0 THEN 'credit_card' ELSE 'pix' END,
  NOW() - ((30 - (n * 30 / 400))::int * INTERVAL '1 day') + ((9 + (n % 13))::int * INTERVAL '1 hour') + ((n % 47)::int * INTERVAL '1 minute'),
  NOW() - ((30 - (n * 30 / 400))::int * INTERVAL '1 day') + ((9 + (n % 13))::int * INTERVAL '1 hour') + ((n % 47)::int * INTERVAL '1 minute'),
  CASE WHEN n % 18 = 0 THEN NULL ELSE NOW() - ((30 - (n * 30 / 400))::int * INTERVAL '1 day') + ((9 + (n % 13))::int * INTERVAL '1 hour') + ((n % 47)::int * INTERVAL '1 minute') END
FROM generate_series(1, 400) AS n;

-- Grupo 3: 200 vendas de R$ 39,00 (promoção)
INSERT INTO orders (vendor_id, product_id, product_name, customer_email, customer_name, amount_cents, gateway, status, payment_method, created_at, updated_at, paid_at)
SELECT 
  'd8095b47-bd91-4e41-925d-b116df22352e',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Curso Completo de Marketing Digital',
  'comprador' || (900 + n) || '@yahoo.com',
  (ARRAY['Márcio Lopes','Tatiane Borges','Leandro Farias','Priscila Santana','Henrique Melo','Sabrina Correia','Rodrigo Azevedo','Aline Nascimento','Diego Ramos','Bianca Cunha'])[1 + (n % 10)],
  3900,
  'mercadopago',
  CASE WHEN n % 12 = 0 THEN 'pending' ELSE 'paid' END,
  'pix',
  NOW() - ((30 - (n * 30 / 200))::int * INTERVAL '1 day') + ((10 + (n % 12))::int * INTERVAL '1 hour') + ((n % 37)::int * INTERVAL '1 minute'),
  NOW() - ((30 - (n * 30 / 200))::int * INTERVAL '1 day') + ((10 + (n % 12))::int * INTERVAL '1 hour') + ((n % 37)::int * INTERVAL '1 minute'),
  CASE WHEN n % 12 = 0 THEN NULL ELSE NOW() - ((30 - (n * 30 / 200))::int * INTERVAL '1 day') + ((10 + (n % 12))::int * INTERVAL '1 hour') + ((n % 37)::int * INTERVAL '1 minute') END
FROM generate_series(1, 200) AS n;

-- Grupo 4: 100 vendas de R$ 67,00 (pacote premium)
INSERT INTO orders (vendor_id, product_id, product_name, customer_email, customer_name, amount_cents, gateway, status, payment_method, created_at, updated_at, paid_at)
SELECT 
  'd8095b47-bd91-4e41-925d-b116df22352e',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Curso Completo de Marketing Digital',
  'premium' || (1100 + n) || '@outlook.com',
  (ARRAY['Fábio Miranda','Natália Duarte','Sérgio Machado','Elaine Vasconcelos','Paulo Andrade','Cristina Sales','Wagner Pires','Simone Braga','Alessandro Xavier','Mônica Rezende'])[1 + (n % 10)],
  6700,
  'mercadopago',
  CASE WHEN n % 20 = 0 THEN 'pending' ELSE 'paid' END,
  'credit_card',
  NOW() - ((30 - (n * 30 / 100))::int * INTERVAL '1 day') + ((11 + (n % 11))::int * INTERVAL '1 hour') + ((n % 53)::int * INTERVAL '1 minute'),
  NOW() - ((30 - (n * 30 / 100))::int * INTERVAL '1 day') + ((11 + (n % 11))::int * INTERVAL '1 hour') + ((n % 53)::int * INTERVAL '1 minute'),
  CASE WHEN n % 20 = 0 THEN NULL ELSE NOW() - ((30 - (n * 30 / 100))::int * INTERVAL '1 day') + ((11 + (n % 11))::int * INTERVAL '1 hour') + ((n % 53)::int * INTERVAL '1 minute') END
FROM generate_series(1, 100) AS n;

-- Grupo 5: 72 vendas de R$ 61,86 (para ajustar ticket médio exato)
INSERT INTO orders (vendor_id, product_id, product_name, customer_email, customer_name, amount_cents, gateway, status, payment_method, created_at, updated_at, paid_at)
SELECT 
  'd8095b47-bd91-4e41-925d-b116df22352e',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Curso Completo de Marketing Digital',
  'special' || (1200 + n) || '@gmail.com',
  (ARRAY['Cláudio Fontes','Adriana Queiroz','Rogério Batista','Verônica Leal','Milton Godoy','Luciana Paiva'])[1 + (n % 6)],
  6186,
  'mercadopago',
  'paid',
  CASE WHEN n % 2 = 0 THEN 'credit_card' ELSE 'pix' END,
  NOW() - ((30 - (n * 30 / 72))::int * INTERVAL '1 day') + ((12 + (n % 10))::int * INTERVAL '1 hour') + ((n % 41)::int * INTERVAL '1 minute'),
  NOW() - ((30 - (n * 30 / 72))::int * INTERVAL '1 day') + ((12 + (n % 10))::int * INTERVAL '1 hour') + ((n % 41)::int * INTERVAL '1 minute'),
  NOW() - ((30 - (n * 30 / 72))::int * INTERVAL '1 day') + ((12 + (n % 10))::int * INTERVAL '1 hour') + ((n % 41)::int * INTERVAL '1 minute')
FROM generate_series(1, 72) AS n;
