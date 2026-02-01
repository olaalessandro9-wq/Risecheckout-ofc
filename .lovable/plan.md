

# Plano: Corrigir Erro de Sintaxe no Arquivo de Teste

## Problema Identificado

Arquivo: `supabase/functions/checkout-public-data/index.test.ts`  
Linha: 713  
Erro: `assertEqualslength, 1000);` (falta `(` e `.`)

## Correção Necessária

### Única alteração:

**Arquivo:** `supabase/functions/checkout-public-data/index.test.ts`

```typescript
// ANTES (linha 713):
assertEqualslength, 1000);

// DEPOIS:
assertEquals(longSlug.length, 1000);
```

## Impacto

- Zero risco - é apenas correção de typo em arquivo de teste
- Build passará após a correção
- Nenhuma funcionalidade de produção afetada

## Verificação Pós-Correção

Após corrigir, o build deve passar sem erros e a integração estará 100% funcional.

