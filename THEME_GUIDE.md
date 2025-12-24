# Guia de Estilo: Sistema de Temas
## RiseCheckout - Tema Claro e Escuro

**Última atualização:** 16 de Dezembro de 2025

---

## 📋 REGRAS ESSENCIAIS

### ✅ **SEMPRE FAÇA:**

1. **Use variáveis CSS** para cores
   ```tsx
   // ✅ CORRETO
   <div className="bg-card text-card-foreground border-border">
   
   // ✅ CORRETO (inline style quando necessário)
   <div style={{backgroundColor: 'hsl(var(--success))'}}>
   ```

2. **Use classes do Tailwind** baseadas em variáveis CSS
   ```tsx
   // ✅ CORRETO
   bg-background
   text-foreground
   border-border
   bg-card
   text-muted-foreground
   ```

3. **Teste em AMBOS os temas** antes de fazer commit
   - Abra o dashboard
   - Clique no botão de tema (Sol/Lua)
   - Verifique se tudo está legível e bonito

### ❌ **NUNCA FAÇA:**

1. **NÃO use cores hardcoded**
   ```tsx
   // ❌ ERRADO
   <div className="bg-zinc-950 text-white border-white/10">
   <div className="bg-gray-500 text-gray-700">
   <div style={{color: '#ffffff'}}>
   ```

2. **NÃO use cores específicas do Tailwind**
   ```tsx
   // ❌ ERRADO
   bg-zinc-950
   text-white
   border-gray-500
   bg-slate-800
   text-blue-600
   ```

3. **NÃO assuma que o tema é escuro**
   ```tsx
   // ❌ ERRADO (só funciona no tema escuro)
   <div className="bg-black/40 text-white">
   ```

---

## 🎨 VARIÁVEIS CSS DISPONÍVEIS

### **Cores Principais**

| Variável | Uso | Exemplo |
|----------|-----|---------|
| `--background` | Fundo principal da página | `bg-background` |
| `--foreground` | Texto principal | `text-foreground` |
| `--card` | Fundo de cards | `bg-card` |
| `--card-foreground` | Texto em cards | `text-card-foreground` |
| `--popover` | Fundo de popovers/dropdowns | `bg-popover` |
| `--popover-foreground` | Texto em popovers | `text-popover-foreground` |

### **Botões e Interações**

| Variável | Uso | Exemplo |
|----------|-----|---------|
| `--primary` | Cor primária (botões principais) | `bg-primary` |
| `--primary-foreground` | Texto em botões primários | `text-primary-foreground` |
| `--secondary` | Cor secundária | `bg-secondary` |
| `--secondary-foreground` | Texto em botões secundários | `text-secondary-foreground` |
| `--muted` | Cor neutra/desativada | `bg-muted` |
| `--muted-foreground` | Texto neutro | `text-muted-foreground` |
| `--accent` | Cor de destaque | `bg-accent` |
| `--accent-foreground` | Texto em destaque | `text-accent-foreground` |

### **Estados**

| Variável | Uso | Exemplo |
|----------|-----|---------|
| `--destructive` | Cor de erro/perigo (vermelho) | `bg-destructive` |
| `--destructive-foreground` | Texto em erro | `text-destructive-foreground` |
| `--success` | Cor de sucesso (verde) | `style={{backgroundColor: 'hsl(var(--success))'}}` |
| `--warning` | Cor de aviso (amarelo) | `style={{backgroundColor: 'hsl(var(--warning))'}}` |
| `--info` | Cor de informação (azul) | `style={{backgroundColor: 'hsl(var(--info))'}}` |

### **Bordas e Inputs**

| Variável | Uso | Exemplo |
|----------|-----|---------|
| `--border` | Cor de bordas | `border-border` |
| `--input` | Fundo de inputs | `bg-input` |
| `--ring` | Cor de foco | `ring-ring` |

### **Gráficos (Recharts)**

| Variável | Uso | Exemplo |
|----------|-----|---------|
| `--chart-background` | Fundo de gráficos | `hsl(var(--chart-background))` |
| `--chart-foreground` | Texto de gráficos | `hsl(var(--chart-foreground))` |
| `--chart-grid` | Linhas de grade | `stroke="hsl(var(--chart-grid))"` |
| `--chart-axis` | Eixos X e Y | `stroke="hsl(var(--chart-axis))"` |
| `--chart-tooltip-bg` | Fundo de tooltip | `hsl(var(--chart-tooltip-bg))` |
| `--chart-tooltip-border` | Borda de tooltip | `hsl(var(--chart-tooltip-border))` |
| `--chart-1` a `--chart-5` | Cores de séries | `stroke="hsl(var(--chart-1))"` |

