# Relatório de Incidente e Análise Final: Falha no Disparo de Webhooks

**Data:** 25 de Novembro de 2025  
**Autor:** Manus AI  
**Status:** 🔴 **CRÍTICO - Sistema Inoperante**

## 1. Resumo Executivo

Este relatório documenta a investigação sobre a falha contínua no disparo de webhooks após a implementação de múltiplas correções de segurança e bugs. Apesar de termos corrigido com sucesso a manipulação de preço, credenciais hardcoded e duplicação de webhooks, o sistema **parou de funcionar completamente**.

**Descoberta Principal:** A função `mercadopago-create-payment` (v94), que contém todas as correções, **não está sendo executada**. O frontend está chamando uma versão antiga ou a função está falhando silenciosamente.

**Impacto:** Nenhum pagamento é processado, e nenhum webhook é disparado. O sistema está **inoperante**.

## 2. Histórico do Incidente

| Data/Hora | Ação | Resultado |
| :--- | :--- | :--- |
| 25/11 11:50 | Identificamos 2 vulnerabilidades críticas (preço e credenciais) | Plano de ação criado |
| 25/11 11:55 | Implementamos correções de segurança (v91) | Deploy realizado |
| 25/11 11:58 | Teste falhou (nenhum webhook) | Investigação iniciada |
| 25/11 12:01 | Identificamos erro de `total_amount` e ordem de sanitização | Correção implementada (v94) |
| 25/11 12:03 | Teste final falhou (nenhum webhook) | Investigação aprofundada |

## 3. Análise da Causa Raiz

**Evidências Coletadas:**

1.  **Pedidos no Banco:**
    - O último pedido (`1ed9169d...`) foi criado em **17:02:13** com status **"pending"**.
    - O `gateway_payment_id` está **nulo**, indicando que a API do Mercado Pago não foi chamada.

2.  **Itens do Pedido:**
    - Apenas o produto principal foi salvo na tabela `order_items`.
    - Isso confirma que a função `create-order` funcionou, mas a `mercadopago-create-payment` falhou antes de salvar os bumps.

3.  **Logs das Edge Functions:**
    - **Nenhum log da versão v94** foi encontrado nos últimos 30 minutos.
    - As últimas chamadas bem-sucedidas foram para versões antigas (v87, v88, v90, v92).

**Conclusão Definitiva:**

A função `mercadopago-create-payment` v94 **NÃO ESTÁ SENDO EXECUTADA**. O problema não é mais de lógica de negócio (race condition, duplicação), mas sim um **problema de infraestrutura ou de deploy**.

## 4. Hipóteses

| # | Hipótese | Probabilidade | Análise |
| :- | :--- | :--- | :--- |
| 1 | **Erro de Sintaxe na v94** | 🔴 **Alta** | Um erro de sintaxe (ex: `const` redeclarado, `await` faltando) pode fazer a função falhar no momento do deploy ou da execução, sem gerar logs claros. |
| 2 | **Cache Agressivo** | 🟡 **Média** | O navegador ou o CDN do Supabase podem estar servindo uma versão antiga do código do frontend, que chama uma versão antiga da função. |
| 3 | **Problema no Deploy** | 🟡 **Média** | O deploy da v94 pode ter falhado silenciosamente, deixando a v92 como a versão "ativa" mesmo que o MCP tenha retornado sucesso. |

## 5. Plano de Ação Recomendado

**Prioridade Máxima:** Restaurar a funcionalidade do sistema.

### Ação #1: Revisão Manual e Deploy Simplificado (15 min)

1.  **Revisar o código da v94** linha por linha em busca de erros de sintaxe óbvios.
2.  **Criar uma versão v95 simplificada**, removendo temporariamente a lógica de cálculo de preço e usando um valor fixo (ex: `finalAmount = 1.00`).
3.  **Fazer deploy da v95** e testar. Se funcionar, sabemos que o problema está na lógica de cálculo de preço.

### Ação #2: Adicionar Logs de Debug Extremos (30 min)

1.  Adicionar `console.log` no **início absoluto** da função `mercadopago-create-payment` para confirmar que ela está sendo chamada.
2.  Adicionar `console.log` antes e depois de cada bloco `await` para identificar exatamente onde a função para.
3.  Envolver todo o código em um `try...catch` gigante para capturar qualquer erro não tratado.

### Ação #3: Validar o Frontend (Paralelo)

