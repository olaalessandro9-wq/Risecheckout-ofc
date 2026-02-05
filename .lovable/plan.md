
## Objetivo (o que você pediu)
1) A logo no topo do email “Compra Confirmada” precisa **preencher completamente o espaço do header** (estilo “banner 100% coberto”, como no template PIX).
2) O email **não pode voltar a aparecer “Mostrar conteúdo cortado”** no Gmail.

## Diagnóstico (o que o código mostrou)
- O template **PIX** já aplica um padrão de header “anti-clipping” e “banner-like”:
  - `.header { padding: 0; line-height: 0; }`
  - `img { width: 100%; ... }`
  - `width="400"` no `<img>`
- O template **Purchase** atualmente:
  - tem `padding: 40px 20px` no header (cria “moldura” e reduz sensação de banner),
  - **não tem `width="400"`** no `<img>` (inclusive existe teste esperando isso),
  - não usa `width: 100%` no CSS do `<img>`, então ele nunca “cobre” 100% do header (ele só cresce até o `max-width`).
- O “Mostrar conteúdo cortado” do Gmail é sintoma clássico de **mensagem grande demais / heurísticas do provedor**. Como a alteração foi mínima (180 → 300), isso sugere que:
  - ou já estávamos “no limite” por algum fator externo ao template,
  - ou o problema está na forma de **preview** (assunto fixo, repetição, metadados do provedor, etc).
- O preview de emails (`supabase/functions/email-preview/index.ts`) usa **ZeptoMail** e manda sempre o mesmo subject:
  - `"[PREVIEW] Compra Confirmada - Rise Checkout"`
  - isso piora testes porque o Gmail pode agrupar/consolidar e você perde controle do que está vendo.

## Análise de Soluções (RISE V3)

### Solução A: Só aumentar max-width da logo (o que já fizemos)
- Manutenibilidade: 4/10 (tuning infinito)
- Zero DT: 4/10 (não cria regra estável)
- Arquitetura: 5/10 (não alinha com padrão PIX que funciona)
- Escalabilidade: 3/10
- Segurança: 10/10
- **NOTA FINAL: 4.8/10**

### Solução B: Copiar o header do PIX para o Purchase (CSS + width attr) e parar aí
- Manutenibilidade: 8/10 (padrão comprovado em produção do próprio projeto)
- Zero DT: 8/10 (reduz “tentativa e erro”)
- Arquitetura: 9/10 (convergência de padrões internos)
- Escalabilidade: 8/10
- Segurança: 10/10
- **NOTA FINAL: 8.6/10**

### Solução C (melhor): Padronizar header do Purchase + criar “Email Size Budget Guard” no preview (minificação/medição) + subject único por envio
- Manutenibilidade: 10/10 (causa raiz: previsibilidade e observabilidade)
- Zero DT: 10/10 (evita regressão silenciosa)
- Arquitetura: 10/10 (pipeline robusto de render → validar → enviar)
- Escalabilidade: 10/10 (qualquer template fica protegido)
- Segurança: 10/10
- **NOTA FINAL: 10.0/10**

### DECISÃO: Solução C (10.0/10)

---

## Implementação (passo a passo)

### 1) Ajustar o header do template de compra para comportamento “banner 100% coberto” (igual ao PIX)
**Arquivo:** `supabase/functions/_shared/email-templates-purchase.ts`

Mudanças propostas:
- Trocar:
  - `.header { padding: 40px 20px; ... }`
  - por:
  - `.header { text-align:center; padding: 0; line-height: 0; background-color: #fff; }`
- Trocar CSS da imagem para:
  - `.header img { display:block; width: 100%; max-width: 600px; height:auto; margin: 0 auto; }`
- Adicionar `width="600"` (ou `width="400"` se quisermos manter “regra do 400” do projeto; como o container é 600, eu prefiro `600` para “cobrir” de verdade).
  - Ex.: `<img src="..." alt="Rise Checkout" width="600">`

Resultado esperado:
- A logo passa a “encostar” nas laterais do header (dentro do container 600px), sem borda/padding.
- Visualmente igual ao comportamento do banner no PIX.

### 2) Criar um “Email Rendering Guard” (tamanho/validação) para impedir regressões de clipping
**Novo arquivo (shared):** `supabase/functions/_shared/email-rendering.ts` (ou nome equivalente)
Responsabilidades:
- `minifyEmailHtml(html: string): string`
  - remove whitespace “seguro” (quebras de linha repetidas, espaços entre tags) sem quebrar o HTML.
- `getEmailByteLength(html: string): number`
  - calcula bytes (TextEncoder) para medir o que realmente vai pro provedor.
- `assertUnderGmailClipLimit(html: string, context: { template: string; subject: string })`
  - define limite (ex.: warning > 80KB, hard fail > 95KB) para manter margem do Gmail (102KB).
  - se exceder: log detalhado + bloquear envio no preview com mensagem clara (“Template excedeu o limite: X bytes”).

Isso garante:
- se algum template crescer por acidente (QR base64, tracking, HTML duplicado), a falha fica explícita.

### 3) Aplicar o guard no email-preview (onde você está testando)
**Arquivo:** `supabase/functions/email-preview/index.ts`
- Após `processTemplate()`:
  - minificar `htmlBody`
  - medir bytes e validar limite
- Ajustar subject para ser **único por envio** para evitar confusão de thread/testes:
  - Ex.: `"[PREVIEW] Compra Confirmada - Rise Checkout • 2026-02-05 11:42:10"`
  - (ou suffix com `Date.now()`)

### 4) Testes (para garantir que nunca mais volta)
**Arquivo de testes existente:** `supabase/functions/_shared/email-templates-purchase.test.ts`
- Corrigir/alinhar o template para passar o teste de `width="400"` (ou atualizar o teste para `width="600"` se decidirmos 600).
- Adicionar teste de “tamanho máximo”:
  - Renderizar HTML e validar que `byteLength < 50_000` (exemplo conservador).

Opcional (recomendado):
- Adicionar testes do guard em `email-preview` (unit) para garantir que falha quando excede.

### 5) Deploy e verificação end-to-end
- Deploy das edge functions afetadas:
  - `email-preview`
  - (se necessário) `send-confirmation-email` (não é o seu fluxo de preview, mas vale manter padrão)
- Teste no Gmail:
  1) Enviar 1 preview de “Compra Confirmada”
  2) Confirmar:
     - logo ocupando 100% do header (como PIX)
     - ausência de “Mostrar conteúdo cortado”
  3) Enviar 3 previews seguidos e confirmar que cada um chega com subject único e continua sem clipping.

---

## Riscos & Mitigações
- **Risco:** minificação agressiva quebrar HTML.
  - **Mitigação:** minificador conservador (não mexer dentro de `<style>` e não remover espaços entre palavras), + testes de “contém tags essenciais”.
- **Risco:** escolher `width="600"` pode divergir do “width=400” citado em memórias.
  - **Mitigação:** alinhar com regra do container: `width="600"` é semanticamente correto para “cobrir 100%”; se preferir manter regra histórica, usamos `width="400"` e `max-width: 600` + `width:100%` (a imagem continuará cobrindo, limitada pelo próprio asset).

---

## Entregáveis (o que vai mudar no repo)
- Editar: `supabase/functions/_shared/email-templates-purchase.ts` (header “banner-like” + width attr)
- Criar: `supabase/functions/_shared/email-rendering.ts` (minify + byte-length + guard)
- Editar: `supabase/functions/email-preview/index.ts` (subject único + guard)
- Editar: `supabase/functions/_shared/email-templates-purchase.test.ts` (assert width + teste de size budget)

