# Análise Comparativa: Brick.tsx vs CustomCardForm.tsx

**Data:** 29 de Novembro de 2025
**Objetivo:** Determinar se podemos substituir CustomCardForm pelo Brick novo

## 📊 Comparação de Funcionalidades

| Funcionalidade | Brick.tsx (Novo) | CustomCardForm.tsx (Antigo) | Status |
|:---|:---:|:---:|:---|
| **Renderiza formulário de cartão** | ✅ | ✅ | ✅ Equivalente |
| **Inicializa SDK do MP** | ✅ | ✅ | ✅ Equivalente |
| **Callbacks (onReady, onSubmit, onError)** | ✅ | ✅ | ✅ Equivalente |
| **Validação de campos** | ⚠️ SDK nativo | ✅ Manual + SDK | ❌ **GAP** |
| **Campos customizados (Nome, CPF)** | ❌ | ✅ | ❌ **GAP** |
| **Seleção de parcelas** | ⚠️ SDK nativo | ✅ Manual | ❌ **GAP** |
| **Controle de erros por campo** | ⚠️ SDK nativo | ✅ Granular | ❌ **GAP** |
| **Ref para submit externo** | ❌ | ✅ | ❌ **GAP CRÍTICO** |
| **Scroll para erro** | ❌ | ✅ | ⚠️ Nice to have |
| **Customização visual** | ⚠️ Limitada | ✅ Total | ⚠️ Importante |

## 🔍 Análise Detalhada

### Brick.tsx (Novo)

**Tipo:** Componente wrapper do Brick oficial do Mercado Pago

**Abordagem:** Usa o Brick Builder do MP (API de alto nível)

**Características:**
- ✅ Código limpo e simples (~140 linhas)
- ✅ Usa API oficial do MP (menos bugs)
- ✅ Callbacks bem definidos
- ❌ Menos controle sobre campos individuais
- ❌ Não expõe ref para submit externo
- ❌ Não permite adicionar campos customizados (CPF, Nome)

**Código de Inicialização:**
```typescript
const mp = new window.MercadoPago(publicKey, { locale: "pt-BR" });
const brickBuilder = mp.bricks();
await brickBuilder.create("payment", brickConfig);
```

### CustomCardForm.tsx (Antigo)

**Tipo:** Formulário customizado usando Card Form API do MP

**Abordagem:** Usa o cardForm() do MP (API de baixo nível)

**Características:**
- ✅ Controle total sobre cada campo
- ✅ Validação granular (campo por campo)
- ✅ Campos customizados (Nome do titular, CPF)
- ✅ Ref para submit externo (usado pelo PaymentSection)
- ✅ Seleção manual de parcelas
- ❌ Código complexo (~200+ linhas)
- ❌ Gambiarras (polling de foco, stale closures)
- ❌ Usa API de baixo nível (mais propensa a bugs)

**Código de Inicialização:**
```typescript
const mp = new window.MercadoPago(publicKey, { locale: 'pt-BR' });
const cardForm = mp.cardForm({
  amount: amount.toString(),
  iframe: true,
  form: {
    id: "form-checkout",
    cardNumber: { id: "form-checkout__cardNumber" },
    // ... campos individuais
  }
});
```

## 🚨 Gaps Críticos Identificados

### 1. Ref para Submit Externo (CRÍTICO)

**Problema:** `PaymentSection.tsx` usa `customCardFormRef.current.submit()` para submeter o formulário de fora.

**Código Atual:**
```typescript
// PaymentSection.tsx
const customCardFormRef = useRef<CustomCardFormRef>(null);

useImperativeHandle(ref, () => ({
  submitCard: async () => {
    if (customCardFormRef.current) {
      await customCardFormRef.current.submit();
    }
  }
}));
```

**Brick.tsx:** Não expõe nenhum método de submit via ref.

**Impacto:** 🔴 **Bloqueante** - Sem isso, o botão de pagamento não funciona.

### 2. Campos Customizados (Nome e CPF)

**Problema:** `CustomCardForm` renderiza campos adicionais:
- Nome do titular do cartão
- CPF/CNPJ do titular

**Brick.tsx:** Renderiza apenas o container do Brick (MP controla tudo).

