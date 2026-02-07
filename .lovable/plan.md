

# Correcao: MFA_ENCRYPTION_KEY - Base64 Invalida + Hardening do Validador

## Diagnostico Preciso

### Erro nos Logs
```
MFA setup error: Failed to decode base64
```

### Causa Raiz

A chave `k7Hj9Lm2Np4Qr6St8Uv0Wx2Yz4Ab6Cd8Ef0Gh2Ij4K=` tem **43 caracteres**. Base64 valido exige comprimento **multiplo de 4**.

| Caracteres | Multiplo de 4? | Status |
|-----------|----------------|--------|
| 43        | NAO (43/4 = 10.75) | INVALIDO |
| 44        | SIM (44/4 = 11)    | VALIDO |

O `atob()` do Deno rejeita ANTES de decodificar, gerando `Failed to decode base64`.

### Por que o codigo nao ajudou a diagnosticar

A funcao `getMfaEncryptionKey()` em `mfa-helpers.ts` (linha 60) chama `atob(keyBase64)` **sem try-catch**. O erro generico do runtime (`Failed to decode base64`) propaga sem contexto, sem indicar que a chave esta com formato invalido nem como corrigi-la.

Isso viola RISE V3 Secao 6.1 (Root Cause Only): o erro deveria informar **exatamente o que esta errado e como corrigir**.

---

## Analise de Solucoes

### Solucao A: Apenas orientar o usuario a trocar a chave

- Manutenibilidade: 5/10 (proximo usuario com chave invalida tera o mesmo erro generico)
- Zero DT: 4/10 (funcao fragil continua sem validacao adequada)
- Arquitetura: 5/10 (funcao de seguranca sem tratamento de erro robusto)
- Escalabilidade: 6/10 (nao impacta)
- Seguranca: 6/10 (mensagem de erro nao ajuda em auditoria)
- **NOTA FINAL: 5.0/10**

### Solucao B: Hardening do validador + orientacao da chave

Melhorar `getMfaEncryptionKey()` com:
1. Try-catch ao redor do `atob()` com mensagem actionable
2. Validacao de formato base64 (multiplo de 4) ANTES de decodificar
3. Log claro com instrucoes de geracao
4. Orientar o usuario a gerar e configurar a chave correta

- Manutenibilidade: 10/10 (qualquer erro futuro tera diagnostico automatico)
- Zero DT: 10/10 (nenhuma "correcao futura" necessaria)
- Arquitetura: 10/10 (funcao de seguranca com tratamento robusto)
- Escalabilidade: 10/10 (nao impacta)
- Seguranca: 10/10 (validacao completa, mensagens claras em auditoria)
- **NOTA FINAL: 10.0/10**

### DECISAO: Solucao B (Nota 10.0)

A Solucao A resolve o problema de HOJE. A Solucao B resolve o problema para SEMPRE.

---

## Plano de Execucao

### 1. Hardening de `getMfaEncryptionKey()` em `mfa-helpers.ts`

Reescrever a funcao para:

```text
function getMfaEncryptionKey(): Uint8Array {
  const keyBase64 = Deno.env.get("MFA_ENCRYPTION_KEY");
  
  // 1. Verifica se existe
  if (!keyBase64) {
    throw new Error("MFA_ENCRYPTION_KEY not configured. Set it via: openssl rand -base64 32");
  }

  // 2. Valida formato base64 (multiplo de 4, caracteres validos)
  const trimmed = keyBase64.trim();
  if (trimmed.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(trimmed)) {
    throw new Error(
      `MFA_ENCRYPTION_KEY is not valid base64 (length ${trimmed.length}, must be multiple of 4). ` +
      `Generate with: openssl rand -base64 32`
    );
  }

  // 3. Decodifica com try-catch (defesa em profundidade)
  let keyBytes: Uint8Array;
  try {
    keyBytes = Uint8Array.from(atob(trimmed), (c) => c.charCodeAt(0));
  } catch {
    throw new Error(
      "MFA_ENCRYPTION_KEY failed base64 decoding. Generate a new key with: openssl rand -base64 32"
    );
  }

  // 4. Valida tamanho exato (AES-256 = 32 bytes)
  if (keyBytes.length !== 32) {
    throw new Error(
      `MFA_ENCRYPTION_KEY must decode to exactly 32 bytes (got ${keyBytes.length}). ` +
      `Generate with: openssl rand -base64 32`
    );
  }

  return keyBytes;
}
```

**Mudancas:**
- Trim da chave (remove espacos acidentais)
- Validacao regex de formato base64 ANTES do atob
- Try-catch ao redor do atob com mensagem actionable
- Todas as mensagens de erro incluem o comando de geracao

### 2. Orientacao para gerar chave correta

O usuario precisa gerar uma chave que:
- Seja base64 valida (multiplo de 4 caracteres)
- Decodifique para exatamente 32 bytes

**Metodo 1 - Terminal (recomendado):**
```
openssl rand -base64 32
```
Isso gera exatamente 32 bytes aleatorios e os codifica em base64 (resultado: 44 caracteres).

**Metodo 2 - Console do navegador:**
```
btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))))
```

O resultado sera uma string de 44 caracteres terminando em `=`. Essa string deve ser configurada como o valor do secret `MFA_ENCRYPTION_KEY` no Supabase.

### 3. Deploy da edge function

Apos modificar `mfa-helpers.ts`, deployar `unified-auth` para que a nova validacao entre em vigor.

---

## Arvore de Arquivos

```text
Modificados:
  supabase/functions/_shared/mfa-helpers.ts  (~15 linhas alteradas na funcao getMfaEncryptionKey)
```

---

## Checkpoint RISE V3

| Pergunta | Resposta |
|----------|----------|
| Esta e a MELHOR solucao possivel? | Sim, nota 10.0 |
| Existe alguma solucao com nota maior? | Nao |
| Isso cria divida tecnica? | Zero - remove fragilidade existente |
| Precisaremos "melhorar depois"? | Nao |
| O codigo sobrevive 10 anos sem refatoracao? | Sim |
| Estou escolhendo isso por ser mais rapido? | Nao |

