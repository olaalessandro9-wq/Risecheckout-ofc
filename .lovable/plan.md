
## Objetivo (escopo estrito)
Corrigir APENAS o bug descrito: ao sair da aba/app e voltar, a animação do quiz do `/cadastro` roda, e em milissegundos “reinicia do 0” (parece duas animações seguidas). O mesmo comportamento acontece no primeiro carregamento do quiz.

## Diagnóstico de Causa Raiz (confirmado por leitura de código)
### Sintoma observado = “animação reinicia”
Em React + Framer Motion isso quase sempre significa **remount** (desmonta/monta) do subtree animado — não é “só re-render”.

### Causa raiz específica no seu projeto
No arquivo `src/pages/Cadastro.tsx`, existem **componentes definidos dentro da função** `Cadastro()`:

- `PageLayout`
- `ChooseProfileView`
- `AlreadyHasAccountView`

Exemplo (trecho real):
- `const PageLayout = (...) => (...)`
- `const ChooseProfileView = () => (...)`
- `const AlreadyHasAccountView = () => (...)`

Isso é um anti-pattern crítico em React:

- A cada re-render do componente `Cadastro`, essas funções são recriadas (novas referências).
- Para o React, **isso muda o “tipo do componente”**, então ele **desmonta e monta novamente** aquele subtree.
- Ao montar de novo, o `motion.div` executa `initial → animate` novamente.
- Resultado visual: **uma animação “normal” + outra “do zero” imediatamente depois**.

### Por que isso dispara quando você troca de aba?
Porque `useUnifiedAuth()` está configurado para revalidar no foco:

`src/hooks/useUnifiedAuth.ts`
- `refetchOnWindowFocus: true`
- `staleTime: 0`
- `refetchOnMount: 'always'`

Ao voltar para a aba:
- React Query refaz o fetch → o hook re-renderiza `Cadastro`.
- Esse re-render é suficiente para disparar o bug **porque os subcomponentes são inline** (recriados) → remount → animação reinicia.

### Por que também acontece no “primeiro load” do quiz?
Primeira visita:
- `useUnifiedAuth` começa carregando e depois resolve a validação (mesmo que `valid: false`).
- Essa resolução muda o estado interno do hook → causa re-render de `Cadastro`.
- Re-render → recria subcomponentes → remount → animação roda de novo.

## Análise de Soluções (RISE Protocol V3)

### Solução A: Remover a causa raiz (Extrair componentes inline para module-scope + estabilizar configs do Framer)
- Manutenibilidade: 10/10 (remove anti-pattern estrutural)
- Zero DT: 10/10 (correção definitiva e canônica)
- Arquitetura: 10/10 (React idiomático; componentes com identidade estável)
- Escalabilidade: 10/10 (padrão replicável em qualquer fluxo com animação)
- Segurança: 10/10 (não altera garantias de validação de sessão)
- **NOTA FINAL: 10.0/10**
- Tempo estimado: 1–3 horas (refactor limpo + testes manuais)

### Solução B: Desligar `refetchOnWindowFocus` (global ou condicional)
- Manutenibilidade: 6/10 (mexe na semântica do auth para resolver sintoma de UI)
- Zero DT: 7/10 (pode mascarar casos reais de sessão expirada ao retornar)
- Arquitetura: 6/10 (acoplamento “UI depende de política de refetch”)
- Escalabilidade: 7/10
- Segurança: 8/10 (potencial janela de sessão “stale”)
- **NOTA FINAL: 6.8/10**
- Tempo estimado: 15–45 min

### Solução C: Workaround no Framer Motion (ex.: `initial={false}` controlado por ref, ou “debounce” de animação)
- Manutenibilidade: 4/10 (complexidade artificial)
- Zero DT: 3/10 (gira em torno do sintoma, não da causa)
- Arquitetura: 4/10
- Escalabilidade: 4/10
- Segurança: 10/10
- **NOTA FINAL: 4.5/10**
- Tempo estimado: 30–90 min

### DECISÃO: Solução A (10.0/10)
As outras alternativas são inferiores porque não removem a causa raiz: a identidade instável dos componentes inline que provoca remount e reinício das animações.

## Implementação (mudanças planejadas — focadas só no bug de “trocar de aba”)

### 1) Refatorar `src/pages/Cadastro.tsx` para eliminar componentes inline
Objetivo: garantir que **re-render por refetch do auth** não provoque remount.

Abordagem “melhor” (também resolve o limite 300 linhas):
- Criar um pequeno módulo para o cadastro e deixar `src/pages/Cadastro.tsx` como re-export.

#### Nova estrutura proposta
- `src/pages/Cadastro.tsx` (fica pequeno, só re-export)
- `src/pages/cadastro/CadastroPage.tsx` (estado + orquestração: view, navigation, handlers, hooks)
- `src/pages/cadastro/components/CadastroLayout.tsx` (layout + painel direito)
- `src/pages/cadastro/components/ChooseProfileView.tsx` (quiz 3 opções)
- `src/pages/cadastro/components/AlreadyHasAccountView.tsx` (tela “você já tem conta”)
- `src/pages/cadastro/motion.ts` (constantes/variants/transitions estáveis)

Isso garante:
- Componentes têm **referência estável** (module scope)
- Framer Motion recebe configs estáveis (opcional, mas “nota 10”)

### 2) Manter `useUnifiedAuth` intacto (por enquanto)
Escopo atual NÃO é mudar política de auth.
Após remover o remount, o refetch no foco continuará existindo (como deve), porém sem causar reinício de animação.

### 3) Ajuste específico no Framer Motion para robustez
No novo `motion.ts`:
- definir `const` para `transition` e/ou `variants` (ex.: `fadeInUp`), evitando recriar objetos inline desnecessariamente.
Isso não é “workaround”; é higiene arquitetural para animação previsível.

### 4) Critérios de Aceite (o que precisa ficar perfeito)
1. Entrar em `/cadastro` pela primeira vez:
   - animação de entrada acontece 1 vez
   - não deve haver “reset” em milissegundos
2. Estando em qualquer view do quiz (inclusive depois de clicar em opções):
   - sair da aba/app e voltar:
     - não pode ocorrer a segunda animação “do zero”
3. Trocar `view` (choose-profile → already-has-account → back etc):
   - animações de transição continuam funcionando normalmente (sem quebrar UX)
4. Não introduzir novos loaders/flash de tema (já existe `AuthPageLoader` na rota).

## Riscos / Pontos de Atenção
- Como hoje `PageLayout` inclui `AuthThemeProvider`, ao extrair componentes precisamos manter a mesma ordem de providers para não reintroduzir “flash” de tema.
- Garantir que `ProducerRegistrationForm` continue recebendo `registrationSource` e `onBack` exatamente como hoje.
- Não alterar regras de redirect (`if (!authLoading && isAuthenticated) navigate("/dashboard")`).

## Plano de Teste (manual, objetivo)
- Abrir `/cadastro`
  - observar: animação única
- Alternar para outro app/aba por 2–5s e voltar
  - observar: sem reinício duplo
- Repetir o ciclo 5–10 vezes
- Clicar em cada opção do quiz e repetir o ciclo de sair/voltar
  - observar: sem reinício duplo em nenhuma das 3 opções
