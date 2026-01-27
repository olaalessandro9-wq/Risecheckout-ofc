
# Plano: Auto-Save para Ofertas Existentes (Debounce)

## Objetivo

Quando o vendedor editar o **nome** ou **preço** de uma oferta já existente (Oferta Principal ou Ofertas Adicionais), o sistema deve **salvar automaticamente** após um breve delay, sem precisar clicar em "Salvar Produto".

---

## Análise de Soluções

### Solução A: Debounce no Hook com Salvamento Automático
- **Manutenibilidade:** 9/10 - Hook isolado, lógica centralizada
- **Zero DT:** 9/10 - Usa Edge Function existente (offer-crud/update)
- **Arquitetura:** 10/10 - Separação clara entre UI e lógica
- **Escalabilidade:** 9/10 - Facilmente extensível para mais campos
- **Segurança:** 10/10 - Autenticação via api.call()
- **NOTA FINAL: 9.4/10**
- **Tempo estimado:** 3-4 horas

**Como funciona:**
1. Usuário edita campo (nome ou preço)
2. Debounce de 1 segundo antes de disparar save
3. Toast sutil: "Salvando..." → "Salvo ✓"
4. Não precisa clicar em nenhum botão

### Solução B: Botão "Salvar" Individual em Cada Card
- **Manutenibilidade:** 8/10 - Requer estado individual por card
- **Zero DT:** 8/10 - Mesma Edge Function
- **Arquitetura:** 7/10 - Menos elegante, mais cliques
- **Escalabilidade:** 7/10 - Precisa gerenciar "dirty state" por card
- **Segurança:** 10/10 - Mesma autenticação
- **NOTA FINAL: 8.0/10**
- **Tempo estimado:** 3-4 horas

**Problemas:**
- Mais cliques para o usuário
- Precisa de UI para indicar "não salvo"

---

## DECISÃO: Solução A (Nota 9.4/10)

A Solução A é superior porque:
1. **Zero cliques adicionais:** Salva sozinho
2. **Feedback visual:** Toast indica salvamento
3. **Debounce inteligente:** Não sobrecarrega a API
4. **UX moderna:** Comportamento esperado em 2026

---

## Arquitetura da Solução

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                    FLUXO AUTO-SAVE COM DEBOUNCE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. Usuário digita no campo (nome ou preço)                                 │
│     │                                                                        │
│     ▼                                                                        │
│  2. onChange atualiza state local imediatamente                             │
│     │                                                                        │
│     ▼                                                                        │
│  3. useAutoSaveOffer detecta mudança                                        │
│     ├── Cancela debounce anterior (se houver)                               │
│     ├── Inicia novo debounce (1000ms)                                       │
│     └── Mostra indicador sutil (opcional)                                   │
│     │                                                                        │
│     ▼                                                                        │
│  4. Após 1 segundo sem nova digitação:                                      │
│     ├── Validação (nome não vazio, preço > 0)                               │
│     ├── Se inválido: não salva, mostra erro                                 │
│     ├── Se válido: api.call('offer-crud', { action: 'update', ... })        │
│     │                                                                        │
│     ▼                                                                        │
│  5. Resultado:                                                               │
│     ├── Sucesso: Toast discreto "Alterações salvas" (2s)                    │
│     ├── Erro: Toast erro (persiste até fechar)                              │
│     └── State machine: dispatchForm({ type: 'REFRESH' }) opcional           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Componentes e Arquivos

### 1. CRIAR: `src/components/products/offers-manager/useAutoSaveOffer.ts`

Hook dedicado para auto-save com debounce:

```typescript
interface UseAutoSaveOfferProps {
  offerId: string;
  isTemporary: boolean; // IDs temp-xxx não salvam (ainda não existem)
  currentName: string;
  currentPrice: number;
  currentMemberGroupId: string | null;
  debounceMs?: number; // default: 1000
  onSaveSuccess?: () => void;
}

// Retorna:
// - isSaving: boolean (para indicador visual)
// - lastSavedAt: Date | null (para feedback)
// - saveError: string | null
```

