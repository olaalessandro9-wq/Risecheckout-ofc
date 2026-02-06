

# Validacao de Limite: Checkout Name (100 caracteres)

## Diagnostico

O campo `name` no `CheckoutConfigDialog.tsx` nao possui validacao de comprimento. O usuario pode digitar texto ilimitado. Precisa seguir o mesmo padrao implementado nos Order Bumps:

1. Sem contador de caracteres durante digitacao
2. Erro (borda vermelha + mensagem) SOMENTE ao tentar salvar com texto acima de 100 caracteres
3. Save bloqueado ate correcao

## Analise de Solucoes

### Solucao A: Validacao hardcoded no handleSave (sem SSOT)

Adicionar `if (name.length > 100)` diretamente no `handleSave` do `CheckoutConfigDialog.tsx`.

- Manutenibilidade: 6/10 (limite hardcoded, duplicacao com backend)
- Zero DT: 5/10 (se mudar limite, precisa lembrar de atualizar)
- Arquitetura: 5/10 (ignora SSOT em field-limits.ts, nao segue padrao Order Bump)
- Escalabilidade: 6/10
- Seguranca: 10/10
- **NOTA FINAL: 6.0/10**

### Solucao B: SSOT em field-limits.ts + Estado de Erro Reativo (Padrao Order Bump)

1. Adicionar `CHECKOUT_FIELD_LIMITS` ao SSOT existente (`field-limits.ts`)
2. Adicionar estado `nameError` no `CheckoutConfigDialog.tsx`
3. Validar no `handleSave` usando constante SSOT
4. Mostrar borda vermelha + mensagem no Input
5. Limpar erro quando usuario edita o campo

- Manutenibilidade: 10/10 (limites centralizados, padrao consistente com Order Bump)
- Zero DT: 10/10 (SSOT unico, zero duplicacao)
- Arquitetura: 10/10 (segue padrao existente de field-limits + validacao reativa)
- Escalabilidade: 10/10 (adicionar novos campos ao checkout e trivial)
- Seguranca: 10/10
- **NOTA FINAL: 10.0/10**

### DECISAO: Solucao B (Nota 10.0)

A Solucao A ignora o SSOT ja existente e o padrao validado nos Order Bumps. A Solucao B reutiliza a arquitetura provada.

---

## Plano de Execucao

### 1. EDITAR `src/lib/constants/field-limits.ts` - Adicionar CHECKOUT_FIELD_LIMITS

Adicionar novo bloco de constantes seguindo o padrao existente:

```typescript
export const CHECKOUT_FIELD_LIMITS = {
  /** Nome do checkout: ate 100 caracteres */
  NAME: 100,
} as const;
```

### 2. EDITAR `src/components/products/CheckoutConfigDialog.tsx` - Adicionar validacao

Alteracoes cirurgicas no componente existente:

**a) Import da constante SSOT:**
```typescript
import { CHECKOUT_FIELD_LIMITS } from "@/lib/constants/field-limits";
```

**b) Estado de erro de validacao:**
```typescript
const [nameError, setNameError] = useState<string | null>(null);
```

**c) Validacao no `handleSave` (antes da chamada API):**
```typescript
// Validate field limits (SSOT)
if (name.length > CHECKOUT_FIELD_LIMITS.NAME) {
  setNameError(`O nome deve ter no maximo ${CHECKOUT_FIELD_LIMITS.NAME} caracteres. Atual: ${name.length}`);
  return;
}
```

**d) Limpar erro no `onChange` do Input:**
```typescript
onChange={(e) => {
  setName(e.target.value);
  if (nameError) setNameError(null);
}}
```

**e) Borda vermelha condicional no Input:**
```typescript
className={`bg-background ${nameError ? "border-destructive" : "border-border"}`}
```

**f) Mensagem de erro abaixo do Input:**
```typescript
{nameError && (
  <p className="text-[11px] text-destructive leading-tight">{nameError}</p>
)}
```

**g) Reset do erro quando o dialog abre (no useEffect existente):**
```typescript
setNameError(null);
```

---

## Arvore de Arquivos

```text
src/
  lib/
    constants/
      field-limits.ts                                      -- EDITAR (adicionar CHECKOUT_FIELD_LIMITS)
  components/
    products/
      CheckoutConfigDialog.tsx                             -- EDITAR (adicionar validacao + estado de erro)
```

## Comportamento Esperado

1. Usuario digita texto livremente no campo Nome (sem contador visivel)
2. Ao clicar "Salvar":
   - Se Nome > 100 chars: borda vermelha + mensagem "O nome deve ter no maximo 100 caracteres. Atual: X"
   - O save e bloqueado ate que esteja dentro do limite
3. Quando o usuario edita o campo e fica dentro do limite, o erro desaparece automaticamente

## Checkpoint de Qualidade RISE V3

| Pergunta | Resposta |
|----------|----------|
| Esta e a MELHOR solucao possivel? | Sim - usa SSOT existente, padrao Order Bump |
| Existe alguma solucao com nota maior? | Nao |
| Isso cria divida tecnica? | Zero |
| Precisaremos "melhorar depois"? | Nao |
| O codigo sobrevive 10 anos sem refatoracao? | Sim |
| Estou escolhendo isso por ser mais rapido? | Nao |

