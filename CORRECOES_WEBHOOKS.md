# Correções Implementadas no Sistema de Webhooks

## Data: 24 de Novembro de 2025

## Resumo das Alterações

Foram implementadas duas correções críticas no sistema de webhooks para resolver problemas que impediam o funcionamento correto tanto em ambiente de produção quanto em sandbox.

---

## Correção 1: Criação da Função `trigger-webhooks`

### Problema Identificado
A função `mercadopago-webhook` tentava chamar uma função chamada `trigger-webhooks` que não existia no repositório do GitHub, causando falha no fluxo de disparo de webhooks.

### Solução Implementada
Criada a função `trigger-webhooks` em `/supabase/functions/trigger-webhooks/index.ts` com as seguintes responsabilidades:

1. **Autenticação:** Valida que a chamada vem de uma função interna usando service_role key
2. **Busca de Webhooks:** Consulta a tabela `outbound_webhooks` para encontrar todos os webhooks cadastrados para o evento específico
3. **Montagem de Payload:** Cria um payload padronizado com informações do pedido, cliente e pagamento
4. **Disparo em Paralelo:** Chama a função `dispatch-webhook` para cada webhook encontrado
5. **Relatório de Resultados:** Retorna quantos webhooks foram disparados e quantos tiveram sucesso

### Fluxo Implementado
```
trigger-webhooks (recebe order_id + event_type)
    ↓
Busca pedido no banco de dados
    ↓
Busca webhooks cadastrados para o vendor_id e event_type
    ↓
Para cada webhook encontrado:
    ↓
Chama dispatch-webhook (que envia para a URL do cliente)
    ↓
Retorna resultado consolidado
```

### Código-Chave
```typescript
// Buscar webhooks cadastrados para este vendedor e evento
const { data: webhooks } = await supabase
  .from("outbound_webhooks")
  .select("*")
  .eq("vendor_id", vendorId)
  .eq("active", true)
  .contains("events", [event_type]);

// Disparar cada webhook em paralelo
const dispatchPromises = webhooks.map(async (webhook) => {
  const dispatchResponse = await fetch(
    `${Deno.env.get("SUPABASE_URL")}/functions/v1/dispatch-webhook`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      },
      body: JSON.stringify({
        webhook_id: webhook.id,
        webhook_url: webhook.url,
        order_id: order.id,
        event_type: event_type,
        payload: payload,
      }),
    }
  );
  // ...
});
```

---

## Correção 2: Suporte a Credenciais de Teste em `mercadopago-webhook`

### Problema Identificado
A função `mercadopago-webhook` estava codificada para buscar credenciais **apenas** na tabela `vendor_integrations` (credenciais de produção via OAuth). Isso ignorava completamente as credenciais de teste armazenadas na tabela `profiles`, impedindo o funcionamento em ambiente sandbox.

### Solução Implementada
Refatorada a lógica de busca de credenciais para seguir uma estratégia híbrida:

1. **Primeiro:** Verifica se o modo teste está ativo em `profiles.test_mode_enabled`
2. **Se sim:** Usa `profiles.test_access_token` (credenciais de sandbox)
3. **Se não:** Busca em `vendor_integrations` (credenciais de produção OAuth)

### Código Antes (Problemático)
```typescript
// Buscar credenciais do Mercado Pago
const { data: integration, error: integrationError } = await supabaseClient
  .from('vendor_integrations')
  .select('*')
  .eq('vendor_id', vendorId)
  .eq('integration_type', 'MERCADOPAGO')
  .eq('active', true)
  .single();

if (integrationError || !integration) {
  throw new Error('Integração do Mercado Pago não encontrada');
}

const { access_token } = integration.config;
```

### Código Depois (Corrigido)
```typescript
// Buscar credenciais do Mercado Pago (suporta modo teste e produção)
console.log('🔍 Buscando credenciais para vendor:', vendorId);

// Primeiro, verificar se está em modo teste
const { data: profile } = await supabaseClient
  .from('profiles')
  .select('test_mode_enabled, test_access_token')
  .eq('id', vendorId)
  .single();

let accessToken;
let isTestMode = false;

if (profile?.test_mode_enabled && profile?.test_access_token) {
  // Usar credenciais de teste
  accessToken = profile.test_access_token;
  isTestMode = true;
  console.log('🧪 Usando credenciais de TESTE (Sandbox)');
} else {
  // Buscar credenciais de produção em vendor_integrations
  console.log('🔍 Buscando credenciais de produção...');
  const { data: integration } = await supabaseClient
    .from('vendor_integrations')
    .select('*')
    .eq('vendor_id', vendorId)
    .eq('integration_type', 'MERCADOPAGO')
    .eq('active', true)
    .single();

  if (!integration) {
    throw new Error('Integração do Mercado Pago não encontrada');
  }

  accessToken = integration.config?.access_token;
  console.log('🚀 Usando credenciais de PRODUÇÃO');
}

if (!accessToken) {
  throw new Error('Access token não encontrado');
}
```

### Benefícios
- ✅ Suporta ambiente **sandbox** (modo teste)
- ✅ Suporta ambiente **produção** (OAuth)
- ✅ Logs claros indicando qual modo está sendo usado
- ✅ Validação robusta de credenciais

---

## Fluxo Completo Após as Correções

```
1. Mercado Pago envia notificação
    ↓
2. mercadopago-webhook recebe
    ↓
3. Busca credenciais (TESTE ou PRODUÇÃO) ← CORRIGIDO
    ↓
4. Consulta detalhes do pagamento na API do MP
    ↓
5. Atualiza status do pedido no banco
    ↓
6. Chama trigger-webhooks ← CRIADO
    ↓
7. trigger-webhooks busca webhooks cadastrados
    ↓
8. Para cada webhook, chama dispatch-webhook
    ↓
9. dispatch-webhook envia para URL do cliente
    ↓
10. Registra resultado em webhook_deliveries
```

---

## Arquivos Modificados

1. **Criado:** `/supabase/functions/trigger-webhooks/index.ts`
2. **Modificado:** `/supabase/functions/mercadopago-webhook/index.ts` (linhas 54-97)

---

## Próximos Passos

### 1. Deploy das Funções
As funções precisam ser implantadas no Supabase:
```bash
supabase functions deploy trigger-webhooks
supabase functions deploy mercadopago-webhook
```

### 2. Teste em Sandbox
1. Fazer um pagamento de teste usando as credenciais de sandbox
2. Verificar os logs da função `mercadopago-webhook` para confirmar que está usando credenciais de teste
3. Verificar se o webhook foi disparado para a URL cadastrada
4. Verificar a tabela `webhook_deliveries` para confirmar o sucesso

### 3. Monitoramento
Acompanhar os logs das funções para garantir que:
- As credenciais corretas estão sendo usadas (teste vs produção)
- Os webhooks estão sendo encontrados e disparados
- As entregas estão sendo registradas corretamente

---

## Observações Importantes

- As credenciais de teste devem estar configuradas em `profiles.test_mode_enabled = true` e `profiles.test_access_token`
- As credenciais de produção devem estar em `vendor_integrations` com `integration_type = 'MERCADOPAGO'` e `active = true`
- O sistema agora suporta ambos os modos simultaneamente, escolhendo automaticamente com base na configuração do vendedor
