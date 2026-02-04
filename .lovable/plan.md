
## Objetivo (sem suposições, com prova técnica)

Você está certo em exigir foco no código. Eu encontrei **um bug objetivo e reproduzível** que impede o disparo dos eventos UTMify via backend, **independente do token**:

- O módulo **`_shared/utmify-dispatcher.ts`** e o handler **`checkout-public-data/handlers/order-handler.ts`** fazem `SELECT utm_source, utm_campaign, src, sck...` na tabela `orders`.
- **Essas colunas NÃO EXISTEM** no schema atual da tabela `orders`.
- Resultado: o Supabase retorna erro SQL (ex.: `column "src" does not exist`), e o dispatcher trata qualquer erro como “pedido não encontrado”, **pulando o envio**.

Isso explica por que os eventos “não disparam”: **o backend não chega nem a chamar a API da UTMify** na maioria dos fluxos.

Além disso, há um segundo gap real:
- **MercadoPago** hoje **não dispara `pix_generated`** no momento de criação do PIX (`mercadopago-create-payment`), enquanto PushinPay/Asaas/Stripe já disparam.

E há um terceiro ponto de correção:
- O filtro por produto no dispatcher considera apenas o **primeiro item** do pedido; pedidos com 2 itens (produto + bump) podem ser filtrados incorretamente.

---

## Limite de comunicação (necessário)
Eu vou continuar resolvendo o problema com profundidade e sem “chutar”, mas **não vou interagir sob insultos/ameaças**. Mantendo o foco técnico e o respeito mínimo, seguimos.

---

## Análise de Soluções (RISE V3 — obrigatório)

### Solução A: Persistir tracking no `orders` + alinhar queries + corrigir dispatch MercadoPago + filtro multi-itens (recomendado)
- Manutenibilidade: 10/10 (schema explícito, leitura simples em todo o backend)
- Zero DT: 10/10 (remove causa raiz + elimina falsos “order_not_found”)
- Arquitetura: 9.8/10 (dados de tracking ficam no domínio Order; SSOT real)
- Escalabilidade: 10/10 (sem joins caros; indexável)
- Segurança: 10/10 (sem secrets no frontend; só params UTM)
- **NOTA FINAL: 9.96/10**
- Tempo estimado: 1–2 dias (inclui testes + migração)

### Solução B: Criar tabela `order_tracking_parameters` e fazer join no dispatcher
- Manutenibilidade: 9/10 (modelo mais “normalizado”, mas adiciona join e sincronização)
- Zero DT: 9/10 (bom, mas aumenta superfície de bugs de consistência)
- Arquitetura: 10/10 (separação formal)
- Escalabilidade: 9/10 (join frequente nos webhooks)
- Segurança: 10/10
- **NOTA FINAL: 9.4/10**

### Solução C: Tentar inferir UTM a partir de `checkout_visits` (sem salvar no pedido)
- Manutenibilidade: 4/10 (heurística; sem vínculo forte com order)
- Zero DT: 3/10 (eventos errados em tráfego real)
- Arquitetura: 5/10
- Escalabilidade: 6/10
- Segurança: 10/10
- **NOTA FINAL: 5.6/10**

### DECISÃO: Solução A (9.96/10)
É a única que elimina a causa raiz (schema mismatch) e transforma o backend SSOT em algo que funciona em qualquer gateway e evento.

---

## O que será verdade após a correção (respostas objetivas)

### 1) “Se eu desmarcar purchase_approved, não envia venda aprovada?”
Sim. A lógica atual em `isEventEnabled()` já respeita `selected_events`.  
Após a correção, isso continuará verdadeiro e será testado.

### 2) “Todos gateways disparam eventos corretamente?”
- PushinPay: `pix_generated` já integrado; `purchase_approved/refund/chargeback` via flows atuais.
- Asaas: `pix_generated` já integrado.
- Stripe: `pix_generated` já integrado.
- MercadoPago: **falta `pix_generated` no create PIX** (será implementado).
- Compra recusada: já há chamadas no `stripe-webhook` e `mercadopago-webhook`.

### 3) “O problema é o código?”
Sim: hoje o backend SSOT está quebrado porque lê colunas inexistentes em `orders`. Isso é 100% código/schema.

---

## Plano de Implementação (passo a passo)

### Fase 1 — Corrigir a causa raiz: Schema e persistência de tracking no pedido

1) **Migração SQL: adicionar colunas UTM na tabela `orders`**
   - Adicionar colunas (todas `text null`):
     - `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `src`, `sck`
   - (Opcional, recomendado) índice parcial em `vendor_id` + `created_at` já existe via queries comuns; para UTM não é crítico agora.

2) **Frontend: enviar tracking parameters no create-order**
   - Em `src/modules/checkout-public/machines/actors/createOrderActor.ts`:
     - usar `extractUTMParameters()` (já existe em `src/integrations/tracking/utmify/utils.ts`)
     - incluir no payload:
       - `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `src`, `sck`
   - Atualizar/expandir testes em `createOrderActor.test.ts` para garantir que o payload inclui os campos.

