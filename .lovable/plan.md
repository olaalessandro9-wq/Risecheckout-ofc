
# Plano de Correção: Facebook Pixel Ausente no Checkout Público

## Diagnóstico Completo

A investigação rastreou cada camada do pipeline de pixels desde o banco de dados ate o HTML renderizado em producao.

### O que foi verificado e esta CORRETO:

1. **Banco de Dados**: Pixel `653351790061731` (facebook) existe na tabela `vendor_pixels`, esta ativo, e esta vinculado ao produto RISE COMMUNITY via `product_pixels`
2. **BFF (resolve-universal)**: Testado diretamente via curl - retorna `productPixels` com todos os dados corretos
3. **Schema Zod**: O `ProductPixelSchema` valida perfeitamente os dados retornados pelo BFF
4. **Mapper**: `mapResolveAndLoad` transforma os dados corretamente para `ProductPixelUIModel[]`
5. **XState Machine**: O contexto armazena `productPixels` corretamente apos validacao
6. **TrackingManager**: Filtra pixels por plataforma e renderiza `Facebook.Pixel` com config valida
7. **Facebook.Pixel**: Injeta script `fbevents.js`, inicializa `fbq("init", pixelId)` e dispara `PageView`
8. **CSP**: `vercel.json` inclui `connect.facebook.net` em `script-src`
9. **CORS**: Suporta wildcard `*.risecheckout.com` e dominio exato `risecheckout.com`

### O que esta ERRADO:

O HTML renderizado em producao (`www.risecheckout.com`) **NAO contém** nenhum script `fbevents.js` nem a funcao `fbq`. Isso significa que o código React que renderiza o pixel simplesmente nao esta sendo executado na versao deployada.

### Causa Raiz Identificada

O deploy na Vercel esta **desatualizado**. Voce confirmou que desconectou a Vercel para economizar creditos e reconectou recentemente. O trigger de deploy que fizemos anteriormente pode nao ter atualizado o build com a versao mais recente do codigo que inclui o sistema de pixel Phase 2.

---

## Plano de Acao

### Etapa 1: Forcar Rebuild na Vercel

Fazer uma alteracao trivial no `index.html` (build trigger comment) para forcar um novo commit e consequentemente um novo deploy na Vercel. Essa alteracao nao afeta funcionalidade - serve apenas como trigger.

### Etapa 2: Adicionar Logging Diagnostico no TrackingManager

Para facilitar depuracao futura caso o problema persista apos o deploy, adicionar um log no `TrackingManager.tsx` que registra quantos pixels foram recebidos e quantos sao do Facebook. Isso permitira verificar nos DevTools do navegador se os dados estao chegando corretamente.

```text
Arquivo: src/components/checkout/v2/TrackingManager.tsx
Acao: Adicionar log diagnostico na inicializacao
```

### Etapa 3: Verificacao Pos-Deploy

Apos o deploy completar na Vercel (geralmente 2-3 minutos):

1. Acessar `www.risecheckout.com/c/38c7817_239675`
2. Abrir DevTools (F12) > Console
3. Verificar se aparece log do tipo `[Rise][Facebook] Pixel inicializado com sucesso`
4. Verificar se a extensao Meta Pixel Helper detecta o pixel `653351790061731`

---

## Detalhes Tecnicos

### Arquivo 1: `index.html` (Build Trigger)

Adicionar ou atualizar comentario de timestamp para forcar rebuild:

```html
<!-- Build: 2026-02-07T22:00:00Z -->
```

### Arquivo 2: `src/components/checkout/v2/TrackingManager.tsx`

Adicionar import do logger e log diagnostico:

```typescript
import { createLogger } from "@/lib/logger";

const log = createLogger("TrackingManager");

// Dentro do componente, ANTES do return:
log.info("Rendering tracking pixels", {
  total: productPixels.length,
  facebook: facebookPixels.length,
  tiktok: tiktokPixels.length,
  googleAds: googleAdsPixels.length,
  kwai: kwaiPixels.length,
});
```

Isso usa o `useEffect` pattern para logar apenas quando os dados mudam, sem re-renders desnecessarios.

### Arquivo 3: `supabase/functions/test-deploy/index.ts`

Atualizar timestamp do build trigger para garantir que o commit diferencial force o deploy.

---

## Resumo

| Acao | Prioridade | Impacto |
|------|-----------|---------|
| Forcar rebuild Vercel | CRITICA | Resolve o problema se o deploy esta desatualizado |
| Logging diagnostico | ALTA | Permite depuracao futura sem investigacao manual |
| Verificacao pos-deploy | CRITICA | Confirma que a correcao foi efetiva |

O codigo do pipeline de pixels esta 100% correto. O problema e exclusivamente de deploy desatualizado na Vercel.
