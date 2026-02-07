

# Remoção de Código Morto: Disable MFA (Frontend)

## Diagnóstico

O MFA é visível **exclusivamente** para roles `admin`/`owner` (via `isMfaEligible` em `Perfil.tsx`), e é **sempre obrigatório** para essas mesmas roles (`isMfaMandatory` em `MfaSettingsCard.tsx`). Isso significa que `isMfaEligible === isMfaMandatory` — ambos verificam `admin || owner`.

Consequência: todo o código relacionado a "desativar MFA" no frontend é **código morto** — nenhum caminho de execução jamais o alcança. Nenhum usuário verá o botão de desativar, o dialog de confirmação, ou executará o handler.

---

## Análise de Soluções (Seção 4 RISE V3)

### Solução A: Apenas esconder o botão com condicional (estado atual)

O botão está escondido via `isMfaMandatory ? <texto> : <botão>`, mas todo o código morto permanece: estado, handler, imports, Dialog, e a função `mfaDisable` no service.

- Manutenibilidade: 4/10 (100+ linhas de código morto no componente)
- Zero DT: 2/10 (código morto É dívida técnica por definição)
- Arquitetura: 3/10 (imports não utilizados, estados sem propósito)
- Escalabilidade: 5/10 (não impacta, mas polui o componente)
- Segurança: 7/10 (backend bloqueia, mas frontend mantém código de ataque)
- **NOTA FINAL: 3.8/10**

### Solução B: Remoção cirúrgica de todo código morto

Remover do `MfaSettingsCard.tsx`:
- Estados: `showDisableDialog`, `disablePassword`, `disableCode`, `isDisabling`
- Handler: `handleDisable`
- Dialog inteiro de desativação (~70 linhas)
- Imports não utilizados: `ShieldOff`, `Input`, `Label`, `Dialog*`, `mfaDisable`
- Condicional `isMfaMandatory` (sempre true para quem vê o card)

Remover do `mfaService.ts`:
- Função `mfaDisable` e interface `MfaDisableResponse` (sem caller no frontend)

Manter no backend:
- `mfa-disable.ts` como guarda de segurança (defesa em profundidade), mas atualizar docstring

- Manutenibilidade: 10/10 (zero código morto, componente enxuto ~120 linhas)
- Zero DT: 10/10 (nenhuma linha sem propósito)
- Arquitetura: 10/10 (imports limpos, estados mínimos)
- Escalabilidade: 10/10 (componente focado em sua única responsabilidade)
- Segurança: 10/10 (backend mantém 403, frontend não expõe código de ataque)
- **NOTA FINAL: 10.0/10**

### DECISÃO: Solução B (Nota 10.0)

A Solução A mantém ~100 linhas de código morto que violam diretamente a regra de Zero Dívida Técnica do Protocolo RISE V3. A Solução B elimina todo código sem propósito mantendo a defesa em profundidade no backend.

---

## Plano de Execução

### 1. `src/components/auth/MfaSettingsCard.tsx` — Limpeza total

**Remover:**
- Estados: `showDisableDialog`, `disablePassword`, `disableCode`, `isDisabling`
- Handler: `handleDisable` (linhas 68-95)
- Dialog de desativação inteiro (linhas 184-254)
- Constante `isMfaMandatory` (sempre true, redundante)
- Imports não utilizados: `Input`, `Label`, `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `ShieldOff`, `mfaDisable`

**Simplificar:**
- Quando MFA está ativo: mostrar status "Ativo" + mensagem "MFA é obrigatório" (sem botão de desativar, sem condicional)
- Quando MFA está inativo: mostrar botão "Ativar" + alerta obrigatório (sem condicional `isMfaMandatory` — é sempre mandatório)

**Resultado estimado:** ~100 linhas (de 257 para ~100)

### 2. `src/services/mfaService.ts` — Remover função morta

**Remover:**
- Interface `MfaDisableResponse` (linhas 46-49)
- Função `mfaDisable` (linhas 137-156)
- Comentário de docstring associado (linhas 133-136)

### 3. Backend `supabase/functions/unified-auth/handlers/mfa-disable.ts` — Atualizar docstring

**Manter** o handler intacto (defesa em profundidade — retorna 403 para admin/owner).
**Atualizar** o docstring para refletir que este endpoint é um guarda de segurança, não uma funcionalidade ativa:

```text
/**
 * MFA Disable Guard
 * 
 * Defense-in-depth: blocks ALL disable attempts for admin/owner roles.
 * MFA is mandatory and cannot be deactivated.
 * 
 * The frontend does NOT expose any UI to call this endpoint.
 * This handler exists solely as a backend security guard against
 * direct API calls attempting to bypass frontend restrictions.
 */
```

### 4. `docs/EDGE_FUNCTIONS_REGISTRY.md` — Atualizar descrição

Atualizar a linha 99 para indicar que `MFA-Disable` é um guarda de segurança (não funcionalidade ativa):

```text
| `unified-auth` | public | false | general | SSOT - Login/Register/.../MFA-Disable(guard-only)/MFA-Status |
```

---

## Árvore de Arquivos Modificados

```text
Modificados:
  src/components/auth/MfaSettingsCard.tsx    (~-150 linhas: remoção completa de disable)
  src/services/mfaService.ts                (~-25 linhas: mfaDisable + MfaDisableResponse)
  supabase/functions/unified-auth/handlers/mfa-disable.ts  (docstring atualizado)
  docs/EDGE_FUNCTIONS_REGISTRY.md           (descrição atualizada)
```

---

## Checkpoint RISE V3

| Pergunta | Resposta |
|----------|----------|
| Esta é a MELHOR solução possível? | Sim, nota 10.0 |
| Existe alguma solução com nota maior? | Não |
| Isso cria dívida técnica? | Zero — remove dívida existente |
| Precisaremos "melhorar depois"? | Não |
| O código sobrevive 10 anos sem refatoração? | Sim |
| Estou escolhendo isso por ser mais rápido? | Não |

