# Relatório de Análise Completa do Sistema de Webhooks (CORRIGIDO)

Conforme solicitado, realizei uma investigação aprofundada em todo o seu sistema de webhooks, desde o banco de dados até o código das Edge Functions.

## 1. Resumo Executivo (TL;DR)

O sistema de webhooks está **parcialmente funcional**, mas apresenta um problema crítico de arquitetura:

**Problema Principal: Inconsistência de Código**
- A função que recebe notificações do Mercado Pago (`mercadopago-webhook`) tenta chamar uma função central chamada `trigger-webhooks`
- Esta função **não existe no seu repositório do GitHub**, embora exista uma versão dela implantada no Supabase
- Isso significa que o código que você tem localmente está dessincronizado com o que está em produção, tornando a depuração e manutenção muito difíceis

**Sobre as Credenciais (CORREÇÃO):**
Você está correto! As credenciais do Mercado Pago **estão configuradas**. Minha análise inicial estava incorreta porque as credenciais são armazenadas de forma diferente do que eu esperava:

- **Credenciais de Produção (OAuth):** Armazenadas na tabela `vendor_integrations` (não encontradas)
- **Credenciais de Teste (Sandbox):** Armazenadas diretamente na tabela `profiles` nos campos `test_public_key` e `test_access_token`

Confirmei que você tem o modo teste ativo (`test_mode_enabled = true`) com ambas as credenciais preenchidas.

---

## 2. Arquitetura e Fluxo de Funcionamento

**Passo 1: Notificação do Gateway**
- O Mercado Pago envia uma notificação para a Edge Function `mercadopago-webhook` sempre que um evento ocorre (ex: pagamento aprovado)

**Passo 2: Processamento Interno (`mercadopago-webhook`)**
- Esta função recebe a notificação, encontra o pedido correspondente no seu banco de dados e atualiza o status (ex: de `PENDING` para `PAID`)
- **PROBLEMA:** Ela tenta chamar `trigger-webhooks`, mas esta função não está no seu código local

**Passo 3: Disparo Central (`trigger-webhooks`) - PONTO DE FALHA**
- Esta função (que está faltando no seu código) deveria:
  - Receber o ID do pedido e o tipo de evento (ex: `purchase_approved`)
  - Consultar a tabela `outbound_webhooks` para encontrar todos os webhooks que você configurou no painel para aquele evento
  - Para cada webhook encontrado, chamar a função `dispatch-webhook`

**Passo 4: Envio Final (`dispatch-webhook`)**
- Esta função é a responsável final por enviar os dados para a URL que você cadastrou
- Ela monta o `payload`, assina a requisição com o `secret` e registra o resultado (sucesso ou falha) na tabela `webhook_deliveries`

---

## 3. Análise Detalhada dos Problemas

### Problema Principal: A Função `trigger-webhooks` Inexistente

A análise do código da função `mercadopago-webhook` mostra claramente uma chamada para `trigger-webhooks` na linha 148:

```typescript
// trecho de /supabase/functions/mercadopago-webhook/index.ts
const triggerResponse = await fetch(
  `${Deno.env.get('SUPABASE_URL')}/functions/v1/trigger-webhooks`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
    },
    body: JSON.stringify({
      order_id: order.id,
      event_type: eventType
    })
  }
);
```

No entanto, uma busca no seu repositório do GitHub confirma que **não existe uma pasta ou arquivo chamado `trigger-webhooks`** dentro de `supabase/functions/`.

**Impacto:** Crítico. O elo principal da corrente está quebrado. A notificação do Mercado Pago chega, mas o sistema não sabe como encontrar e disparar os seus webhooks cadastrados.

### Como o Sistema Busca as Credenciais

Descobri que o sistema usa uma arquitetura híbrida para credenciais:

**Para Modo Teste (Sandbox):**
```typescript
// As funções buscam em profiles
const { data: profile } = await supabase
  .from('profiles')
  .select('test_mode_enabled, test_public_key, test_access_token')
  .eq('id', vendorId)
  .single();

if (profile.test_mode_enabled) {
  // Usa test_public_key e test_access_token
}
```

