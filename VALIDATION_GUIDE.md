# 🛡️ Guia de Validação de Formulários

**Data:** 16 de dezembro de 2025  
**Versão:** 1.0  
**Commit:** `c5b0ee34`

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Biblioteca de Validação](#biblioteca-de-validação)
3. [Hook useFormValidation](#hook-useformvalidation)
4. [Máscaras Implementadas](#máscaras-implementadas)
5. [Validações Implementadas](#validações-implementadas)
6. [Como Usar](#como-usar)
7. [Exemplos Práticos](#exemplos-práticos)
8. [Proteção Contra Spam](#proteção-contra-spam)

---

## 🎯 Visão Geral

Sistema completo de validação e máscaras para formulários, protegendo contra spam e melhorando drasticamente a experiência do usuário.

### ✅ **Problemas Resolvidos:**

1. ❌ **Antes:** Usuários podiam digitar qualquer coisa (99999999...)
2. ✅ **Agora:** Máscaras automáticas e validação em tempo real

3. ❌ **Antes:** Validação apenas no submit (erro tarde demais)
4. ✅ **Agora:** Feedback visual imediato (verde/vermelho)

5. ❌ **Antes:** CPF/telefone sem validação de formato
6. ✅ **Agora:** Validação com dígitos verificadores

7. ❌ **Antes:** Vulnerável a spam e dados inválidos
8. ✅ **Agora:** Limites e bloqueios de caracteres

---

## 📚 Biblioteca de Validação

**Arquivo:** `src/lib/validation.ts`

### Máscaras Disponíveis:

```typescript
import {
  maskCPF,        // 000.000.000-00
  maskCNPJ,       // 00.000.000/0000-00
  maskPhone,      // (00) 00000-0000
  maskDocument,   // Auto-detecta CPF ou CNPJ
  unmask,         // Remove formatação
} from '@/lib/validation';
```

### Validações Disponíveis:

```typescript
import {
  validateCPF,      // Valida CPF com dígitos verificadores
  validateCNPJ,     // Valida CNPJ com dígitos verificadores
  validatePhone,    // Valida telefone (10-11 dígitos)
  validateEmail,    // Valida formato de email
  validateName,     // Mínimo 3 caracteres
  validatePassword, // Mínimo 6 caracteres
  validateDocument, // Auto-detecta e valida CPF/CNPJ
} from '@/lib/validation';
```

---

## 🎣 Hook useFormValidation

**Arquivo:** `src/hooks/useFormValidation.ts`

Hook customizado que encapsula toda a lógica de validação, máscaras e feedback visual.

### Sintaxe:

```typescript
const field = useFormValidation(
  type: 'cpf' | 'cnpj' | 'document' | 'phone' | 'email' | 'name' | 'password' | 'text',
  required: boolean,
  initialValue?: string
);
```

### Retorno:

```typescript
{
  value: string;           // Valor formatado (com máscara)
  error: string | null;    // Mensagem de erro
  isValid: boolean;        // Se o campo é válido
  isTouched: boolean;      // Se o usuário já interagiu
  onChange: (e) => void;   // Handler de mudança
  onBlur: () => void;      // Handler de blur (validação)
  reset: () => void;       // Reseta o campo
  setValue: (v) => void;   // Define valor programaticamente
  validate: () => boolean; // Valida manualmente
  getRawValue: () => string; // Retorna valor sem máscara
}
```

---

## 🎭 Máscaras Implementadas

### 1. **CPF**

```typescript
const cpfField = useFormValidation('cpf', true);

// Input: 70991920198
// Output: 709.919.201-98
```

**Características:**
- Limita a 11 dígitos
- Formata automaticamente enquanto digita
- Valida dígitos verificadores

---

### 2. **CNPJ**

```typescript
const cnpjField = useFormValidation('cnpj', true);

// Input: 12345678000190
// Output: 12.345.678/0001-90
```

**Características:**
- Limita a 14 dígitos
- Formata automaticamente
- Valida dígitos verificadores

---

### 3. **CPF ou CNPJ (Auto-detecta)**

```typescript
const documentField = useFormValidation('document', true);

// Se digitar 11 dígitos → CPF
// Se digitar 14 dígitos → CNPJ
```

**Características:**
- Detecta automaticamente o tipo
- Aplica máscara correspondente
- Valida de acordo com o tipo

---

### 4. **Telefone**

```typescript
const phoneField = useFormValidation('phone', true);

// Input: 11999999999
// Output: (11) 99999-9999

// Input: 1133334444
// Output: (11) 3333-4444
```

**Características:**
- Aceita 10 (fixo) ou 11 (celular) dígitos
- Formata com DDD
- Valida DDD (11-99)
- Valida 9º dígito para celular

---

## ✅ Validações Implementadas

### 1. **CPF**

```typescript
validateCPF('709.919.201-98') // true
validateCPF('111.111.111-11') // false (todos iguais)
validateCPF('123.456.789-00') // false (dígitos inválidos)
```

**Regras:**
- Deve ter exatamente 11 dígitos
- Não pode ter todos os dígitos iguais
- Valida 1º e 2º dígitos verificadores

---

### 2. **CNPJ**

```typescript
validateCNPJ('12.345.678/0001-90') // true/false
```

**Regras:**
- Deve ter exatamente 14 dígitos
- Não pode ter todos os dígitos iguais
- Valida 1º e 2º dígitos verificadores

---

### 3. **Telefone**

```typescript
validatePhone('(11) 99999-9999') // true
validatePhone('(11) 3333-4444')  // true
validatePhone('(00) 99999-9999') // false (DDD inválido)
validatePhone('(11) 89999-9999') // false (celular sem 9)
```

**Regras:**
- 10 dígitos (fixo) ou 11 dígitos (celular)
- DDD entre 11 e 99
- Se 11 dígitos, 3º dígito deve ser 9

---

### 4. **Email**

```typescript
validateEmail('usuario@exemplo.com') // true
validateEmail('usuario@exemplo')     // false
validateEmail('usuario.exemplo.com') // false
```

**Regras:**
- Formato: `usuario@dominio.extensao`
- Aceita letras, números, `.`, `_`, `-`

---

### 5. **Nome**

```typescript
validateName('João Silva') // true
validateName('Jo')         // false (< 3 caracteres)
validateName('João123')    // false (números)
```

**Regras:**
- Mínimo 3 caracteres
- Apenas letras e espaços
- Aceita acentos

---

### 6. **Senha**

```typescript
validatePassword('123456')  // true
validatePassword('12345')   // false (< 6 caracteres)
```

**Regras:**
- Mínimo 6 caracteres

---

## 🚀 Como Usar

### Exemplo Completo (Formulário de Cadastro):

```tsx
import { useFormValidation } from '@/hooks/useFormValidation';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

function SignupForm() {
  const nameField = useFormValidation('name', true);
  const cpfField = useFormValidation('cpf', true);
  const phoneField = useFormValidation('phone', false); // Opcional
  const emailField = useFormValidation('email', true);
  const passwordField = useFormValidation('password', true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validar todos os campos
    const isValid = 
      nameField.validate() &&
      cpfField.validate() &&
      (phoneField.value ? phoneField.validate() : true) &&
      emailField.validate() &&
      passwordField.validate();

    if (!isValid) {
      toast.error('Corrija os erros no formulário');
      return;
    }

    // Enviar dados (sem máscara)
    const data = {
      name: nameField.value,
      cpf: cpfField.getRawValue(), // Remove máscara
      phone: phoneField.getRawValue(),
      email: emailField.value,
      password: passwordField.value,
    };

    // Enviar ao backend...
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Nome */}
      <div>
        <Label>Nome</Label>
        <div className="relative">
          <Input
            value={nameField.value}
            onChange={nameField.onChange}
            onBlur={nameField.onBlur}
            className={
              nameField.isTouched
                ? nameField.isValid
                  ? "border-green-500"
                  : "border-red-500"
                : ""
            }
          />
          {nameField.isTouched && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {nameField.isValid ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
            </div>
          )}
        </div>
        {nameField.error && nameField.isTouched && (
          <p className="text-xs text-red-500">{nameField.error}</p>
        )}
      </div>

      {/* CPF */}
      <div>
        <Label>CPF</Label>
        <div className="relative">
          <Input
            value={cpfField.value}
            onChange={cpfField.onChange}
            onBlur={cpfField.onBlur}
            placeholder="000.000.000-00"
            className={
              cpfField.isTouched
                ? cpfField.isValid
                  ? "border-green-500"
                  : "border-red-500"
                : ""
            }
          />
          {cpfField.isTouched && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {cpfField.isValid ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
            </div>
          )}
        </div>
        {cpfField.error && cpfField.isTouched && (
          <p className="text-xs text-red-500">{cpfField.error}</p>
        )}
      </div>

      <Button type="submit">Cadastrar</Button>
    </form>
  );
}
```

---

## 🔒 Proteção Contra Spam

### 1. **Limites de Caracteres**

Todas as máscaras limitam automaticamente:
- CPF: 11 dígitos
- CNPJ: 14 dígitos
- Telefone: 11 dígitos

### 2. **Bloqueio de Caracteres Inválidos**

```typescript
// CPF: Apenas números
maskCPF('abc123') // '123'

// Email: Validação de formato
validateEmail('usuario@') // false
```

### 3. **Validação de Dígitos Verificadores**

```typescript
// Impede CPFs/CNPJs falsos
validateCPF('111.111.111-11') // false
validateCPF('123.456.789-00') // false
```

### 4. **Validação de DDD**

```typescript
// Impede DDDs inválidos
validatePhone('(00) 99999-9999') // false
validatePhone('(99) 99999-9999') // false
```

---

## 📊 Benefícios

### Segurança:
- ✅ Bloqueia dados inválidos antes do backend
- ✅ Valida dígitos verificadores (CPF/CNPJ)
- ✅ Previne spam e dados falsos

### UX:
- ✅ Formatação automática enquanto digita
- ✅ Feedback visual imediato (verde/vermelho)
- ✅ Mensagens de erro claras
- ✅ Validação antes do submit

### Performance:
- ✅ Validação no frontend (reduz chamadas ao backend)
- ✅ Dados já formatados para o backend
- ✅ Menos erros de validação no servidor

---

## 🎨 Feedback Visual

### Estados do Campo:

1. **Normal (não tocado):**
   - Borda padrão
   - Sem ícone

2. **Válido (tocado):**
   - Borda verde
   - Ícone CheckCircle verde

3. **Inválido (tocado):**
   - Borda vermelha
   - Ícone AlertCircle vermelho
   - Mensagem de erro abaixo

---

## 🚀 Próximos Passos

### Para expandir para outros formulários:

1. **Checkout (SharedPersonalDataForm.tsx):**
   - Aplicar máscaras de CPF e telefone
   - Validação em tempo real

2. **Cadastro de Produtos:**
   - Validação de preços
   - Validação de URLs

3. **Integrações:**
   - Validação de API keys
   - Validação de tokens

---

## 📝 Mensagens de Erro

```typescript
export const ERROR_MESSAGES = {
  cpf: 'CPF inválido. Deve ter 11 dígitos válidos.',
  cnpj: 'CNPJ inválido. Deve ter 14 dígitos válidos.',
  phone: 'Telefone inválido. Use formato (00) 00000-0000.',
  email: 'Email inválido. Use formato exemplo@email.com.',
  name: 'Nome deve ter no mínimo 3 caracteres.',
  password: 'Senha deve ter no mínimo 6 caracteres.',
  required: 'Este campo é obrigatório.',
};
```

---

## ✅ Checklist de Implementação

- [x] Criar biblioteca de validação (`src/lib/validation.ts`)
- [x] Criar hook customizado (`src/hooks/useFormValidation.ts`)
- [x] Aplicar em Auth.tsx (cadastro de usuários)
- [ ] Aplicar em SharedPersonalDataForm.tsx (checkout)
- [ ] Aplicar em cadastro de produtos
- [ ] Aplicar em integrações

---

**Implementado por:** Manus AI  
**Status:** ✅ Pronto para produção  
**Commit:** `c5b0ee34`
