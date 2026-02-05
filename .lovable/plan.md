
## Ajuste Visual - Members Area Email

### O que será alterado

**Arquivo:** `supabase/functions/_shared/email-templates-members-area.ts`

### Mudanças no CSS

| Elemento | Antes | Depois |
|----------|-------|--------|
| `.cta-section` (fundo) | Gradiente azul | Fundo cinza neutro (`#F8F9FA`) com borda (`#E9ECEF`) |
| `.cta-section h2` | Texto branco | Texto escuro (`#212529`) |
| `.cta-section p` | Texto branco translúcido | Texto cinza (`#495057`) |
| `.cta-button` | Fundo branco, texto azul | Gradiente azul (`#004fff → #002875`), texto branco |

### Código Exato

**Linhas 29-32** - Trocar:

```css
.cta-section { background: linear-gradient(135deg, #004fff 0%, #002875 100%); padding: 24px; border-radius: 6px; text-align: center; margin-bottom: 32px; }
.cta-section h2 { font-size: 18px; font-weight: 600; color: #FFFFFF; margin: 0 0 8px; }
.cta-section p { font-size: 14px; color: rgba(255,255,255,0.9); margin: 0 0 20px; }
.cta-button { display: inline-block; background-color: #FFFFFF; color: #004fff !important; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 16px; }
```

**Por:**

```css
.cta-section { background-color: #F8F9FA; border: 1px solid #E9ECEF; padding: 24px; border-radius: 6px; text-align: center; margin-bottom: 32px; }
.cta-section h2 { font-size: 18px; font-weight: 600; color: #212529; margin: 0 0 8px; }
.cta-section p { font-size: 14px; color: #495057; margin: 0 0 20px; }
.cta-button { display: inline-block; background: linear-gradient(135deg, #004fff 0%, #002875 100%); color: #ffffff !important; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 16px; }
```

### Resultado Visual Esperado

- Seção "Acesse sua Área de Membros": fundo cinza claro neutro
- Texto da seção: escuro (legível no fundo claro)
- Botão "Acessar Área de Membros": gradiente azul (#004fff → #002875) com texto **branco**
