
# Corrigir Links Externos no Editor de Conteudo da Area de Membros

## Problema Diagnosticado

O bug ocorre em duas camadas:

1. **Insercao (Editor)**: A funcao `addLink()` no `RichTextEditor.tsx` (linha 45-49) salva a URL exatamente como o usuario digita. Se o usuario digita `loja.risestore.online` (sem `https://`), o TipTap grava `href="loja.risestore.online"`.

2. **Renderizacao (Buyer)**: O navegador interpreta `href="loja.risestore.online"` como um caminho **relativo**, resultando em `https://sandrodev.lovable.app/.../aula/loja.risestore.online`.

## Causa Raiz

A funcao `addLink()` nao normaliza a URL adicionando protocolo quando ausente. Alem disso, a configuracao do TipTap Link extension nao valida URLs.

## O que sera feito

### 1. Criar funcao `normalizeUrl()` no `RichTextEditor.tsx`

Uma funcao pura que garante que toda URL tenha protocolo:

```text
Entrada: "loja.risestore.online"     -> Saida: "https://loja.risestore.online"
Entrada: "http://exemplo.com"        -> Saida: "http://exemplo.com" (mantido)
Entrada: "https://exemplo.com"       -> Saida: "https://exemplo.com" (mantido)
Entrada: "mailto:user@email.com"     -> Saida: "mailto:user@email.com" (mantido)
Entrada: "tel:+5511999999999"        -> Saida: "tel:+5511999999999" (mantido)
Entrada: ""                          -> Saida: null (invalido, nao insere)
Entrada: "   "                       -> Saida: null (invalido, nao insere)
```

### 2. Atualizar `addLink()` para usar `normalizeUrl()`

A funcao de adicionar link passara a normalizar a URL antes de inserir no editor. Tambem adicionara validacao para rejeitar URLs vazias/invalidas com feedback ao usuario.

### 3. Configurar `autolink` no TipTap Link Extension

Adicionar `autolink: true` na configuracao do `Link.configure()` para que URLs digitadas diretamente no texto (sem usar o botao de link) tambem sejam detectadas automaticamente com protocolo correto.

### 4. Adicionar `target: "_blank"` e `rel: "noopener noreferrer"`

Para que links externos abram em nova aba (comportamento esperado pelo usuario) e com seguranca contra ataques de `window.opener`.

## Secao Tecnica

### Arquivo alterado

```text
src/modules/members-area/components/editor/RichTextEditor.tsx
```

1 arquivo editado. Zero arquivos criados. Zero arquivos deletados.

### Mudancas especificas

**Funcao `normalizeUrl` (nova, ~15 linhas)**:
- Trim e validacao de string vazia
- Deteccao de protocolos existentes via regex (`/^[a-zA-Z][a-zA-Z\d+\-.]*:/`)
- Se nao tem protocolo, prepend `https://`
- Retorna `null` para entradas invalidas

**Funcao `addLink` (linhas 45-49, refatorada)**:
- Chama `normalizeUrl()` na URL digitada pelo usuario
- Se `normalizeUrl()` retorna `null`, nao insere o link
- URL normalizada e passada ao `setLink()`

**`Link.configure()` (linhas 216-221, atualizado)**:
- Adicionar `autolink: true`
- Adicionar `defaultProtocol: 'https'` (recurso nativo do TipTap)
- Adicionar `HTMLAttributes` com `target: "_blank"` e `rel: "noopener noreferrer"`

### Dados ja salvos no banco

Links que ja foram salvos sem protocolo (como o `loja.risestore.online` atual) continuarao quebrados ate serem re-editados pelo produtor. Isso e esperado -- o fix corrige a **insercao** de novos links, nao retroage sobre conteudo ja persistido.

### Impacto

- Zero breaking changes
- Renderizacao no buyer nao precisa de alteracao (o HTML salvo ja tera `https://`)
- DOMPurify continua sanitizando normalmente
