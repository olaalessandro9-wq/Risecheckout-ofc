
# Plano: Corrigir Payload de Teste UTMify

## Diagnóstico

A API UTMify retornou **HTTP 400** com mensagem:
```json
{"approvedDate":"approvedDate is a required field"}
```

O problema está na Edge Function `utmify-validate-credentials/index.ts` (linhas 155-193), onde o `testPayload` enviado para testar o token **NÃO inclui** o campo `approvedDate`.

---

## Análise de Soluções

### Solução A: Adicionar apenas `approvedDate` ao testPayload
- Manutenibilidade: 10/10 (correção cirúrgica)
- Zero DT: 10/10 (resolve o problema definitivamente)
- Arquitetura: 10/10 (segue o padrão existente)
- Escalabilidade: 10/10 (nenhuma alteração estrutural)
- Segurança: 10/10 (mantém isTest: true)
- **NOTA FINAL: 10.0/10**
- Tempo estimado: 5 minutos

### Solução B: Usar o buildUTMifyPayload() centralizado
- Manutenibilidade: 9/10 (DRY, mas acoplamento desnecessário)
- Zero DT: 10/10 (funciona)
- Arquitetura: 8/10 (overengineering para um teste simples)
- Escalabilidade: 9/10 (mais genérico)
- Segurança: 10/10
- **NOTA FINAL: 9.2/10**
- Tempo estimado: 15 minutos

### DECISÃO: Solução A (Nota 10.0)
A correção pontual é preferível porque o testPayload é propositalmente minimalista para testes. Adicionar apenas os campos obrigatórios mantém o payload de teste leve e de rápida execução.

---

## Correção Técnica

### Arquivo: `supabase/functions/utmify-validate-credentials/index.ts`

**Localização:** Linhas 155-193 (testPayload)

**Alteração:** Adicionar campo `approvedDate` com mesmo formato de `createdAt`

```typescript
// ANTES (linhas 155-161):
const testPayload = {
  orderId: `test_${Date.now()}`,
  platform: PLATFORM_NAME,
  paymentMethod: "pix",
  status: "waiting_payment",
  createdAt: new Date().toISOString().replace("T", " ").slice(0, 19),
  // ❌ approvedDate AUSENTE

// DEPOIS:
const testPayload = {
  orderId: `test_${Date.now()}`,
  platform: PLATFORM_NAME,
  paymentMethod: "pix",
  status: "waiting_payment",
  createdAt: new Date().toISOString().replace("T", " ").slice(0, 19),
  approvedDate: new Date().toISOString().replace("T", " ").slice(0, 19), // ✅ ADICIONADO
  refundedAt: null, // ✅ Explícito para consistência
```

---

## Fluxo Após Correção

```text
┌─────────────────────────────────────────────────────────────────┐
│  1. Usuário clica "Validar Credenciais"                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. Edge Function constrói testPayload COM approvedDate         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. API UTMify valida schema → OK (passa)                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. Se token válido → HTTP 200/201 → "Credenciais Válidas" ✅   │
│  Se token inválido → HTTP 401 → "Token inválido"                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Arquivos a Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `supabase/functions/utmify-validate-credentials/index.ts` | MODIFICAR | Adicionar `approvedDate` e `refundedAt` ao testPayload |

---

## Validação

Após a correção:
1. Deploy da Edge Function
2. Usuário clica "Validar Credenciais"
3. Se o token `lUDu0mzMbURWqgdtyva60EMeTJROqRBLtTIt` for válido, retornará HTTP 200
4. Dialog mostrará "Credenciais Válidas" com fingerprint e detalhes
