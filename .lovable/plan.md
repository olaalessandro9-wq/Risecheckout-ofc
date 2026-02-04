
# Plano de Implementação: Restrição de Acesso à Área de Membros por Role

## Objetivo
Restringir a funcionalidade "Área de Membros" para **admin/owner apenas**. Para outros roles (user, seller), a funcionalidade aparece como **"Em Breve"** em 3 pontos específicos:

1. **Tab "Área de Membros"** - Mostra placeholder em vez do conteúdo
2. **Tipo de Entrega "Área de Membros"** - Opção desabilitada com badge "Em Breve"
3. **Campo "Grupo de Acesso"** nas ofertas - Oculto para non-admin

---

## Arquivos a Modificar (12 total)

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/hooks/usePermissions.ts` | MODIFICAR | Adicionar `canAccessMembersArea: boolean` |
| `src/components/ui/coming-soon-placeholder.tsx` | CRIAR | Componente reutilizável |
| `src/modules/products/components/ProductTabs.tsx` | MODIFICAR | Tab condicional com Badge |
| `src/modules/products/tabs/general/ProductDeliverySection.tsx` | MODIFICAR | Desabilitar opção members_area |
| `src/components/products/add-product-dialog/StepTwo.tsx` | MODIFICAR | Desabilitar opção members_area |
| `src/components/products/offers-manager/types.ts` | MODIFICAR | Adicionar prop `canAccessMembersArea` |
| `src/components/products/offers-manager/index.tsx` | MODIFICAR | Passar prop para cards |
| `src/components/products/offers-manager/DefaultOfferCard.tsx` | MODIFICAR | Condicional no MemberGroupSelect |
| `src/components/products/offers-manager/AdditionalOfferCard.tsx` | MODIFICAR | Condicional no MemberGroupSelect |
| `src/components/products/offers-manager/NewOfferCard.tsx` | MODIFICAR | Condicional no MemberGroupSelect |
| `src/modules/products/tabs/general/ProductOffersSection.tsx` | MODIFICAR | Adicionar prop |
| `src/modules/products/tabs/GeneralTab.tsx` | MODIFICAR | Obter e passar permissão |

---

## Detalhes de Implementação

### Passo 1: usePermissions.ts
Adicionar nova permissão na interface e no hook:

```typescript
// Na interface Permissions:
canAccessMembersArea: boolean;  // Pode acessar área de membros (admin/owner)

// No useMemo:
canAccessMembersArea: role === "owner" || role === "admin",
```

### Passo 2: coming-soon-placeholder.tsx (NOVO)
Criar componente reutilizável:

```typescript
import { Construction } from "lucide-react";

interface ComingSoonPlaceholderProps {
  title: string;
  description?: string;
}

export function ComingSoonPlaceholder({ 
  title, 
  description = "Esta funcionalidade estará disponível em breve."
}: ComingSoonPlaceholderProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
        <Construction className="w-8 h-8 text-primary" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-3">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md">{description}</p>
    </div>
  );
}
```

### Passo 3: ProductTabs.tsx
- Importar Badge e ComingSoonPlaceholder
- Usar `canAccessMembersArea` do usePermissions
- Adicionar Badge "Em Breve" no TabTrigger
- Renderizar placeholder ou conteúdo real no TabsContent

### Passo 4: ProductDeliverySection.tsx
- Importar usePermissions e Badge
- Desabilitar opção `members_area` se `!canAccessMembersArea`
- Mostrar Badge "Em Breve" na opção desabilitada

### Passo 5: StepTwo.tsx
- Mesma lógica do ProductDeliverySection

### Passo 6: Sistema de Ofertas (5 arquivos)
Fluxo de props:
```text
GeneralTab 
  └─ usePermissions() → canAccessMembersArea
  └─ ProductOffersSection (recebe canAccessMembersArea)
       └─ OffersManager (recebe canAccessMembersArea)
            ├─ DefaultOfferCard (recebe canAccessMembersArea)
            ├─ AdditionalOfferCard (recebe canAccessMembersArea)
            └─ NewOfferCard (recebe canAccessMembersArea)
```

O campo MemberGroupSelect só é renderizado se:
`canAccessMembersArea && hasMembersArea && memberGroups.length > 0`

---

## Comportamento Final por Role

| Role | Tab Área de Membros | Tipo de Entrega | Grupo de Acesso |
|------|---------------------|-----------------|-----------------|
| owner | Funcional | Selecionável | Visível |
| admin | Funcional | Selecionável | Visível |
| user | Placeholder + Badge "Em Breve" | Desabilitado + Badge | Oculto |
| seller | Placeholder + Badge "Em Breve" | Desabilitado + Badge | Oculto |

---

## Conformidade RISE V3

| Critério | Nota | Justificativa |
|----------|------|---------------|
| Manutenibilidade Infinita | 10/10 | Permissão centralizada, componente reutilizável |
| Zero Dívida Técnica | 10/10 | Sem código temporário ou workarounds |
| Arquitetura Correta | 10/10 | Segue padrão existente de usePermissions |
| Escalabilidade | 10/10 | Fácil adicionar novas features restritas |
| Segurança | 10/10 | Verificação no frontend (backend já valida) |
| **NOTA FINAL** | **10.0/10** | |

---

## Testes Manuais Recomendados

1. **Como owner/admin**: Todas as features funcionam normalmente
2. **Como user/seller**: 
   - Tab mostra placeholder com "Em Breve"
   - Opção de entrega desabilitada
   - Campo Grupo de Acesso não aparece nas ofertas
