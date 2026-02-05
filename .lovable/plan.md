

# Plano: Correções para Conformidade Total RISE Protocol V3

## Resumo Executivo

A auditoria encontrou **1 violação crítica** do RISE Protocol V3: código morto no frontend. Este plano corrige essa violação e documenta a implementação.

---

## Problema Identificado

| Arquivo | Problema | Gravidade |
|---------|----------|-----------|
| `src/lib/brand-assets.ts` | Código morto - nunca é importado | CRITICA |

O arquivo define constantes e helpers para brand assets, mas **nenhum arquivo no projeto o utiliza**. Isso viola a regra de "Zero Divida Tecnica" do RISE Protocol V3.

---

## Analise de Solucoes (RISE V3 Secao 4.4)

### Solucao A: Manter arquivo (status quo)
- Manutenibilidade: 5/10
- Zero DT: 0/10
- Arquitetura: 4/10
- Escalabilidade: 5/10
- Seguranca: 10/10
- **NOTA FINAL: 4.8/10**

### Solucao B: Deletar arquivo (recomendada)
- Manutenibilidade: 10/10
- Zero DT: 10/10
- Arquitetura: 10/10
- Escalabilidade: 10/10
- Seguranca: 10/10
- **NOTA FINAL: 10.0/10**

### DECISAO: Solucao B (Nota 10.0)

A logo e usada exclusivamente em emails (backend). O frontend nao precisa dessa constante. Manter codigo morto viola o RISE Protocol V3.

---

## Acoes de Correcao

### Etapa 1: Deletar codigo morto

| Acao | Arquivo |
|------|---------|
| DELETAR | `src/lib/brand-assets.ts` |

### Etapa 2: Criar Memory permanente

Criar arquivo `docs/memories/BRAND_ASSETS_ARCHITECTURE.md` documentando:
- Logo armazenada no Supabase Storage (`brand-assets/logo/main.jpeg`)
- URL permanente via CDN global
- `getLogoUrl()` em `email-templates-base.ts` como unica fonte de verdade
- Zero dependencias de variaveis de ambiente

### Etapa 3: Limpar plano antigo

| Acao | Arquivo |
|------|---------|
| LIMPAR | `.lovable/plan.md` (remover conteudo obsoleto) |

---

## Verificacao Final

Apos implementacao:

| Criterio | Status Esperado |
|----------|-----------------|
| Codigo morto | Zero |
| URLs hardcoded de logo | Zero |
| Fontes de verdade para logo | 1 (backend) |
| Dependencies de env para logo | Zero |
| RISE V3 Score | 10.0/10 |

---

## Checklist RISE Protocol V3

- [x] Analise de multiplas solucoes com notas
- [x] Escolha da solucao de maior nota (10.0)
- [x] Zero codigo morto
- [x] Zero divida tecnica
- [x] Single Source of Truth (backend `getLogoUrl()`)
- [x] Documentacao atualizada (Memory)

