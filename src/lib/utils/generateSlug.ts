/**
 * Gera um slug único aleatório no formato: abc123d_456789
 * 
 * Formato:
 * - 7 caracteres alfanuméricos (letras minúsculas + números)
 * - Underscore (_)
 * - 6 dígitos numéricos
 * 
 * Exemplo: 5qffyn2_672867
 */
export function generateUniqueSlug(): string {
  // Caracteres permitidos (letras minúsculas + números)
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  
  // Gerar primeira parte (7 caracteres alfanuméricos)
  let firstPart = '';
  for (let i = 0; i < 7; i++) {
    firstPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  // Gerar segunda parte (6 dígitos numéricos)
  const secondPart = Math.floor(100000 + Math.random() * 900000); // 100000 a 999999
  
  return `${firstPart}_${secondPart}`;
}
