/**
 * Password Policy Validator
 * 
 * Implementa validação de força de senha conforme melhores práticas.
 * 
 * VULN-007: Política de senhas fracas corrigida
 * 
 * @version 1.0.0
 */

export interface PasswordValidationResult {
  valid: boolean;
  score: number; // 0-100
  errors: string[];
  suggestions: string[];
}

/**
 * Configuração da política de senhas
 */
export const PASSWORD_POLICY = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: false, // Opcional mas recomendado
  disallowCommonPasswords: true,
};

/**
 * Lista de senhas comuns que devem ser bloqueadas
 */
const COMMON_PASSWORDS = [
  "password",
  "123456",
  "12345678",
  "123456789",
  "1234567890",
  "qwerty",
  "abc123",
  "password1",
  "password123",
  "admin",
  "letmein",
  "welcome",
  "monkey",
  "dragon",
  "master",
  "login",
  "princess",
  "qwertyuiop",
  "solo",
  "passw0rd",
  "senha",
  "senha123",
  "mudar123",
  "teste123",
  "admin123",
];

/**
 * Verifica se a senha contém sequências óbvias
 */
function hasSequentialChars(password: string): boolean {
  const sequences = [
    "abcdefghijklmnopqrstuvwxyz",
    "zyxwvutsrqponmlkjihgfedcba",
    "0123456789",
    "9876543210",
    "qwertyuiop",
    "asdfghjkl",
    "zxcvbnm",
  ];
  
  const lower = password.toLowerCase();
  
  for (const seq of sequences) {
    for (let i = 0; i <= seq.length - 4; i++) {
      if (lower.includes(seq.slice(i, i + 4))) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Verifica se a senha tem caracteres repetidos demais
 */
function hasRepeatedChars(password: string): boolean {
  // 3+ caracteres iguais consecutivos
  return /(.)\1{2,}/.test(password);
}

/**
 * Valida força da senha
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];
  const suggestions: string[] = [];
  let score = 0;
  
  // Validação básica
  if (typeof password !== "string") {
    return {
      valid: false,
      score: 0,
      errors: ["Senha inválida"],
      suggestions: [],
    };
  }
  
  // Comprimento mínimo
  if (password.length < PASSWORD_POLICY.minLength) {
    errors.push(`Senha deve ter no mínimo ${PASSWORD_POLICY.minLength} caracteres`);
  } else {
    score += 20;
    
    // Bônus por comprimento extra
    if (password.length >= 12) score += 10;
    if (password.length >= 16) score += 10;
  }
  
  // Comprimento máximo
  if (password.length > PASSWORD_POLICY.maxLength) {
    errors.push(`Senha deve ter no máximo ${PASSWORD_POLICY.maxLength} caracteres`);
  }
  
  // Letra maiúscula
  if (PASSWORD_POLICY.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push("Senha deve conter pelo menos uma letra maiúscula");
  } else if (/[A-Z]/.test(password)) {
    score += 15;
  }
  
  // Letra minúscula
  if (PASSWORD_POLICY.requireLowercase && !/[a-z]/.test(password)) {
    errors.push("Senha deve conter pelo menos uma letra minúscula");
  } else if (/[a-z]/.test(password)) {
    score += 15;
  }
  
  // Número
  if (PASSWORD_POLICY.requireNumber && !/[0-9]/.test(password)) {
    errors.push("Senha deve conter pelo menos um número");
  } else if (/[0-9]/.test(password)) {
    score += 15;
  }
  
  // Caractere especial (opcional mas adiciona pontos)
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score += 15;
  } else {
    suggestions.push("Adicione caracteres especiais para maior segurança");
  }
  
  // Senhas comuns
  if (PASSWORD_POLICY.disallowCommonPasswords) {
    const lowerPassword = password.toLowerCase();
    if (COMMON_PASSWORDS.includes(lowerPassword)) {
      errors.push("Esta senha é muito comum e fácil de adivinhar");
      score = Math.max(0, score - 30);
    }
  }
  
  // Sequências óbvias
  if (hasSequentialChars(password)) {
    suggestions.push("Evite sequências óbvias como 'abcd' ou '1234'");
    score = Math.max(0, score - 10);
  }
  
  // Caracteres repetidos
  if (hasRepeatedChars(password)) {
    suggestions.push("Evite repetir o mesmo caractere várias vezes");
    score = Math.max(0, score - 10);
  }
  
  // Limitar score a 100
  score = Math.min(100, score);
  
  return {
    valid: errors.length === 0,
    score,
    errors,
    suggestions,
  };
}

/**
 * Cria mensagem de erro formatada para o usuário
 */
export function formatPasswordError(result: PasswordValidationResult): string {
  if (result.valid) {
    return "";
  }
  
  if (result.errors.length === 1) {
    return result.errors[0];
  }
  
  return "Senha inválida: " + result.errors.join(". ");
}