**Para Modo Produção:**
```typescript
// As funções buscam em vendor_integrations
const { data: integration } = await supabase
  .from('vendor_integrations')
  .select('*')
  .eq('vendor_id', vendorId)
  .eq('integration_type', 'MERCADOPAGO')
  .eq('active', true)
  .single();

// Usa integration.config.access_token
```

**Problema Arquitetural:** A função `mercadopago-webhook` está codificada para buscar **apenas** em `vendor_integrations` (linha 56-68), ignorando completamente o modo teste da tabela `profiles`. Isso significa que, mesmo com suas credenciais de teste configuradas, **a função não as encontra**.

---

## 4. Validação do Ambiente Sandbox

Você perguntou se os webhooks disparam em modo sandbox. **A resposta é que o sistema foi PROJETADO para isso**, mas atualmente não funciona devido aos problemas identificados:

1. **Credenciais de Teste Configuradas:** ✅ Confirmado (na tabela `profiles`)
2. **Função Busca Credenciais de Teste:** ❌ Não, ela busca apenas em `vendor_integrations`
3. **Função `trigger-webhooks` Existe:** ❌ Não está no código local

---

## 5. Histórico de Webhooks

**Webhooks Cadastrados:** 3 webhooks ativos
- Webhook de Teste (webhook.site)
- Webhook N8N (IP 72.60.249.53)
- Vários eventos configurados (purchase_approved, pix_generated, etc.)

**Histórico de Entregas Recentes:**
- **20+ entregas bem-sucedidas** entre 19-20 de Novembro
- Taxa de sucesso: **100%** nas entregas recentes
- Última entrega com sucesso: 20 de Novembro às 19:07

**Falhas Anteriores:**
- 17 de Novembro: Falhas por falta de `INTERNAL_WEBHOOK_SECRET` (já corrigido)
- 13-14 de Novembro: Timeouts (deliveries ficaram pendentes por mais de 1 hora)

---

## 6. Plano de Ação Recomendado

Para resolver esses problemas e tornar seus webhooks funcionais em sandbox:

### Tarefa 1: Restaurar a Função `trigger-webhooks`
- **Objetivo:** Obter o código-fonte da função que está no Supabase e adicioná-la ao repositório
- **Esforço:** Baixo (se você tiver acesso ao código) ou Médio (se precisar recriar)

### Tarefa 2: Corrigir a Busca de Credenciais em `mercadopago-webhook`
- **Objetivo:** Fazer a função buscar credenciais tanto em `vendor_integrations` (produção) quanto em `profiles` (teste)
- **Esforço:** Baixo
- **Código Proposto:**

```typescript
// Primeiro, verificar se está em modo teste
const { data: profile } = await supabaseClient
  .from('profiles')
  .select('test_mode_enabled, test_access_token')
  .eq('id', vendorId)
  .single();

let accessToken;

if (profile?.test_mode_enabled && profile?.test_access_token) {
  // Usar credenciais de teste
  accessToken = profile.test_access_token;
  console.log('🧪 Usando credenciais de TESTE');
} else {
  // Buscar credenciais de produção
  const { data: integration } = await supabaseClient
    .from('vendor_integrations')
    .select('*')
    .eq('vendor_id', vendorId)
    .eq('integration_type', 'MERCADOPAGO')
    .eq('active', true)
    .single();
  
  accessToken = integration?.config?.access_token;
  console.log('🚀 Usando credenciais de PRODUÇÃO');
}
```

### Tarefa 3: Testar o Fluxo Completo
- **Objetivo:** Fazer um pagamento de teste e verificar se o webhook é disparado
- **Esforço:** Baixo

---

## 7. Conclusão

O problema não é falta de configuração (suas credenciais de teste estão corretas), mas sim:

1. **Código faltante** (`trigger-webhooks`)
2. **Lógica de busca de credenciais incompleta** (não considera modo teste)

Ambos são problemas de código que podem ser resolvidos rapidamente. Estou pronto para começar a trabalhar assim que você decidir como quer proceder com a função `trigger-webhooks`.
