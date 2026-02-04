
## Objetivo (não-negociável)
1) Remover completamente a landing WordPress (arquivos e qualquer vestígio de acesso).  
2) Garantir que **qualquer acesso ao domínio principal** (rota `/`) leve **direto para `/auth`** — tanto no Preview (Lovable) quanto em Produção (Vercel).  
3) Corrigir o motivo real pelo qual o redirect “falhou” no preview: o app **não está renderizando** por causa de **Invalid Hook Call** (React duplicado), então o router nunca chega a executar o `<Navigate />`.

---

## Diagnóstico (causa raiz)
### 1) WordPress landing ainda existe como arquivos estáticos
Existe `public/landing/` com milhares de linhas de HTML e assets “WordPress espelhado”. Mesmo que a rota `/` no React redirecione para `/auth`, URLs como `/landing/index.html` ainda podem ser servidas como estático, e qualquer referência a iframe pode gerar erros de X-Frame-Options.

### 2) O problema que quebra o redirect no Preview é outro: **Invalid Hook Call**
Console do preview mostra:
- `Warning: Invalid hook call...`
- stack em `QueryClientProvider` chamando `React.useEffect`, com dispatcher nulo.

Causa técnica provável (muito forte): o `index.html` está carregando o entrypoint com querystring fixa:
```html
<script type="module" src="/src/main.tsx?v=build_20251103_5"></script>
```
Em Vite dev, querystring muda o “module id” e pode fazer o browser carregar **duas instâncias de React** com versões de cache-buster diferentes (cada módulo com `?v=` diferente), resultando exatamente no erro “dispatcher null”.

Sem o app renderizar, não existe redirect de `/` para `/auth` na SPA.

---

## Análise de Soluções (RISE Protocol V3)

### Solução A: “Só deletar public/landing e manter o resto”
- Manutenibilidade: 7/10
- Zero DT: 7/10
- Arquitetura: 7/10
- Escalabilidade: 8/10
- Segurança: 8/10
- **NOTA FINAL: 7.4/10**
- Tempo estimado: 15–30 min  
**Por que é inferior:** não garante que `/` funcione, pois o app pode continuar quebrado no Preview/Prod se o invalid hook call persistir (e ele impede o redirect).

### Solução B: “Confiar apenas no redirect do React Router”
- Manutenibilidade: 8/10
- Zero DT: 7/10
- Arquitetura: 8/10
- Escalabilidade: 8/10
- Segurança: 8/10
- **NOTA FINAL: 7.8/10**
- Tempo estimado: 15–30 min  
**Por que é inferior:** se JS falhar, o redirect não ocorre. Em produção, redirect server-side para `/` é mais robusto (SSOT do comportamento do domínio).

### Solução C: “Redirecionar no servidor (Vercel) + remover WordPress + corrigir Invalid Hook Call na raiz”
- Manutenibilidade: 10/10
- Zero DT: 10/10
- Arquitetura: 10/10
- Escalabilidade: 10/10
- Segurança: 10/10
- **NOTA FINAL: 10.0/10**
- Tempo estimado: 45–90 min  
**Por que é a melhor:** garante comportamento correto mesmo se o app não iniciar, remove a fonte de bugs (WordPress estático) e corrige a causa raiz do preview quebrado.

### DECISÃO: Solução C (Nota 10.0/10)
As outras soluções não atacam simultaneamente:
- a robustez do redirect em produção, e
- o crash do app que impede o router de rodar.

---

## Plano de Implementação (sequência exata)

### Etapa 0 — Hardening de comportamento “sem landing”
Definir o contrato:
- `/` sempre vai para `/auth` (server-side)
- qualquer tentativa de acessar antigas LPs (`/landing/*`, `/wp-content/*`, etc.) também vai para `/auth` (ou 404 — vamos preferir redirect para reduzir confusão)

### Etapa 1 — Remover WordPress completamente (fonte do problema)
1. Deletar diretório `public/landing/` inteiro:
   - `public/landing/index.html`
   - `public/landing/wp-content/*`
   - `public/landing/wp-includes/*`
   - `public/landing/wp-json/*`
   - arquivos “estranhos” como `xmlrpc.php?rsd` (isso é particularmente ruim para static hosting)

