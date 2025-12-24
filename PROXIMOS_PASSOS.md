# Próximos Passos - RiseCheckout Payment System

**Última Atualização:** 29 de Novembro de 2025

---

## 🎯 Prioridade Alta (Próxima Sessão)

### 1. Gerenciar Débito Técnico do Deploy

A solução de deploy atual funciona perfeitamente, mas introduziu uma duplicação de código que precisa ser gerenciada.

**Ações:**

- **Decisão Estratégica:** Definir se vamos manter a duplicação (simples) ou investir em Import Map (escalável).
- **Documentação:** Se optar por manter, documentar o processo de deploy no README.
- **Automação:** Considerar criar um script `deploy-edge-function.sh` que automatize a cópia e o deploy.

**Impacto:** Baixo (48KB duplicados) até termos 3+ Edge Functions.

### 2. Testar Pagamento com Cartão de Crédito

O sistema de PIX está 100% validado. Agora precisamos validar o fluxo de cartão de crédito.

**Cenários de Teste:**

- Cartão sem bumps
- Cartão com 1 bump
- Cartão com todos os bumps
- Cartão recusado (validar tratamento de erro)
- Cartão com 3DS (autenticação adicional)

**Gateway:** Mercado Pago (já implementado no adaptador)

### 3. ~~Refatorar PushinPay Frontend~~ ✅ CONCLUÍDO

**Status:** O PushinPay frontend já está 100% refatorado seguindo o padrão Feature Folders!

**Estrutura Atual:**

```
src/integrations/gateways/pushinpay/
├── index.ts (barrel export) ✅
├── types.ts (interfaces) ✅
├── api.ts (funções de API) ✅
├── hooks.ts (usePushinPayConfig, usePushinPayAvailable) ✅
├── README.md (documentação) ✅
└── components/
    ├── ConfigForm.tsx ✅
    ├── PixPayment.tsx ✅
    ├── QRCanvas.tsx ✅
    └── Legal.tsx ✅
```

**Conclusão:** Nenhuma ação necessária. O módulo está completo e seguindo os padrões do projeto.

---

## 🚀 Prioridade Média (Próximas 2 Semanas)

### 4. Implementar Edge Function Genérica

Conforme sugestão da IA Gemini, criar uma única Edge Function que processa todos os gateways.

**Proposta:**

```typescript
// supabase/functions/process-payment/index.ts
const { gateway, paymentMethod, orderId } = await req.json();

const paymentGateway = PaymentFactory.create(gateway, credentials);
const result = await paymentGateway.createPayment(paymentRequest);
```

**Vantagens:**

- Elimina necessidade de múltiplas Edge Functions
- Centraliza lógica de erro e logging
- Facilita adição de novos gateways

**Desafio:** Migrar rotas do frontend para usar a nova function.

### 5. Adicionar Testes Automatizados

O sistema está funcionando, mas não temos testes automatizados.

**Ferramentas:**

- **Backend:** Deno Test para Edge Functions
- **Frontend:** Vitest + React Testing Library

**Cobertura Mínima:**

- Adaptadores (MercadoPago, PushinPay)
- PaymentFactory
- Hooks de integração

### 6. Implementar Logging e Monitoramento

Adicionar logs estruturados para facilitar debug em produção.

**Implementação:**

```typescript
console.log(JSON.stringify({
  level: 'info',
  gateway: 'mercadopago',
  orderId: order.id,
  amount: totalAmount,
  timestamp: new Date().toISOString()
}));
```

**Ferramentas:** Integrar com Sentry ou LogTail para alertas.

---

## 🔮 Prioridade Baixa (Futuro)

### 7. Adicionar Novos Gateways

A arquitetura está pronta para receber novos gateways sem modificar código existente.

**Candidatos:**

- **Stripe:** Popular internacionalmente
- **Pagar.me:** Alternativa brasileira
- **Asaas:** Foco em recorrência

**Esforço:** ~2-3 horas por gateway (criar adaptador + configuração).

### 8. Implementar Webhooks

Atualmente, o sistema não processa notificações automáticas dos gateways.

**Necessário:**

- Edge Function `handle-webhook`
- Validação de assinatura (segurança)
- Atualização de status do pedido
- Notificação ao cliente

### 9. Otimizar Bundle da Edge Function

Investigar uso de Import Map para eliminar duplicação de `_shared`.

**Referência:** [Supabase Import Maps Documentation](https://supabase.com/docs/guides/functions/import-maps)

**Benefício:** Reduz tamanho do bundle e facilita manutenção.

---

## 📋 Checklist de Validação Final

Antes de considerar o sistema 100% pronto para produção:

- [x] PIX Mercado Pago funcionando
- [x] PIX PushinPay funcionando
- [ ] Cartão Mercado Pago funcionando
- [ ] Tratamento de erros validado
- [ ] Testes automatizados implementados
- [ ] Logging estruturado ativo
- [ ] Webhooks configurados
- [ ] Documentação completa

---

## 🤝 Colaboração com Gemini (IA Consultora)

Lembre-se de compartilhar este documento e o `RELATORIO_FINAL_DEPLOY.md` com a IA Gemini para obter feedback estratégico sobre as próximas etapas.

**Perguntas para o Gemini:**

1. A solução de duplicação de `_shared` é aceitável a longo prazo?
2. Devemos priorizar a Edge Function genérica ou os testes automatizados?
3. Qual gateway adicional traria mais valor para o negócio?

---

**Autor:** Manus AI
**Revisão:** Pendente (Gemini)
