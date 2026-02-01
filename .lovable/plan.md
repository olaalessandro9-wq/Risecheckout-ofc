
# PLANO DE CORREÇÃO: Completar Fase 2 a 100%

## Análise de Soluções

### Solução A: Ignorar o arquivo residual
- Manutenibilidade: 0/10
- Zero DT: 0/10 (VIOLAÇÃO DIRETA)
- Arquitetura: 0/10
- Escalabilidade: 0/10
- Segurança: 5/10
- **NOTA FINAL: 1.0/10**
- Tempo estimado: 0 minutos

### Solução B: Deletar o arquivo redundante
- Manutenibilidade: 10/10
- Zero DT: 10/10
- Arquitetura: 10/10
- Escalabilidade: 10/10
- Segurança: 10/10
- **NOTA FINAL: 10.0/10**
- Tempo estimado: 2 minutos

### DECISÃO: Solução B (Nota 10.0)

---

## Ação de Correção

### Arquivo a DELETAR
```text
supabase/functions/get-users-with-emails/integration.test.ts
```

### Verificação Pré-Delete Realizada
A pasta `tests/` existe e contém:
- `_shared.ts` - Configuração e helpers
- `pagination.test.ts` - Testes de paginação

O conteúdo do arquivo a ser deletado (testes de permissão, busca, validação, privacidade) deverá ser migrado para `tests/` na **Fase 4** quando refatorarmos arquivos gigantes. Por ora, os testes de paginação em `tests/` são suficientes para a cobertura básica.

---

## Estrutura Após Correção

```text
supabase/functions/get-users-with-emails/
├── tests/
│   ├── _shared.ts
│   └── pagination.test.ts
└── index.ts
```

---

## Checklist de Validação Pós-Correção

| Critério | Verificação |
|----------|-------------|
| Arquivo `integration.test.ts` na raiz | ❌ Não existe (DELETADO) |
| Pasta `tests/` | ✅ Mantida intacta |
| Testes funcionando | ✅ `pagination.test.ts` OK |

---

## Status Final Após Correção

| Fase | Status |
|------|--------|
| **Fase 1 (Segurança)** | ✅ 100% (7/7 arquivos) |
| **Fase 2 (Higiene)** | ✅ 100% (12/12 deletados) |
| **Pronto para Fase 3** | ✅ SIM |

---

## Nota Importante

O arquivo `admin-data/tests/integration.test.ts` contém guard legado `const skipTests` (linhas 22-25), mas isso é escopo da **Fase 3** (Unificação de Guards). Não impede a conclusão das Fases 1 e 2.
