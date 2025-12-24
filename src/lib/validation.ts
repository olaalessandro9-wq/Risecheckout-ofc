/**
 * Biblioteca de validação e máscaras para formulários
 * Protege contra spam e melhora UX
 */

// ============================================
// MÁSCARAS (Formatação automática)
// ============================================

/**
 * Aplica máscara de CPF: 000.000.000-00
 * Bloqueia digitação após 11 dígitos
 */
export function maskCPF(value: string): string {
  // Remove tudo que não é número e limita a 11 dígitos
  const numbers = value.replace(/\D/g, '').slice(0, 11);
  
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
  if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
  return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9)}`;
}

/**
 * Aplica máscara de CNPJ: 00.000.000/0000-00
 * Bloqueia digitação após 14 dígitos
 */
export function maskCNPJ(value: string): string {
  // Remove tudo que não é número e limita a 14 dígitos
  const numbers = value.replace(/\D/g, '').slice(0, 14);
  
  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 5) return `${numbers.slice(0, 2)}.${numbers.slice(2)}`;
  if (numbers.length <= 8) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`;
  if (numbers.length <= 12) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8)}`;
  return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12)}`;
}

/**
 * Aplica máscara de telefone: (00) 00000-0000 ou (00) 0000-0000
 * Bloqueia digitação após 11 dígitos
 */
export function maskPhone(value: string): string {
  // Remove tudo que não é número e limita a 11 dígitos
  const numbers = value.replace(/\D/g, '').slice(0, 11);
  
  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  if (numbers.length <= 10) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
}

/**
 * Remove máscara e retorna apenas números
 */
export function unmask(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Aplica máscara de nome: apenas letras, espaços e acentos
 * Bloqueia números e caracteres especiais
 */
export function maskName(value: string): string {
  // Permite apenas letras (a-z, A-Z), espaços, e caracteres acentuados (á, é, í, ó, ú, ã, õ, ç, etc.)
  return value.replace(/[^a-zA-ZÀ-ÿ\s]/g, '');
}

// ============================================
// VALIDAÇÕES
// ============================================

/**
 * Valida CPF (com dígitos verificadores)
 */
export function validateCPF(cpf: string): boolean {
  const numbers = unmask(cpf);
  
  // Deve ter 11 dígitos
  if (numbers.length !== 11) return false;
  
  // Rejeita CPFs com todos os dígitos iguais
  if (/^(\d)\1{10}$/.test(numbers)) return false;
  
  // Validação dos dígitos verificadores
  let sum = 0;
  let remainder;
  
  // Primeiro dígito verificador
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(numbers.substring(i - 1, i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(numbers.substring(9, 10))) return false;
  
  // Segundo dígito verificador
  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(numbers.substring(i - 1, i)) * (12 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(numbers.substring(10, 11))) return false;
  
  return true;
}

/**
 * Valida CNPJ (com dígitos verificadores)
 */
export function validateCNPJ(cnpj: string): boolean {
  const numbers = unmask(cnpj);
  
  // Deve ter 14 dígitos
  if (numbers.length !== 14) return false;
  
  // Rejeita CNPJs com todos os dígitos iguais
  if (/^(\d)\1{13}$/.test(numbers)) return false;
  
  // Validação dos dígitos verificadores
  let length = numbers.length - 2;
  let nums = numbers.substring(0, length);
  const digits = numbers.substring(length);
  let sum = 0;
  let pos = length - 7;
  
  // Primeiro dígito verificador
  for (let i = length; i >= 1; i--) {
    sum += parseInt(nums.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;
  
  // Segundo dígito verificador
  length = length + 1;
  nums = numbers.substring(0, length);
  sum = 0;
  pos = length - 7;
  for (let i = length; i >= 1; i--) {
    sum += parseInt(nums.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;
  
  return true;
}

/**
 * Valida telefone (10 ou 11 dígitos)
 */
export function validatePhone(phone: string): boolean {
  const numbers = unmask(phone);
  
  // Deve ter 10 (fixo) ou 11 (celular) dígitos
  if (numbers.length < 10 || numbers.length > 11) return false;
  
  // DDD deve estar entre 11 e 99
  const ddd = parseInt(numbers.substring(0, 2));
  if (ddd < 11 || ddd > 99) return false;
  
  // Se tiver 11 dígitos, o terceiro deve ser 9 (celular)
  if (numbers.length === 11 && numbers[2] !== '9') return false;
  
  return true;
}

/**
 * Valida email
 */
export function validateEmail(email: string): boolean {
  const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(email);
}

/**
 * Valida nome (mínimo 3 caracteres, apenas letras e espaços)
 */
export function validateName(name: string): boolean {
  if (name.length < 3) return false;
  const regex = /^[a-zA-ZÀ-ÿ\s]+$/;
  return regex.test(name);
}

/**
 * Valida senha (mínimo 6 caracteres)
 */
export function validatePassword(password: string): boolean {
  return password.length >= 6;
}

// ============================================
// MENSAGENS DE ERRO
// ============================================

export const ERROR_MESSAGES = {
  cpf: 'CPF inválido. Deve ter 11 dígitos válidos.',
  cnpj: 'CNPJ inválido. Deve ter 14 dígitos válidos.',
  phone: 'Telefone inválido. Use formato (00) 00000-0000.',
  email: 'Email inválido. Use formato exemplo@email.com.',
  name: 'Nome deve ter no mínimo 3 caracteres.',
  password: 'Senha deve ter no mínimo 6 caracteres.',
  required: 'Este campo é obrigatório.',
};

// ============================================
// HELPER: Detecta se é CPF ou CNPJ
// ============================================

export function detectDocumentType(value: string): 'cpf' | 'cnpj' | null {
  const numbers = unmask(value);
  if (numbers.length <= 11) return 'cpf';
  if (numbers.length <= 14) return 'cnpj';
  return null;
}

export function maskDocument(value: string): string {
  const type = detectDocumentType(value);
  if (type === 'cpf') return maskCPF(value);
  if (type === 'cnpj') return maskCNPJ(value);
  return value;
}

export function validateDocument(value: string): boolean {
  const type = detectDocumentType(value);
  if (type === 'cpf') return validateCPF(value);
  if (type === 'cnpj') return validateCNPJ(value);
  return false;
}
