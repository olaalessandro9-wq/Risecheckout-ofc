

# Rework: Secao de Gateways de Pagamento (PIX e Cartao de Credito)

## O Que Muda

### Remocoes
- **Taxas/Fees**: Remover toda exibicao de taxas de todos os gateways (texto "Taxa: R$ 2,00 + 0.99%")
- **Descricoes**: Remover as descricoes dos gateways (texto "Gateway completo com PIX e Cartao", etc.)

### Redesign Visual

O design atual usa cards grandes com RadioGroupItem circular + nome + taxas + descricao + aviso de credenciais, resultando em blocos visuais pesados e com muita informacao desnecessaria.

O novo design sera:

**Cards compactos e limpos** com:
- Nome do gateway em destaque (unica informacao textual)
- Borda sutil com transicao suave no hover
- Estado selecionado com borda `primary` e fundo suave `primary/5`
- Icone de check discreto no canto superior direito quando selecionado (em vez do RadioGroupItem circular)
- Badge "Em Breve" minimalista para gateways nao disponiveis
- Status de credencial como um dot indicator discreto (verde = configurado, amarelo = pendente, azul = via secrets)

**Layout das secoes PIX e Cartao**:
- Titulo da secao com icone contextual (QrCode para PIX, CreditCard para Cartao)
- Grid responsivo: 3 colunas em desktop, 2 em tablet, 1 em mobile
- Separador visual sutil entre PIX e Cartao
- Remocao do bloco "Aviso de Configuracao" (informacao redundante ja presente no dot indicator)

**Credential Status integrado no card**:
- Dot verde no canto com tooltip "Configurado" (em vez de texto abaixo do selector)
- Dot azul com tooltip "Via Secrets" para Owner
- Dot amarelo com tooltip "Configurar no Financeiro" para credenciais pendentes

## Arvore de Arquivos

```text
src/components/products/
  GatewaySelector.tsx                -- REESCREVER (novo design completo)
  settings/GatewaySection.tsx        -- EDITAR (remover GatewayCredentialStatus, simplificar layout, adicionar icones)
```

## Detalhes Tecnicos

### `GatewaySelector.tsx` - Reescrita Completa

Mudancas estruturais:
1. Remover toda referencia a `formatGatewayFees` e `fees`
2. Remover exibicao de `gateway.description`
3. Substituir `RadioGroup` + `RadioGroupItem` por cards clicaveis com estado controlado (mantendo a mesma interface `value`/`onChange`)
4. Novo sub-componente `GatewayCard` com design minimalista
5. Novo sub-componente `CredentialDot` para status de credencial inline
6. Grid de 3 colunas (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`)

Layout de cada card:

```text
┌─────────────────────────┐
│                    [dot] │  <- dot de credential status (verde/amarelo/azul)
│                         │
│     Gateway Name        │  <- texto centralizado, font-medium
│                         │
│              [check] ✓  │  <- icone check sutil quando selecionado
└─────────────────────────┘
```

Card selecionado: `border-primary bg-primary/5 shadow-sm`
Card hover: `hover:border-primary/50 hover:shadow-sm`
Card disabled: `opacity-50 cursor-not-allowed`
Card coming soon: `opacity-40` + badge "Em Breve" no canto

### `GatewaySection.tsx` - Simplificacao

1. Remover o componente `GatewayCredentialStatus` (substituido por dot inline no card)
2. Adicionar icones `QrCode` (PIX) e `CreditCard` (Cartao) nos titulos das secoes
3. Remover o bloco de "Aviso de Configuracao" (info box azul)
4. Adicionar `Separator` entre PIX e Cartao para separacao visual

### Dados removidos da exibicao (mantidos no registry para uso interno)

As taxas e descricoes continuam existindo no `payment-gateways.ts` para uso interno do sistema (calculo de fees no checkout, etc). Apenas a **exibicao** na UI de configuracoes e removida.

## Resultado Visual Esperado

| Aspecto | Antes | Depois |
|---------|-------|--------|
| Taxas | "Taxa: R$ 2,00 + 0.99%" visivel | Removido |
| Descricao | "Gateway completo com PIX e Cartao" | Removido |
| Radio button | Circulo RadioGroupItem | Check icon discreto |
| Credential status | Texto abaixo do selector | Dot colorido no card |
| Info box azul | Bloco grande com texto | Removido |
| Colunas | 2 colunas | 3 colunas (desktop) |
| Altura do card | ~80px (muito conteudo) | ~64px (compacto) |

