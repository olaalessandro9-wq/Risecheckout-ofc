# Integração do Heartbeat de Checkout

## 📋 Objetivo

Detectar checkouts abandonados enviando pings periódicos do frontend para o backend.

---

## 🔄 Como Funciona

### **1. Frontend (PublicCheckout)**

Quando o usuário acessa o checkout:

1. Cria uma sessão no banco (`checkout_sessions`)
2. Inicia heartbeat (ping a cada 20s)
3. Atualiza `last_seen_at` da sessão

### **2. Backend (Edge Function)**

Recebe heartbeat e atualiza `last_seen_at`:

```typescript
POST /functions/v1/checkout-heartbeat
{
  "sessionId": "uuid"
}
```

### **3. Job Agendado (Cron)**

A cada 10-15 minutos:

1. Busca sessões com `last_seen_at < now() - 30 minutes`
2. Marca sessão e pedido como `abandoned`
3. Registra evento `CHECKOUT_ABANDONED`

---

## 🚀 Implementação

### **Passo 1: Criar sessão ao carregar checkout**

Adicione no `PublicCheckout.tsx`:

```typescript
import { useCheckoutHeartbeat } from '@/hooks/useCheckoutHeartbeat';

const PublicCheckout = () => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  // Criar sessão ao carregar checkout
  useEffect(() => {
    if (checkout) {
      createCheckoutSession();
    }
  }, [checkout]);

  const createCheckoutSession = async () => {
    try {
      // 1) Criar pedido (se ainda não existir)
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          vendor_id: checkout.vendor_id, // Pegar do checkout
          product_id: checkout.product.id,
          customer_email: formData.email || null,
          customer_name: formData.name || null,
          amount_cents: checkout.product.price,
          currency: 'BRL',
          payment_method: selectedPayment,
          gateway: null, // Ainda não tem gateway
          gateway_payment_id: null,
          status: 'initiated',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 2) Criar sessão
      const { data: session, error: sessionError } = await supabase
        .from('checkout_sessions')
        .insert({
          order_id: order.id,
          vendor_id: checkout.vendor_id,
          started_at: new Date().toISOString(),
          last_seen_at: new Date().toISOString(),
          status: 'active',
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      setSessionId(session.id);
      console.log('[Session] Created:', session.id);

    } catch (error) {
      console.error('[Session] Error:', error);
    }
  };

  // Iniciar heartbeat
  useCheckoutHeartbeat(sessionId);

  // ... resto do código
};
```

---

### **Passo 2: Atualizar sessão ao enviar formulário**

Quando o usuário preenche o formulário, atualize o pedido:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    // Atualizar pedido com dados do cliente
    const { error } = await supabase
      .from('orders')
      .update({
        customer_email: formData.email,
        customer_name: formData.name,
        // ... outros campos
      })
      .eq('id', orderId);

    if (error) throw error;

    // Continuar com pagamento...
    
  } catch (error) {
    console.error('[Order] Error:', error);
    toast.error('Erro ao processar pedido');
  }
};
```

---

### **Passo 3: Marcar sessão como concluída ao finalizar**

Quando o pagamento é criado com sucesso:

```typescript
const createPayment = async () => {
  try {
    // Criar pagamento no gateway...
    
    // Marcar sessão como concluída
    await supabase
      .from('checkout_sessions')
      .update({
        status: 'completed',
        last_seen_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    console.log('[Session] Completed');

  } catch (error) {
    console.error('[Payment] Error:', error);
  }
};
```

---

## 🧪 Teste

### **1. Testar heartbeat**

1. Abrir checkout público
2. Abrir DevTools (F12) → Console
3. Verificar logs:
   ```
   [Session] Created: uuid
   [Heartbeat] Sent: uuid
   [Heartbeat] Sent: uuid
   ...
   ```

### **2. Testar abandono**

1. Abrir checkout
2. Aguardar 30+ minutos SEM interagir
3. Executar job manualmente:
   ```bash
   curl -X POST https://your-project.supabase.co/functions/v1/detect-abandoned-checkouts \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```
4. Verificar no banco:
   ```sql
   SELECT * FROM checkout_sessions WHERE status = 'abandoned';
   SELECT * FROM orders WHERE status = 'abandoned';
   SELECT * FROM order_events WHERE type = 'CHECKOUT_ABANDONED';
   ```

---

## 📊 Monitoramento

### **Sessões ativas**

```sql
SELECT *
FROM checkout_sessions
WHERE status = 'active'
ORDER BY last_seen_at DESC;
```

### **Checkouts abandonados hoje**

```sql
SELECT COUNT(*)
FROM orders
WHERE status = 'abandoned'
  AND DATE(updated_at) = CURRENT_DATE;
```

### **Taxa de abandono**

```sql
SELECT
  COUNT(*) FILTER (WHERE status = 'abandoned') AS abandonados,
  COUNT(*) FILTER (WHERE status IN ('paid', 'authorized')) AS pagos,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'abandoned')::numeric /
    NULLIF(COUNT(*), 0) * 100,
    2
  ) AS taxa_abandono_pct
FROM orders
WHERE DATE(created_at) >= CURRENT_DATE - INTERVAL '30 days';
```

---

## ⚙️ Configuração

### **Variáveis de ambiente**

```env
VITE_SUPABASE_URL=https://wivbtmtgpsxupfjwwovf.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### **Ajustar tempos**

**Heartbeat (frontend):**
```typescript
// useCheckoutHeartbeat.tsx
setInterval(sendHeartbeat, 20000); // 20 segundos
```

**Timeout de abandono (backend):**
```typescript
// detect-abandoned-checkouts/index.ts
.lte('last_seen_at', new Date(Date.now() - 30 * 60 * 1000).toISOString())
// 30 minutos = 30 * 60 * 1000 ms
```

**Frequência do cron:**
```sql
-- setup_cron_jobs.sql
'*/10 * * * *' -- A cada 10 minutos
```

---

## 🎯 Benefícios

1. ✅ **Detecta abandono** - Sabe quando usuário desiste
2. ✅ **Recuperação de vendas** - Pode enviar e-mail de lembrete
3. ✅ **Métricas** - Taxa de abandono, funil de conversão
4. ✅ **Otimização** - Identifica gargalos no checkout
5. ✅ **Automação** - Integra com n8n para e-mails automáticos

---

## 📚 Referências

- [Sistema de Eventos](./ORDERS_EVENTS_SYSTEM.md)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [pg_cron](https://supabase.com/docs/guides/database/extensions/pg_cron)

