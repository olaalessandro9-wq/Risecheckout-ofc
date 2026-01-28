
# Plano: Remover Badge "Padrão" da Aba de Links

## RISE Protocol V3 - Análise de Soluções

### Solução A: Remover renderização do badge
- Manutenibilidade: 10/10 (menos código = menos manutenção)
- Zero DT: 10/10 (remove feature desnecessária)
- Arquitetura: 10/10 (simplifica UI sem lógica morta)
- Escalabilidade: 10/10 (não afeta outras partes)
- Segurança: 10/10 (sem impacto)
- **NOTA FINAL: 10.0/10**
- Tempo estimado: 5 minutos

### DECISÃO: Solução A (10.0/10)

Única solução viável - remoção direta do código de renderização do badge.

---

## Alteração

### Arquivo: `src/components/products/LinksTable.tsx`

**Código Atual (linhas 115-124):**
```typescript
<TableCell className="font-medium text-foreground">
  <div className="flex items-center gap-2">
    {link.offer_name}
    {link.is_default && (
      <Badge variant="secondary" className="text-xs gap-1">
        <Star className="w-3 h-3" />
        Padrão
      </Badge>
    )}
  </div>
</TableCell>
```

**Código Corrigido:**
```typescript
<TableCell className="font-medium text-foreground">
  {link.offer_name}
</TableCell>
```

---

## Limpeza de Código Morto

Após remover o badge, o import `Star` não será mais utilizado. Deve ser removido:

**Linha 2 (atual):**
```typescript
import { Search, Copy, Star, ExternalLink, Power, MoreVertical } from "lucide-react";
```

**Linha 2 (corrigida):**
```typescript
import { Search, Copy, ExternalLink, Power, MoreVertical } from "lucide-react";
```

---

## Interface `PaymentLink`

A propriedade `is_default` na interface pode ser mantida pois pode ser usada em outros contextos (ex: lógica de negócio). A UI simplesmente não renderiza mais o badge na aba Links.

---

## Resumo das Alterações

| Arquivo | Alteração |
|---------|-----------|
| `src/components/products/LinksTable.tsx` | Remover badge "Padrão" (linhas 118-123) |
| `src/components/products/LinksTable.tsx` | Remover import `Star` não utilizado |

---

## Resultado Visual

| Antes | Depois |
|-------|--------|
| `Teste sandro ⭐ Padrão` | `Teste sandro` |
| `Teste sandro ⭐ Padrão` | `Teste sandro` |

Todos os links aparecem iguais, sem distinção de "Padrão".

---

## Conformidade RISE V3

| Critério | Status |
|----------|--------|
| Root Cause Only | Remove a feature por decisão de negócio |
| Zero Dívida Técnica | Remove código morto (import Star) |
| Arquitetura Correta | Simplificação sem workarounds |
| Segurança | Sem impacto |

**NOTA FINAL: 10.0/10** - Simplificação seguindo RISE Protocol V3.
