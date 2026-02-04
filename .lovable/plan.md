
## Contexto e restrição assumida (não-negociável)
Você afirmou que **o token UTMify está correto e ativo**. Vou tratar isso como verdade. Logo, o problema não é “token inválido”, e sim **o sistema não está usando exatamente esse token no disparo**, ou está **alterando o token** (normalização/sanitização/encoding), ou há **desalinhamento de ambiente** (o token salvo no Vault do ambiente que dispara não é o mesmo).

Além disso: você acabou de colar um segredo em chat. Pelo RISE V3, isso exige ação de segurança: **rotacionar a credencial** depois que terminarmos o diagnóstico (não porque o token era “inválido”, e sim porque foi exposto).

---

## O que eu vi no código (e por que isso importa)
Hoje existem **3 pontos** que podem alterar o token antes de chegar na UTMify:

1) `supabase/functions/vault-save/index.ts`
- Sanitização UTMify:
  - remove `[\r\n\t]`
  - remove **todos** os whitespace via `\s+` (isso inclui espaços internos)
  - remove aspas “envolventes” com `^["']|["']$` (remove só 1 por lado)
- Isso pode **transformar o token** no momento do save.

2) `supabase/functions/_shared/utmify-dispatcher.ts`
- Recupera do Vault via RPC `get_gateway_credentials(p_vendor_id, 'utmify')`
- Sanitiza **de novo** com a mesma regra (`\s+` e regex de aspas simples)
- Envia em `x-api-token`

3) `supabase/functions/utmify-conversion/index.ts`
- Também sanitiza com a mesma regra

Ponto crítico: a documentação oficial da UTMify (PDF) mostra exemplo de token com **espaço** no meio. Se isso for um espaço real (e não artefato do PDF), o código atual **corrompe** tokens que contenham espaços internos. Mesmo que o seu token atual não tenha, essa normalização agressiva é uma fonte real de inconsistências e “funcionava antes / parou depois”.

---

## Objetivo técnico (o único que resolve sem discussão)
Construir um diagnóstico “prova matemática” de que:
1) **Qual token (fingerprint) está no Vault** (sem expor o segredo)
2) **Qual token (fingerprint) está sendo enviado no dispatch**
3) **Se a UTMify aceita esse token** (requisição real, controlada, em modo teste)
4) Detectar automaticamente se há **alteração por sanitização**, **caractere invisível**, **unicode/encoding**, ou **ambiente divergente**

Isso atende seu pedido (“teste você mesmo”) sem violar segurança.

---

## Análise de Soluções (RISE V3)

### Solução A: “Só testar PIX de novo e olhar painel”
- Manutenibilidade: 1/10
- Zero DT: 1/10
- Arquitetura: 1/10
- Escalabilidade: 1/10
- Segurança: 6/10
- **NOTA FINAL: 1.7/10**
- Tempo estimado: curto, mas não resolve a causa raiz

### Solução B: Ajustar sanitização (parar de remover `\s+`) e torcer
- Manutenibilidade: 6/10
- Zero DT: 5/10
- Arquitetura: 6/10
- Escalabilidade: 6/10
- Segurança: 9/10
- **NOTA FINAL: 6.4/10**
- Tempo estimado: baixo, mas ainda fica “cego” (sem prova/fingerprint/health)

### Solução C (SSOT + Prova Criptográfica): Validador backend + fingerprint + health check + normalização robusta centralizada
- Manutenibilidade: 10/10
- Zero DT: 10/10
- Arquitetura: 10/10
- Escalabilidade: 10/10
- Segurança: 10/10
- **NOTA FINAL: 10.0/10**
- Tempo estimado: médio (mas é a melhor solução, obrigatória no RISE V3)

### DECISÃO: Solução C (10.0/10)
É a única que:
- prova se o sistema está usando o token correto
- detecta e impede corrupção do token
- dá diagnóstico objetivo em produção
- evita regressões futuras

---

## Plano de Implementação (Solução C)

### Fase 0 — Segurança (obrigatória após diagnóstico)
- Assim que confirmarmos o fluxo, **rotacionar a credencial no dashboard da UTMify** e salvar novamente no RiseCheckout (porque o token foi exposto em chat).
- Isso não tem relação com “token inválido”; é higiene de segurança.

### Fase 1 — Criar um módulo SSOT de normalização (backend)
Criar um helper único (shared) usado por:
- `vault-save` (no momento de salvar)
- `utmify-dispatcher` (no momento de disparar)
- `utmify-conversion` (legado/compatibilidade)

**Regras de normalização (robustas e seguras):**
- `raw.normalize('NFKC')` (evita unicode “parecido”)
- remover caracteres invisíveis/control:
  - C0/C1, `\u200B-\u200F`, `\uFEFF`, `\u00A0` (NBSP), etc.
