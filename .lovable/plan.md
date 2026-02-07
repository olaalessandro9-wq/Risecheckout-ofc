
# Force Build Trigger para Vercel

## Contexto
A Vercel esta agora conectada em tempo real. Precisamos forcar um novo commit para disparar o deploy automatico.

## Alteracoes

### Arquivo 1: `index.html` (linha 34)
Atualizar timestamp do build trigger:
- De: `<!-- Build: 2026-02-08T00:30:00Z -->`
- Para: `<!-- Build: 2026-02-08T01:15:00Z -->`

### Arquivo 2: `supabase/functions/test-deploy/index.ts` (linha 6)
Atualizar timestamp do build trigger:
- De: `// Build trigger: 2026-02-08T00:30:00Z`
- Para: `// Build trigger: 2026-02-08T01:15:00Z`

## Resultado
O commit gerado por essas alteracoes vai disparar automaticamente o deploy na Vercel. Aguarde 2-3 minutos apos a aprovacao e teste no checkout publico com o Meta Pixel Helper.
