

# Plano: Alinhar Template Purchase com Templates que Funcionam

## Diagnóstico Final

Após comparação exaustiva de **todos os 5 templates**:

| Template | Return Style | Header CSS | Logo Width | Funciona no Gmail? |
|----------|--------------|------------|------------|-------------------|
| `payment` | `return \`<!DOCTYPE...` (sem indent) | `padding: 0; line-height: 0` | `width="400"` | **SIM** |
| `seller` | `return \`<!DOCTYPE...` (sem indent) | `padding: 0; line-height: 0` | `width="400"` | **SIM** |
| `members-area` | `return \`\n    <!DOCTYPE...` (com indent) | `padding: 40px 20px; border-bottom` | Sem width attr | **?** |
| `external` | `return \`\n    <!DOCTYPE...` (com indent) | `padding: 40px 20px; border-bottom` | Sem width attr | **?** |
| `purchase` | `return \`\n    <!DOCTYPE...` (com indent) | `padding: 40px 20px; border-bottom` | Sem width attr | **NAO** |

O template antigo que você enviou (que funcionava) tinha a estrutura mais simples - provavelmente similar ao `payment` e `seller`.

## Analise de Solucoes (RISE V3 Secao 4.4)

### Solucao A: Manter estrutura atual (members-area style)
Continuar tentando ajustes incrementais na estrutura atual.

- Manutenibilidade: 5/10
- Zero DT: 3/10 (loop de tentativa/erro)
- Arquitetura: 5/10
- Escalabilidade: 5/10
- Seguranca: 10/10
- **NOTA FINAL: 5.6/10**

### Solucao B: Copiar estrutura EXATA do `payment`/`seller` (que sabemos funcionar)
Reescrever `email-templates-purchase.ts` seguindo EXATAMENTE a estrutura de `payment` e `seller`:
- Return sem indentacao
- Header com `padding: 0; line-height: 0`
- Logo com `width="400"` no atributo HTML

- Manutenibilidade: 10/10
- Zero DT: 10/10 (baseado em templates comprovadamente funcionais)
- Arquitetura: 10/10 (padrao unico)
- Escalabilidade: 10/10
- Seguranca: 10/10
- **NOTA FINAL: 10.0/10**

### DECISAO: Solucao B (Nota 10.0)

## Implementacao Detalhada

### Arquivo: `supabase/functions/_shared/email-templates-purchase.ts`

**Mudancas especificas:**

1. **Return statement** - Mudar de:
```typescript
return `
    <!DOCTYPE html>
    ...
  `;
```
Para (igual `payment` e `seller`):
```typescript
return `<!DOCTYPE html>
<html lang="pt-BR">
...
</html>`;
```

2. **CSS do Header** - Mudar de:
```css
.header { text-align: center; padding: 40px 20px; border-bottom: 1px solid #E9ECEF; }
.header img { max-width: 180px; }
```
Para (igual `payment` e `seller`):
```css
.header { text-align: center; padding: 0; line-height: 0; }
.header img { display: block; width: 100%; max-width: 400px; height: auto; margin: 0 auto; }
```

3. **HTML do Logo** - Adicionar `width="400"`:
```html
<img src="${getLogoUrl()}" alt="Rise Checkout" width="400">
```

4. **Remover border-bottom do header** - Consistencia com templates funcionais

5. **Ajustar footer** - Seguir estrutura do `payment`/`seller`:
```css
.footer { text-align: center; padding: 24px 32px; font-size: 12px; color: #6C757D; border-top: 1px solid #E9ECEF; }
```

### Estrutura Final do Template

```text
<!DOCTYPE html>  (SEM whitespace antes)
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmacao de Compra - Rise Checkout</title>
  <style>
    @import url(...);
    body { ... }
    .container { ... }
    .header { padding: 0; line-height: 0; }  <- MUDANCA
    .header img { display: block; width: 100%; max-width: 400px; ... }  <- MUDANCA
    // ... resto do CSS
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="..." alt="Rise Checkout" width="400">  <- MUDANCA
    </div>
    // ... conteudo
  </div>
</body>
</html>
```

### Manter CTA Condicional

O CTA condicional (`data.deliveryUrl ? ... : ''`) sera mantido, pois essa logica e correta para o caso de uso do purchase.

### Arquivos a Modificar

| Arquivo | Acao |
|---------|------|
| `email-templates-purchase.ts` | Reescrever com estrutura de `payment`/`seller` |

### Teste Apos Implementacao

1. Deploy da Edge Function `email-preview`
2. Enviar preview `purchase-standard` via Email Preview
3. Verificar no Gmail: email completo SEM 3 pontinhos e logo em tamanho normal (400px)

## Checklist RISE V3

- [x] Analise de multiplas solucoes com notas
- [x] Escolha da solucao de maior nota (10.0)
- [x] Codigo baseado em templates que JA FUNCIONAM (`payment`, `seller`)
- [x] Consistencia arquitetural total
- [x] Zero divida tecnica
- [x] Logo restaurado para tamanho normal (400px)