1.  Pedir ao desenvolvedor frontend para **limpar o cache do navegador** e testar novamente.
2.  Verificar o código do `PublicCheckout.tsx` para garantir que a chamada ao `invoke` está correta e sem o `body`.

## 6. Questões para o Gemini

1.  **Análise de Código:** Você consegue identificar algum erro de sintaxe ou lógico no código da v94 que possa estar causando a falha silenciosa?
2.  **Estratégia de Debug:** Qual seria a forma mais eficiente de debugar uma Edge Function do Supabase que parece não estar sendo executada, mesmo com o deploy retornando sucesso?
3.  **Hipótese Alternativa:** Existe alguma outra causa provável para este comportamento que não consideramos?

---

## Anexo: Código da Versão v94 (Com Falha)

```typescript
// CÓDIGO COMPLETO DA v94 AQUI...
```

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PaymentRequest {
  orderId: string
  // amount: number // REMOVIDO: Não aceitamos valor do frontend (SEGURANÇA)
  payerEmail: string
  payerName?: string
  payerDocument?: string
  payerPhone?: string
  paymentMethod: 'pix' | 'credit_card'
  token?: string
  installments?: number
  deviceId?: string
  items?: any[] // IDs dos itens para verificação
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Recebemos os dados, IGNORANDO o 'amount' que vem do frontend
    const {
      orderId,
      payerEmail,
      payerName,
      payerDocument,
      payerPhone,
      paymentMethod,
      token,
      installments,
      deviceId,
      items
    }: PaymentRequest = await req.json()

    console.log(`[MP] Iniciando Pagamento Seguro. Order: ${orderId}, Método: ${paymentMethod}`);

    // 1. Buscar Pedido e Produto Principal no Banco
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select('*, products(*)')
      .eq('id', orderId)
      .single()

    if (orderError || !order) throw new Error('Pedido não encontrado');
    
    const vendorId = order.vendor_id;

    // 2. CÁLCULO DE PREÇO BLINDADO (Server-Side)
    let calculatedTotalCents = 0;
    let finalItemsList = [];

    // 2.1 Adicionar Preço do Produto Principal
    if (!order.products) throw new Error('Produto principal não encontrado');
    
    // Assumindo que products.price está em centavos (numeric)
    const mainProductPriceCents = Math.round(Number(order.products.price));
    calculatedTotalCents += mainProductPriceCents;
    
    finalItemsList.push({
        id: order.products.id,
        title: order.products.name,
        description: order.products.description || 'Produto Digital',
        quantity: 1,
        unit_price: mainProductPriceCents / 100,
        category_id: 'digital_goods'
    });

    console.log(`[MP] Produto Principal: ${order.products.name} - R$ ${(mainProductPriceCents / 100).toFixed(2)}`);

    // 2.2 Somar Order Bumps (Se houver)
    if (items && items.length > 0) {
        // Filtra apenas os que são Bumps (ID diferente do principal)
        const bumpIds = items
            .filter((i: any) => i.id !== order.products.id)
            .map((i: any) => i.id);
            
        if (bumpIds.length > 0) {
            console.log(`[MP] Buscando ${bumpIds.length} bumps no banco...`);
            
            // Busca os preços REAIS desses bumps no banco
            const { data: bumpsDb, error: bumpsError } = await supabaseClient
                .from('products')
                .select('id, name, price, description')
                .in('id', bumpIds);
                
            if (!bumpsError && bumpsDb) {
                bumpsDb.forEach((bump: any) => {
                    const bumpPriceCents = Math.round(Number(bump.price));
                    calculatedTotalCents += bumpPriceCents;
                    
                    finalItemsList.push({
                        id: bump.id,
                        title: bump.name,
                        description: bump.description || 'Order Bump',
                        quantity: 1,
                        unit_price: bumpPriceCents / 100,
                        category_id: 'digital_goods'
                    });
                    
                    console.log(`[MP] Bump: ${bump.name} - R$ ${(bumpPriceCents / 100).toFixed(2)}`);
                });
            }
        }
    }

    const finalAmount = calculatedTotalCents / 100;
    console.log(`[MP] 💰 VALOR TOTAL CALCULADO NO SERVIDOR: R$ ${finalAmount.toFixed(2)}`);

    // 3. SANITIZAÇÃO: Salvar itens ANTES de chamar MP (evita race condition)
    console.log('[MP] Salvando itens no banco ANTES de chamar MP...');
    await supabaseClient.from('order_items').delete().eq('order_id', orderId);
    
    const itemsToSave = finalItemsList.map(item => ({
        order_id: orderId,
        product_id: item.id,
        product_name: item.title,
        amount_cents: Math.round(item.unit_price * 100),
        quantity: 1,
        is_bump: item.id !== order.product_id
    }));
    
    await supabaseClient.from('order_items').insert(itemsToSave);
    console.log(`[MP] ✅ ${itemsToSave.length} itens salvos no banco.`);

    // 4. Buscar Credenciais
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('test_mode_enabled, test_public_key, test_access_token')
      .eq('id', vendorId)
      .single()

    const testModeEnabled = profile?.test_mode_enabled || false
    let accessToken: string

    if (testModeEnabled && profile?.test_access_token) {
      accessToken = profile.test_access_token;
      console.log('[MP] Usando credenciais de TESTE');
    } else {
      const { data: integration } = await supabaseClient
        .from('vendor_integrations')
        .select('config')
        .eq('vendor_id', vendorId)
        .eq('integration_type', 'MERCADOPAGO')
        .eq('active', true)
        .single();
        
      if (!integration) throw new Error('Mercado Pago não configurado');
      const config = integration.config as any;
      accessToken = config.access_token;
      console.log('[MP] Usando credenciais de PRODUÇÃO');
    }

    // 4. Montar Payload com Valor Seguro
    const paymentData: any = {
      transaction_amount: finalAmount, // USA O VALOR CALCULADO, NÃO O DO FRONTEND
      description: `Pedido #${orderId.slice(0, 8)}`,
      payment_method_id: paymentMethod === 'pix' ? 'pix' : 'credit_card',
      payer: {
        email: payerEmail,
        ...(payerName && {
          first_name: payerName.split(' ')[0],
          last_name: payerName.split(' ').slice(1).join(' ') || undefined,
        }),
        ...(payerDocument && {
          identification: {
            type: payerDocument.length === 11 ? 'CPF' : 'CNPJ',
            number: payerDocument
          }
        })
      },
      external_reference: orderId,
      notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mercadopago-webhook`,
      additional_info: {
        items: finalItemsList
      }
    }

    if (paymentMethod === 'credit_card') {
      if (!token) throw new Error('Token do cartão é obrigatório');
      paymentData.token = token;
      paymentData.installments = installments || 1;
      paymentData.statement_descriptor = 'RISECHECKOUT';
      delete paymentData.payment_method_id;
    }

    // 5. Enviar para Mercado Pago
    console.log('[MP] Enviando para API do Mercado Pago...');
    const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'X-Idempotency-Key': orderId,
      },
      body: JSON.stringify(paymentData),
    });

    const mpData = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error('[MP] Erro API:', JSON.stringify(mpData, null, 2));
      throw new Error(`Mercado Pago API Error: ${mpData.message || 'Unknown error'}`);
    }

    console.log(`[MP] ✅ Pagamento criado. ID: ${mpData.id}, Status: ${mpData.status}`);

    // 6. Atualizar Pedido (itens já foram salvos antes)
    const updateData: any = {
        gateway: 'MERCADOPAGO',
        gateway_payment_id: mpData.id.toString(),
        status: mpData.status === 'approved' ? 'PAID' : order.status,
        payment_method: paymentMethod.toUpperCase(),
        updated_at: new Date().toISOString(),
        total_amount: finalAmount // Salva o valor real cobrado em REAIS
    };

    if (paymentMethod === 'pix' && mpData.point_of_interaction) {
      updateData.pix_qr_code = mpData.point_of_interaction.transaction_data.qr_code;
      updateData.pix_id = mpData.id.toString();
      updateData.pix_status = mpData.status;
      updateData.pix_created_at = new Date().toISOString();
    }

    await supabaseClient.from('orders').update(updateData).eq('id', orderId);

    // 8. Retorno
    const response: any = {
      success: true,
      paymentId: mpData.id,
      status: mpData.status,
      statusDetail: mpData.status_detail,
    }

    if (paymentMethod === 'pix' && mpData.point_of_interaction) {
      response.pix = {
        qrCode: mpData.point_of_interaction.transaction_data.qr_code,
        qrCodeBase64: mpData.point_of_interaction.transaction_data.qr_code_base64,
        ticketUrl: mpData.point_of_interaction.transaction_data.ticket_url,
      }
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('[MP] Erro Fatal:', error instanceof Error ? error.message : 'Erro desconhecido');
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

```