3) **Backend: aceitar e validar tracking no create-order**
   - Em `supabase/functions/_shared/validators.ts`:
     - estender `CreateOrderInput` e `validateCreateOrderInput` para aceitar os campos UTM (strings opcionais, com trim, e tamanho máximo).
   - Em `supabase/functions/create-order/index.ts`:
     - extrair os novos campos do payload validado.
   - Em `supabase/functions/create-order/handlers/order-creator.ts`:
     - incluir as colunas no `.insert({ ... })` da tabela `orders`.

Resultado: qualquer pedido novo terá tracking persistido no banco, e o backend consegue montar payload UTMify sem depender do frontend.

---

### Fase 2 — Consertar o dispatcher e o success handler (parar de falhar silenciosamente)

4) **`utmify-dispatcher.ts`: corrigir o SELECT e logs de erro**
   - Em `fetchOrderForUTMify()`:
     - manter o `select` somente com colunas que existem (agora existirão após migração).
   - Melhorar o log quando houver `error`:
     - logar `error.message` e `error.code` (sem dados sensíveis) em vez de “Pedido não encontrado”.

5) **`checkout-public-data/handlers/order-handler.ts`: corrigir SELECT e normalização de status**
   - Atualizar o `select` para colunas existentes (após migração).
   - Ajustar `isPaid` para trabalhar com status normalizado (`paid`/`PAID`), evitando falso negativo.

---

### Fase 3 — Garantir paridade total: MercadoPago `pix_generated`

6) **`supabase/functions/mercadopago-create-payment/index.ts`**
   - Após atualizar `orders` com `pix_qr_code`/`pix_id`/`pix_status`, disparar:
     - `dispatchUTMifyEventForOrder(supabase, orderId, "pix_generated")`
   - Garantir que:
     - só dispare quando `paymentMethod === 'pix'` e houver QR code.
     - logue claramente: enviado / pulado / erro.

---

### Fase 4 — Filtro por produto correto (multi-itens)

7) **Corrigir filtro por produto no dispatcher**
   - Hoje: `dispatchUTMifyEventForOrder()` passa apenas `order.order_items?.[0]?.product_id`
   - Novo: passar **todos** `product_id` dos itens e considerar habilitado se houver interseção com `selected_products`
   - Com isso:
     - pedidos com bump não serão erroneamente bloqueados por “primeiro item não selecionado”.

---

### Fase 5 — Token: tornar impossível “estar certo e falhar por formatação” (sem culpar usuário)

8) **Normalização determinística do token (sem expor)**
   - Em `vault-save/index.ts`:
     - para UTMIFY: aplicar sanitização segura (trim + remoção de `\r\n\t` + remoção de aspas envolventes `"token"`)
   - Em `_shared/utmify-dispatcher.ts` e `utmify-conversion/index.ts`:
     - repetir normalização defensiva ao ler do Vault.
     - adicionar logs **não sensíveis**:
       - `tokenLength`, `containsWhitespace`, `containsZeroWidth` (boolean)
       - `tokenFingerprint`: SHA-256 do token (primeiros 8 chars do hash), para auditoria.
   - Isso não trata como “possibilidade”; é **hardening** para eliminar qualquer ambiguidade.

---

## Testes (obrigatórios)

9) **Unit tests / Integration tests**
   - Atualizar/adicionar testes para:
     - `validateCreateOrderInput` aceitar e normalizar UTM fields.
     - `utmify-dispatcher` respeitar `selected_events` (desmarcou `purchase_approved` → skip `not_enabled`).
     - filtro por produtos com múltiplos itens (1 selecionado + 1 não selecionado → deve enviar).
     - MercadoPago PIX cria `pix_generated` (mock).

10) **Teste end-to-end manual**
   - Gerar PIX em MercadoPago e confirmar:
     - log de `pix_generated` no edge function.
   - Aprovar pagamento e confirmar:
     - `purchase_approved` disparado (ou pulado se desmarcado no painel).
   - Executar reembolso/chargeback (quando aplicável) e confirmar logs.

---

## Arquivos que serão alterados/criados

### Alterações (frontend)
- `src/modules/checkout-public/machines/actors/createOrderActor.ts`
- `src/modules/checkout-public/machines/actors/__tests__/createOrderActor.test.ts` (se existir cobertura para payload)

### Alterações (edge functions)
- `supabase/functions/_shared/validators.ts`
- `supabase/functions/create-order/index.ts`
- `supabase/functions/create-order/handlers/order-creator.ts`
- `supabase/functions/_shared/utmify-dispatcher.ts`
- `supabase/functions/utmify-conversion/index.ts` (normalização + fingerprint)
- `supabase/functions/checkout-public-data/handlers/order-handler.ts`
- `supabase/functions/mercadopago-create-payment/index.ts`
- `supabase/functions/vault-save/index.ts`

### Migração (DB)
- Novo arquivo em `supabase/migrations/` adicionando colunas em `orders`:
  - `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `src`, `sck`

---

## Critérios de Aceite (binários)

1) Criar pedido via checkout → linhas em `orders` devem conter UTM fields (mesmo que null).
2) `utmify-dispatcher` não pode mais logar “Pedido não encontrado” por erro de coluna inexistente.
3) MercadoPago PIX deve disparar `pix_generated` (quando habilitado).
4) Desmarcar `purchase_approved` no painel UTMify → `purchase_approved` deve ser pulado com reason `not_enabled`.
5) Pedido com 2 itens (produto + bump) deve respeitar seleção por interseção (não “primeiro item apenas”).

