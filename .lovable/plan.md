
# Correção: Spinner Sobrepondo Texto no LoadingSwitch

## Diagnóstico do Problema

O componente `LoadingSwitch` (src/components/ui/loading-switch.tsx) possui um bug visual onde o spinner de loading sobrepõe o texto "Ativando..." ou "Desativando...".

### ROOT CAUSE (Linhas 74-79)
```typescript
{/* Loading indicator positioned next to switch */}
{isLoading && (
  <div className="absolute -right-7 top-1/2 -translate-y-1/2">
    <Loader2 className="h-4 w-4 animate-spin text-primary" />
  </div>
)}
```

O spinner está posicionado como `absolute -right-7` dentro do container `relative` do switch. Porém, o label está FORA deste container (linha 82-91), e o `gap-3` entre o switch e o label não é suficiente para acomodar o spinner sem sobreposição.

### Fluxo Visual Atual (QUEBRADO)
```
┌─────────────────────────────────────────────────────────────────┐
│  [SWITCH] ⟲ (spinner)   Desativando...                         │
│      └─ absolute -right-7 ─────┘     ↑                          │
│                              Spinner sobrepõe o texto           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Análise de Soluções (RISE V3)

### Solução A: Aumentar o gap entre switch e label
- Aumentar `gap-3` para `gap-8` ou maior
- Manutenibilidade: 6/10 - Hack visual, pode quebrar em outros contextos
- Zero DT: 5/10 - Pode precisar de ajustes futuros
- Arquitetura: 5/10 - Não resolve o problema na raiz
- Escalabilidade: 5/10 - Não funciona bem em diferentes tamanhos de tela
- Segurança: 10/10 - Sem impacto
- **NOTA FINAL: 5.6/10**

### Solução B: Mover o spinner para DENTRO do label (inline)
- Remover posição absolute do spinner
- Renderizar o spinner inline ANTES do texto no label
- Layout: `[SWITCH]   ⟲ Desativando...`
- Manutenibilidade: 10/10 - Fluxo natural, sem posicionamento absoluto
- Zero DT: 10/10 - Solução definitiva, sem ajustes futuros
- Arquitetura: 10/10 - Segue fluxo natural do DOM
- Escalabilidade: 10/10 - Funciona em qualquer contexto/tamanho
- Segurança: 10/10 - Sem impacto
- **NOTA FINAL: 10.0/10**

### Solução C: Substituir o label por um componente de loading separado
- Quando loading, esconder label e mostrar apenas spinner
- Manutenibilidade: 7/10 - Mais código, lógica condicional
- Zero DT: 8/10 - Funciona, mas perde contexto visual
- Arquitetura: 7/10 - Mais complexo que necessário
- Escalabilidade: 8/10 - OK
- Segurança: 10/10 - Sem impacto
- **NOTA FINAL: 7.6/10**

### DECISÃO: Solução B (Nota 10.0/10)
Mover o spinner para dentro do label é a solução mais limpa e semanticamente correta. O usuário verá: `⟲ Ativando...` ou `⟲ Desativando...` com o spinner inline.

---

## Especificação Técnica

### Modificação: loading-switch.tsx

**ANTES (linhas 49-95):**
```typescript
return (
  <div className="flex items-center gap-3">
    <div className="relative">
      <SwitchPrimitives.Root ...>
        <SwitchPrimitives.Thumb ... />
      </SwitchPrimitives.Root>
      
      {/* Loading indicator positioned next to switch */}
      {isLoading && (
        <div className="absolute -right-7 top-1/2 -translate-y-1/2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        </div>
      )}
    </div>

    {showLabel && (
      <Label className={...}>
        {displayLabel}
      </Label>
    )}
  </div>
);
```

**DEPOIS:**
```typescript
return (
  <div className="flex items-center gap-3">
    <SwitchPrimitives.Root
      className={cn(
        "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-all",
        "data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:cursor-not-allowed disabled:opacity-50",
        isLoading && "cursor-wait opacity-70 animate-pulse",
        className
      )}
      checked={checked}
      disabled={disabled || isLoading}
      {...props}
      ref={ref}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform",
          "data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
        )}
      />
    </SwitchPrimitives.Root>

    {showLabel && (
      <Label
        className={cn(
          "text-sm min-w-[100px] transition-all cursor-pointer flex items-center gap-2",
          isLoading && "text-primary font-medium",
          (disabled || isLoading) && "cursor-not-allowed opacity-70"
        )}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {displayLabel}
      </Label>
    )}
  </div>
);
```

### Resultado Visual

```
┌─────────────────────────────────────────────────────────────────┐
│  ANTES:  [SWITCH]   ⟲sativando...   (spinner sobrepõe texto)   │
│  DEPOIS: [SWITCH]   ⟲ Desativando... (spinner inline no label) │
└─────────────────────────────────────────────────────────────────┘
```

---

## Arquivos a Modificar

| Arquivo | Ação |
|---------|------|
| `src/components/ui/loading-switch.tsx` | Mover spinner de absolute para inline no label |

---

## Verificação RISE V3

| Critério | Nota | Justificativa |
|----------|------|---------------|
| Manutenibilidade | 10/10 | Código mais simples, sem posicionamento absolute |
| Zero DT | 10/10 | Solução definitiva |
| Arquitetura | 10/10 | Segue fluxo natural do DOM |
| Escalabilidade | 10/10 | Funciona em qualquer contexto |
| Segurança | 10/10 | Sem impacto |
| **NOTA FINAL** | **10.0/10** |

---

## Tempo Estimado
**5 minutos**
