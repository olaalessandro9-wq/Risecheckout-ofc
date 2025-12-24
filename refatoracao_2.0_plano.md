# Refatoração 2.0 - RiseCheckout
## Validação e Plano Detalhado

**Data:** 27/11/2025
**Objetivo:** Transformar código "funcional mas complexo" em "robusto, simples e manutenível"

---

## ✅ Validação da Recomendação do Gemini

### Análise Manus vs Recomendação Gemini

| Aspecto | Manus AI | Gemini | Validação |
|---------|----------|--------|-----------|
| **Frente 1: PublicCheckout** | Dividir em componentes e hooks | Extrair OrderSummary, OrderBumpList, SecurityBadges, useCheckoutTracking | ✅ **ALINHADO** |
| **Frente 2: CustomCardForm** | Dividir em componentes e hooks, remover gambiarras | Criar useMercadoPagoBrick, resolver polling, remover "Solução Nuclear" | ✅ **ALINHADO** |
| **Frente 3: Segurança** | Corrigir 3 vulnerabilidades altas | Sanitização XSS, remover logs | ⚠️ **PARCIAL** (Gemini focou em 2 de 3) |

### Conclusão da Validação

✅ **A recomendação do Gemini está CORRETA e ALINHADA** com a análise da Manus.

**Diferenças:**
- Gemini priorizou refatoração (Frentes 1 e 2) antes de segurança (Frente 3)
- Manus priorizou segurança (Fase 1) antes de refatoração (Fase 2)

**Decisão:** Seguir a ordem do Gemini (refatoração primeiro) pois:
1. Código mais simples facilita implementação de segurança depois
2. "Vitória rápida" na legibilidade motiva a equipe
3. Vulnerabilidades altas não são críticas (0 vulnerabilidades críticas)

---

## 🗺️ Plano Detalhado de Implementação

### Frente 1: Refatoração do PublicCheckout.tsx

#### Objetivo
Reduzir de ~1500 linhas para ~300 linhas

#### Componentes a Extrair

**1. OrderSummary.tsx**
- **Responsabilidade:** Exibir resumo do pedido (produto + bumps + total)
- **Props:** `{ product, bumps, total, paymentMethod }`
- **Linhas Removidas:** ~150

**2. OrderBumpList.tsx**
- **Responsabilidade:** Renderizar lista de bumps selecionáveis
- **Props:** `{ bumps, selectedBumps, onToggle }`
- **Linhas Removidas:** ~200

**3. SecurityBadges.tsx**
- **Responsabilidade:** Exibir selos de segurança no rodapé
- **Props:** Nenhuma (componente estático)
- **Linhas Removidas:** ~50

#### Hooks a Extrair

**1. useCheckoutTracking.ts**
- **Responsabilidade:** Gerenciar eventos do Facebook Pixel e UTMify
- **Parâmetros:** `{ checkout, vendorId, product, total }`
- **Retorno:** Nenhum (side effects apenas)
- **Linhas Removidas:** ~100

#### Resultado Esperado
- `PublicCheckout.tsx`: ~1000 linhas (redução de 500 linhas)
- Arquivos novos: 4 (3 componentes + 1 hook)

---

### Frente 2: "Desgambiarrização" do CustomCardForm.tsx

#### Objetivo
Isolar gambiarras em hook dedicado, reduzir de ~1400 para ~200 linhas

#### Hook a Criar

**1. useMercadoPagoBrick.ts**
- **Responsabilidade:** Gerenciar SDK do Mercado Pago
- **Parâmetros:** `{ amount, publicKey, payerEmail, cardFieldsStyle }`
- **Retorno:** `{ isReady, error, submit, fieldErrors, clearError }`
- **Gambiarras Isoladas:**
  - "SOLUÇÃO NUCLEAR" (useEffect vazio)
  - "CORREÇÃO CRÍTICA DE STALE CLOSURE" (onSubmitRef)
  - Polling de ActiveElement (50ms)

#### Melhorias Implementadas

**1. Resolver Polling (50ms → Eventos Declarativos)**
- **Antes:** `setInterval(() => { ... }, 50)`
- **Depois:** Usar `onFocus` nos wrappers das divs

**2. Remover "SOLUÇÃO NUCLEAR"**
- **Antes:** `useEffect(() => { ... }, [])` (array vazio)
- **Depois:** `useRef` para singleton + dependências corretas