- `trim()` apenas nas bordas
- remover aspas nas bordas com regex correta: `^["']+|["']+$`
- **não** remover espaços internos automaticamente (porque pode ser significativo).  
  Em vez disso, tratar “espaços internos” como caso especial a ser validado na Fase 2.

**Entrega adicional: testes unitários (Deno) para normalização**
- casos com tabs/CRLF
- casos com NBSP
- casos com 1/2/3 aspas
- caso com espaço interno (mantém)

### Fase 2 — Nova Edge Function de diagnóstico: `utmify-validate-credentials`
Criar `supabase/functions/utmify-validate-credentials/index.ts` com:
- Auth:
  - modo “sessions” (para painel do produtor) e/ou modo “internal/admin”
- Fonte do token:
  - por padrão: buscar do Vault via `get_gateway_credentials(vendor_id, 'utmify')`
- Saída **sem expor segredo**:
  - `token_length`
  - `token_fingerprint_sha256_12` (ex: primeiros 12 chars do hex)
  - `has_spaces`, `has_invisible_chars_detected`
  - `normalization_diff` (ex: “removed 2 invisible chars”, “removed surrounding quotes”)
- Teste real contra UTMify:
  - enviar payload `isTest: true` com status coerente (`waiting_payment`)
  - retornar `utmify_http_status` + `utmify_body_truncated`
- Se token contiver espaço interno:
  - tentar duas variantes **somente no validador**:
    1) token normalizado (com espaços)
    2) token com espaços removidos
  - retornar qual variante foi aceita (se alguma), e recomendar salvar a forma canônica aceita

Resultado: isso cumpre seu “teste você mesmo” de forma auditável e sem vazar token.

### Fase 3 — Observabilidade no dispatcher (prova de qual token foi usado)
Atualizar `supabase/functions/_shared/utmify-dispatcher.ts` para:
- logar `token_fingerprint_sha256_12` junto com `orderId/eventType` (sem token)
- logar também `normalization_applied` (boolean + diffs)
- quando falhar, registrar em tabela de erros/telemetria existente (ex: `edge_function_errors`) com:
  - `order_id`, `vendor_id`, `event_type`, `utmify_status`, `fingerprint`

Isso resolve definitivamente o debate “o sistema enviou esse token mesmo?”.

### Fase 4 — UI do painel (produtor) com “Testar Conexão”
Atualizar `src/modules/utmify` para incluir:
- botão “Testar Conexão UTMify”
- chama `utmify-validate-credentials`
- mostra resultado:
  - “Conexão OK” ou erro com mensagem específica da UTMify
- exibir fingerprint retornado (12 chars) para auditoria

### Fase 5 — Ajuste do fluxo de salvar (bloquear corrupção)
Atualizar `vault-save`:
- usar normalização SSOT (Fase 1)
- remover a normalização agressiva `\s+` (ou, se mantida para algum cenário, que seja baseada em validação real do token, não suposição)
- opcional: após salvar token, rodar validação server-side e gravar `validated_at` no `vendor_integrations.config` (saúde da integração)

### Fase 6 — Docs (SSOT)
Atualizar `docs/EDGE_FUNCTIONS_REGISTRY.md`:
- registrar `utmify-validate-credentials`
- descrever fingerprint/health check
- declarar regra: “token nunca aparece em logs; apenas fingerprint”

---

## Como vamos comprovar o resultado (checklist)
1) Você gera um PIX (MercadoPago) no seu domínio de produção.
2) Logs do `utmify-dispatcher` mostram:
   - fingerprint X
   - request enviado
3) `utmify-validate-credentials` retorna:
   - fingerprint X (mesmo do dispatcher)
   - status 200/201 (ou o erro real)
4) Se o status for erro:
   - agora teremos a resposta real + fingerprint para isolar se é credencial, payload, ou outro fator

---

## Escopo de arquivos (previsto)

### Novos
- `supabase/functions/utmify-validate-credentials/index.ts`
- `supabase/functions/_shared/utmify-token-normalizer.ts` (ou equivalente)
- testes Deno para normalizer e validador

### Modificados
- `supabase/functions/vault-save/index.ts`
- `supabase/functions/_shared/utmify-dispatcher.ts`
- `supabase/functions/utmify-conversion/index.ts` (consistência)
- `src/modules/utmify/machines/utmifyMachine.ts`
- `src/modules/utmify/components/UTMifyForm.tsx`
- `docs/EDGE_FUNCTIONS_REGISTRY.md`

---

## Nota importante sobre o token que você colou
Eu não vou repetir o token em logs/UI/planos futuros. Ele foi exposto aqui, então a etapa de rotação após o diagnóstico é obrigatória para manter RISE V3 10/10.

