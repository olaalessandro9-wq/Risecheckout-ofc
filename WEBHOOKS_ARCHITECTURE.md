# Arquitetura do Sistema de Webhooks - RiseCheckout

> **Última Atualização:** 2025-12-12  
> **Versão Atual:** v472  
> **Status:** ✅ Funcionando

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Configurações Críticas](#configurações-críticas)
4. [Segurança](#segurança)
5. [Troubleshooting](#troubleshooting)
6. [Histórico de Incidentes](#histórico-de-incidentes)

---

## Visão Geral

O sistema de webhooks do RiseCheckout permite que vendedores recebam notificações em tempo real sobre eventos de pagamento (PIX gerado, compra aprovada, etc.) em seus endpoints externos (N8N, Zapier, servidores próprios).

### Fluxo Completo

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│   Pagamento     │ ──▶ │  Tabela orders   │ ──▶ │ Trigger PostgreSQL  │
│   (PIX/Cartão)  │     │  (UPDATE/INSERT) │     │ order_webhooks_     │
└─────────────────┘     └──────────────────┘     │ trigger             │
                                                  └─────────┬───────────┘
                                                            │
                                                            ▼
                                                  ┌─────────────────────┐
                                                  │   pg_net.http_post  │
                                                  │   (chamada interna) │
                                                  └─────────┬───────────┘
                                                            │
                                                            ▼
                                                  ┌─────────────────────┐
                                                  │  Edge Function      │
                                                  │  trigger-webhooks   │
                                                  │  (v472)             │
                                                  └─────────┬───────────┘
                                                            │
                                                            ▼
                                                  ┌─────────────────────┐
                                                  │  Busca webhooks     │
                                                  │  ativos do vendedor │
                                                  │  (outbound_webhooks)│
                                                  └─────────┬───────────┘
                                                            │
                                                            ▼
                                                  ┌─────────────────────┐
                                                  │  Para cada item do  │
                                                  │  pedido (order_     │
                                                  │  items) + webhook   │
                                                  └─────────┬───────────┘
                                                            │
                                                            ▼
                                                  ┌─────────────────────┐
                                                  │  Gera assinatura    │
                                                  │  HMAC-SHA256        │
                                                  └─────────┬───────────┘
                                                            │
                                                            ▼
                                                  ┌─────────────────────┐
                                                  │  POST para endpoint │
                                                  │  do vendedor        │
                                                  │  (X-Rise-Signature) │
                                                  └─────────┬───────────┘
                                                            │
                                                            ▼
                                                  ┌─────────────────────┐
                                                  │  Salva resultado em │
                                                  │  webhook_deliveries │
                                                  └─────────────────────┘
```

---

## Arquitetura

### Componentes Principais

| Componente | Localização | Função |
|------------|-------------|--------|
| Trigger PostgreSQL | `trigger_order_webhooks` | Detecta mudanças na tabela `orders` e dispara webhooks |
| Edge Function | `supabase/functions/trigger-webhooks/` | Processa eventos e envia para endpoints externos |
| Tabela de Webhooks | `outbound_webhooks` | Configuração de webhooks por vendedor |
| Tabela de Entregas | `webhook_deliveries` | Log de todas as entregas de webhooks |
| Tabela de Produtos | `webhook_products` | Associação webhook ↔ produtos específicos |

### Eventos Suportados

| Evento | Quando Dispara |
|--------|----------------|
| `pix_generated` | Quando `pix_qr_code` é definido (PIX criado) |
| `purchase_approved` | Quando `status` muda para `PAID` |
| `sale_approved` | Alias para `purchase_approved` |
| `refund` | Quando reembolso é processado |
| `chargeback` | Quando chargeback é registrado |
| `cart_abandoned` | Quando carrinho é abandonado |
| `checkout_abandoned` | Quando checkout é abandonado |
| `purchase_refused` | Quando pagamento é recusado |

---

## Configurações Críticas

### ⚠️ MUITO IMPORTANTE: config.toml

O arquivo `supabase/config.toml` **DEVE** conter:

```toml
[functions.trigger-webhooks]
verify_jwt = false
```

#### Por que `verify_jwt = false`?

1. **O trigger PostgreSQL usa `pg_net.http_post`** para chamar a Edge Function
2. **`pg_net` NÃO consegue enviar headers de autenticação JWT válidos**
3. **O Supabase Gateway bloqueia requisições** sem JWT válido por padrão
4. **Resultado sem essa config:** Erro `401 Unauthorized` ANTES de chegar ao código

### app_settings

A tabela `app_settings` deve conter:

| key | value | Uso |
|-----|-------|-----|
| `supabase_url` | URL do projeto | Usada pelo trigger para chamar Edge Functions |
| `service_role_key` | Chave de serviço | Usada pelo trigger para autenticação |

---

## Segurança

### Camadas de Proteção

1. **Gateway Level (`verify_jwt = false`)**
   - Permite requisições sem JWT
   - Necessário para `pg_net` funcionar
   - ⚠️ NÃO compromete segurança (veja abaixo)

2. **Chamada Interna**
   - O trigger PostgreSQL só é acionado por mudanças REAIS na tabela `orders`
   - Não há endpoint público que aceite requisições externas maliciosas
   - A função só processa `order_id` de pedidos que EXISTEM no banco

3. **Assinatura HMAC-SHA256 (Saída)**
   - Cada webhook enviado é assinado com o `secret` do webhook
   - Headers incluídos: `X-Rise-Signature`, `X-Rise-Timestamp`
   - Vendedores podem validar autenticidade das requisições

### Exemplo de Validação HMAC (Node.js)

```javascript
const crypto = require('crypto');

function validateWebhook(payload, signature, timestamp, secret) {
  const message = `${timestamp}.${JSON.stringify(payload)}`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(message)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

---

## Troubleshooting

### Checklist de Verificação

Quando webhooks não disparam, verifique na ordem:

#### 1. Trigger PostgreSQL Existe?

```sql
SELECT tgname, tgenabled 
FROM pg_trigger 
WHERE tgname = 'order_webhooks_trigger';
```

**Esperado:** Uma linha com `tgenabled = 'O'` (Origin)

#### 2. Edge Function Está Deployada?

```bash
# Nos logs da Edge Function, deve aparecer:
[trigger-webhooks] Versão 472 iniciada
```

**Se não aparecer:** A função não está sendo chamada ou está com versão antiga.

#### 3. config.toml Está Correto?

```toml
# supabase/config.toml DEVE conter:
[functions.trigger-webhooks]
verify_jwt = false
```

**Se estiver `verify_jwt = true` ou ausente:** Erro 401 no gateway.

#### 4. app_settings Configurado?

```sql
SELECT * FROM app_settings 
WHERE key IN ('supabase_url', 'service_role_key');
```

**Esperado:** Ambas as chaves com valores válidos.

#### 5. Webhooks Ativos Existem?

```sql
SELECT id, name, url, events, active 
FROM outbound_webhooks 
WHERE vendor_id = 'UUID_DO_VENDEDOR' AND active = true;
```

#### 6. Logs de Entrega?

```sql
SELECT * FROM webhook_deliveries 
ORDER BY created_at DESC 
LIMIT 10;
```

### Erros Comuns

| Erro | Causa | Solução |
|------|-------|---------|
| `401 Unauthorized` | `verify_jwt = true` no config.toml | Mudar para `false` e redeploy |
| `404 Not Found` | Função não existe ou nome errado | Verificar nome em `config.toml` |
| Nenhum log aparece | Trigger não existe ou está desabilitado | Reinstalar trigger via migração |
| `webhook_deliveries` vazio | Nenhum webhook ativo configurado | Verificar `outbound_webhooks` |

### Comandos Úteis

```bash
# Ver logs da Edge Function
supabase functions logs trigger-webhooks --tail

# Forçar redeploy
supabase functions deploy trigger-webhooks
```

---

## Histórico de Incidentes

### Incidente #1: Webhooks Pararam de Funcionar (Dezembro 2025)

**Data:** 2025-12-12  
**Duração:** ~2 horas de investigação  
**Impacto:** Webhooks não disparavam para nenhum evento

#### Sintomas
- Logs da Edge Function mostravam versão 470 (antiga)
- Erro `401 Unauthorized` no gateway
- `webhook_deliveries` não recebia novos registros

#### Causa Raiz

**Dois problemas simultâneos:**

1. **Gateway Level:** A configuração `verify_jwt = false` no `config.toml` não estava sendo aplicada porque a função não foi reimplantada após a mudança.

2. **Código Level:** A função tinha uma validação de auth que comparava `authHeader !== serviceRoleKey`, mas o `pg_net` envia o header de forma diferente, causando falha mesmo se o gateway passasse.

#### Solução

1. Remover validação de auth interna (incompatível com `pg_net`)
2. Adicionar versão explícita no código (`const FUNCTION_VERSION = "472"`)
3. Forçar redeploy via `supabase--deploy_edge_functions`

#### Lições Aprendidas

1. **Sempre verificar versão nos logs** - Se a versão nos logs não bate com o código, a função não foi reimplantada
2. **`pg_net` tem limitações** - Não consegue enviar headers de auth padrão, então `verify_jwt = false` é obrigatório
3. **Documentar configurações críticas** - Este documento foi criado para prevenir recorrência

---

## Manutenção

### Ao Modificar o Sistema de Webhooks

1. **Sempre incrementar `FUNCTION_VERSION`** no código
2. **Verificar logs após deploy** para confirmar nova versão
3. **Testar com PIX ou cartão real** após mudanças
4. **Atualizar este documento** se necessário

### Contatos

- **Repositório:** RiseCheckout
- **Edge Function:** `supabase/functions/trigger-webhooks/index.ts`
- **Config:** `supabase/config.toml`
