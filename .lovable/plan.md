
Objetivo: corrigir definitivamente o erro 500 ao desconectar Mercado Pago, eliminando a causa raiz (“integrationId” não-UUID = “mercadopago”) e blindando o backend contra payload inválido.

## Diagnóstico (Root Cause Only)

Os logs do Edge Function mostram repetidamente:

- `invalid input syntax for type uuid: "mercadopago"` (Postgres `22P02`)

Isso acontece porque o frontend está chamando:

```ts
api.call('integration-management', { action: 'disconnect', integrationId: 'mercadopago' })
```

Mas `integrationId` deveria ser um UUID da tabela `vendor_integrations.id`. Hoje, no módulo Financeiro, o `connectionStatus.id` é **GatewayId** (`'mercadopago'`), não o UUID do registro. O ConfigForm do Mercado Pago deriva `integration.id = connectionStatus.id`, e repassa isso para `handleDisconnect(integration?.id)`.

Portanto:
- O backend faz `.eq("id", integrationId)` esperando UUID
- recebe `"mercadopago"`
- Postgres explode com `22P02`
- vira 500 na UI

## Análise de Soluções (RISE V3)

### Solução A: Corrigir contrato (frontend usa integrationType) + Validação forte no backend (uuid/type)
- Manutenibilidade: 10/10
- Zero DT: 10/10
- Arquitetura: 10/10
- Escalabilidade: 10/10
- Segurança: 10/10
- **NOTA FINAL: 10.0/10**
- Tempo estimado: 45–90 min (inclui testes)

### Solução B: Backend “tolerante” (se integrationId não for UUID, interpretar como GatewayId e mapear)
- Manutenibilidade: 7/10 (contrato fica ambíguo)
- Zero DT: 6/10 (permite bug continuar existindo no caller)
- Arquitetura: 7/10 (mistura “id” e “type” no mesmo campo)
- Escalabilidade: 7/10
- Segurança: 10/10
- **NOTA FINAL: 7.2/10**
- Tempo estimado: 30–60 min

## DECISÃO: Solução A (10.0/10)

A solução A é superior porque corrige o contrato (SSOT) e ainda impede que payload inválido volte a virar 500, transformando em erro 400 explícito (diagnóstico imediato).

---

## Implementação (passo a passo)

### 1) Frontend: Mercado Pago deve desconectar por `integrationType`, não por `integrationId`

**Arquivo 1:** `src/integrations/gateways/mercadopago/hooks/useMercadoPagoConnection.ts`
- Alterar a assinatura:
  - de: `handleDisconnect(integrationId: string | undefined)`
  - para: `handleDisconnect(): Promise<void>`
- Remover a validação “integração não encontrada” baseada em `integrationId`
- Chamar o Edge Function com:
  - `action: 'disconnect'`
  - `integrationType: 'MERCADOPAGO'`

Motivo: `vendor_integrations` é naturalmente endereçável por `(vendor_id, integration_type)`. Isso evita expor UUID interno na UI e não depende do Financeiro carregar `vendor_integrations.id`.

**Arquivo 2:** `src/integrations/gateways/mercadopago/components/ConfigForm.tsx`
- Trocar:
  - `await handleDisconnect(integration?.id);`
  - por:
  - `await handleDisconnect();`
- (Opcional, mas recomendado) Ajustar `deriveStateFromConnectionStatus` para não chamar o campo de “integration.id” se ele não é UUID (pode manter, desde que não seja usado como id de DB).

Resultado: o payload enviado deixará de ter `integrationId: "mercadopago"`.

---

### 2) Backend: blindar `handleDisconnect` contra `integrationId` inválido (não-UUID) e contra `integrationType` inválido

**Arquivo:** `supabase/functions/_shared/integration-handlers.ts`

Mudanças:
1. Criar helper `isUuid(value: string): boolean` (regex UUID v4/v1 genérico, aceitando padrões padrão do Postgres).
2. Se `integrationId` existir:
   - Se NÃO for UUID: retornar **400** com mensagem clara (“integrationId inválido; esperado UUID”)
   - Se for UUID: seguir fluxo atual
3. Se usar `integrationType`:
   - Normalizar para uppercase (`integrationType.toUpperCase()`)
   - Validar contra o conjunto permitido: `ASAAS | MERCADOPAGO | PUSHINPAY | STRIPE`
   - Se inválido: retornar **400**

Resultado: mesmo que algum lugar do frontend volte a mandar “mercadopago” como `integrationId`, isso nunca mais vira 500; vira 400 e aponta a origem do bug.

---

### 3) Teste automatizado (anti-regressão)

Adicionar teste Deno para garantir que `integration-management` não retorna 500 com `integrationId` inválido.

**Arquivo (novo):** `supabase/functions/integration-management/index_test.ts` (ou `integration-management.test.ts`)
- Carregar dotenv conforme guideline
- Executar POST para a Edge Function `integration-management` com body:
  - `{ action: "disconnect", integrationId: "mercadopago" }`
- Assert:
  - status === 400
  - body contém mensagem de erro esperada
- Importante: consumir response body (`await res.text()`)

Observação: este teste não precisa autenticar se a função exige auth? No seu caso, `integration-management` usa `getAuthenticatedProducer`. Então o teste deve:
- ou usar um token válido (se viável no ambiente),
- ou focar em uma rota pública não autenticada (não existe aqui),
- ou então fazer o teste em nível de handler com SupabaseClient mock (mais complexo).
  
Escolha (melhor): **teste de handler com mock minimalista** do SupabaseClient para o caminho “integrationId inválido”, porque esse caminho retorna 400 antes de qualquer query real. Assim o teste fica determinístico e não depende de sessão.

---

### 4) Verificação pós-implementação (com prova)

Checklist:
1. UI: clicar “Desconectar” no Mercado Pago deve:
   - não gerar 500
   - desativar a integração (active=false) e limpar config
2. Logs: `integration-management` deve registrar action disconnect sem erro `22P02`.
3. Se alguém mandar `integrationId: "mercadopago"` manualmente:
   - retorno 400, não 500.

---

## Mudanças por arquivo

- `src/integrations/gateways/mercadopago/hooks/useMercadoPagoConnection.ts` (modificar)
- `src/integrations/gateways/mercadopago/components/ConfigForm.tsx` (modificar)
- `supabase/functions/_shared/integration-handlers.ts` (modificar)
- `supabase/functions/integration-management/index_test.ts` (criar) — teste de regressão

---

## Resultado esperado

- Desconectar Mercado Pago funciona sempre.
- Bug de “GatewayId usado como UUID” é eliminado na origem (frontend).
- Backend fica imune a payload inválido, evitando 500 (falha segura com 400).
