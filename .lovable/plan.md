
# Auditoria de Conformidade: API UTMify vs Implementação RiseCheckout

## Resumo Executivo

Após análise completa da documentação oficial da API UTMify (PDF fornecido) e comparação com nossa implementação atual, identifiquei **1 problema crítico** que pode estar causando falhas no tracking.

---

## 1. Problema Identificado: Status Inválido para `pix_generated`

### Evidência da Documentação Oficial (Página 2, Seção 1.3.1)

```
status: 'waiting_payment' | 'paid' | 'refused' | 'refunded' | 'chargedback'
```

Os únicos status válidos são:
- `waiting_payment` (aguardando pagamento)
- `paid` (pago)
- `refused` (recusado)
- `refunded` (reembolsado)
- `chargedback` (estornado)

### Código Atual (`utmify-dispatcher.ts` linha 51)

```typescript
const STATUS_MAP: Record<UTMifyEventType, string> = {
  pix_generated: "pending",      // ❌ ERRADO - "pending" não existe na API
  purchase_approved: "paid",     // ✅ CORRETO
  purchase_refused: "refused",   // ✅ CORRETO
  refund: "refunded",           // ✅ CORRETO
  chargeback: "chargedback",    // ✅ CORRETO
};
```

### Impacto

Quando o evento `pix_generated` é disparado, enviamos `status: "pending"` para a API UTMify. Como `pending` **não é um status válido**, a API pode:
1. Rejeitar a requisição silenciosamente
2. Aceitar mas não processar corretamente
3. Causar inconsistências no dashboard UTMify

---

## 2. Tabela de Conformidade Completa

| Critério | Status | Notas |
|----------|--------|-------|
| **Endpoint** | ✅ | `https://api.utmify.com.br/api-credentials/orders` |
| **Header x-api-token** | ✅ | Implementado corretamente |
| **Campo orderId** | ✅ | String UUID |
| **Campo platform** | ✅ | "RiseCheckout" (PascalCase) |
| **Campo paymentMethod** | ✅ | `pix`, `credit_card`, `boleto` |
| **Campo status** | ⚠️ | `pix_generated` usa `pending` em vez de `waiting_payment` |
| **Campo createdAt** | ✅ | Formato `YYYY-MM-DD HH:MM:SS` UTC |
| **Campo approvedDate** | ✅ | String ou null |
| **Campo refundedAt** | ✅ | String ou null |
| **Objeto customer** | ✅ | Todos os campos conforme spec |
| **Objeto products** | ✅ | Array com id, name, quantity, priceInCents |
| **Objeto trackingParameters** | ✅ | 7 campos UTM + src + sck |
| **Objeto commission** | ✅ | totalPriceInCents, gatewayFeeInCents, userCommissionInCents, currency |
| **Campo isTest** | ✅ | Boolean, default false |

---

## 3. Correção Necessária

### Arquivo: `supabase/functions/_shared/utmify-dispatcher.ts`

**Linha 51 - Alterar de:**
```typescript
pix_generated: "pending",
```

**Para:**
```typescript
pix_generated: "waiting_payment",
```

### Justificativa RISE V3

- **Manutenibilidade:** 10/10 - Correção de 1 linha
- **Zero DT:** 10/10 - Remove não-conformidade com API externa
- **Arquitetura:** 10/10 - Alinha com documentação oficial
- **Escalabilidade:** 10/10 - Nenhum impacto
- **Segurança:** 10/10 - Nenhum impacto
- **NOTA FINAL: 10.0/10**

---

## 4. Verificação de Outros Componentes

### `utmify-conversion/types.ts` (linha 41)

```typescript
export const OrderStatusMap = {
  paid: "paid",
  pending: "waiting_payment",  // ✅ CORRETO AQUI
  ...
};
```

O arquivo de types já tem o mapeamento correto, mas ele não é usado pelo dispatcher!

---

## 5. Arquivos a Modificar

| Arquivo | Linha | Alteração |
|---------|-------|-----------|
| `supabase/functions/_shared/utmify-dispatcher.ts` | 51 | `pending` → `waiting_payment` |

---

## 6. Conformidade Final Após Correção

| Campo | Documentação UTMify | Implementação | Status |
|-------|---------------------|---------------|--------|
| `waiting_payment` | PIX gerado | ✅ `waiting_payment` | **CONFORME** |
| `paid` | Pagamento aprovado | ✅ `paid` | **CONFORME** |
| `refused` | Pagamento recusado | ✅ `refused` | **CONFORME** |
| `refunded` | Reembolso | ✅ `refunded` | **CONFORME** |
| `chargedback` | Chargeback | ✅ `chargedback` | **CONFORME** |

---

## 7. Teste de Validação

Após a correção, validar:

1. Gerar um PIX via qualquer gateway
2. Verificar nos logs da edge function que o payload contém `"status": "waiting_payment"`
3. Verificar no dashboard UTMify se o evento aparece como "Aguardando Pagamento"

---

## 8. Conclusão

A implementação está **99% conforme** com a documentação oficial da API UTMify. O único problema é o status incorreto para o evento `pix_generated`, que usa `pending` em vez de `waiting_payment`.

Esta correção de 1 linha garante conformidade total com a especificação oficial.
