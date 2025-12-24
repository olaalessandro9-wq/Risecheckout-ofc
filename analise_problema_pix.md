# Análise do Problema: Erro na Geração de PIX

## Situação Atual

**Sintoma**: Mensagem de erro no frontend ao gerar PIX, porém o PIX está sendo criado corretamente (webhook dispara, QR Code é gerado).

**Diagnóstico da IA Superior**: O erro ocorre na tentativa de chamar a Edge Function `get-order-for-pix`, que retorna erro 500.

## Investigação Realizada

### 1. Edge Function `get-order-for-pix` EXISTE no Supabase

Confirmado via MCP CLI:
- **Status**: ACTIVE
- **Versão**: 110
- **ID**: 49952366-d2ee-44b4-beb9-04219424b7d6
- **Última atualização**: 1762899057293

### 2. Código da Edge Function

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const { orderId } = await req.json();
    
    if (!orderId) {
      return new Response(JSON.stringify({ error: "orderId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    
    // Criar cliente Supabase com service_role para bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    
    // Buscar pedido
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("*, product:products(*)")
      .eq("id", orderId)
      .single();
    
    if (error) {
      console.error("[get-order-for-pix] Erro ao buscar pedido:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    
    return new Response(JSON.stringify({ order }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("[get-order-for-pix] Erro:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
```

### 3. Código Atual do Frontend (`MercadoPagoPayment.tsx`)

**IMPORTANTE**: O código atual JÁ FOI CORRIGIDO!

Linhas 26-54 mostram que a função `fetchOrderData` já faz busca direta no banco:

```typescript
const fetchOrderData = useCallback(async (retryCount = 0) => {
  try {
    console.log(`[MercadoPagoPayment] Buscando pedido (tentativa ${retryCount + 1}):`, orderId);
    
    // Busca direta na tabela orders (sem Edge Function)
    const { data: order, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (error || !order) {
      // Retry logic...
    }
    
    setOrderData(order);
  } catch (err: any) {
    console.error("[MercadoPagoPayment] Erro ao buscar pedido:", err);
    toast.error("Erro ao carregar dados do pedido");
  }
}, [orderId]);
```

**NÃO HÁ CHAMADA para `get-order-for-pix` no código atual!**

## Conclusão da Investigação

### Possíveis Causas do Erro

1. **Cache do Navegador**: O erro pode estar sendo exibido a partir de uma versão antiga em cache.
2. **Build Desatualizado**: O código em produção pode não estar refletindo a última versão do repositório.
3. **Outro Arquivo**: Pode haver outro arquivo (como `PixPaymentPage.tsx`) que ainda chama a função.

### Próximos Passos

1. Verificar se existe outro arquivo que chama `get-order-for-pix`
2. Verificar o arquivo `PixPaymentPage.tsx`
3. Verificar se o build em produção está atualizado
