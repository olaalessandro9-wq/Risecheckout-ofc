
# Plano de Correção: Criar Edge Function `utmify-validate-credentials`

## Problema Identificado

A Edge Function de diagnóstico `utmify-validate-credentials` foi:
- ✅ Planejada e aprovada
- ✅ Documentada em `docs/EDGE_FUNCTIONS_REGISTRY.md`
- ✅ Configurada em `supabase/config.toml`
- ❌ **NÃO FOI CRIADA** (diretório não existe)

Isso viola o RISE V3 por criar documentação que referencia código inexistente.

---

## Análise de Soluções (RISE V3 §4.4)

### Solução A: Remover referências e considerar "opcional"
- Manutenibilidade: 7/10
- Zero DT: 6/10
- Arquitetura: 8/10
- Escalabilidade: 10/10
- Segurança: 9/10
- **NOTA FINAL: 7.8/10**

### Solução B: Criar a Edge Function conforme planejado
- Manutenibilidade: 10/10
- Zero DT: 10/10
- Arquitetura: 10/10
- Escalabilidade: 10/10
- Segurança: 10/10
- **NOTA FINAL: 10.0/10**

### DECISÃO: Solução B (10.0/10)

---

## Implementação

### Criar `supabase/functions/utmify-validate-credentials/index.ts`

A função irá:
1. Autenticar usuário via `unified-auth`
2. Validar propriedade do `vendorId`
3. Recuperar token do Vault via `getUTMifyToken()`
4. Listar eventos habilitados via `listEnabledEvents()`
5. Fazer teste real contra API UTMify com `isTest: true`
6. Retornar diagnóstico completo com fingerprint

### Especificação da Resposta

```typescript
interface ValidateResponse {
  valid: boolean;
  message: string;
  details: {
    fingerprint: string | null;
    tokenLength: number;
    normalizationApplied: boolean;
    normalizationChanges: string[];
    apiTest: {
      performed: boolean;
      statusCode?: number;
      response?: string;
    };
    configStatus: {
      hasToken: boolean;
      eventsEnabled: string[];
    };
  };
}
```

---

## Arquivos a Criar/Modificar

| Arquivo | Ação | Linhas |
|---------|------|--------|
| `supabase/functions/utmify-validate-credentials/index.ts` | CRIAR | ~140 linhas |

---

## Resultado Esperado

Após a correção:
- 100% RISE V3 Compliance
- Documentação consistente
- Ferramenta de diagnóstico funcional para debugging de tokens UTMify
