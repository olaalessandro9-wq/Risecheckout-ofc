
# Plano RISE V3: Unificar e Corrigir CSP para Produção

## Diagnóstico

O sistema tem **DUAS CSPs conflitantes**:
- `index.html` (meta tag) - Versão mais completa
- `vercel.json` (HTTP header) - Versão incompleta, sem `worker-src` e alguns domínios

Em produção, o navegador aplica a mais restritiva, causando bloqueios de scripts.

---

## Análise de Soluções (RISE Protocol V3 Seção 4.4)

### Solução A: Apenas Sincronizar CSPs

Copiar a CSP do `index.html` para o `vercel.json` manualmente.

- Manutenibilidade: 5/10 (duas fontes para manter sincronizadas)
- Zero DT: 5/10 (risco de dessincronização futura)
- Arquitetura: 4/10 (duplicação de configuração)
- Escalabilidade: 4/10 (cada mudança requer editar dois arquivos)
- Segurança: 8/10 (funciona se sincronizado)
- **NOTA FINAL: 5.2/10**
- Tempo estimado: 15 minutos

### Solução B: Fonte Única de CSP no vercel.json (HTTP Header) (ESCOLHIDA)

Remover a CSP do `index.html` e manter apenas no `vercel.json` com a versão completa.

Justificativa técnica:
- HTTP headers têm precedência sobre meta tags
- HTTP headers são aplicados antes do HTML ser parseado (mais seguro)
- Fonte única elimina conflitos
- Padrão recomendado pela indústria

- Manutenibilidade: 10/10 (fonte única de verdade)
- Zero DT: 10/10 (sem duplicação, sem conflitos)
- Arquitetura: 10/10 (padrão correto para CSP)
- Escalabilidade: 10/10 (fácil de manter)
- Segurança: 10/10 (HTTP header é mais seguro que meta tag)
- **NOTA FINAL: 10.0/10**
- Tempo estimado: 30 minutos

### DECISÃO: Solução B (Nota 10.0)

A Solução A mantém duplicação e risco de dessincronização. A Solução B estabelece uma fonte única de verdade, eliminando conflitos permanentemente.

---

## Plano de Implementação

### Arquivos a Modificar

```text
index.html     # REMOVER meta tag de CSP
vercel.json    # ATUALIZAR CSP completa e unificada
```

---

## Alterações Detalhadas

### 1. REMOVER CSP do `index.html`

**Remover linhas 13-28** (meta tag Content-Security-Policy):

```html
<!-- REMOVER COMPLETAMENTE -->
<!-- Content Security Policy - Proteção avançada contra XSS -->
<meta http-equiv="Content-Security-Policy" content="...">
```

### 2. ATUALIZAR `vercel.json` com CSP Unificada e Completa

O header CSP no `vercel.json` será atualizado para incluir TODAS as diretivas necessárias:

```json
{
  "key": "Content-Security-Policy",
  "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co https://challenges.cloudflare.com https://js.stripe.com https://sdk.mercadopago.com https://http2.mlstatic.com https://www.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net https://analytics.tiktok.com https://kpx.alicdn.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https: blob:; connect-src 'self' https://api.risecheckout.com https://*.supabase.co wss://*.supabase.co https://*.mercadopago.com https://*.mercadolibre.com https://*.mlstatic.com https://http2.mlstatic.com https://events.mercadopago.com https://api.stripe.com https://challenges.cloudflare.com https://www.google-analytics.com https://api.utmify.com.br https://graph.facebook.com https://analytics.tiktok.com https://kpx.alicdn.com https://*.sentry.io https://*.ingest.us.sentry.io; frame-src 'self' https://js.stripe.com https://challenges.cloudflare.com https://*.mercadopago.com https://*.mercadolibre.com https://www.mercadopago.com.br https://www.youtube.com https://player.vimeo.com; media-src 'self' https: blob:; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests;"
}
```

### Mudanças Específicas na CSP Unificada

| Diretiva | Antes (vercel.json) | Depois |
|----------|---------------------|--------|
| `script-src` | Faltava `challenges.cloudflare.com`, usava domínio hardcoded | Adicionado `https://challenges.cloudflare.com`, usa `https://*.supabase.co` |
| `connect-src` | Usava domínio hardcoded | Usa wildcard `https://*.supabase.co` |
| `worker-src` | **AUSENTE** | Adicionado `'self' blob:` |
| `media-src` | **AUSENTE** | Adicionado `'self' https: blob:` |

---

## Resultado Esperado

| Erro Atual | Status Após |
|------------|-------------|
| `Refused to load script... violates CSP 'script-src'` (supabase) | Resolvido |
| `Refused to create worker... violates CSP 'worker-src'` | Resolvido |
| `Refused to load script... challenges.cloudflare.com` | Resolvido |
| Mercado Pago SDK deprecation warning | Não controlável (SDK externo) |

---

## Conformidade RISE V3

| Critério | Status |
|----------|--------|
| Manutenibilidade Infinita | Fonte única de CSP |
| Zero Dívida Técnica | Sem duplicação |
| Arquitetura Correta | HTTP header (padrão recomendado) |
| Escalabilidade | Fácil adicionar novos domínios |
| Segurança | CSP via header é mais segura |

**RISE V3 Score: 10.0/10**

---

## Seção Técnica

### Por que HTTP Header ao invés de Meta Tag?

1. **Timing**: HTTP headers são processados ANTES do HTML ser parseado
2. **Cobertura**: Aplica a todos os recursos, incluindo o próprio HTML
3. **Precedência**: Em caso de conflito, o header tem precedência
4. **Padrão**: Recomendado pelo OWASP e MDN

### Por que Wildcard `*.supabase.co`?

1. **Futuro-proof**: Se o projeto mudar de Supabase instance, não quebra
2. **Subdomínios**: Cobre realtime, storage, functions, etc.
3. **Manutenção**: Não precisa atualizar se o project ID mudar

### Sobre o Warning do Mercado Pago

O warning `using deprecated parameters for the initialization function` vem de **dentro do SDK do Mercado Pago** (`feature_collector.js`), não do nosso código. Nosso código já usa a sintaxe correta:

```typescript
new window.MercadoPago(publicKey, { locale: "pt-BR" });
```

Este warning é interno ao SDK e será corrigido quando o Mercado Pago atualizar sua biblioteca. Não é algo que possamos resolver do nosso lado.
