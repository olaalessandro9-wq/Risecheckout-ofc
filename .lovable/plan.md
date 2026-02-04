
# Plano: Reordenar Opções de Entrega (Área de Membros por Último)

## Objetivo
Alterar a ordem das opções de Tipo de Entrega para que "Área de Membros" apareça por último.

## Ordem Atual vs Nova Ordem

| Posição | Ordem Atual | Nova Ordem |
|---------|-------------|------------|
| 1º | Entrega Padrão | Entrega Padrão |
| 2º | Área de Membros | Entrega Externa |
| 3º | Entrega Externa | Área de Membros |

## Arquivos a Modificar (2 arquivos)

| Arquivo | Linha | Ação |
|---------|-------|------|
| `src/modules/products/tabs/general/ProductDeliverySection.tsx` | 35-54 | Reordenar array `DELIVERY_OPTIONS` |
| `src/components/products/add-product-dialog/StepTwo.tsx` | 31-55 | Reordenar array `DELIVERY_OPTIONS` |

## Mudança Específica

Em ambos os arquivos, o array `DELIVERY_OPTIONS` será alterado de:

```typescript
const DELIVERY_OPTIONS = [
  { id: 'standard', ... },
  { id: 'members_area', ... },  // Mover para o final
  { id: 'external', ... },
];
```

Para:

```typescript
const DELIVERY_OPTIONS = [
  { id: 'standard', ... },
  { id: 'external', ... },
  { id: 'members_area', ... },  // Agora por último
];
```

## Conformidade RISE V3

| Critério | Nota | Justificativa |
|----------|------|---------------|
| Manutenibilidade | 10/10 | Alteração mínima e pontual |
| Zero Dívida Técnica | 10/10 | Sem código temporário |
| Arquitetura | 10/10 | Não afeta estrutura |
| Escalabilidade | 10/10 | Fácil adicionar novas opções |
| Segurança | 10/10 | Apenas ordem visual |
| **NOTA FINAL** | **10.0/10** | |

## Resultado Visual

A ordem das opções em ambos os locais ficará:
1. **Entrega Padrão** - Rise envia email com link personalizado
2. **Entrega Externa** - Rise confirma pagamento, você faz a entrega
3. **Área de Membros** - Rise envia email com acesso à área de membros (Em Breve para non-admin)
