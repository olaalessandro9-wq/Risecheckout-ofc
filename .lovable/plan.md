
# Plano de Melhorias: Persistência de Formulário e Unicidade de Campos

## Resumo Executivo

Identificados **2 problemas** no fluxo de cadastro (`/cadastro`):

1. **Dados do formulário são perdidos** ao trocar de aba/navegador (nenhuma persistência implementada)
2. **CPF/telefone duplicados são permitidos** (e o CPF sequer está sendo salvo no banco!)

---

## Análise de Soluções (RISE V3 Seção 4.4)

### Solução A: Persistência via sessionStorage + Validação Backend com Constraints

- Manutenibilidade: 10/10 (Pattern reutilizável, Single Source of Truth)
- Zero DT: 10/10 (Resolve todos os problemas de uma vez + corrige bug de CPF não salvo)
- Arquitetura: 10/10 (Segue pattern do useFormManager já existente no checkout)
- Escalabilidade: 10/10 (Constraints no banco garantem integridade)
- Segurança: 10/10 (Validação server-side + constraints + não persiste senha)
- **NOTA FINAL: 10.0/10**
- Tempo estimado: 45 minutos

### Solução B: Apenas Persistência Frontend (sem constraints)

- Manutenibilidade: 7/10 (Resolve só metade do problema)
- Zero DT: 5/10 (Não adiciona constraints, permite duplicatas)
- Arquitetura: 6/10 (Ignora problema de CPF não estar sendo salvo)
- Escalabilidade: 5/10 (Dados inconsistentes no banco)
- Segurança: 7/10 (Sem validação server-side)
- **NOTA FINAL: 6.0/10**

### Solução C: localStorage com Expiração + Verificação Assíncrona

- Manutenibilidade: 8/10 (localStorage tem problemas de sincronização cross-tab)
- Zero DT: 8/10 (Ainda precisa de constraints)
- Arquitetura: 7/10 (sessionStorage é mais apropriado para formulários temporários)
- Escalabilidade: 8/10 (localStorage pode conflitar entre abas)
- Segurança: 8/10 (Dados persistem mesmo após fechar navegador - risco LGPD)
- **NOTA FINAL: 7.8/10**

### DECISÃO: Solução A (Nota 10.0)

As outras são inferiores porque:
- **Solução B**: Ignora o problema de unicidade e o bug de CPF não ser salvo
- **Solução C**: localStorage persiste dados sensíveis por tempo demais (LGPD)

---

## Diagnóstico Detalhado

### Problema 1: Dados Perdidos ao Trocar de Aba

**Causa Raiz**: O componente `ProducerRegistrationForm.tsx` usa `useState` diretamente, sem nenhum mecanismo de persistência.

**Código Atual** (linhas 36-40):
```typescript
const nameField = useFormValidation('name', true);
const cpfCnpjField = useFormValidation('document', true);
const phoneField = useFormValidation('phone', true);
const emailField = useFormValidation('email', true);
const passwordField = useFormValidation('password', true);
```

O hook `useFormValidation` usa `useState` internamente, que é volátil.

### Problema 2: CPF/CNPJ NÃO Está Sendo Salvo no Banco

**Descoberta Crítica**: O formulário coleta CPF/CNPJ, mas **NÃO envia** para o backend!

**Código do Formulário** (linhas 74-83):
```typescript
const { data, error } = await api.publicCall("unified-auth/register", {
  email: emailField.value,
  password: passwordField.value,
  name: nameField.value,
  phone: phoneField.getRawValue() || undefined,
  registrationType: registrationSource,
  // ❌ FALTA: cpf_cnpj: cpfCnpjField.getRawValue()
});
```

**Handler do Backend** (register.ts linhas 22-28):
```typescript
interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
  phone?: string;
  registrationType?: "producer" | "affiliate" | "buyer";
  // ❌ FALTA: cpf_cnpj
}
```

### Problema 3: Nenhuma Constraint de Unicidade

**Estado Atual do Banco** (tabela `users`):
- `email` → ✅ TEM UNIQUE constraint
- `phone` → ❌ SEM constraint
- `cpf_cnpj` → ❌ SEM constraint (e nem está sendo preenchido!)

---

## Plano de Implementação

### Fase 1: Adicionar Unique Constraints no Banco

**Arquivo**: Nova migração SQL

```sql
-- Adicionar constraints de unicidade para phone e cpf_cnpj
-- Usando partial index para permitir NULLs múltiplos

CREATE UNIQUE INDEX IF NOT EXISTS users_phone_unique 
ON public.users (phone) 
WHERE phone IS NOT NULL AND phone != '';

CREATE UNIQUE INDEX IF NOT EXISTS users_cpf_cnpj_unique 
ON public.users (cpf_cnpj) 
WHERE cpf_cnpj IS NOT NULL AND cpf_cnpj != '';
```

### Fase 2: Corrigir Handler de Registro

