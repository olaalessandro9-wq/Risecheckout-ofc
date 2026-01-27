
# PLANO DE CORREÇÃO - B7 INCOMPLETO

## Problema Identificado

As correções anteriores de B7 (CORS) removeram `PUBLIC_CORS_HEADERS` dos blocos catch, mas não substituíram por `corsHeaders` - deixando as respostas de erro **SEM NENHUM HEADER CORS**.

Isso causará:
- Erros de CORS no browser quando ocorrer qualquer exceção
- Mensagens de erro ilegíveis no frontend (blocked by CORS policy)
- Experiência de usuário degradada

## Análise RISE V3 (Seção 4.4)

### Solução A: Manter Código Atual (Sem CORS em erros)
- Manutenibilidade: 5/10 - Código confuso, comentário incorreto
- Zero DT: 2/10 - Bug conhecido que precisa correção
- Arquitetura: 3/10 - Viola padrão de respostas consistentes
- Escalabilidade: 8/10 - N/A
- Segurança: 7/10 - Não expõe dados, mas comportamento incorreto
- **NOTA FINAL: 4.8/10** ❌
- Tempo: 0 minutos (já implementado incorretamente)

### Solução B: Usar corsHeaders Existente
- Manutenibilidade: 10/10 - Padrão consistente em todo o arquivo
- Zero DT: 10/10 - Correção definitiva
- Arquitetura: 10/10 - Segue mesmo padrão de todas as outras respostas
- Escalabilidade: 10/10 - N/A
- Segurança: 10/10 - Headers dinâmicos validados
- **NOTA FINAL: 10.0/10** ✅
- Tempo: 2 minutos

### DECISÃO: Solução B (Nota 10.0/10)
A variável `corsHeaders` já existe no escopo do catch e deve ser utilizada para manter consistência com todas as outras respostas no arquivo.

## Correções Necessárias

### Arquivo 1: supabase/functions/rpc-proxy/index.ts

**Localização:** Linhas 207-214

**De:**
```typescript
} catch (err) {
  log.error("Exception:", err);
  // RISE V3: Use dynamic corsHeaders when available, fallback to empty for uncaught errors
  return new Response(
    JSON.stringify({ error: "Internal server error" }),
    { status: 500, headers: { "Content-Type": "application/json" } }
  );
}
```

**Para:**
```typescript
} catch (err) {
  log.error("Exception:", err);
  // RISE V3: corsHeaders already validated at function start
  return new Response(
    JSON.stringify({ error: "Internal server error" }),
    { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
```

### Arquivo 2: supabase/functions/storage-management/index.ts

**Localização:** Linhas 277-284

**De:**
```typescript
} catch (err) {
  log.error("Exception:", err);
  // RISE V3: Use dynamic corsHeaders when available, fallback to empty for uncaught errors
  return new Response(
    JSON.stringify({ error: "Internal server error" }),
    { status: 500, headers: { "Content-Type": "application/json" } }
  );
}
```

**Para:**
```typescript
} catch (err) {
  log.error("Exception:", err);
  // RISE V3: corsHeaders already validated at function start
  return new Response(
    JSON.stringify({ error: "Internal server error" }),
    { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
```

## Checklist de Validação Pós-Correção

| # | Verificação | Resultado Esperado |
|---|-------------|-------------------|
| 1 | Todas as respostas usam corsHeaders | Sim |
| 2 | Nenhum uso de PUBLIC_CORS_HEADERS | Sim |
| 3 | Comentários atualizados corretamente | Sim |
| 4 | Zero código morto | Sim |
| 5 | Padrão consistente em todo o arquivo | Sim |

## Impacto

- **Risco:** Nenhum - correção pontual de 2 linhas em cada arquivo
- **Downtime:** Zero
- **Testes necessários:** Verificar resposta CORS em erros 500 via curl

## Resumo Final Pós-Correção

Após esta correção, a Categoria B estará:
- **B1-B4:** ✅ Conformes (RLS correto)
- **B5:** ✅ Corrigido (ANON_KEY removida)
- **B6:** ✅ Conforme (sem secrets expostos)
- **B7:** ✅ Corrigido (CORS dinâmico em todas as respostas)

**Nota Final Categoria B: 10.0/10**