**Impacto:** 🟡 **Alto** - Esses campos são obrigatórios para o Mercado Pago.

### 3. Seleção Manual de Parcelas

**Problema:** `CustomCardForm` permite escolher parcelas via dropdown customizado.

**Brick.tsx:** Parcelas são controladas pelo Brick (interface do MP).

**Impacto:** 🟡 **Médio** - Perda de controle sobre UX.

### 4. Validação Granular

**Problema:** `CustomCardForm` valida cada campo individualmente e mostra erros específicos.

**Brick.tsx:** Validação é feita pelo SDK (menos controle).

**Impacto:** 🟡 **Médio** - UX menos refinada.

## 🎯 Conclusão

### ❌ Substituição Direta NÃO é Viável

O `Brick.tsx` novo **não pode substituir** o `CustomCardForm.tsx` diretamente porque:

1. **Falta de Ref:** Não há como chamar submit de fora
2. **Campos Customizados:** Não permite adicionar Nome e CPF
3. **Controle de Parcelas:** Menos controle sobre a UX

### 🔧 Opções de Solução

#### Opção A: Adaptar Brick.tsx para Suportar Refs

**Ação:** Modificar `Brick.tsx` para expor um método `submit()` via `useImperativeHandle`.

**Vantagens:**
- ✅ Mantém código limpo
- ✅ Usa API oficial

**Desvantagens:**
- ❌ Ainda não resolve campos customizados
- ❌ Ainda não resolve controle de parcelas

**Esforço:** Baixo (1h)

#### Opção B: Manter CustomCardForm e Movê-lo para o Módulo

**Ação:** Mover `CustomCardForm.tsx` e `useMercadoPagoBrick.ts` para `gateways/mercadopago/`.

**Vantagens:**
- ✅ Zero quebra de funcionalidade
- ✅ Organiza arquitetura
- ✅ Mantém todas as features

**Desvantagens:**
- ❌ Mantém código complexo
- ❌ Mantém gambiarras

**Esforço:** Baixo (30min)

#### Opção C: Criar Híbrido (CardForm.tsx)

**Ação:** Criar novo componente `CardForm.tsx` no módulo que:
- Usa `cardForm()` API (baixo nível) como o antigo
- Mas com código limpo e bem estruturado
- Expõe ref para submit
- Permite campos customizados

**Vantagens:**
- ✅ Mantém funcionalidades
- ✅ Remove gambiarras
- ✅ Código limpo

**Desvantagens:**
- ⚠️ Requer reescrita

**Esforço:** Alto (3-4h)

## 📋 Recomendação Final

### Opção B: Mover para o Módulo (RECOMENDADA)

**Justificativa:**
1. **Pragmatismo:** Funciona perfeitamente agora, não quebra nada
2. **Rápido:** 30 minutos vs 3-4 horas
3. **Arquitetura:** Ainda organiza o código no módulo
4. **Futuro:** Podemos refatorar depois com calma

**Plano de Ação:**

1. **Mover arquivos:**
   - `useMercadoPagoBrick.ts` → `gateways/mercadopago/hooks.ts` (adicionar)
   - `CustomCardForm.tsx` → `gateways/mercadopago/components/CardForm.tsx`

2. **Atualizar exports:**
   - Adicionar em `gateways/mercadopago/index.ts`:
     ```typescript
     export { CardForm } from "./components/CardForm";
     export { useMercadoPagoBrick } from "./hooks";
     ```

3. **Atualizar imports:**
   - `PaymentSection.tsx`:
     ```typescript
     import * as MercadoPago from "@/integrations/gateways/mercadopago";
     // Usar: <MercadoPago.CardForm />
     ```

4. **Manter Brick.tsx:**
   - Deixar para uso futuro ou outros casos de uso
   - Documentar diferenças no README

## 🚀 Próximos Passos

1. ✅ Confirmar decisão com o usuário
2. ⏳ Executar migração (Opção B)
3. ⏳ Testar fluxo completo
4. ⏳ Partir para PushinPay

## 📝 Notas

- O Brick.tsx pode ser útil para casos mais simples no futuro
- A refatoração completa (Opção C) pode ser feita depois, sem pressa
- O importante agora é organizar a arquitetura, não reescrever tudo
