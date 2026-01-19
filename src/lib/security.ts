import DOMPurify from 'dompurify';
import { createLogger } from '@/lib/logger';

const log = createLogger("Security");

// ============================================================================
// CONFIGURAÇÃO CENTRALIZADA DE SANITIZAÇÃO HTML
// ============================================================================

/**
 * Configuração segura para DOMPurify - define tags e atributos permitidos
 * Use esta configuração para manter consistência em toda a aplicação
 */
export const SAFE_HTML_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'br', 'b', 'i', 'u', 'strong', 'em', 'a',
    'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'blockquote', 'span', 'div', 'img'
  ],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'class', 'style'],
  ALLOW_DATA_ATTR: false,
  FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'link', 'form', 'input'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
};

// ============================================================================
// FUNÇÕES DE SANITIZAÇÃO
// ============================================================================

/**
 * Remove scripts e tags HTML perigosas de uma string.
 * Mantém tags seguras definidas em SAFE_HTML_CONFIG.
 * Protege contra ataques XSS (Cross-Site Scripting).
 */
export const sanitize = (input: unknown): string => {
  if (typeof input !== 'string') return '';
  return DOMPurify.sanitize(input.trim(), SAFE_HTML_CONFIG);
};

/**
 * Sanitiza HTML permitindo tags seguras.
 * Alias para sanitize() - use quando o contexto deixar claro que é HTML.
 */
export const sanitizeHtml = (html: unknown): string => {
  return sanitize(html);
};

/**
 * Remove TODAS as tags HTML - retorna apenas texto puro.
 * Use para campos que não devem ter nenhuma formatação.
 */
export const sanitizeText = (input: unknown): string => {
  if (typeof input !== 'string') return '';
  return DOMPurify.sanitize(input.trim(), { ALLOWED_TAGS: [] });
};

/**
 * Sanitiza URLs - bloqueia protocolos perigosos (javascript:, data:, vbscript:)
 * Retorna string vazia se a URL for maliciosa.
 */
export const sanitizeUrl = (url: unknown): string => {
  if (typeof url !== 'string') return '';
  const cleaned = url.trim();
  
  // Bloqueia protocolos perigosos
  if (/^(javascript|data|vbscript):/i.test(cleaned)) {
    log.warn('URL maliciosa bloqueada:', cleaned.substring(0, 50));
    return '';
  }
  
  return cleaned;
};

/**
 * Sanitiza cores hex - aceita apenas formato #RGB ou #RRGGBB
 * Retorna cor default se o formato for inválido.
 */
export const sanitizeColor = (color: unknown, defaultColor: string = '#000000'): string => {
  if (typeof color !== 'string') return defaultColor;
  const cleaned = color.trim();
  
  // Aceita apenas cores hex válidas (#RGB ou #RRGGBB)
  if (/^#[0-9A-Fa-f]{3}$/.test(cleaned) || /^#[0-9A-Fa-f]{6}$/.test(cleaned)) {
    return cleaned;
  }
  
  return defaultColor;
};

/**
 * Tipo para valores aceitos em formulários
 */
type FormValue = string | number | boolean | null | undefined;

/**
 * Limpa todos os campos de texto de um objeto de formulário.
 * Aplica sanitização apropriada baseada no tipo de campo.
 */
export const sanitizeFormObject = <T extends Record<string, FormValue>>(data: T): T => {
  const cleanData = { ...data };
  
  Object.keys(cleanData).forEach((key) => {
    const value = cleanData[key];
    if (typeof value === 'string') {
      // Campos de URL
      if (key.toLowerCase().includes('url') || key.toLowerCase().includes('link')) {
        (cleanData as Record<string, FormValue>)[key] = sanitizeUrl(value);
      }
      // Campos de cor
      else if (key.toLowerCase().includes('color')) {
        (cleanData as Record<string, FormValue>)[key] = sanitizeColor(value);
      }
      // Outros campos de texto
      else {
        (cleanData as Record<string, FormValue>)[key] = sanitize(value);
      }
    }
  });

  return cleanData;
};
