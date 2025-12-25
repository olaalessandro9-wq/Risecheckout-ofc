# Stripe Gateway Module

> Módulo de integração frontend para o gateway de pagamentos Stripe.
> Utiliza **Stripe Connect** para split de pagamentos.

---

## 📁 Estrutura do Módulo

```
src/integrations/gateways/stripe/
├── index.ts           # Barrel exports
└── ConfigForm.tsx     # Formulário de conexão OAuth
```

---

## 🔧 Visão Geral

O módulo Stripe é mais simples que o Asaas pois utiliza **Stripe Connect OAuth**.
O vendedor não precisa inserir chaves manualmente - ele é redirecionado para o Stripe
para autorizar a conexão.

### Fluxo de Conexão

```
┌─────────────────────────────────────────────────────────────────┐
│                   FLUXO STRIPE CONNECT                          │
└─────────────────────────────────────────────────────────────────┘

[Vendedor]                [Frontend]              [Edge Function]              [Stripe]
    │                          │                         │                        │
    │  Clica "Conectar"        │                         │                        │
    │ ─────────────────────────►                         │                        │
    │                          │                         │                        │
    │                          │   stripe-connect-start  │                        │
    │                          │ ────────────────────────►                        │
    │                          │                         │                        │
    │                          │     OAuth URL           │                        │
    │                          │ ◄────────────────────────                        │
    │                          │                         │                        │
    │    Redireciona           │                         │                        │
    │ ◄─────────────────────────                         │                        │
    │                          │                         │                        │
    │ ─────────────────────────────────────────────────────────────────────────────►
    │                     [Autoriza no Stripe]                                     │
    │ ◄─────────────────────────────────────────────────────────────────────────────
    │                          │                         │                        │
    │    Callback URL          │                         │                        │
    │ ─────────────────────────►                         │                        │
    │                          │                         │                        │
    │                          │  stripe-connect-callback│                        │
    │                          │ ────────────────────────►                        │
    │                          │                         │                        │
    │                          │                         │   Exchange Code        │
    │                          │                         │ ───────────────────────►
    │                          │                         │                        │
    │                          │                         │   stripe_account_id    │
    │                          │                         │ ◄───────────────────────
    │                          │                         │                        │
    │                          │    Salva account_id     │                        │
    │                          │ ◄────────────────────────                        │
    │                          │                         │                        │
    │    Exibe "Conectado"     │                         │                        │
    │ ◄─────────────────────────                         │                        │
```

---

## 🎨 Componentes

### ConfigForm

Componente único que gerencia toda a conexão Stripe Connect.

```typescript
import { ConfigForm } from '@/integrations/gateways/stripe';

function GatewaySettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurar Stripe</CardTitle>
      </CardHeader>
      <CardContent>
        <ConfigForm />
      </CardContent>
    </Card>
  );
}
```

**Funcionalidades:**
- Exibe status de conexão (Conectado/Desconectado)
- Botão "Conectar com Stripe" que inicia OAuth
- Exibe detalhes da conta conectada (email, modo, data)
- Botão de desconexão
- Tratamento automático de callback OAuth

---

## 📡 Edge Functions Relacionadas

O ConfigForm interage com as seguintes Edge Functions:

### stripe-connect-start

Inicia o fluxo OAuth do Stripe Connect.

```typescript
// Chamada interna do ConfigForm
const { data } = await supabase.functions.invoke('stripe-connect-start');
window.location.href = data.url; // Redireciona para Stripe
```

### stripe-connect-callback

Processa o callback após autorização no Stripe.

```typescript
// Callback automático via URL
// /settings?stripe=success&code=xxx&state=yyy
```

### stripe-status

Verifica status atual da conexão.

```typescript
const { data } = await supabase.functions.invoke('stripe-status');
// { connected: true, account_id: 'acct_xxx', email: 'vendor@email.com' }
```

### stripe-disconnect

Desconecta a conta Stripe.

```typescript
await supabase.functions.invoke('stripe-disconnect');
```

---

## 🔄 Dados Armazenados

Após conexão bem-sucedida, os seguintes campos são salvos em `profiles`:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `stripe_account_id` | string | ID da conta Stripe Connect (acct_xxx) |
| `stripe_connected_at` | timestamp | Data/hora da conexão |

---

## 💳 Split de Pagamentos

O Stripe usa o modelo **Destination Charges** para split:

```
┌─────────────────────────────────────────────────────────────────┐
│                     SPLIT STRIPE CONNECT                        │
└─────────────────────────────────────────────────────────────────┘

                     Pagamento: R$ 100,00
                            │
                            ▼
              ┌─────────────────────────────┐
              │      Conta Plataforma       │
              │    (STRIPE_SECRET_KEY)      │
              └─────────────────────────────┘
                            │
           ┌────────────────┴────────────────┐
           │                                 │
           ▼                                 ▼
  ┌─────────────────┐               ┌─────────────────┐
  │  Taxa Plataforma │               │   Vendedor      │
  │      4%          │               │     96%         │
  │    R$ 4,00       │               │   R$ 96,00      │
  └─────────────────┘               └─────────────────┘
```

**Nota:** A taxa do Stripe (~3.99%) é cobrada separadamente do valor líquido.

---

## ⚙️ Configuração de Ambiente

### Secrets Necessários

| Secret | Descrição | Onde Obter |
|--------|-----------|------------|
| `STRIPE_SECRET_KEY` | Chave secreta da plataforma | Stripe Dashboard → API Keys |
| `STRIPE_CONNECT_CLIENT_ID` | Client ID do Connect | Stripe Dashboard → Connect Settings |

### Modo de Teste

Para testar, use chaves de teste (`sk_test_...`) e contas de teste do Stripe.

---

## 📋 Checklist de Integração

1. ✅ Criar conta Stripe (plataforma)
2. ✅ Habilitar Stripe Connect no dashboard
3. ✅ Configurar secrets no Supabase
4. ✅ Vendedor clica "Conectar" no painel
5. ✅ Vendedor autoriza no Stripe
6. ✅ Sistema salva `stripe_account_id`
7. ✅ Pagamentos podem usar split automático

---

## 🔐 Segurança

1. **OAuth Flow**: Nenhuma chave do vendedor é exposta ao frontend
2. **State Parameter**: Protege contra CSRF no callback
3. **Account ID**: Único identificador armazenado (não sensível)
4. **Destination Charges**: Pagamentos vão direto para conta do vendedor

---

## 📚 Referências

- [Stripe Connect Documentation](https://stripe.com/docs/connect)
- [Edge Function: stripe-create-payment](../../../supabase/functions/stripe-create-payment/README.md)
- [Edge Function: stripe-webhook](../../../supabase/functions/stripe-webhook/README.md)
- [Arquitetura de Pagamentos](../../../docs/ARCHITECTURE.md)