**3. Remover "STALE CLOSURE"**
- **Antes:** `onSubmitRef.current = onSubmit`
- **Depois:** Hook retorna função `submit` estável

#### Resultado Esperado
- `CustomCardForm.tsx`: ~200 linhas (redução de 1200 linhas)
- `useMercadoPagoBrick.ts`: ~800 linhas (gambiarras isoladas e documentadas)

---

### Frente 3: Segurança e Otimização

#### 1. Sanitização XSS

**Arquivos Afetados:**
- `src/pages/PublicCheckout.tsx`
- `supabase/functions/create-order/index.ts`

**Implementação:**
```typescript
import DOMPurify from 'dompurify';

function sanitizeInput(input: string): string {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
}

// Uso
const safeName = sanitizeInput(customerName);
```

#### 2. Remover Logs de Produção

**Arquivos Afetados:**
- Todos os arquivos com `console.log`

**Implementação:**
```typescript
// src/lib/logger.ts
export const logger = {
  info: (message: string, data?: any) => {
    if (import.meta.env.DEV) {
      console.log(message, data);
    }
  },
  error: (message: string, error?: any) => {
    console.error(message, error); // Sempre loga erros
  }
};

// Uso
logger.info('🚨 [handlePixPayment] INÍCIO', selectedPayment);
```

#### 3. Criptografia de Credenciais (Opcional - Não mencionado pelo Gemini)

**Decisão:** Implementar em fase futura (requer chave mestra e migração de dados)

---

## 📋 Checklist de Implementação

### Frente 1: PublicCheckout.tsx
- [ ] Criar `OrderSummary.tsx`
- [ ] Criar `OrderBumpList.tsx`
- [ ] Criar `SecurityBadges.tsx`
- [ ] Criar `useCheckoutTracking.ts`
- [ ] Refatorar `PublicCheckout.tsx` para usar novos componentes/hooks
- [ ] Testar fluxo completo de checkout

### Frente 2: CustomCardForm.tsx
- [ ] Criar `useMercadoPagoBrick.ts`
- [ ] Implementar resolução de polling (eventos declarativos)
- [ ] Remover "SOLUÇÃO NUCLEAR"
- [ ] Remover "STALE CLOSURE"
- [ ] Refatorar `CustomCardForm.tsx` para usar novo hook
- [ ] Testar pagamento com cartão

### Frente 3: Segurança
- [ ] Instalar `dompurify`
- [ ] Criar `sanitizeInput()` em `src/lib/utils.ts`
- [ ] Aplicar sanitização em `PublicCheckout.tsx`
- [ ] Aplicar sanitização em `create-order/index.ts`
- [ ] Criar `logger.ts`
- [ ] Substituir todos `console.log` por `logger.info`
- [ ] Testar em produção

---

## ⏱️ Estimativa de Tempo

| Frente | Tarefas | Tempo Estimado |
|--------|---------|----------------|
| Frente 1 | 4 componentes/hooks + refatoração | 3-4 horas |
| Frente 2 | 1 hook + refatoração | 4-5 horas |
| Frente 3 | Sanitização + logger | 1-2 horas |
| **Total** | | **8-11 horas** |

---

## 🚀 Ordem de Execução

1. **Frente 1 - Fase 1:** Criar `OrderSummary.tsx`
2. **Frente 1 - Fase 2:** Criar `OrderBumpList.tsx`
3. **Frente 1 - Fase 3:** Criar `SecurityBadges.tsx`
4. **Frente 1 - Fase 4:** Criar `useCheckoutTracking.ts`
5. **Frente 1 - Fase 5:** Refatorar `PublicCheckout.tsx`
6. **Frente 2 - Fase 1:** Criar `useMercadoPagoBrick.ts`
7. **Frente 2 - Fase 2:** Refatorar `CustomCardForm.tsx`
8. **Frente 3 - Fase 1:** Implementar sanitização
9. **Frente 3 - Fase 2:** Implementar logger
10. **Teste Final:** Validar todos os fluxos

---

## ✅ Pronto para Começar!

**Próximo Passo:** Criar `OrderSummary.tsx` (Frente 1 - Fase 1)

Aguardando aprovação para iniciar! 🚀
