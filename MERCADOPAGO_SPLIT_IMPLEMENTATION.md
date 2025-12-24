# Implementação do Split de Pagamentos - Mercado Pago

## Resumo da Documentação

### Solução: Split Payments (Marketplace)

O Mercado Pago oferece uma solução de **Split Payments** para plataformas marketplace que precisam dividir pagamentos entre vendedores e a plataforma.

---

## 🎯 Requisitos para Implementação

### 1. **OAuth já implementado** ✅
- Já temos OAuth funcionando
- Obtemos `access_token` de cada vendedor
- Armazenamos em `vendor_integrations`

### 2. **Dois tipos de checkout disponíveis:**

#### **Checkout Pro** (Redirecionamento)
- Comprador vai para página do Mercado Pago
- Usa parâmetro `marketplace_fee`
- API: `/checkout/preferences`

#### **Checkout Transparente** (Integrado)
- Pagamento dentro do ambiente da plataforma
- Usa parâmetro `application_fee`
- API: `/v1/payments`

---

## 💰 Como Funciona a Comissão

### Ordem de Dedução:
1. **Mercado Pago** deduz sua comissão primeiro
2. **Marketplace** (nós) deduz comissão do valor restante
3. **Vendedor** recebe o valor final

### Exemplo com 5% de comissão:
```
Venda: R$ 100,00
├─ Comissão Mercado Pago: R$ 4,99 (4.99%)
├─ Valor restante: R$ 95,01
├─ Comissão Marketplace (5%): R$ 4,75
└─ Vendedor recebe: R$ 90,26
```

---

## 🔧 Implementação Técnica

### Para Checkout Transparente (Recomendado):

```javascript
// POST /v1/payments
{
  "description": "Produto XYZ",
  "installments": 1,
  "token": "{{card_token}}",
  "payer": {
    "email": "comprador@email.com"
  },
  "payment_method_id": "master",
  "transaction_amount": 100,
  "application_fee": 5.00  // ← 5% fixo para plataforma
}
```

**Headers:**
```
Authorization: Bearer {{oauth_access_token}}  // ← Token do VENDEDOR
```

### Para Checkout Pro:

```javascript
// POST /checkout/preferences
{
  "items": [
    {
      "id": "item-ID-1234",
      "title": "Meu produto",
      "currency_id": "BRL",
      "quantity": 1,
      "unit_price": 75.76
    }
  ],
  "marketplace_fee": 3.79  // ← 5% de 75.76
}
```

---

## ⚠️ Pontos Importantes

### 1. **Access Token do Vendedor**
- Usar `access_token` do vendedor (obtido via OAuth)
- Já temos isso armazenado em `vendor_integrations.config.access_token`

### 2. **Public Key da Plataforma**
- No frontend, usar `public_key` da conta integradora (plataforma)
- No backend, usar `access_token` do vendedor

### 3. **Reembolsos**
- Valor é dividido proporcionalmente
- Marketplace e vendedor devolvem suas partes
- Se vendedor não tiver saldo, marketplace decide como proceder

### 4. **Transferências**
- Apenas entre contas Mercado Pago
- Não permite transferências de instituições externas

---

## 📋 Plano de Implementação

### Fase 1: Configuração
- [ ] Armazenar `collector_id` da plataforma no banco
- [ ] Configurar porcentagem fixa de 5%

### Fase 2: Backend
- [ ] Criar função para calcular `application_fee`
- [ ] Modificar API de criação de pagamento
- [ ] Adicionar parâmetro `application_fee` nas requisições

### Fase 3: Testes
- [ ] Testar com conta de teste
- [ ] Verificar divisão de valores
- [ ] Validar reembolsos

---

## 🔗 Links Úteis

- [Split Payments Landing](https://www.mercadopago.com.br/developers/en/docs/split-payments/landing)
- [Integrate Marketplace](https://www.mercadopago.com.br/developers/en/docs/split-payments/integration-configuration/integrate-marketplace)
- [OAuth Documentation](https://www.mercadopago.com.br/developers/en/docs/split-payments/additional-content/security/oauth)

---

## 📊 Status Atual

✅ OAuth implementado e funcionando
✅ Access tokens dos vendedores salvos
⏳ Application fee precisa ser implementado
⏳ Cálculo automático de 5% precisa ser adicionado
⏳ Testes precisam ser realizados
