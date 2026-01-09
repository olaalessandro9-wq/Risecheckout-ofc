
-- DADOS FICTÍCIOS PARA MARKETING - REMOVER DEPOIS
-- Usuário: maiconmiranda1528@gmail.com

-- 1. Criar produto
INSERT INTO products (id, name, user_id, status, price, description)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Curso Completo de Marketing Digital',
  'd8095b47-bd91-4e41-925d-b116df22352e',
  'active',
  4700,
  'Curso completo com aulas práticas'
);

-- 2. Inserir 144 vendas (~R$ 65.000, ticket ~R$ 47)
INSERT INTO orders (vendor_id, product_id, product_name, customer_email, customer_name, amount_cents, gateway, status, payment_method, created_at, updated_at, paid_at)
SELECT 
  'd8095b47-bd91-4e41-925d-b116df22352e',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Curso Completo de Marketing Digital',
  'cliente' || n || '@email.com',
  CASE (n % 10)
    WHEN 0 THEN 'João Silva'
    WHEN 1 THEN 'Maria Santos'
    WHEN 2 THEN 'Carlos Oliveira'
    WHEN 3 THEN 'Ana Costa'
    WHEN 4 THEN 'Pedro Lima'
    WHEN 5 THEN 'Fernanda Souza'
    WHEN 6 THEN 'Lucas Martins'
    WHEN 7 THEN 'Juliana Alves'
    WHEN 8 THEN 'Rafael Pereira'
    ELSE 'Camila Rodrigues'
  END,
  CASE 
    WHEN n % 7 = 0 THEN 3900
    WHEN n % 5 = 0 THEN 5700
    ELSE 4700
  END,
  'mercadopago',
  CASE WHEN n % 12 = 0 THEN 'pending' ELSE 'paid' END,
  CASE WHEN n % 3 = 0 THEN 'credit_card' ELSE 'pix' END,
  NOW() - (30 - (n / 5))::int * INTERVAL '1 day' + (8 + (n % 12))::int * INTERVAL '1 hour',
  NOW() - (30 - (n / 5))::int * INTERVAL '1 day' + (8 + (n % 12))::int * INTERVAL '1 hour',
  CASE WHEN n % 12 = 0 THEN NULL ELSE NOW() - (30 - (n / 5))::int * INTERVAL '1 day' + (8 + (n % 12))::int * INTERVAL '1 hour' END
FROM generate_series(1, 140) AS n;