**Arquivo**: `supabase/functions/unified-auth/handlers/register.ts`

Alterações:
1. Adicionar `cpf_cnpj` na interface `RegisterRequest`
2. Normalizar CPF/CNPJ (remover máscara)
3. Salvar no banco
4. Verificar unicidade de phone e cpf_cnpj antes de criar

```typescript
interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
  phone?: string;
  cpf_cnpj?: string;  // ✅ NOVO
  registrationType?: "producer" | "affiliate" | "buyer";
}

// Após validações existentes, adicionar:
const normalizedPhone = phone?.replace(/\D/g, '') || null;
const normalizedCpfCnpj = cpf_cnpj?.replace(/\D/g, '') || null;

// Verificar unicidade de phone
if (normalizedPhone) {
  const { data: existingPhone } = await supabase
    .from("users")
    .select("id")
    .eq("phone", normalizedPhone)
    .single();
    
  if (existingPhone) {
    return errorResponse("Este telefone já está cadastrado", corsHeaders, 409);
  }
}

// Verificar unicidade de cpf_cnpj
if (normalizedCpfCnpj) {
  const { data: existingDoc } = await supabase
    .from("users")
    .select("id")
    .eq("cpf_cnpj", normalizedCpfCnpj)
    .single();
    
  if (existingDoc) {
    return errorResponse("Este CPF/CNPJ já está cadastrado", corsHeaders, 409);
  }
}

// No insert, adicionar:
cpf_cnpj: normalizedCpfCnpj,
```

### Fase 3: Corrigir Frontend para Enviar CPF/CNPJ

**Arquivo**: `src/components/auth/ProducerRegistrationForm.tsx`

```typescript
const { data, error } = await api.publicCall<{
  success: boolean;
  error?: string;
}>("unified-auth/register", {
  email: emailField.value,
  password: passwordField.value,
  name: nameField.value,
  phone: phoneField.getRawValue() || undefined,
  cpf_cnpj: cpfCnpjField.getRawValue() || undefined,  // ✅ NOVO
  registrationType: registrationSource,
});
```

### Fase 4: Criar Hook de Persistência de Formulário

**Novo Arquivo**: `src/hooks/useRegistrationFormPersistence.ts`

```typescript
/**
 * useRegistrationFormPersistence - Persiste dados do formulário de cadastro
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Usa sessionStorage (não localStorage) para:
 * - Dados são limpos ao fechar navegador (LGPD)
 * - Não persiste entre sessões (segurança)
 * - Persiste ao trocar de aba/navegador
 * 
 * NÃO persiste: senha (segurança)
 */

import { useEffect, useCallback, useRef } from "react";

const STORAGE_KEY = "rise_registration_form";

interface RegistrationFormData {
  name: string;
  cpfCnpj: string;
  phone: string;
  email: string;
  registrationType: "producer" | "affiliate";
}

export function useRegistrationFormPersistence() {
  const isHydratedRef = useRef(false);

  // Carregar dados salvos
  const loadSavedData = useCallback((): Partial<RegistrationFormData> | null => {
    if (typeof window === "undefined") return null;
    
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (!saved) return null;
      return JSON.parse(saved);
    } catch {
      return null;
    }
  }, []);

  // Salvar dados
  const saveData = useCallback((data: Partial<RegistrationFormData>) => {
    if (typeof window === "undefined") return;
    
    try {
      // ❌ Nunca salvar senha
      const { password, ...safeData } = data as Record<string, unknown>;
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(safeData));
    } catch {
      // Silently fail
    }
  }, []);

  // Limpar dados após sucesso
  const clearData = useCallback(() => {
    if (typeof window === "undefined") return;
    sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    loadSavedData,
    saveData,
    clearData,
    isHydratedRef,
  };
}
```

### Fase 5: Integrar Persistência no ProducerRegistrationForm

**Arquivo**: `src/components/auth/ProducerRegistrationForm.tsx`

Alterações:
1. Importar e usar o hook de persistência
2. Hidratar campos no mount
3. Salvar alterações em sessionStorage
4. Limpar após sucesso

```typescript
import { useRegistrationFormPersistence } from "@/hooks/useRegistrationFormPersistence";

export function ProducerRegistrationForm({ ... }) {
  const { loadSavedData, saveData, clearData, isHydratedRef } = useRegistrationFormPersistence();
  
  // Hidratar campos no mount
  useEffect(() => {
    if (isHydratedRef.current) return;
    
    const saved = loadSavedData();
    if (saved) {
      if (saved.name) nameField.setValue(saved.name);
      if (saved.cpfCnpj) cpfCnpjField.setValue(saved.cpfCnpj);
      if (saved.phone) phoneField.setValue(saved.phone);
      if (saved.email) emailField.setValue(saved.email);
    }
    
    isHydratedRef.current = true;
  }, []);
  
  // Salvar alterações
  useEffect(() => {
    if (!isHydratedRef.current) return;
    
    saveData({
      name: nameField.value,
      cpfCnpj: cpfCnpjField.value,
      phone: phoneField.value,
      email: emailField.value,
      registrationType: registrationSource,
    });
  }, [nameField.value, cpfCnpjField.value, phoneField.value, emailField.value]);
  
  // No handleSignup, após sucesso:
  clearData();
}
```

