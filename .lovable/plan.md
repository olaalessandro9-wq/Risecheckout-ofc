

# Implementacao do Pixel UTMify Frontend: Evento InitiateCheckout

## Diagnostico da Raiz

O relatorio do Manus/Gemini esta correto no diagnostico. A integracao UTMify do RiseCheckout esta **arquiteturalmente incompleta**:

- **Backend (SSOT)**: Funciona corretamente. Eventos transacionais (purchase_approved, pix_generated, refund, chargeback) sao disparados via `_shared/utmify/dispatcher.ts` nos webhooks de pagamento. Nenhuma alteracao necessaria.
- **Frontend (Pixel)**: NAO existe. O componente `Tracker.tsx` atual e **codigo morto** -- ele apenas loga uma mensagem e retorna `null`. Nao injeta nenhum script, nao dispara nenhum evento. Enquanto isso, TODOS os outros pixels (Facebook, TikTok, Google Ads, Kwai) possuem componentes `Pixel.tsx` que injetam scripts CDN e disparam eventos.

A consequencia direta: o evento `InitiateCheckout` (IC) -- um sinal comportamental critico para otimizacao de campanhas Facebook Ads via UTMify -- **nunca e disparado**.

### Por que o InitiateCheckout e diferente dos outros eventos?

| Tipo | Onde dispara | Exemplos |
|------|-------------|----------|
| Transacional | Backend (API S2S) | purchase_approved, refund, chargeback |
| Comportamental | Frontend (Pixel/Script) | InitiateCheckout, PageView |

A API backend da UTMify (`api.utmify.com.br/api-credentials/orders`) serve APENAS para eventos transacionais. O evento `InitiateCheckout` e comportamental e DEVE ser disparado pelo script frontend da UTMify (`cdn.utmify.com.br/scripts/utms/latest.js`) via `window.utmify('track', 'InitiateCheckout')`.

---

## Analise de Solucoes

### Solucao A: Criar `Pixel.tsx` seguindo o padrao dos outros pixels + remover `Tracker.tsx` (codigo morto)

Criar um componente `Pixel.tsx` que:
1. Injeta o script `https://cdn.utmify.com.br/scripts/utms/latest.js` no `<head>`
2. Dispara `window.utmify('track', 'InitiateCheckout')` apos o carregamento
3. Usa retry (polling com limite) para lidar com latencia de script
4. Adiciona atributos `data-utmify-prevent-xcod-sck` e `data-utmify-prevent-subids` para evitar conflito com o sistema proprio de captura de UTMs do RiseCheckout
5. Remove `Tracker.tsx` (codigo morto) e atualiza TrackingManager para usar `Pixel`

- Manutenibilidade: 10/10 (segue exatamente o padrao de Facebook.Pixel, TikTok.Pixel, Kwai.Pixel)
- Zero DT: 10/10 (remove codigo morto, componente auto-contido)
- Arquitetura: 10/10 (Single Responsibility, segue padrao existente, type-safe)
- Escalabilidade: 10/10 (facil adicionar novos eventos no futuro)
- Seguranca: 10/10 (nenhum token exposto -- o script CDN usa cookies, nao API key)
- **NOTA FINAL: 10.0/10**

### Solucao B: Modificar `Tracker.tsx` para adicionar a logica de pixel

Reaproveitar o componente existente e adicionar a injecao de script dentro dele.

- Manutenibilidade: 6/10 (mistura responsabilidades -- o nome "Tracker" nao comunica "injecao de script")
- Zero DT: 5/10 (nome inconsistente com os outros modulos que usam "Pixel")
- Arquitetura: 5/10 (quebra o padrao estabelecido -- todos os outros modulos tem Pixel.tsx)
- Escalabilidade: 7/10
- Seguranca: 10/10
- **NOTA FINAL: 6.2/10**

### DECISAO: Solucao A (Nota 10.0)

A Solucao B mantem inconsistencia de nomenclatura e viola o padrao arquitetural. A Solucao A segue o padrao existente (Facebook.Pixel, TikTok.Pixel, Kwai.Pixel), remove codigo morto, e resulta em uma arquitetura uniforme.

---

## Plano de Execucao

### Arquivo 1: `src/types/global.d.ts` -- EDITAR

Adicionar a declaracao de tipo para `window.utmify` na secao WINDOW GLOBAL DECLARATIONS, seguindo o padrao dos outros pixels:

```text
// ========== UTMIFY PIXEL ==========
/** Funcao principal do UTMify Pixel */
utmify?: UTMifyPixelFunction;
```

E adicionar a interface `UTMifyPixelFunction` na secao de tipos:

```text
// UTMIFY PIXEL TYPES
interface UTMifyPixelFunction {
  (method: 'track', eventName: string, params?: Record<string, unknown>): void;
  (...args: unknown[]): void;
}
```

### Arquivo 2: `src/integrations/tracking/utmify/Pixel.tsx` -- CRIAR (NOVO)

Componente seguindo o padrao exato de `Facebook/Pixel.tsx` e `Kwai/Pixel.tsx`:

