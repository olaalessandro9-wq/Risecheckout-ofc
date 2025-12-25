# 📧 Integração ZeptoMail - RiseCheckout

**Data:** 25 de Dezembro de 2025  
**Status:** ✅ Implementado

---

## 📋 Visão Geral

O RiseCheckout utiliza ZeptoMail como provedor de emails transacionais para envio de confirmações, notificações e comunicações com usuários.

---

## 🔧 Configuração

### Secrets Necessários

Os seguintes secrets devem estar configurados no projeto:

| Secret | Descrição | Obrigatório |
|--------|-----------|-------------|
| `ZEPTOMAIL_TOKEN` | Token de autenticação da API | ✅ Sim |
| `ZEPTOMAIL_FROM_EMAIL` | Email do remetente | ✅ Sim |
| `ZEPTOMAIL_FROM_NAME` | Nome do remetente | ✅ Sim |
| `ZEPTOMAIL_BOUNCE_ADDRESS` | Endereço para bounces | ✅ Sim |
| `ZEPTOMAIL_REPLY_TO` | Endereço de resposta | ❌ Não |

### Verificar Secrets

Para verificar se os secrets estão configurados:
1. Acesse as configurações do projeto
2. Navegue até a seção de Secrets
3. Confirme que todos os secrets acima estão presentes

---

## 📁 Estrutura

### Edge Function

**Localização:** `supabase/functions/send-email/index.ts`

**Funcionalidades:**
- Envio de emails via API ZeptoMail
- Suporte a HTML e texto plano
- Templates dinâmicos
- Tratamento de erros

---

## 🚀 Uso

### Chamada Básica

```typescript
const response = await supabase.functions.invoke('send-email', {
  body: {
    to: 'destinatario@email.com',
    subject: 'Assunto do Email',
    html: '<h1>Conteúdo HTML</h1>',
    text: 'Conteúdo em texto plano'
  }
});
```

### Exemplo Completo

```typescript
import { supabase } from '@/integrations/supabase/client';

async function enviarEmailConfirmacao(email: string, nome: string, pedidoId: string) {
  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        to: email,
        subject: `Confirmação do Pedido #${pedidoId}`,
        html: `
          <h1>Olá, ${nome}!</h1>
          <p>Seu pedido #${pedidoId} foi confirmado.</p>
          <p>Obrigado por sua compra!</p>
        `,
        text: `Olá, ${nome}! Seu pedido #${pedidoId} foi confirmado.`
      }
    });

    if (error) throw error;
    
    console.log('Email enviado com sucesso:', data);
    return data;
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    throw error;
  }
}
```

---

## 📨 Tipos de Email

### Emails Transacionais Recomendados

| Tipo | Trigger | Prioridade |
|------|---------|------------|
| Confirmação de Pedido | `order.paid` | Alta |
| Pagamento Pendente | `order.pending` | Média |
| Pagamento Expirado | `order.expired` | Média |
| Boas-vindas | Novo cadastro | Baixa |
| Recuperação de Senha | Solicitação | Alta |

---

## 🔒 Segurança

### Boas Práticas

1. **Nunca exponha o token:** O `ZEPTOMAIL_TOKEN` deve permanecer apenas nos secrets
2. **Valide destinatários:** Verifique emails antes de enviar
3. **Rate limiting:** ZeptoMail tem limites de envio
4. **Logs:** Monitore envios para detectar problemas

### Tratamento de Erros

```typescript
try {
  const { data, error } = await supabase.functions.invoke('send-email', {
    body: { ... }
  });
  
  if (error) {
    // Erro na invocação da função
    console.error('Erro na Edge Function:', error);
  }
  
  if (data?.error) {
    // Erro retornado pela API ZeptoMail
    console.error('Erro ZeptoMail:', data.error);
  }
} catch (e) {
  // Erro de rede ou outro
  console.error('Erro inesperado:', e);
}
```

---

## 📊 Monitoramento

### Logs

Os logs de envio podem ser verificados em:
1. Supabase Dashboard → Edge Functions → `send-email` → Logs
2. Console do navegador (em desenvolvimento)

### Métricas ZeptoMail

Acesse o painel do ZeptoMail para:
- Taxa de entrega
- Bounces
- Aberturas (se tracking habilitado)
- Cliques (se tracking habilitado)

---

## 🛠️ Troubleshooting

### Email não enviado

1. Verifique se todos os secrets estão configurados
2. Verifique logs da Edge Function
3. Confirme que o email do destinatário é válido
4. Verifique limites de envio do ZeptoMail

### Erro de autenticação

1. Verifique se o `ZEPTOMAIL_TOKEN` está correto
2. Confirme que o token não expirou
3. Verifique se o domínio está verificado no ZeptoMail

### Email indo para spam

1. Configure SPF, DKIM e DMARC no domínio
2. Use o endereço `ZEPTOMAIL_BOUNCE_ADDRESS` corretamente
3. Evite conteúdo que pareça spam

---

## 📚 Recursos

- [Documentação ZeptoMail](https://www.zoho.com/zeptomail/help/)
- [API Reference](https://www.zoho.com/zeptomail/help/api/)
- [Best Practices](https://www.zoho.com/zeptomail/help/best-practices.html)

---

**Desenvolvido seguindo o Rise Architect Protocol**
