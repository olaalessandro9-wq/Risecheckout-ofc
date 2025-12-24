# ✅ Implementação do Split de Pagamentos - COMPLETA

**Última Atualização:** Dezembro 2024  
**Taxa Atual:** 4% (configurável por vendedor)

---

## 🎯 Objetivo

Implementar split automático de **4%** em transações, com regras especiais para o Owner da plataforma.

---

## 🏠 Modelo Owner = Plataforma

> **IMPORTANTE**: O Owner da plataforma é a própria plataforma RiseCheckout.

### Regras de Taxa para Owner:

| Cenário | Taxa | Destino |
|---------|------|---------|
| Owner vendendo **DIRETO** (sem afiliado) | **0%** | N/A (isento) |
| Owner vendendo **COM AFILIADO** | **4%** | Retorna ao Owner |
| Vendedor comum | **4%** | Plataforma (Owner) |

Para detalhes completos, consulte: **[docs/MODELO_NEGOCIO.md](docs/MODELO_NEGOCIO.md)**

---

## 📊 Como Funciona (Vendedor Comum)

### Fluxo de Pagamento com Split:

```
Cliente paga R$ 100,00
        ↓
RiseCheckout deduz taxa (4%): R$ 4,00
        ↓
Valor para vendedor: R$ 96,00
        ↓
Mercado Pago deduz sua taxa (~4.99%): ~R$ 4,80
        ↓
Vendedor recebe líquido: ~R$ 91,20
```

---

## 🔧 Implementação Técnica

### 1. **Configuração Central**

**Arquivo:** `supabase/functions/_shared/platform-config.ts`

```typescript
// Taxa da plataforma: 4%
export const PLATFORM_FEE_PERCENT = 0.04;

// Owner da plataforma (isento de taxa quando vende direto)
export const PLATFORM_OWNER_USER_ID = "ccff612c-93e6-4acc-85d9-7c9d978a7e4e";

// Collector IDs para split
export const PLATFORM_MERCADOPAGO_COLLECTOR_ID = "3002802852";
export const PLATFORM_PUSHINPAY_ACCOUNT_ID = "A0557404-1578-4F50-8AE7-AEF8711F03D1";
```

### 2. **Banco de Dados**

**Tabela criada:** `platform_config`

```sql
CREATE TABLE platform_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Configuração inserida:**
```json
{
  "key": "mercadopago_platform",
  "value": {
    "collector_id": "3002802852",
    "split_percentage": 5,
    "enabled": true
  },
  "description": "Configurações da plataforma para split do Mercado Pago"
}
```

---

## 💰 Exemplos de Cálculo

### Exemplo 1: Owner Venda Direta (R$ 100,00)
```
Valor da venda: R$ 100,00
Taxa RiseCheckout: R$ 0,00 (0% - OWNER ISENTO)
Taxa Mercado Pago (~5%): R$ 5,00
Owner recebe: R$ 95,00 (100%)
```

### Exemplo 2: Owner COM Afiliado 50% (R$ 100,00)
```
Valor da venda: R$ 100,00
Taxa RiseCheckout (4%): R$ 4,00 → Owner
Líquido para split: R$ 96,00
  - Afiliado 50%: R$ 48,00
  - Owner 50%: R$ 48,00
TOTAL OWNER: R$ 52,00 (4 + 48)
TOTAL AFILIADO: R$ 48,00
```

### Exemplo 3: Vendedor Comum (R$ 100,00)
```
Valor da venda: R$ 100,00
Taxa RiseCheckout (4%): R$ 4,00 → Plataforma (Owner)
Vendedor recebe: R$ 96,00
Taxa Mercado Pago (~5%): ~R$ 4,80 (sobre R$ 96)
Vendedor líquido: ~R$ 91,20
```

### Exemplo 4: Vendedor Taxa Personalizada 2% (R$ 100,00)
```
Valor da venda: R$ 100,00
Taxa RiseCheckout (2% custom): R$ 2,00 → Plataforma (Owner)
Vendedor recebe: R$ 98,00
```

---

## 🔐 Credenciais da Plataforma

**Conta RiseCheckout (Plataforma):**
- **Collector ID:** 3002802852
- **Client ID:** 2354396684039370
- **Public Key:** literal:<REDACTED_PUBLIC_KEY>
- **Access Token:** literal:<REDACTED_ACCESS_TOKEN>

---

## 📝 Logs de Debug

Quando um pagamento for criado, você verá nos logs:

```
[MP] Split calculado: {
  amount: 100,
  platformFee: 5.00,
  percentage: '5%'
}
```

---

## ⚠️ Pontos Importantes

### 1. **Ordem de Dedução**
A ordem é importante e automática:
1. Mercado Pago deduz sua taxa primeiro
2. RiseCheckout recebe 5% do valor restante
3. Vendedor recebe o saldo final

### 2. **Reembolsos**
Em caso de reembolso:
- O valor é dividido proporcionalmente
- RiseCheckout devolve sua parte (5%)
- Vendedor devolve sua parte (95% - taxa MP)

### 3. **Apenas Mercado Pago**
- Split funciona apenas entre contas Mercado Pago
- Não permite transferências externas

### 4. **Access Token do Vendedor**
- Sempre usar o `access_token` do vendedor
- Obtido via OAuth e armazenado em `vendor_integrations`
- O split é automático pelo Mercado Pago

---

## 🧪 Como Testar

### 1. **Criar um Pedido de Teste**
```bash
# Criar pedido com valor de R$ 100,00
# Escolher Mercado Pago como gateway
# Completar pagamento
```

### 2. **Verificar Logs**
```bash
# Ver logs da Edge Function
# Procurar por: [MP] Split calculado
```

### 3. **Verificar no Mercado Pago**
- Acessar sua conta: https://www.mercadopago.com.br
- Ir em "Vendas e cobranças"
- Verificar se recebeu os 5%

### 4. **Verificar Conta do Vendedor**
- Vendedor acessa sua conta Mercado Pago
- Verifica valor recebido (95% - taxa MP)

---

## 📈 Próximos Passos (Opcional)

### Melhorias Futuras:
1. **Dashboard de Comissões**
   - Visualizar total de comissões recebidas
   - Gráficos de receita da plataforma
   - Relatórios mensais

2. **Porcentagem Configurável**
   - Permitir alterar % via admin
   - Diferentes % por vendedor (planos)

3. **Notificações**
   - Email quando receber comissão
   - Relatório semanal de comissões

---

## ✅ Status da Implementação

- ✅ Pesquisa de documentação
- ✅ Código implementado
- ✅ Cálculo de 5% automático
- ✅ Tabela de configuração criada
- ✅ Collector ID configurado
- ⏳ Testes em produção
- ⏳ Validação de recebimento

---

## 🎉 Conclusão

O split está **100% implementado e pronto para uso**!

Toda venda feita através do Mercado Pago agora automaticamente:
1. Deduz taxa do Mercado Pago
2. Transfere 5% para RiseCheckout (ID: 3002802852)
3. Transfere o restante para o vendedor

**Não é necessário nenhuma ação manual!** 🚀
