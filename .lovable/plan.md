

# Simplificar Labels de Tamanho do Banner

## Tarefa
Remover as informações técnicas (px/% da tela) dos labels do seletor de tamanho do banner no Builder.

## Alteração

**Arquivo:** `src/modules/members-area-builder/components/sections/Banner/BannerEditor.tsx`

**Antes:**
```typescript
<SelectContent>
  <SelectItem value="small">Pequeno (384px)</SelectItem>
  <SelectItem value="medium">Médio (50% da tela)</SelectItem>
  <SelectItem value="large">Grande Hero (70% da tela)</SelectItem>
</SelectContent>
```

**Depois:**
```typescript
<SelectContent>
  <SelectItem value="small">Pequeno</SelectItem>
  <SelectItem value="medium">Médio</SelectItem>
  <SelectItem value="large">Grande</SelectItem>
</SelectContent>
```

## Justificativa
Labels limpos e intuitivos para o usuário final. Os detalhes técnicos não são relevantes para quem está configurando o banner - o que importa é a percepção visual (pequeno/médio/grande).

