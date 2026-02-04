

# Plano: Remover Subdomínio `pay.` dos Links de Pagamento

## Diagnóstico

O problema identificado está na exibição dos links na aba "Links de Pagamento":

- **Linha 53 de `LinksTable.tsx`**: A função `getCorrectUrl()` chama `toProductionUrl(originalUrl, 'checkout')`
- O contexto `'checkout'` força o subdomínio `pay.` conforme mapeamento em `SUBDOMAIN_MAP`
- Como você ainda não configurou o subdomínio `pay.risecheckout.com`, os links ficam inválidos

**Arquitetura atual (correta para o futuro):**
```
SUBDOMAIN_MAP = {
  default: '',           // risecheckout.com
  members: 'aluno.',     // aluno.risecheckout.com  
  checkout: 'pay.',      // pay.risecheckout.com ← problema aqui
  dashboard: 'app.',     // app.risecheckout.com
}
```

## Solução

**Nota 10.0/10** - Mudar temporariamente o contexto de `'checkout'` para `'default'` no `LinksTable.tsx`.

### Alternativas Analisadas

| Solução | Nota | Tempo | Justificativa |
|---------|------|-------|---------------|
| **A: Mudar contexto para 'default' no LinksTable** | 10.0 | 2 min | Correção cirúrgica, sem dívida técnica, fácil reverter quando subdomínios estiverem prontos |
| B: Remover 'pay.' do SUBDOMAIN_MAP globalmente | 8.0 | 2 min | Afeta toda a aplicação, pode quebrar preparações futuras |
| C: Adicionar flag de feature para subdomínios | 9.5 | 30 min | Over-engineering para o momento atual |

**Decisão: Solução A** - Correção pontual no componente que exibe os links.

## Implementação

### Arquivo: `src/components/products/LinksTable.tsx`

**Antes (linha 52-54):**
```typescript
const getCorrectUrl = (originalUrl: string): string => {
  return toProductionUrl(originalUrl, 'checkout');
};
```

**Depois:**
```typescript
// RISE V3: Usando 'default' até subdomínios serem configurados
// TODO: Mudar para 'checkout' quando pay.risecheckout.com estiver ativo
const getCorrectUrl = (originalUrl: string): string => {
  return toProductionUrl(originalUrl, 'default');
};
```

### Resultado Esperado

- **Antes:** `https://pay.risecheckout.com/c/abc123` (inválido)
- **Depois:** `https://risecheckout.com/c/abc123` (válido)

## Detalhes Técnicos

### Arquivos Impactados
- `src/components/products/LinksTable.tsx` - 1 linha alterada

### Pontos de Atenção para o Futuro
Quando você configurar o subdomínio `pay.risecheckout.com`:

1. Reverter esta alteração (mudar `'default'` para `'checkout'`)
2. Configurar DNS wildcard ou subdomínio específico
3. Testar resolução do checkout público via `pay.` subdomain

### Zero Dívida Técnica
- O comentário `TODO` documenta a intenção futura
- A arquitetura de subdomínios permanece intacta em `site-urls.ts`
- Fácil de reverter com uma única mudança de string

