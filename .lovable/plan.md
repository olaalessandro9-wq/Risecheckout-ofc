

# Correção: Remover propriedade inválida do vercel.json

## Problema
A propriedade `_deploy_trigger` que adicionei na linha 3 do `vercel.json` não é permitida pelo schema da Vercel, causando falha de validação no deploy.

## Solução
Remover a linha 3 (`"_deploy_trigger": "2026-02-04T00:00:00Z"`) do arquivo.

## Arquivo Afetado

**`vercel.json`** - Remover linha 3

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "redirects": [
    ...
  ]
}
```

## Resultado Esperado
1. O arquivo `vercel.json` volta a ser válido
2. O deploy na Vercel será disparado automaticamente com a correção
3. Os redirects configurados anteriormente (`/` → `/auth`) funcionarão corretamente

## Nota
A simples remoção dessa propriedade inválida já conta como uma alteração no código, o que automaticamente dispara um novo deploy na Vercel quando sincronizado com o GitHub.

