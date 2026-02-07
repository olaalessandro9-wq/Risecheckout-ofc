

# Substituir Favicon Genérico da Lovable pela Logo RiseCheckout

## Problema

O favicon atual (`public/favicon.ico`) exibe o logo generico da Lovable na aba do navegador. O correto e exibir a logo oficial do RiseCheckout -- o "R" branco com fundo azul que ja e utilizado em toda a aplicacao via `RiseLogo.tsx`.

## O que sera feito

### 1. Copiar o asset da logo para a pasta `public`

O arquivo `src/assets/logo.jpeg` (a logo oficial com o "R" azul) sera copiado para `public/favicon.jpeg`.

### 2. Atualizar o `index.html`

A tag `<link rel="icon">` sera atualizada para apontar para o novo arquivo:

```text
Antes:  <link rel="icon" type="image/x-icon" href="/favicon.ico">
Depois: <link rel="icon" type="image/jpeg" href="/favicon.jpeg">
```

Tambem sera adicionada uma tag `<link rel="apple-touch-icon">` para dispositivos Apple, garantindo que o icone correto apareca quando o usuario salvar o site na tela inicial do iPhone/iPad.

### 3. Remover o favicon antigo

O arquivo `public/favicon.ico` (logo generica da Lovable) sera removido para eliminar codigo morto.

---

## Secao Tecnica

### Arvore de arquivos

```text
public/
  favicon.ico       -- DELETAR (logo generica Lovable)
  favicon.jpeg      -- CRIAR (copia de src/assets/logo.jpeg)

index.html          -- EDITAR (atualizar tag link rel="icon")
```

1 arquivo criado (copia). 1 arquivo deletado. 1 arquivo editado.

### Por que JPEG e nao ICO/PNG?

O asset oficial da marca (`src/assets/logo.jpeg`) ja esta em formato JPEG. Todos os navegadores modernos suportam JPEG como favicon. Converter para ICO ou PNG seria criar um asset duplicado com formato diferente, violando o principio SSOT (Single Source of Truth) da marca. O JPEG original e a fonte de verdade.

### Resultado esperado

Apos a implementacao, a aba do navegador exibira o "R" azul do RiseCheckout em vez do logo generico da Lovable.

