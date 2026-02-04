
## Diagnóstico (Root Cause – confirmado no código)

O comportamento que você descreveu (“mesmo e-mail gera um PIX, volta ao checkout, gera outro PIX e o UTMify não mostra um novo `pix_generated`”) é explicado por **idempotência errada no `create-order`**.

Hoje, o backend **reaproveita o mesmo `order_id`** quando considera que “é o mesmo pedido” dentro de uma janela de 5 minutos. Isso acontece aqui:

- Arquivo: `supabase/functions/create-order/handlers/order-creator.ts`
- Trecho (linhas ~131–167):

```ts
// Verificar idempotência (pedidos duplicados)
const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

const { data: existingOrders } = await supabase
  .from("orders")
  .select("id, status, created_at")
  .eq("customer_email", customer_email)
  .eq("offer_id", validatedOfferId || product_id)
  .eq("amount_cents", amountInCents)
  .gte("created_at", fiveMinutesAgo)
  .limit(1);

if (existingOrders && existingOrders.length > 0) {
  return Response({ order_id: existing.id, duplicate: true })
}
```

Isso significa que:
- Mesmo e-mail + mesma oferta + mesmo valor + dentro de 5 minutos
- `create-order` **não cria um novo pedido** → retorna o mesmo `order_id`
- Em seguida, o gateway gera “outro PIX”, mas **para o mesmo orderId**
- A UTMify, por especificação, trata `orderId` como identificador único do pedido (ela faz “upsert/atualização do mesmo pedido”), então **não aparece um “novo pedido pendente”** no dashboard.

Você testou concorrentes e faz sentido: **checkout bom não deduplica pedido por e-mail**. Ele deduplica por **idempotency key do clique/attempt**, não por heurística.

---

## O que você quer (e é correto)

- “Gerou outro PIX” deve significar **outro attempt/pedido** para tracking.
- Logo, precisa existir **outro `order_id`**.
- A UTMify só vai registrar “mais um pix_generated” como “mais um pedido pendente” se o `orderId` for diferente. Isso não é opinião: é o contrato do modelo deles (orderId é chave).

---

## Análise de Soluções (RISE V3 – obrigatório)

### Solução A: Remover idempotência por e-mail/oferta/valor (sempre criar novo order)
- Manutenibilidade: 6/10 (resolve o sintoma, mas abre porta para duplicação por double-click/retry de rede)
- Zero DT: 4/10 (vai gerar pedidos duplicados acidentais; depois vira caos de conciliação)
- Arquitetura: 6/10 (sem idempotência correta é anti-padrão em checkout)
- Escalabilidade: 5/10 (duplicação explode custo operacional)
- Segurança: 9/10
- **NOTA FINAL: 5.9/10**

### Solução B: Idempotência correta por “Order Attempt Key” (client-generated) + persistência no backend (SSOT)
Implementar **idempotency key por tentativa**, não por e-mail.
- Manutenibilidade: 10/10 (padrão de indústria; comportamento previsível)
- Zero DT: 10/10 (elimina duplicação acidental e elimina dedupe errada)
- Arquitetura: 10/10 (Clean: tentativa explícita; sem heurística frágil)
- Escalabilidade: 10/10 (funciona com múltiplas instâncias/concorrência)
- Segurança: 10/10
- **NOTA FINAL: 10.0/10**

### Solução C: Manter heurística de 5 min e criar um “force_new_order=true”
- Manutenibilidade: 5/10 (regra escondida, branch extra, casos inconsistentes)
- Zero DT: 4/10 (vira matriz de exceções)
- Arquitetura: 5/10
- Escalabilidade: 6/10
- Segurança: 10/10
- **NOTA FINAL: 5.5/10**

### DECISÃO: Solução B (Nota 10.0/10)
A deduplicação por e-mail é conceitualmente errada para checkout e conflita diretamente com o tracking UTMify baseado em `orderId`. A solução de nota máxima é trocar para idempotência por tentativa (idempotency key).

---

## Implementação (Plano detalhado)

### Fase 0 — Critério de Aceite (o que vai mudar visivelmente)
Após a implementação:
1. Mesmo e-mail pode gerar **2 pedidos pendentes** seguidos (2 `order_id` diferentes).
2. A UTMify deve mostrar **2 registros** “waiting_payment” se ambos foram criados.
3. Double-click / retry de rede no mesmo clique **não cria pedido duplicado** (retorna o mesmo order_id do attempt).

---

### Fase 1 — Banco de Dados (migração)
Objetivo: persistir “tentativa de criação de pedido” de forma idempotente e auditável.

**Opção escolhida (nota 10/10):** adicionar uma coluna de idempotência no próprio `orders` + índice único parcial (sem tabela extra), porque:
- cria 1 fonte de verdade por pedido
- não adiciona crescimento infinito de uma tabela de tentativas
- resolve o problema 100% com complexidade mínima e máxima robustez

#### 1.1 Adicionar coluna `orders.idempotency_key`
- Coluna: `idempotency_key uuid null`
- Índice: `unique` **apenas quando não for null**

SQL (migration):
```sql
alter table public.orders
  add column if not exists idempotency_key uuid;

create unique index if not exists orders_idempotency_key_uq
  on public.orders (idempotency_key)
  where idempotency_key is not null;

comment on column public.orders.idempotency_key is
  'Idempotency key generated per checkout submission attempt. Prevents accidental duplicate order creation; must NOT dedupe by email.';
```

Observação RISE: manter `null` para pedidos legados, sem backfill forçado.

