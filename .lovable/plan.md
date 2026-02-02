

# Plano: Corrigir Erro 404 nas Rotas do React (SPA na Vercel)

## Diagnóstico

**Erro:** Ao acessar `risecheckout.com/c/d9bc95_300_1f`, a Vercel retorna 404 NOT_FOUND.

**Causa Raiz:** O `vercel.json` atual contém apenas headers de segurança. Falta a configuração de `rewrites` que instrui a Vercel a direcionar todas as rotas para `index.html`, permitindo que o React Router gerencie as rotas do lado do cliente.

**Arquivo `public/_redirects`:** Este arquivo usa sintaxe do Netlify e é ignorado pela Vercel.

---

## Análise de Soluções

### Solução A: Adicionar rewrites ao vercel.json existente
- Manutenibilidade: 10/10 (configuração centralizada)
- Zero DT: 10/10 (resolve o problema definitivamente)
- Arquitetura: 10/10 (padrão oficial da Vercel para SPAs)
- Escalabilidade: 10/10 (suporta qualquer rota futura)
- Segurança: 10/10 (mantém headers de segurança)
- **NOTA FINAL: 10.0/10**
- Tempo estimado: 5 minutos

### Solução B: Usar configuração via Vercel Dashboard
- Manutenibilidade: 6/10 (configuração fora do código)
- Zero DT: 7/10 (não versionada no Git)
- Arquitetura: 5/10 (separa config de código)
- Escalabilidade: 6/10
- Segurança: 8/10
- **NOTA FINAL: 6.4/10**
- Tempo estimado: 3 minutos

### DECISÃO: Solução A (Nota 10.0)

Configuração via código (Infrastructure as Code) é sempre superior a configurações manuais no dashboard.

---

## Implementação

### Passo 1: Atualizar vercel.json

Adicionar a configuração `rewrites` que direciona todas as rotas para `index.html`:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    // ... headers existentes mantidos
  ]
}
```

### Passo 2: Remover arquivo obsoleto (opcional)

O arquivo `public/_redirects` pode ser removido pois é sintaxe do Netlify e não funciona na Vercel.

---

## Arquivos Afetados

| Arquivo | Ação |
|---------|------|
| `vercel.json` | ATUALIZAR (adicionar rewrites) |
| `public/_redirects` | DELETAR (opcional - sintaxe Netlify) |

---

## Resultado Esperado

Após deploy:
1. Acessar `risecheckout.com/c/slug` carregará o `index.html`
2. React Router assumirá e renderizará `PaymentLinkRedirect`
3. Todas as rotas dinâmicas funcionarão (checkout, pagamentos, etc.)

---

## Seção Técnica

### Por que SPAs precisam de rewrites?

Single Page Applications usam client-side routing. O servidor (Vercel) não conhece rotas como `/c/slug` - elas só existem no JavaScript do React Router. Sem rewrites:

```
Usuário acessa: /c/d9bc95_300_1f
Vercel procura: dist/c/d9bc95_300_1f/index.html
Resultado: 404 NOT_FOUND
```

Com rewrites:

```
Usuário acessa: /c/d9bc95_300_1f
Vercel rewrite: → /index.html
React Router: renderiza <PaymentLinkRedirect />
```

### Ordem de prioridade no vercel.json

A Vercel processa na ordem:
1. **Arquivos estáticos existentes** (JS, CSS, imagens)
2. **Rewrites** (redireciona para index.html se não for arquivo)

Isso garante que assets estáticos são servidos normalmente, e apenas rotas "virtuais" são redirecionadas.

