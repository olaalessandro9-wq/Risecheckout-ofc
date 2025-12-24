# Checklist - Próximos Passos

## ✅ Concluído

- [x] Análise completa do sistema de webhooks
- [x] Identificação do problema (tabela errada)
- [x] Correção do código (v12)
- [x] Deploy da versão corrigida
- [x] Documentação completa

---

## 🔄 Testes Pendentes

### Teste 1: Pagamento End-to-End
- [ ] Fazer pagamento de teste no frontend
- [ ] Aguardar aprovação do Mercado Pago
- [ ] Verificar atualização do status do pedido
- [ ] Verificar disparo do webhook do vendedor
- [ ] Verificar log em `webhook_deliveries`

**Vendor de Teste:** `ccff612c-93e6-4acc-85d9-7c9d978a7e4e`  
**Webhook:** `http://72.60.249.53:5678/webhook/7eddf273-3a35-4283-b598-19c757262c18`

---

### Teste 2: Verificar Logs
```bash
# Ver logs do mercadopago-webhook
supabase functions logs mercadopago-webhook \
  --project-ref wivbtmtgpsxupfjwwovf \
  --follow
```

- [ ] Verificar se webhook do MP está sendo recebido
- [ ] Verificar se pedido está sendo atualizado
- [ ] Verificar se trigger-webhooks está sendo chamado
- [ ] Verificar se não há erros nos logs

---

### Teste 3: Verificar Banco de Dados
```sql
-- Ver últimas entregas de webhook
SELECT 
  id, 
  webhook_id, 
  order_id, 
  event_type, 
  status, 
  attempts, 
  response_status,
  created_at 
FROM webhook_deliveries 
ORDER BY created_at DESC 
LIMIT 5;
```

- [ ] Verificar se registros estão sendo criados
- [ ] Verificar se status é `success`
- [ ] Verificar se `response_status` é 200
- [ ] Verificar payload está completo

---

### Teste 4: Validar Payload no Vendedor
- [ ] Capturar payload recebido no webhook do vendedor
- [ ] Verificar se contém todos os campos necessários
- [ ] Verificar se assinatura HMAC está presente
- [ ] Verificar se headers estão corretos (`X-Rise-Signature`, `X-Rise-Event`)

---

## 📊 Monitoramento

### Métricas para Acompanhar
- [ ] Taxa de sucesso de webhooks (meta: >95%)
- [ ] Tempo médio de entrega
- [ ] Número de tentativas de retry
- [ ] Erros mais comuns

### Queries de Monitoramento
```sql
-- Taxa de sucesso nas últimas 24h
SELECT 
  status,
  COUNT(*) as total,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM webhook_deliveries
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY status;

-- Webhooks com mais falhas
SELECT 
  w.name,
  w.url,
  COUNT(*) as failed_attempts
FROM webhook_deliveries wd
JOIN outbound_webhooks w ON w.id = wd.webhook_id
WHERE wd.status = 'failed'
  AND wd.created_at > NOW() - INTERVAL '7 days'
GROUP BY w.id, w.name, w.url
ORDER BY failed_attempts DESC
LIMIT 10;
```

---

## 🔧 Ajustes Opcionais

### Se Necessário
- [ ] Ajustar campos do payload
- [ ] Adicionar mais eventos
- [ ] Configurar alertas para falhas
- [ ] Criar dashboard de métricas

---

## 📚 Documentação para Vendedores

### Criar Guia de Integração
- [ ] Documentar formato do payload
- [ ] Documentar eventos disponíveis
- [ ] Documentar validação de assinatura HMAC
- [ ] Criar exemplos de código (Node.js, Python, PHP)
- [ ] Documentar troubleshooting comum

---

## 🎯 Validação Final

### Critérios de Sucesso
- [ ] Pelo menos 1 pagamento de teste completo com sucesso
- [ ] Webhook do vendedor recebeu notificação
- [ ] Log em `webhook_deliveries` com status `success`
- [ ] Payload completo e correto
- [ ] Assinatura HMAC válida
- [ ] Sem erros nos logs

---

## 📞 Contatos Importantes

**Supabase Project:** wivbtmtgpsxupfjwwovf  
**Webhook URL:** https://wivbtmtgpsxupfjwwovf.supabase.co/functions/v1/mercadopago-webhook

**Versões Atuais:**
- mercadopago-webhook: v12
- trigger-webhooks: v32
- mercadopago-create-payment: v22

---

## 🚀 Quando Tudo Estiver Validado

- [ ] Marcar tarefa como concluída
- [ ] Notificar equipe sobre correção
- [ ] Atualizar documentação do projeto
- [ ] Arquivar documentos de análise
- [ ] Celebrar! 🎉

---

**Última atualização:** 2025-11-19 21:05 GMT-3
