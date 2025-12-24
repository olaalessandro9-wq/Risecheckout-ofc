import { assertEquals, assertExists } from "https://deno.land/std@0.192.0/testing/asserts.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

Deno.test({
  name: "create-order: Deve criar um pedido com sucesso",
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Payload de teste com formato correto
  const payload = {
    product_id: "dc29b022-5dff-4175-9228-6a0449523707", // Produto real do banco
    checkout_id: "1e1bb5ef-451f-4260-b7b5-7abd514691a0", // Checkout real do banco
    customer_name: "Teste Cliente",
    customer_email: "teste@example.com",
    customer_phone: "11999999999",
    customer_cpf: "12345678900",
    gateway: "MERCADOPAGO",
    payment_method: "credit_card"
  };

  // Chamar a Edge Function
  const response = await fetch(`${supabaseUrl}/functions/v1/create-order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'Origin': 'http://localhost:5173' // Adicionar origin para passar validação CORS
    },
    body: JSON.stringify(payload)
  });

  // Consumir o body para evitar leak
  const data = await response.json();
  
  // Validações
  console.log("Response status:", response.status);
  console.log("Response data:", data);
  
  assertEquals(response.status, 200);
  assertExists(data.order_id);
  assertEquals(data.success, true);
  }
});

Deno.test("create-order: Deve retornar 400 para payload inválido", async () => {
  const payload = {
    // Payload inválido (faltando campos obrigatórios como product_id)
    customer_name: "Teste"
  };

  const response = await fetch(`${supabaseUrl}/functions/v1/create-order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'Origin': 'http://localhost:5173'
    },
    body: JSON.stringify(payload)
  });

  // Consumir o body para evitar leak
  const data = await response.json();
  console.log("Error response:", data);

  assertEquals(response.status, 400);
});