---

### Fase 2 — Frontend (gerar idempotency key por tentativa)
Objetivo: cada clique real de “Gerar PIX” cria **um novo attempt** → um novo `idempotency_key`.

#### 2.1 Adicionar `orderAttemptKey` ao contexto da máquina XState
Arquivos:
- `src/modules/checkout-public/machines/checkoutPublicMachine.types.ts` (adicionar campo no `CheckoutPublicContext`)
- `src/modules/checkout-public/machines/checkoutPublicMachine.context.ts` (inicializar como `null`)

#### 2.2 Gerar uma nova chave ao enviar `SUBMIT`
No `checkoutPublicMachine.ts`, na transição do evento `SUBMIT` (onde já existe `assign(...)`):
- setar `orderAttemptKey = crypto.randomUUID()`

Regra:
- sempre que o usuário realmente submeter um novo pedido, gera outra.
- se houver retry automático dentro do mesmo submit (ex.: falha de rede com retry), a chave deve ser **a mesma** daquele attempt.
  - Para isso, manter a chave no contexto enquanto o submit estiver “em progresso/erro” e só gerar outra quando o usuário voltar a submeter “um novo pedido”.

#### 2.3 Enviar `idempotency_key` no payload do `create-order`
Arquivos:
- `src/modules/checkout-public/machines/checkoutPublicMachine.inputs.ts` (incluir `idempotency_key: context.orderAttemptKey`)
- `src/modules/checkout-public/machines/actors/createOrderActor.ts` (incluir no payload)

---

### Fase 3 — Backend `create-order` (usar idempotency_key corretamente)
Objetivo: parar de deduplicar por e-mail/oferta/valor e deduplicar apenas por `idempotency_key`.

#### 3.1 Validar `idempotency_key` na camada de validação
Arquivo:
- `supabase/functions/_shared/validators.ts`

Mudanças:
- Incluir `idempotency_key` em `CreateOrderInput`
- Tornar obrigatório (ou obrigatório quando presente; recomendado: obrigatório para chamadas do checkout)
- Validar como UUID

#### 3.2 Remover heurística de 5 minutos por e-mail
Arquivo:
- `supabase/functions/create-order/handlers/order-creator.ts`

Substituir o bloco de “Verificar idempotência (pedidos duplicados)” por:
- `select id, access_token from orders where idempotency_key = input.idempotency_key`
- se existir: retornar o mesmo `order_id` e `access_token`
- se não existir: inserir um novo pedido com `idempotency_key`

Isso garante:
- Mesmo e-mail pode criar infinitos pedidos
- Apenas o mesmo attempt (mesma chave) é idempotente

#### 3.3 Persistir `idempotency_key` ao inserir `orders`
Ainda em `order-creator.ts`, no `.insert({ ... })`, incluir:
- `idempotency_key: input.idempotency_key`

---

### Fase 4 — Tracking UTMify (resultado esperado)
Com o `order_id` sempre novo por tentativa:
- a Edge Function do gateway vai disparar `dispatchUTMifyEventForOrder(..., "pix_generated")` para **um orderId novo**
- o payload para a UTMify terá `status = waiting_payment` (já corrigido)
- a UTMify terá base para registrar **mais de um pendente** para o mesmo e-mail, como concorrentes.

---

### Fase 5 — Testes (obrigatório, RISE V3)
#### 5.1 Testes de Edge Function (Deno)
Atualizar/Adicionar testes em:
- `supabase/functions/create-order/tests/`

Casos:
1. Mesmo `idempotency_key` → retorna mesmo `order_id`
2. Mesmo e-mail/offer/amount com **idempotency_key diferente** → cria **novo** order_id
3. Requisição com idempotency_key inválida → 400

#### 5.2 Teste E2E manual (fluxo real)
Checklist:
1. Gerar PIX com `alessanderlaem@gmail.com` (pedido A) → aparece na UTMify
2. Voltar ao checkout e gerar outro PIX com mesmo e-mail (pedido B) → deve aparecer também
3. Conferir no banco: 2 linhas em `orders` com ids diferentes
4. Conferir logs do gateway: 2 chamadas `Disparando UTMify pix_generated`

---

## Arquivos que serão modificados

### Frontend
- `src/modules/checkout-public/machines/checkoutPublicMachine.types.ts`
- `src/modules/checkout-public/machines/checkoutPublicMachine.context.ts`
- `src/modules/checkout-public/machines/checkoutPublicMachine.ts`
- `src/modules/checkout-public/machines/checkoutPublicMachine.inputs.ts`
- `src/modules/checkout-public/machines/actors/createOrderActor.ts`

### Backend (Edge)
- `supabase/functions/_shared/validators.ts`
- `supabase/functions/create-order/index.ts` (somente para plugar o novo campo se necessário no flow)
- `supabase/functions/create-order/handlers/order-creator.ts`

### Banco
- `supabase/migrations/<timestamp>_orders_idempotency_key.sql`

---

## Nota final de conformidade com o seu requisito

- Você não quer “um PIX por e-mail”: correto.
- O que está acontecendo hoje é uma consequência direta de um design errado (idempotência heurística).
- A solução proposta muda o modelo para o padrão correto: **1 submit attempt = 1 pedido (orderId único)**, mantendo idempotência real para evitar duplicação acidental.
- Isso alinha perfeitamente com como a UTMify enxerga o mundo: `orderId` é a chave, e um “novo PIX gerado” que você quer contar precisa ser um “novo pedido” (novo orderId).

