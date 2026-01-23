# RELATÓRIO MÃE - RiseCheckout

> **Versão:** 1.0  
> **Data:** 2026-01-23  
> **Status:** OBRIGATÓRIO - Leitura antes de qualquer trabalho

---

## 📋 Índice

1. [Contexto do Projeto](#1-contexto-do-projeto)
2. [Princípios Absolutos - RISE V3](#2-princípios-absolutos---rise-v3)
3. [Trabalhando com Outras IAs](#3-trabalhando-com-outras-ias)
4. [Git Workflow](#4-git-workflow)
5. [Mapa Técnico do Projeto](#5-mapa-técnico-do-projeto)
6. [Metodologia de Auditoria](#6-metodologia-de-auditoria)

---

## 1. Contexto do Projeto

### 1.1 O Que É o RiseCheckout

**RiseCheckout** é uma plataforma SaaS de Checkout High-End e Marketing Digital, no estilo Kiwify/Hotmart.

### 1.2 Status Atual

| Aspecto | Status |
|---------|--------|
| **Ambiente** | Desenvolvimento |
| **Usuários Reais** | ZERO |
| **Fase** | Pré-produção |

### 1.3 O Recurso Supremo

> **TEMPO ILIMITADO**

Não existe prazo. Não existe "para ontem". O único deadline é a **perfeição estrutural**.

### 1.4 Permissão para Destruir

Você tem **CARTA BRANCA** para:

- ✅ Deletar arquivos inteiros
- ✅ Reescrever módulos do zero
- ✅ Quebrar o build se for para consertar
- ✅ Propor mudanças radicais na arquitetura

**NÃO TENHA MEDO** de propor destruição. Se algo está mal feito, proponha reescrevê-lo.

---

## 2. Princípios Absolutos - RISE V3

### 2.1 Lei Suprema

> **"Se a solução mais complexa demora 1 ano e tem nota 10, e a mais rápida demora 5 minutos e tem nota 9.9, NÓS VAMOS NA MAIS COMPLEXA. NÃO TEM ESSA. É SEMPRE A MELHOR."**

Este é o mandamento que rege TODA decisão técnica.

### 2.2 Sistema de Notas (OBRIGATÓRIO)

Quando propor soluções, **SEMPRE** apresente notas baseadas em:

| Critério | Peso | Descrição |
|----------|------|-----------|
| **Manutenibilidade Infinita** | 30% | Código mantido por décadas sem acumular dívida |
| **Zero Dívida Técnica** | 25% | Nenhuma "correção futura" necessária |
| **Arquitetura Correta** | 20% | SOLID, Clean Architecture |
| **Escalabilidade** | 15% | Suporta crescimento sem reescritas |
| **Segurança** | 10% | Sem vulnerabilidades ou brechas |

### 2.3 Formato de Análise de Soluções

```markdown
## Análise de Soluções

### Solução A: [Nome]
- Manutenibilidade: X/10
- Zero DT: X/10
- Arquitetura: X/10
- Escalabilidade: X/10
- Segurança: X/10
- **NOTA FINAL: X.X/10**

### Solução B: [Nome]
- Manutenibilidade: X/10
- Zero DT: X/10
- Arquitetura: X/10
- Escalabilidade: X/10
- Segurança: X/10
- **NOTA FINAL: X.X/10**

### DECISÃO: Solução [X] (Nota X.X)
[Justificativa de por que as outras são inferiores]
```

### 2.4 Cinco Regras Absolutas

| # | Regra | Consequência da Violação |
|---|-------|--------------------------|
| 1 | **Zero gambiarras/workarounds** | Rejeição imediata |
| 2 | **Zero tipos `any`** | Rejeição imediata |
| 3 | **Zero `@ts-ignore`** | Rejeição imediata |
| 4 | **Zero arquivos > 300 linhas** | Refatoração obrigatória |
| 5 | **Zero `supabase.from()` no frontend** | Rejeição imediata |

### 2.5 Frases TERMINANTEMENTE PROIBIDAS

Estas frases indicam pensamento errado. Se você se pegar pensando assim, PARE e reconsidere:

| Frase Proibida | Por Que Está Banida |
|----------------|---------------------|
| "Por ora, podemos..." | Implica solução temporária |
| "É mais rápido fazer..." | Velocidade não é critério |
| "É muito complexo..." | Complexidade não nos assusta |
| "Podemos melhorar depois..." | Não. Fazemos certo agora |
| "Uma solução simples seria..." | Simples ≠ Melhor |
| "Para não complicar..." | Complicação correta > Simplicidade errada |
| "Temporariamente..." | Nada é temporário |
| "Workaround..." | PROIBIDO |
| "Gambiarra..." | PROIBIDO |
| "Quick fix..." | PROIBIDO |

### 2.6 Vibe Coding (Anti-Reativo)

- **Resolva a DOENÇA, não a FEBRE**: Se um bug ocorreu, a arquitetura permitiu esse bug. Corrija a arquitetura.
- **Arquiteto Antes de Pedreiro**: Planeje antes de codar.
- **Dívida Técnica Zero**: Cada linha é um ativo, não um passivo.

---

## 3. Trabalhando com Outras IAs

### 3.1 Contexto Fundamental

> **Você NÃO está sozinha.**

Existem outras IAs trabalhando **simultaneamente** neste código. O número pode variar:
- Às vezes 1-2 IAs
- Às vezes 5-6 IAs
- Às vezes 10+ IAs

**Sua tarefa específica será passada INDIVIDUALMENTE.** Este documento ensina **COMO** conviver no mesmo código.

### 3.2 Regra de Ouro: Isolamento de Domínio

Cada IA trabalha em um **DOMÍNIO ISOLADO**. Você receberá:

1. ✅ Quais pastas pode modificar
2. ✅ Quais Edge Functions são suas
3. ✅ O que está FORA do seu escopo

**NUNCA** modifique arquivos fora do seu domínio sem coordenação explícita.

### 3.3 Arquivos CRÍTICOS (Coordenação Obrigatória)

Estes arquivos afetam **TODO** o sistema. Para modificá-los:

1. **Comunicar ANTES** de começar
2. **Aguardar confirmação** de que nenhuma outra IA está mexendo
3. **Fazer em branch isolada**
4. **Abrir PR** com descrição detalhada

#### Lista de Arquivos Críticos

| Arquivo/Pasta | Por Que É Crítico |
|---------------|-------------------|
| `supabase/functions/_shared/*` | Módulos usados por TODAS as Edge Functions |
| `supabase/migrations/*` | Schema do banco de dados |
| `src/integrations/supabase/*` | Cliente Supabase do frontend |
| `src/lib/api/client.ts` | API Client centralizado |
| `tailwind.config.ts` | Estilos globais |
| `src/index.css` | Tokens de design |

> ⚠️ **IMPORTANTE**: "Crítico" **NÃO** significa "intocável".  
> Se está mal feito, **DEVE** ser reescrito.  
> A coordenação é apenas para **evitar conflitos simultâneos**.

### 3.4 Quando Outra IA Mexeu no Mesmo Arquivo

Se você encontrar conflitos:

```bash
git pull origin main
# Resolver conflitos localmente
# Manter a implementação com MAIOR NOTA (melhor arquitetura)
git add .
git commit -m "fix: resolve merge conflict - mantida solução X"
```

### 3.5 Protocolo de Comunicação

**Antes de começar qualquer tarefa:**

1. Verificar se existe branch ativa no módulo
2. Anunciar: "Iniciando trabalho em [módulo]"
3. Criar branch com nomenclatura correta

**Durante o trabalho:**

4. Não tocar em arquivos de outros domínios
5. Se precisar de arquivo crítico, anunciar primeiro

**Ao finalizar:**

6. Abrir PR com descrição completa
7. Aguardar review/merge

---

## 4. Git Workflow

### 4.1 Regra Absoluta

> **NUNCA** commitar direto na `main`. **SEMPRE** usar Pull Request.

### 4.2 Nomenclatura de Branches

**Formato:** `feature/{identificador}-{modulo}-{descricao}`

**Exemplos:**

```
feature/audit-payments-refactor-webhook
feature/fix-checkout-pix-timeout
feature/security-rls-policies
feature/members-video-player
feature/dashboard-analytics-charts
```

### 4.3 Fluxo de Pull Request

```
┌─────────────────────────────────────────────┐
│  1. git checkout main                       │
│  2. git pull origin main                    │
│  3. git checkout -b feature/{nome}          │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│  4. Desenvolver no domínio isolado          │
│  5. Commits atômicos e descritivos          │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│  6. git pull origin main (atualizar)        │
│  7. Resolver conflitos localmente           │
│  8. git push origin feature/{nome}          │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│  9. Abrir PR com descrição completa         │
│ 10. Aguardar CI (Security Scan + Tests)     │
│ 11. Merge após aprovação                    │
└─────────────────────────────────────────────┘
```

### 4.4 Template de Descrição de PR

```markdown
## Descrição
[O que foi feito e por quê]

## Domínio Afetado
- [ ] Pagamentos
- [ ] Produtos
- [ ] Área de Membros
- [ ] Backend/Auth
- [ ] Dashboard
- [ ] Tracking/Pixels

## Arquivos Críticos Modificados
- [ ] Nenhum
- [ ] `_shared/` - [qual arquivo]
- [ ] `migrations/` - [qual migration]

## Checklist
- [ ] Sem tipos `any`
- [ ] Sem `@ts-ignore`
- [ ] Arquivos < 300 linhas
- [ ] Testado localmente
```

---

## 5. Mapa Técnico do Projeto

### 5.1 Números do Projeto

| Métrica | Valor |
|---------|-------|
| Edge Functions | ~110 |
| Módulos Frontend | 13 |
| Arquivos em `_shared/` | ~70 |
| Documentos em `docs/` | ~60 |
| Tabelas no Banco | ~80 |

### 5.2 Estrutura de Pastas Frontend

| Pasta | Descrição | Complexidade |
|-------|-----------|--------------|
| `src/modules/admin/` | Painel administrativo (owner) | Média |
| `src/modules/affiliation/` | Sistema de afiliados | Alta |
| `src/modules/checkout-public/` | UI pública do checkout | Alta |
| `src/modules/dashboard/` | Dashboard do produtor | Média |
| `src/modules/financeiro/` | Gestão financeira | Média |
| `src/modules/marketplace/` | Marketplace público | Baixa |
| `src/modules/members-area/` | Área de membros (aluno) | Alta |
| `src/modules/members-area-builder/` | Builder da área de membros | Alta |
| `src/modules/navigation/` | Sidebar e navegação | Baixa |
| `src/modules/pixels/` | Rastreamento e pixels | Média |
| `src/modules/products/` | CRUD de produtos | Média |
| `src/modules/utmify/` | Integração UTMify | Baixa |
| `src/modules/webhooks/` | Configuração de webhooks | Média |

### 5.3 Domínios de Negócio (Conceituais)

#### Domínio: Transações e Pagamentos

**Responsabilidade:** Fluxo de pagamento ponta-a-ponta.

| Componente | Arquivos |
|------------|----------|
| Gateways | `asaas-*`, `stripe-*`, `mercadopago-*`, `pushinpay-*` |
| Ordens | `create-order`, `get-order-for-pix`, `get-pix-status` |
| Webhooks | `*-webhook` (de cada gateway) |

---

#### Domínio: Produtos e Ofertas

**Responsabilidade:** CRUD de produtos e checkout builder.

| Componente | Arquivos |
|------------|----------|
| Frontend | `src/modules/products/` |
| Edge Functions | `product-*`, `offer-*`, `order-bump-*`, `coupon-*` |
| Checkout Builder | `checkout-crud`, `checkout-editor` |

---

#### Domínio: Área de Membros

**Responsabilidade:** Experiência completa do aluno/comprador.

| Componente | Arquivos |
|------------|----------|
| Frontend Aluno | `src/modules/members-area/` |
| Frontend Builder | `src/modules/members-area-builder/` |
| Edge Functions | `members-area-*`, `content-*`, `students-*`, `buyer-*` |

---

#### Domínio: Backend e Segurança

**Responsabilidade:** Auth, segurança, infraestrutura.

| Componente | Arquivos |
|------------|----------|
| Auth | `unified-auth`, `producer-auth`, `buyer-auth` |
| Sessions | `session-*` |
| Security | `security-*`, `rls-security-tester` |
| Admin | `admin-*` |
| Infra | `reconcile-*`, `gdpr-*`, `data-retention-*` |
| Email | `send-*-email` |
| Shared | `_shared/*` (~70 arquivos) |

> ⚠️ Este é o **MAIOR** domínio. Em revisões completas, pode ser subdividido.

---

#### Domínio: Dashboard e Admin

**Responsabilidade:** UX do produtor, dashboard, analytics.

| Componente | Arquivos |
|------------|----------|
| Dashboard | `src/modules/dashboard/` |
| Admin | `src/modules/admin/` |
| Financeiro | `src/modules/financeiro/` |
| Navigation | `src/modules/navigation/` |
| Edge Functions | `dashboard-analytics`, `admin-data` |

---

#### Domínio: Integrações e Tracking

**Responsabilidade:** Pixels, webhooks, UTM tracking.

| Componente | Arquivos |
|------------|----------|
| Pixels | `src/modules/pixels/`, `pixel-*` |
| Webhooks | `src/modules/webhooks/`, `webhook-crud`, `trigger-webhooks` |
| UTMify | `src/modules/utmify/`, `utmify-conversion` |
| Afiliados | `src/modules/affiliation/`, `affiliation-*` |

---

### 5.4 Edge Functions por Categoria de Auth

| Auth Type | Descrição | Qtd Funções |
|-----------|-----------|-------------|
| `producer_sessions` | Requer sessão de produtor | ~45 |
| `buyer_token` | Requer token de comprador | ~10 |
| `webhook` | Validação de assinatura | ~4 |
| `public` | Sem auth | ~20 |
| `internal` | Service role only | ~15 |

---

## 6. Metodologia de Auditoria

### 6.1 O Que Procurar

| Categoria | Exemplos | Severidade |
|-----------|----------|------------|
| **Segurança** | Chaves expostas, RLS faltando, validações ausentes | CRÍTICO |
| **Arquitetura** | Código duplicado, acoplamento, god objects | ALTO |
| **Tipagem** | Tipos `any`, `@ts-ignore`, tipos incorretos | ALTO |
| **Performance** | N+1 queries, re-renders desnecessários | MÉDIO |
| **Manutenibilidade** | Arquivos > 300 linhas, nomes ruins | MÉDIO |
| **Dívida Técnica** | TODOs, FIXMEs, código comentado | BAIXO |

### 6.2 Classificação de Problemas

| Nível | Critério | Ação Requerida |
|-------|----------|----------------|
| 🔴 **CRÍTICO** | Segurança comprometida | Corrigir IMEDIATAMENTE |
| 🟠 **ALTO** | Arquitetura errada | Propor reescrita |
| 🟡 **MÉDIO** | Código subótimo | Planejar refatoração |
| 🟢 **BAIXO** | Melhorias cosméticas | Documentar para futuro |

### 6.3 Formato de Relatório de Auditoria

```markdown
# Relatório de Auditoria

**Domínio:** [Nome do Domínio]
**Data:** [Data]
**Auditor:** [Identificador]

---

## Resumo Executivo

[2-3 linhas sobre o estado geral do domínio]

**Estatísticas:**
- Problemas Críticos: X
- Problemas Altos: X
- Problemas Médios: X
- Problemas Baixos: X

---

## Problemas Encontrados

### 🔴 [CRÍTICO] Problema 1: [Título]

**Arquivo:** `path/to/file.ts`
**Linha:** 42

**Descrição:**
[O que está errado]

**Impacto:**
[Por que é problema - o que pode acontecer]

**Solução A:** [Descrição]
- Manutenibilidade: X/10
- Zero DT: X/10
- Arquitetura: X/10
- Escalabilidade: X/10
- Segurança: X/10
- **NOTA FINAL: X.X/10**

**Solução B:** [Descrição]
- Manutenibilidade: X/10
- Zero DT: X/10
- Arquitetura: X/10
- Escalabilidade: X/10
- Segurança: X/10
- **NOTA FINAL: X.X/10**

**Solução Recomendada:** Solução A
**Justificativa:** [Por que A é melhor que B]

---

### 🟠 [ALTO] Problema 2: [Título]
[Mesmo formato...]

---

## Ações Recomendadas (Priorizadas)

1. **[CRÍTICO]** [Ação 1 - o que fazer]
2. **[CRÍTICO]** [Ação 2 - o que fazer]
3. **[ALTO]** [Ação 3 - o que fazer]
4. **[ALTO]** [Ação 4 - o que fazer]

---

## Arquivos Analisados

| Arquivo | Linhas | Status |
|---------|--------|--------|
| `file1.ts` | 120 | ✅ OK |
| `file2.ts` | 350 | ⚠️ > 300 linhas |
| `file3.ts` | 80 | ✅ OK |
```

---

## Checklist de Qualidade

Antes de entregar **QUALQUER** código, pergunte-se:

| Pergunta | Resposta Esperada |
|----------|-------------------|
| Esta é a MELHOR solução possível? | Sim, nota máxima |
| Existe alguma solução com nota maior? | Não |
| Isso cria dívida técnica? | Zero |
| Precisaremos "melhorar depois"? | Não |
| O código sobrevive 10 anos sem refatoração? | Sim |
| Estou escolhendo isso por ser mais rápido? | Não |
| Estou escolhendo isso por ser mais simples? | Não |

Se qualquer resposta for diferente da esperada, **PARE e reconsidere**.

---

## Declaração de Missão

> **Nossa métrica de sucesso não é a velocidade de entrega, é a Manutenibilidade Infinita.**

> **Estamos construindo a fundação de um arranha-céu.**

> **Destrua a complexidade pela raiz.**

> **Deu erro? Vá procurar e entender o código. Não mande suposições. Entenda o código, o erro, e aí sim venha com diagnóstico e solução.**

> **Se a melhor solução demora 1 ano, nós demoramos 1 ano. Sem discussão.**

---

**FIM DO RELATÓRIO MÃE v1.0**