**Lógica:**
- Compara valores atuais com valores "commitados"
- Usa `useRef` para guardar o timeout do debounce
- Usa `useEffect` para detectar mudanças
- Chama `api.call('offer-crud', { action: 'update', ... })`
- Atualiza valores "commitados" após save bem-sucedido

### 2. MODIFICAR: `src/components/products/offers-manager/DefaultOfferCard.tsx`

Adicionar auto-save:

```typescript
// Mudanças:
// - Importar useAutoSaveOffer
// - Usar o hook passando offer.id, offer.name, offer.price
// - Adicionar indicador visual de saving (opcional: ícone subtle)
```

### 3. MODIFICAR: `src/components/products/offers-manager/AdditionalOfferCard.tsx`

Adicionar auto-save:

```typescript
// Mudanças:
// - Importar useAutoSaveOffer
// - Usar o hook passando offer.id, offer.name, offer.price
// - Mesmo padrão do DefaultOfferCard
```

### 4. MODIFICAR: `src/components/products/offers-manager/types.ts`

Adicionar tipos para auto-save (se necessário):

```typescript
// Adicionar:
export interface AutoSaveState {
  isSaving: boolean;
  lastSavedAt: Date | null;
  error: string | null;
}
```

---

## Detalhes do useAutoSaveOffer

### Parâmetros

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| offerId | string | ID da oferta (não salva se começa com "temp-") |
| currentName | string | Nome atual do campo |
| currentPrice | number | Preço atual do campo |
| debounceMs | number | Delay antes de salvar (default: 1000ms) |

### Estados

| Estado | Uso |
|--------|-----|
| `isSaving` | Mostrar indicador (ex: spinner pequeno) |
| `lastSavedAt` | Opcional: "Salvo às 14:28" |
| `saveError` | Mostrar erro se falhar |

### Comportamento

1. **Ofertas temporárias (temp-xxx):** Ignora auto-save
2. **Validação falha:** Não salva, não mostra erro (já tem erro inline)
3. **Debounce:** Cancela save anterior se usuário continuar digitando
4. **Toast:** Discreto, some após 2 segundos

---

## Indicador Visual (Opcional mas Recomendado)

Pequeno indicador no card mostrando estado:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ Oferta Principal                                          [💾 Salvando...] │
│                                                                              │
│ Nome: [Produto teste              ]    Preço: [R$ 9,90           ]          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

↓ Após salvar:

┌─────────────────────────────────────────────────────────────────────────────┐
│ Oferta Principal                                               [✓ Salvo]   │
│                                                                              │
│ Nome: [Produto teste              ]    Preço: [R$ 9,90           ]          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

O indicador [✓ Salvo] desaparece após 3 segundos.

---

## Resumo das Alterações

| Arquivo | Ação | Linhas Est. |
|---------|------|-------------|
| `useAutoSaveOffer.ts` | CRIAR | ~80 linhas |
| `DefaultOfferCard.tsx` | MODIFICAR | +15 linhas |
| `AdditionalOfferCard.tsx` | MODIFICAR | +15 linhas |
| `types.ts` | MODIFICAR | +5 linhas |

---

## Proteções

| Cenário | Comportamento |
|---------|---------------|
| Oferta temporária (temp-xxx) | Auto-save desabilitado |
| Usuário digitando rápido | Debounce cancela saves anteriores |
| Erro de rede | Toast de erro, não perde dados locais |
| Navegação durante save | Save completa em background |
| Validação falha | Não tenta salvar, erro inline visível |

---

## Conformidade RISE V3

| Critério | Status |
|----------|--------|
| Manutenibilidade Infinita | Hook isolado, zero acoplamento |
| Zero Dívida Técnica | Usa Edge Function existente |
| Arquitetura Correta | Separação de responsabilidades |
| Escalabilidade | Facilmente extensível |
| Segurança | Autenticação via api.call() |
| Limite 300 linhas | Hook ~80 linhas |

---

## Benefícios

| Benefício | Descrição |
|-----------|-----------|
| Zero cliques | Salva automaticamente |
| Consistência | Dados sempre sincronizados |
| Feedback visual | Usuário sabe que salvou |
| Performático | Debounce evita chamadas excessivas |
| Resiliente | Erros não perdem dados locais |
