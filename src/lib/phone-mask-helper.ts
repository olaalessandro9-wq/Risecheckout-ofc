/**
 * Aplica máscara de telefone baseado no país
 */
export const formatPhoneNumber = (value: string, countryCode: string): string => {
  // Remove tudo que não é dígito
  const numbers = value.replace(/\D/g, '');
  
  switch (countryCode) {
    case 'BR': // Brasil: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
      if (numbers.length <= 10) {
        // Telefone fixo: (XX) XXXX-XXXX
        return numbers
          .replace(/^(\d{2})(\d)/, '($1) $2')
          .replace(/(\d{4})(\d)/, '$1-$2');
      } else {
        // Celular: (XX) XXXXX-XXXX
        return numbers
          .replace(/^(\d{2})(\d)/, '($1) $2')
          .replace(/(\d{5})(\d)/, '$1-$2');
      }
      
    case 'US': // Estados Unidos: (XXX) XXX-XXXX
    case 'CA': // Canadá: (XXX) XXX-XXXX
      return numbers
        .replace(/^(\d{3})(\d)/, '($1) $2')
        .replace(/(\d{3})(\d)/, '$1-$2');
      
    case 'PT': // Portugal: XXX XXX XXX
      return numbers
        .replace(/^(\d{3})(\d)/, '$1 $2')
        .replace(/(\d{3})(\d)/, '$1 $2');
      
    case 'AR': // Argentina: (XX) XXXX-XXXX
    case 'MX': // México: (XX) XXXX-XXXX
    case 'CO': // Colômbia: (XX) XXXX-XXXX
    case 'CL': // Chile: (X) XXXX-XXXX
    case 'PE': // Peru: (XX) XXX-XXXX
    case 'VE': // Venezuela: (XXX) XXX-XXXX
    case 'UY': // Uruguai: (X) XXX-XXXX
    case 'PY': // Paraguai: (XXX) XXX-XXX
    case 'BO': // Bolívia: (X) XXX-XXXX
    case 'EC': // Equador: (XX) XXX-XXXX
      return numbers
        .replace(/^(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2');
      
    case 'ES': // Espanha: XXX XX XX XX
    case 'FR': // França: XX XX XX XX XX
    case 'DE': // Alemanha: XXX XXXXXXX
    case 'IT': // Itália: XXX XXX XXXX
    case 'GB': // Reino Unido: XXXX XXX XXXX
    case 'AU': // Austrália: XXXX XXX XXX
      // Formato genérico para outros países
      return numbers.replace(/(\d{3})(\d{3})(\d)/, '$1 $2 $3');
      
    default:
      return numbers;
  }
};

/**
 * Valida telefone baseado no país
 */
export const validatePhoneNumber = (value: string, countryCode: string): boolean => {
  const numbers = value.replace(/\D/g, '');
  
  switch (countryCode) {
    case 'BR':
      // Brasil: 10 dígitos (fixo) ou 11 dígitos (celular)
      return numbers.length === 10 || numbers.length === 11;
      
    case 'US':
    case 'CA':
      // EUA/Canadá: 10 dígitos
      return numbers.length === 10;
      
    case 'PT':
      // Portugal: 9 dígitos
      return numbers.length === 9;
      
    case 'AR':
    case 'MX':
    case 'CO':
      // Argentina, México, Colômbia: 10 dígitos
      return numbers.length === 10;
      
    case 'CL':
      // Chile: 9 dígitos
      return numbers.length === 9;
      
    case 'PE':
    case 'VE':
    case 'UY':
    case 'BO':
    case 'EC':
      // Peru, Venezuela, Uruguai, Bolívia, Equador: 8-9 dígitos
      return numbers.length >= 8 && numbers.length <= 9;
      
    case 'PY':
      // Paraguai: 9 dígitos
      return numbers.length === 9;
      
    case 'ES':
    case 'FR':
    case 'DE':
    case 'IT':
    case 'GB':
    case 'AU':
      // Outros países europeus e Austrália: 9-11 dígitos
      return numbers.length >= 9 && numbers.length <= 11;
      
    default:
      // Validação genérica: pelo menos 8 dígitos
      return numbers.length >= 8;
  }
};

/**
 * Retorna o comprimento máximo de dígitos para o país
 */
export const getMaxPhoneLength = (countryCode: string): number => {
  switch (countryCode) {
    case 'BR':
      return 11; // Celular brasileiro
    case 'US':
    case 'CA':
    case 'AR':
    case 'MX':
    case 'CO':
      return 10;
    case 'PT':
    case 'CL':
    case 'PY':
      return 9;
    case 'PE':
    case 'VE':
    case 'UY':
    case 'BO':
    case 'EC':
      return 9;
    case 'ES':
    case 'FR':
    case 'DE':
    case 'IT':
    case 'GB':
    case 'AU':
      return 11;
    default:
      return 15; // Máximo genérico
  }
};
