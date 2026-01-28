
# Plano: Remover Badge "Módulo X" Dentro da Imagem do Card

## RISE Protocol V3 - Análise de Soluções

### Solução A: Remover completamente o badge interno
- Manutenibilidade: 10/10 (menos código duplicado)
- Zero DT: 10/10 (elimina informação redundante)
- Arquitetura: 10/10 (alinha com opção existente "Exibir Título do Módulo")
- Escalabilidade: 10/10 (sem impacto)
- Segurança: 10/10 (sem impacto)
- **NOTA FINAL: 10.0/10**
- Tempo estimado: 5 minutos

### DECISÃO: Solução A (10.0/10)

Remoção direta do código duplicado.

---

## Diagnóstico

### Situação Atual (Incorreta)

O componente `NetflixModuleCard.tsx` exibe o título do módulo em **DOIS** lugares:

| Local | Código | Controle |
|-------|--------|----------|
| Dentro da imagem | `Módulo {index + 1}` (linhas 76-81) | Sempre visível |
| Abaixo do card | `{module.title}` (linhas 85-94) | Controlado por "Exibir Título do Módulo" |

### Comportamento Desejado

- Badge "Módulo X" dentro da imagem: **REMOVER**
- Título abaixo do card: **MANTER** (controlado pelo builder)

---

## Alteração

### Arquivo: `src/modules/members-area/pages/buyer/components/netflix/NetflixModuleCard.tsx`

**Código a ser REMOVIDO (linhas 76-81):**
```typescript
{/* Module number */}
<div className="absolute bottom-3 left-3">
  <span className="text-xs font-medium text-white bg-black/50 px-2 py-1 rounded backdrop-blur-sm">
    Módulo {index + 1}
  </span>
</div>
```

**Resultado após remoção:**

O card ficará apenas com:
- Badge de contagem de aulas (topo direito): "X aulas"
- Overlay de play ao hover
- Título abaixo do card (controlado pelo builder)

---

## Resumo das Alterações

| Arquivo | Alteração |
|---------|-----------|
| `src/modules/members-area/pages/buyer/components/netflix/NetflixModuleCard.tsx` | Remover linhas 76-81 (badge "Módulo X") |

---

## Resultado Visual

| Antes | Depois |
|-------|--------|
| Badge "1 aula" + Badge "Módulo 1" + Título "Modulo 01" | Badge "1 aula" + Título "Modulo 01" |

A duplicação será eliminada. O título abaixo do card continuará respeitando a configuração "Exibir Título do Módulo" no builder.

---

## Componentes Relacionados (Sem Alteração Necessária)

- `ModulesView.tsx` (builder): Já não possui o badge "Módulo X" dentro do card
- `ModuleCarousel.tsx`: Apenas orquestra os cards, sem duplicação
- `CourseHome.tsx`: Usa os componentes corretamente

---

## Conformidade RISE V3

| Critério | Status |
|----------|--------|
| Root Cause Only | Remove duplicação na fonte |
| Zero Dívida Técnica | Elimina código redundante |
| Arquitetura Correta | Alinha com configuração existente |
| Segurança | Sem impacto |

**NOTA FINAL: 10.0/10** - Simplificação seguindo RISE Protocol V3.