2. Remover documentação e testes que assumem existência da landing:
   - `LANDING_PAGE_MIGRATION_FINAL.md` (ou atualizar para “REMOVIDO”)
   - `e2e/specs/landing.spec.ts`
   - `e2e/fixtures/pages/LandingPage.ts`

3. Remover código morto relacionado à landing:
   - `src/pages/LandingPage.tsx` (não deve existir se a decisão é “sem LP”)
   - `src/components/landing/*` (já está sem uso; manter isso é dívida técnica silenciosa)

> Resultado: não existe mais “LP antiga ou nova” no build.

### Etapa 2 — Garantia definitiva: redirect no servidor (Vercel) para `/auth`
Editar `vercel.json` para adicionar `redirects` e simplificar rewrites:

1) Redirects (server-side):
- `/` → `/auth` (307 ou 308; recomendo 307 para evitar cache agressivo durante ajustes)
- `/landing/:path*` → `/auth`
- `/wp-content/:path*` → `/auth`
- `/wp-includes/:path*` → `/auth`
- `/wp-json/:path*` → `/auth`

2) Rewrites para SPA:
- Reescrever **qualquer outra rota** para `/index.html` (React Router resolve internamente)
- Remover o pattern com negative lookahead que hoje menciona `landing|wp-content|wp-includes` (não faz mais sentido após remoção)

> Resultado: mesmo que alguém acesse direto `risecheckout.com/` sem JS ou com cache estranho, o servidor manda para `/auth`.

### Etapa 3 — Corrigir a causa raiz do crash no Preview (Invalid Hook Call)
Editar `index.html`:
- trocar
  - `/src/main.tsx?v=build_20251103_5`
- por
  - `/src/main.tsx`

Isso remove a duplicação de “module identity” e força o Vite dev server a manter um grafo consistente (React singleton real).

Opcional (recomendado) para manter rastreabilidade sem quebrar módulos:
- adicionar um `<meta name="app-build" content="YYYYMMDD_HHMM">` ou log no `main.tsx` via constante sem querystring.

### Etapa 4 — Validação (Preview e Produção)
Checklist de aceite:

**Preview (Lovable)**
1. Abrir `/` → deve ir para `/auth`
2. Console sem `Invalid hook call`
3. Acessar manualmente:
   - `/landing/index.html`
   - `/wp-content/...`
   Deve cair em `/auth` (redirect) ou NotFound (se preferirmos 404; o plano propõe redirect)

**Produção (Vercel)**
1. Confirmar que o deploy realmente aconteceu (último commit/Build em Vercel)
2. Acessar `https://risecheckout.com/` → 307/308 para `/auth` (Network tab confirma)
3. Testar em aba anônima (evita cache)
4. Confirmar que não existe mais `public/landing` sendo servido

---

## Arquivos que serão alterados/removidos

### Alterar
- `vercel.json` (redirects + rewrites)
- `index.html` (remover querystring do entrypoint)

### Remover (delete)
- `public/landing/**`
- `src/pages/LandingPage.tsx`
- `src/components/landing/**`
- `LANDING_PAGE_MIGRATION_FINAL.md` (ou reescrever como “removido”)
- `e2e/specs/landing.spec.ts`
- `e2e/fixtures/pages/LandingPage.ts`

---

## Riscos e Mitigações
- **Risco:** Vercel estar apontando para outro projeto/repo (alterações não refletem).
  - Mitigação: validar no dashboard Vercel o “Production Branch” e o commit hash do último deploy.
- **Risco:** algum link externo antigo aponta para `/landing/...`.
  - Mitigação: redirects server-side levam para `/auth`, sem quebrar experiência.

---

## Observação importante (produção)
O arquivo `.env` é ignorado por `.gitignore`. Logo, a produção na Vercel depende das Environment Variables configuradas no painel da Vercel. Isso não explica o Invalid Hook Call, mas pode quebrar integrações depois do app subir. No fim do processo, vamos validar se as env vars necessárias estão no Vercel.

