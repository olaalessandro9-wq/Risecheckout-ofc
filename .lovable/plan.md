
# Correcao: CSP Bloqueando Facebook Pixel

## Diagnostico Definitivo

O pipeline de codigo (BFF -> Zod -> Mapper -> XState -> TrackingManager -> Facebook.Pixel) esta 100% correto em todas as 8 camadas verificadas. O problema e exclusivamente na Content Security Policy do `vercel.json`.

### Evidencia Tecnica

O script `fbevents.js` carrega com sucesso (autorizado por `script-src`), mas quando o SDK do Facebook tenta:
1. Buscar configuracao via XHR em `connect.facebook.net` -- **BLOQUEADO** por `connect-src`
2. Enviar beacon de tracking para `www.facebook.com/tr/` -- **BLOQUEADO** por `connect-src`

O navegador bloqueia essas requisicoes silenciosamente. O Meta Pixel Helper nao detecta o pixel porque a inicializacao falha antes de processar a queue do `fbq`.

Na pagina de vendas do usuario, nao existe CSP restritiva, por isso o pixel funciona normalmente no mesmo navegador.

## Alteracao Necessaria

### Arquivo: `vercel.json` (linha 62)

Adicionar na diretiva `connect-src`:
- `https://www.facebook.com` (endpoint de tracking `/tr/`)
- `https://connect.facebook.net` (chamadas de configuracao do SDK)

A linha CSP atual tem `connect-src` sem esses dois dominios. A correcao e adiciona-los junto aos demais dominios ja autorizados (como `graph.facebook.com` que ja esta la).

### Resultado Esperado

Apos o deploy com essa correcao:
1. O `fbevents.js` carrega (ja funcionava)
2. O SDK faz chamadas de configuracao para `connect.facebook.net` (agora autorizado)
3. O `fbq("init", pixelId)` processa com sucesso
4. O beacon de tracking e enviado para `www.facebook.com/tr/` (agora autorizado)
5. O Meta Pixel Helper detecta o pixel `653351790061731`

### Impacto

| Item | Status |
|------|--------|
| Alteracao de codigo React | Nenhuma necessaria |
| Alteracao de Edge Functions | Nenhuma necessaria |
| Alteracao de banco de dados | Nenhuma necessaria |
| Alteracao de CSP (`vercel.json`) | Unica alteracao necessaria |
| Risco de breaking change | Zero - apenas adiciona permissoes |
