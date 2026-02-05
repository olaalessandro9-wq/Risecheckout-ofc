

# Plano: Eliminar Clipping do Gmail no Template "Compra Confirmada"

## Diagnóstico do Problema

O Gmail corta emails quando excedem ~102KB de tamanho. Os "3 pontinhos" aparecem porque o email está muito pesado.

### Causas Identificadas:

| Causa | Impacto |
|-------|---------|
| `@import url(...)` para Google Fonts | Aumenta tamanho e atrasa rendering |
| CSS não-inline (tag `<style>`) | Gmail remove tags `<style>` em alguns casos |
| Estrutura com muitas divs aninhadas | HTML verboso |
| Separação visual entre `.support` e `.footer` | Ainda visualmente separados |

---

## Solução: Email Leve e Inline

### Estratégia

1. **Remover @import de fontes** - Usar font-family com fallbacks nativos (mais seguro)
2. **CSS totalmente inline** - Estilo direto nos elementos (máxima compatibilidade)
3. **Unificar support + footer** - Um único bloco visual contínuo
4. **Estrutura mínima** - Menos tags HTML = menor tamanho

### Mudanças no Arquivo

| Arquivo | Alteração |
|---------|-----------|
| `supabase/functions/_shared/email-templates-purchase.ts` | Reescrever com CSS inline e estrutura otimizada |

---

## Implementação Detalhada

### 1. Remover tag `<style>` completamente

**Antes:**
```html
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter...');
  body { font-family: 'Inter', ... }
  .container { ... }
  .header { ... }
  <!-- 50+ linhas de CSS -->
</style>
```

**Depois:**
```html
<!-- Zero tag <style> - tudo inline -->
```

### 2. CSS Inline em cada elemento

**Exemplo:**
```html
<div style="max-width:600px;margin:40px auto;background:#fff;border:1px solid #E9ECEF;border-radius:8px;overflow:hidden;">
  <div style="text-align:center;padding:0;border-bottom:1px solid #E9ECEF;line-height:0;">
    <img src="..." style="display:block;width:100%;height:auto;">
  </div>
  <!-- ... -->
</div>
```

### 3. Unificar Support + Footer em um único bloco

**Antes (2 blocos separados):**
```html
<div class="support">...</div>
<div class="footer">...</div>
```

**Depois (1 bloco contínuo):**
```html
<div style="text-align:center;padding:24px 32px;font-size:14px;color:#6C757D;border-top:1px solid #E9ECEF;">
  <p style="margin:0 0 16px;">Em caso de dúvidas...</p>
  <p style="margin:0 0 4px;font-size:12px;">Vendido por: <strong>Rise Academy</strong></p>
  <p style="margin:0 0 4px;font-size:12px;">Processado com segurança por <strong>Rise Checkout</strong>.</p>
  <p style="margin:0;font-size:12px;"><a href="..." style="color:#495057;text-decoration:none;font-weight:600;">risecheckout.com</a></p>
</div>
```

### 4. Estrutura Final Otimizada

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmação de Compra</title>
</head>
<body style="font-family:Arial,Helvetica,sans-serif;margin:0;padding:0;background:#F8F9FA;color:#343A40;">
  
  <!-- Container Principal -->
  <div style="max-width:600px;margin:40px auto;background:#fff;border:1px solid #E9ECEF;border-radius:8px;overflow:hidden;">
    
    <!-- Header com Logo -->
    <div style="text-align:center;padding:0;line-height:0;">
      <img src="${logoUrl}" alt="Logo" style="display:block;width:100%;height:auto;">
    </div>
    
    <!-- Conteúdo Principal -->
    <div style="padding:32px;">
      <h1 style="font-size:24px;font-weight:700;color:#212529;margin:0 0 12px;">Sua compra foi confirmada!</h1>
      <p style="font-size:16px;line-height:1.6;margin:0 0 24px;color:#495057;">Olá, ${nome}...</p>
      
      <!-- CTA (se houver) -->
      ${ctaSection}
      
      <!-- Tabela de Detalhes -->
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E9ECEF;border-radius:6px;border-collapse:separate;border-spacing:0;">
        <tr>
          <td colspan="2" style="font-size:18px;font-weight:700;color:#212529;padding:20px;border-bottom:1px solid #E9ECEF;">Resumo do Pedido</td>
        </tr>
        <tr>
          <td style="padding:16px 20px;border-bottom:1px solid #E9ECEF;font-size:14px;color:#495057;">Produto: </td>
          <td style="padding:16px 20px;border-bottom:1px solid #E9ECEF;font-size:14px;font-weight:600;color:#212529;">${produto}</td>
        </tr>
        <!-- ... demais linhas ... -->
        <tr>
          <td style="padding:20px;background:#F8F9FA;font-size:18px;font-weight:700;color:#212529;">Total: </td>
          <td style="padding:20px;background:#F8F9FA;font-size:18px;font-weight:700;color:#212529;text-align:right;">${total}</td>
        </tr>
      </table>
    </div>
    
    <!-- Footer Unificado (support + footer juntos) -->
    <div style="text-align:center;padding:24px 32px;font-size:14px;color:#6C757D;border-top:1px solid #E9ECEF;">
      <p style="margin:0 0 16px;">Em caso de dúvidas sobre sua compra, responda a este email ou entre em contato: <a href="mailto:${email}" style="color:#007BFF;text-decoration:none;font-weight:600;">${email}</a></p>
      <p style="margin:0 0 4px;font-size:12px;">Vendido por: <strong>${vendedor}</strong></p>
      <p style="margin:0 0 4px;font-size:12px;">Pagamento processado com segurança por <strong>Rise Checkout</strong>.</p>
      <p style="margin:0;font-size:12px;"><a href="${siteUrl}" style="color:#495057;text-decoration:none;font-weight:600;">${siteDomain}</a></p>
    </div>
    
  </div>
</body>
</html>
```

---

## Resultado Esperado

| Antes | Depois |
|-------|--------|
| ~8KB+ de HTML com CSS externo | ~4KB de HTML com CSS inline |
| Gmail corta em 2 partes | Email completo sem corte |
| Support e Footer separados visualmente | Um único bloco contínuo |
| @import de fonte externa | Font-family nativo (Arial/Helvetica) |

---

## Observação Importante

A conversão para **CSS 100% inline** é a prática padrão da indústria de email marketing. Gmail, Outlook e outros clientes frequentemente removem tags `<style>` inteiras, então inline é a única forma garantida de aplicar estilos.

A troca de `Inter` por `Arial, Helvetica, sans-serif` é necessária porque:
1. Gmail não baixa fonts externas
2. @import aumenta tamanho do email
3. Arial é universalmente suportado

