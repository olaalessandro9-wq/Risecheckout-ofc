
# Plano: Expandir Área Clicável na Seleção de Ofertas do Checkout

## Problema

No dialog "Editar Checkout", a seleção de ofertas requer um clique preciso na "bolinha" (radio button) ou no nome da oferta. Clicar no preço, no badge "(Oferta Principal)", ou em qualquer outra área do card não funciona.

## Causa Raiz

A estrutura atual usa um `<div>` container sem handler de clique. Apenas o `<RadioGroupItem>` e o `<Label htmlFor>` são clicáveis nativamente. O preço e o badge estão fora do `<Label>`, então não disparam a seleção.

## Análise de Soluções

### Solução A: Envolver Todo o Card com Label
- **Manutenibilidade:** 10/10 - Solução HTML pura, sem JavaScript adicional
- **Zero DT:** 10/10 - Usa comportamento nativo do HTML
- **Arquitetura:** 10/10 - Segue semântica correta de formulários
- **Escalabilidade:** 10/10 - Funciona com qualquer conteúdo interno
- **Segurança:** 10/10 - Nenhuma implicação
- **NOTA FINAL: 10.0/10**
- **Tempo estimado:** 15 minutos

**Como funciona:** Trocar o `<div>` container por um `<Label>` com `htmlFor` apontando para o radio button. Todo o conteúdo interno (nome, preço, badge) fica clicável automaticamente.

### Solução B: Adicionar onClick no Container
- **Manutenibilidade:** 8/10 - Requer JavaScript adicional
- **Zero DT:** 8/10 - Precisa de ref para o radio
- **Arquitetura:** 7/10 - Usa JS para algo que HTML faz nativamente
- **Escalabilidade:** 8/10 - Funciona, mas menos elegante
- **Segurança:** 10/10 - Nenhuma implicação
- **NOTA FINAL: 8.2/10**
- **Tempo estimado:** 20 minutos

### Solução C: CSS `pointer-events` + Pseudo-element
- **Manutenibilidade:** 6/10 - Truque de CSS não óbvio
- **Zero DT:** 6/10 - Potenciais problemas de acessibilidade
- **Arquitetura:** 5/10 - Gambiarra visual
- **Escalabilidade:** 6/10 - Difícil de debugar
- **Segurança:** 10/10 - Nenhuma implicação
- **NOTA FINAL: 6.6/10**
- **Tempo estimado:** 15 minutos

---

## DECISÃO: Solução A (Nota 10.0/10)

A Solução A é a única que atinge nota máxima porque:
1. **Zero JavaScript:** Usa comportamento nativo do HTML
2. **Semântica correta:** Um `<Label>` associado a um input é a forma correta
3. **Acessibilidade:** Leitores de tela entendem perfeitamente
4. **Manutenibilidade:** Código óbvio e auto-explicativo

---

## Implementação Técnica

### Arquivo: `src/components/products/CheckoutConfigDialog.tsx`

### Antes (Linhas 222-244):

```tsx
{availableOffers.map((offer) => (
  <div
    key={offer.id}
    className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
  >
    <RadioGroupItem value={offer.id} id={`offer-${offer.id}`} />
    <div className="flex-1">
      <Label
        htmlFor={`offer-${offer.id}`}
        className="text-sm font-medium text-foreground cursor-pointer"
      >
        {offer.name}
      </Label>
      <p className="text-xs text-muted-foreground mt-1">
        {formatBRL(offer.price)}
      </p>
      {offer.is_default && (
        <span className="text-xs text-primary">
          (Oferta Principal)
        </span>
      )}
    </div>
  </div>
))}
```

### Depois:

```tsx
{availableOffers.map((offer) => (
  <Label
    key={offer.id}
    htmlFor={`offer-${offer.id}`}
    className={cn(
      "flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors",
      "hover:bg-muted/50",
      selectedOfferId === offer.id && "bg-primary/10 border border-primary/30"
    )}
  >
    <RadioGroupItem 
      value={offer.id} 
      id={`offer-${offer.id}`} 
      className="mt-0.5"
    />
    <div className="flex-1">
      <span className="text-sm font-medium text-foreground">
        {offer.name}
      </span>
      <p className="text-xs text-muted-foreground mt-1">
        {formatBRL(offer.price)}
      </p>
      {offer.is_default && (
        <span className="text-xs text-primary">
          (Oferta Principal)
        </span>
      )}
    </div>
  </Label>
))}
```

---

## Mudanças Específicas

| Mudança | Antes | Depois | Benefício |
|---------|-------|--------|-----------|
| Container | `<div>` | `<Label htmlFor>` | 100% da área clicável |
| Label interno | `<Label>` aninhado | `<span>` | Evita Label dentro de Label |
| Estilo selecionado | Nenhum | `bg-primary/10` | Feedback visual claro |
| Cursor | Padrão no div | `cursor-pointer` | UX consistente |
| Alinhamento radio | Default | `mt-0.5` | Alinha com primeira linha |

---

## Fluxo Visual

```text
ANTES:
┌─────────────────────────────────────────────────────────────┐
│ [○ clicável] [Nome clicável] [Preço NÃO clicável]          │
│              [(Oferta Principal) NÃO clicável]              │
└─────────────────────────────────────────────────────────────┘

DEPOIS:
┌─────────────────────────────────────────────────────────────┐
│ TODA A ÁREA É CLICÁVEL                                      │
│ ○ Nome da Oferta                                            │
│   R$ 9,90                                                   │
│   (Oferta Principal)                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Resumo das Alterações

| Arquivo | Ação | Linhas |
|---------|------|--------|
| `CheckoutConfigDialog.tsx` | MODIFICAR | Linhas 222-244 (~22 linhas) |

---

## Proteções e Acessibilidade

| Aspecto | Status |
|---------|--------|
| Teclado | ✅ RadioGroup já suporta navegação por teclado |
| Leitor de tela | ✅ Label associado ao input via htmlFor |
| Hover | ✅ `hover:bg-muted/50` mantido |
| Selecionado | ✅ Novo estilo `bg-primary/10` para feedback visual |
| Disabled | ✅ RadioGroup `disabled={saving}` continua funcionando |

---

## Conformidade RISE V3

| Critério | Status |
|----------|--------|
| Manutenibilidade Infinita | Solução HTML pura, zero complexidade |
| Zero Dívida Técnica | Usa padrão nativo, não precisa de manutenção |
| Arquitetura Correta | Semântica HTML correta |
| Escalabilidade | Funciona com N ofertas |
| Segurança | Nenhuma implicação |
| Limite 300 linhas | Arquivo já está dentro do limite |

---

## Benefícios

| Benefício | Descrição |
|-----------|-----------|
| UX Melhorada | 100% da área do card é clicável |
| Feedback Visual | Oferta selecionada tem destaque |
| Acessibilidade | Comportamento nativo do HTML |
| Zero JavaScript | Sem lógica adicional |
| Consistência | Mesmo padrão usado em outros selects do sistema |