---

## 💡 EXEMPLOS PRÁTICOS

### **Exemplo 1: Card Simples**

```tsx
// ✅ CORRETO - Funciona em ambos os temas
<div className="bg-card text-card-foreground border border-border rounded-lg p-4">
  <h3 className="text-lg font-bold">Título</h3>
  <p className="text-muted-foreground">Descrição</p>
</div>
```

### **Exemplo 2: Botão Primário**

```tsx
// ✅ CORRETO
<button className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg">
  Clique Aqui
</button>
```

### **Exemplo 3: Badge de Status**

```tsx
// ✅ CORRETO - Usa variável CSS inline
<span 
  className="px-2 py-1 rounded-full text-xs font-semibold"
  style={{
    backgroundColor: 'hsl(var(--success) / 0.1)',
    color: 'hsl(var(--success))',
    borderColor: 'hsl(var(--success) / 0.2)'
  }}
>
  Pago
</span>
```

### **Exemplo 4: Gráfico (Recharts)**

```tsx
// ✅ CORRETO - Usa variáveis CSS para gráficos
<AreaChart data={data}>
  <CartesianGrid 
    stroke="hsl(var(--chart-grid))" 
    opacity={0.4} 
  />
  <XAxis 
    stroke="hsl(var(--chart-axis))" 
  />
  <YAxis 
    stroke="hsl(var(--chart-axis))" 
  />
  <Area 
    stroke="hsl(var(--success))" 
    fill="url(#gradient)" 
  />
</AreaChart>
```

### **Exemplo 5: Tooltip Customizado (Recharts)**

```tsx
// ✅ CORRETO
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card/95 backdrop-blur-xl border border-border rounded-xl p-4 shadow-xl">
        <p className="text-xs font-semibold text-muted-foreground mb-1">
          {label}
        </p>
        <p className="text-xl font-bold text-card-foreground">
          {payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};
```

---

## 🔍 COMO DEBUGAR PROBLEMAS DE TEMA

### **Problema:** Texto invisível ou ilegível

**Solução:**
1. Verifique se está usando `text-foreground` ou `text-card-foreground`
2. Não use `text-white` ou `text-black`

### **Problema:** Fundo não muda com o tema

**Solução:**
1. Verifique se está usando `bg-background` ou `bg-card`
2. Não use `bg-zinc-950`, `bg-gray-500`, etc.

### **Problema:** Bordas invisíveis

**Solução:**
1. Use `border-border`
2. Não use `border-white/10`, `border-gray-500`, etc.

### **Problema:** Gráfico não adapta ao tema

**Solução:**
1. Use `stroke="hsl(var(--chart-axis))"`
2. Não use `stroke="#666"`, `stroke="#333"`, etc.

---

## 🧪 CHECKLIST DE TESTE

Antes de fazer commit, verifique:

- [ ] Abri o dashboard no tema claro
- [ ] Abri o dashboard no tema escuro
- [ ] Todos os textos estão legíveis em ambos os temas
- [ ] Todos os cards têm fundo visível em ambos os temas
- [ ] Todas as bordas estão visíveis em ambos os temas
- [ ] Gráficos estão bonitos em ambos os temas
- [ ] Tooltips estão legíveis em ambos os temas
- [ ] Não usei cores hardcoded (`bg-zinc-950`, `text-white`, etc.)

---

## 📚 REFERÊNCIAS

### **Tailwind CSS + Variáveis CSS**

```css
/* Como funciona */
:root {
  --background: 0 0% 100%;  /* Branco no tema claro */
}

.dark {
  --background: 0 0% 4%;    /* Preto no tema escuro */
}

/* No Tailwind */
.bg-background {
  background-color: hsl(var(--background));
}
```

### **Inline Styles com Variáveis CSS**

```tsx
// Para cores que não têm classe Tailwind
style={{
  backgroundColor: 'hsl(var(--success))',
  color: 'hsl(var(--success))',
  borderColor: 'hsl(var(--success) / 0.2)'  // Com opacidade
}}
```

---

## 🎯 RESUMO

**3 Regras de Ouro:**

1. ✅ **Use variáveis CSS** (`bg-card`, `text-foreground`, etc.)
2. ❌ **Nunca use cores hardcoded** (`bg-zinc-950`, `text-white`, etc.)
3. 🧪 **Teste em ambos os temas** antes de fazer commit

**Se seguir essas regras, seu código vai funcionar perfeitamente em ambos os temas!** 🎉

---

**Dúvidas?** Consulte este guia ou pergunte ao time.

**Última atualização:** 16 de Dezembro de 2025  
**Versão:** 2.0 (Refatoração Completa)