### Fase 6: Melhorar Mensagens de Erro no Frontend

**Arquivo**: `src/components/auth/ProducerRegistrationForm.tsx`

```typescript
if (error || !data?.success) {
  const errorMsg = error?.message || data?.error || "Erro ao criar conta";
  
  // Mapear erros específicos para mensagens amigáveis
  if (errorMsg.includes("email já está cadastrado")) {
    toast.error("Este email já possui uma conta. Tente fazer login.");
  } else if (errorMsg.includes("telefone já está cadastrado")) {
    toast.error("Este telefone já está vinculado a outra conta.");
  } else if (errorMsg.includes("CPF/CNPJ já está cadastrado")) {
    toast.error("Este CPF/CNPJ já está vinculado a outra conta.");
  } else {
    toast.error(errorMsg);
  }
  
  setLoading(false);
  return;
}
```

---

## Arquivos a Criar/Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| **Migração SQL** | CRIAR | Adicionar UNIQUE constraints para phone e cpf_cnpj |
| `supabase/functions/unified-auth/handlers/register.ts` | EDITAR | Adicionar cpf_cnpj + verificações de unicidade |
| `src/hooks/useRegistrationFormPersistence.ts` | CRIAR | Hook de persistência via sessionStorage |
| `src/components/auth/ProducerRegistrationForm.tsx` | EDITAR | Enviar cpf_cnpj + integrar persistência + mensagens de erro |

---

## Fluxo Corrigido

```text
1. Usuário acessa /cadastro → Escolhe "Produtor" ou "Afiliado"
2. Formulário carrega → Hidrata dados do sessionStorage (se existir)
3. Usuário preenche campos → Dados são salvos em sessionStorage
4. Usuário troca de aba/navegador → Volta e dados estão lá
5. Usuário clica "Criar conta":
   a. Frontend envia: email, password, name, phone, cpf_cnpj, registrationType
   b. Backend verifica unicidade de email, phone, cpf_cnpj
   c. Se duplicado → Retorna erro específico (409)
   d. Se único → Cria usuário → Sucesso
6. Após sucesso → sessionStorage é limpo
7. Usuário fecha navegador → sessionStorage é limpo automaticamente (LGPD)
```

---

## Validação Pós-Implementação

| Teste | Como Validar |
|-------|--------------|
| Persistência funciona | Preencher formulário → Trocar de aba → Voltar → Dados devem estar lá |
| Senha NÃO é persistida | Verificar sessionStorage → Não deve conter campo "password" |
| Email duplicado | Tentar cadastrar email existente → Toast: "Este email já possui uma conta" |
| Telefone duplicado | Tentar cadastrar telefone existente → Toast: "Este telefone já está vinculado" |
| CPF duplicado | Tentar cadastrar CPF existente → Toast: "Este CPF/CNPJ já está vinculado" |
| CPF é salvo no banco | Após cadastro → Verificar users.cpf_cnpj no banco |
| Limpa após sucesso | Após cadastro → sessionStorage deve estar vazio |
| Limpa ao fechar browser | Fechar browser → Reabrir → Formulário deve estar vazio |

---

## Detalhes Técnicos

### Por que sessionStorage e não localStorage?

| Aspecto | sessionStorage | localStorage |
|---------|---------------|--------------|
| Persiste ao fechar browser? | ❌ Não | ✅ Sim |
| Persiste ao trocar de aba? | ✅ Sim (mesma origem) | ✅ Sim |
| Risco LGPD | Baixo (dados temporários) | Alto (dados persistem) |
| Uso ideal | Formulários temporários | Preferências do usuário |

Para cadastro, **sessionStorage** é a escolha correta: resolve o problema do usuário (dados persistem ao trocar de aba) sem criar risco de LGPD (dados não persistem entre sessões).

### Constraint Partial Index vs Regular UNIQUE

Usamos partial index (`WHERE column IS NOT NULL AND column != ''`) porque:
- Permite múltiplos usuários com phone/cpf_cnpj NULL
- Apenas impede duplicatas de valores reais
- Mais flexível para cadastros parciais (buyers via checkout)

---

## RISE V3 Compliance Score

| Critério | Nota |
|----------|------|
| Manutenibilidade Infinita | 10.0/10 |
| Zero Dívida Técnica | 10.0/10 |
| Arquitetura Correta | 10.0/10 |
| Escalabilidade | 10.0/10 |
| Segurança | 10.0/10 |
| **NOTA FINAL** | **10.0/10** |