1. Recebe `UTMifyIntegration | null` como prop
2. Valida se integracao esta ativa
3. Verifica se o script ja foi injetado (idempotencia)
4. Cria elemento `<script>` com:
   - `src="https://cdn.utmify.com.br/scripts/utms/latest.js"`
   - `async` e `defer`
   - `data-utmify-prevent-xcod-sck` (evita conflito com captura propria de UTMs)
   - `data-utmify-prevent-subids` (evita conflito com captura propria de subids)
5. No `onload`, dispara `window.utmify('track', 'InitiateCheckout')` com retry (ate 3 tentativas, intervalo de 500ms) caso `window.utmify` ainda nao esteja disponivel
6. Retorna `null` (componente invisivel)

Estimativa: ~80 linhas (dentro do limite de 300).

### Arquivo 3: `src/integrations/tracking/utmify/Tracker.tsx` -- DELETAR

Codigo morto. O componente atual apenas loga e retorna null. Sera substituido por `Pixel.tsx`.

### Arquivo 4: `src/integrations/tracking/utmify/index.ts` -- EDITAR

- Remover export de `Tracker`
- Adicionar export de `Pixel`

### Arquivo 5: `src/components/checkout/v2/TrackingManager.tsx` -- EDITAR

Substituir `UTMify.Tracker` por `UTMify.Pixel`:

Antes:
```text
{UTMify.shouldRunUTMify(utmifyConfig, productId) && (
  <UTMify.Tracker integration={utmifyConfig} />
)}
```

Depois:
```text
{UTMify.shouldRunUTMify(utmifyConfig, productId) && (
  <UTMify.Pixel integration={utmifyConfig} />
)}
```

### Arquivo 6: `src/integrations/tracking/utmify/__tests__/index.test.ts` -- EDITAR

Atualizar o teste que verifica o export de `Tracker` para verificar `Pixel`.

### Arquivo 7: `src/integrations/tracking/utmify/README.md` -- EDITAR

Atualizar a documentacao para refletir:
- O novo componente `Pixel.tsx` (substituindo `Tracker.tsx`)
- A arquitetura hibrida: Backend SSOT para eventos transacionais + Frontend Pixel para eventos comportamentais
- Adicionar `InitiateCheckout` na lista de eventos suportados

### Arquivo 8: `docs/TRACKING_MODULE.md` -- EDITAR

Atualizar a secao UTMify para incluir o Pixel frontend e o evento InitiateCheckout.

---

## Arquitetura Resultante

```text
EVENTOS UTMIFY - ARQUITETURA HIBRIDA

Frontend (Pixel CDN):
  - InitiateCheckout -> window.utmify('track', 'InitiateCheckout')
  - Captura automatica de UTMs pelo script CDN

Backend (API S2S - SSOT):
  - purchase_approved -> dispatcher.ts -> api.utmify.com.br
  - pix_generated     -> dispatcher.ts -> api.utmify.com.br
  - purchase_refused   -> dispatcher.ts -> api.utmify.com.br
  - refund             -> dispatcher.ts -> api.utmify.com.br
  - chargeback         -> dispatcher.ts -> api.utmify.com.br
```

## Fluxo do InitiateCheckout

```text
1. Vendedor configura UTMify (cola API Token, ativa integracao)
2. Comprador acessa checkout do produto
3. checkout-loader retorna vendorIntegration (UTMify config)
4. TrackingManager verifica shouldRunUTMify() = true
5. UTMify.Pixel e renderizado:
   a. Injeta script cdn.utmify.com.br/scripts/utms/latest.js
   b. Script carrega e inicializa
   c. Pixel.tsx chama window.utmify('track', 'InitiateCheckout')
   d. UTMify registra o evento e repassa para Facebook Pixel do vendedor
6. Resultado: Facebook Ads recebe o sinal InitiateCheckout para otimizacao
```

## Arvore de Arquivos

```text
src/types/
  global.d.ts                                  -- EDITAR (adicionar UTMify types)

src/integrations/tracking/utmify/
  Pixel.tsx                                    -- CRIAR (componente de pixel)
  Tracker.tsx                                  -- DELETAR (codigo morto)
  index.ts                                     -- EDITAR (Tracker -> Pixel)
  README.md                                    -- EDITAR (documentacao)
  __tests__/index.test.ts                      -- EDITAR (atualizar testes)

src/components/checkout/v2/
  TrackingManager.tsx                          -- EDITAR (Tracker -> Pixel)

docs/
  TRACKING_MODULE.md                           -- EDITAR (documentacao)
```

1 arquivo criado. 1 arquivo deletado. 6 arquivos editados.

## Nota sobre Validacao

Apos a implementacao, a validacao pode ser feita acessando um checkout publico de um produto com UTMify habilitado e verificando:
1. No DevTools > Network: o script `latest.js` foi carregado
2. No DevTools > Console (via logger): "Disparando evento InitiateCheckout"
3. No painel UTMify do vendedor: o evento IC aparece registrado

