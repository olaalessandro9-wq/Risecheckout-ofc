/**
 * Error Translator - Tradução Centralizada de Erros
 * 
 * RISE Protocol V3 - Todas as mensagens em PT-BR amigável
 * 
 * Este módulo centraliza a tradução de todas as mensagens de erro
 * técnicas ou em inglês para português brasileiro amigável.
 * 
 * @version 1.0.0
 */

// ============================================================================
// SUPABASE AUTH ERRORS
// ============================================================================

/**
 * Mapeamento de erros do Supabase Auth
 * Chaves são mensagens originais (inglês), valores são traduções amigáveis
 */
const SUPABASE_AUTH_ERRORS: Record<string, string> = {
  // Registro
  "A user with this email address has already been registered":
    "Este email já está cadastrado. Faça login ou recupere sua senha.",
  "User already registered":
    "Este email já está cadastrado. Faça login ou recupere sua senha.",
  "Email address already registered":
    "Este email já está cadastrado. Faça login ou recupere sua senha.",
  "duplicate key value violates unique constraint":
    "Este email já está cadastrado. Faça login ou recupere sua senha.",
  
  // Login
  "Invalid login credentials":
    "Email ou senha incorretos.",
  "Invalid email or password":
    "Email ou senha incorretos.",
  "Email not confirmed":
    "Confirme seu email antes de fazer login.",
  "User not found":
    "Usuário não encontrado.",
  
  // Senha
  "Password should be at least 6 characters":
    "A senha deve ter pelo menos 6 caracteres.",
  "Password is too short":
    "A senha é muito curta.",
  "Password is too weak":
    "A senha é muito fraca. Use letras, números e símbolos.",
  
  // Token
  "Token has expired":
    "O link expirou. Solicite um novo.",
  "Invalid token":
    "Link inválido. Solicite um novo.",
  "Token is invalid or has expired":
    "O link é inválido ou expirou. Solicite um novo.",
  
  // Rate Limiting
  "For security purposes, you can only request this once every 60 seconds":
    "Por segurança, aguarde 60 segundos antes de tentar novamente.",
  "Too many requests":
    "Muitas tentativas. Aguarde alguns minutos.",
  "Rate limit exceeded":
    "Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.",
    
  // Email
  "Unable to validate email address":
    "Email inválido. Verifique se digitou corretamente.",
  "Invalid email":
    "Email inválido. Verifique se digitou corretamente.",
    
  // Genéricos
  "Database error":
    "Erro ao processar sua solicitação. Tente novamente.",
  "Internal server error":
    "Erro interno. Tente novamente em alguns minutos.",
  "Service unavailable":
    "Serviço indisponível. Tente novamente em alguns minutos.",
};

/**
 * Padrões de erro por substring (para erros dinâmicos)
 */
const SUPABASE_AUTH_PATTERNS: Array<{ pattern: string; translation: string }> = [
  { pattern: "already been registered", translation: "Este email já está cadastrado. Faça login ou recupere sua senha." },
  { pattern: "already registered", translation: "Este email já está cadastrado. Faça login ou recupere sua senha." },
  { pattern: "duplicate key", translation: "Este email já está cadastrado." },
  { pattern: "invalid credentials", translation: "Email ou senha incorretos." },
  { pattern: "password should be", translation: "A senha não atende aos requisitos mínimos." },
  { pattern: "token expired", translation: "O link expirou. Solicite um novo." },
  { pattern: "rate limit", translation: "Muitas tentativas. Aguarde alguns minutos." },
  { pattern: "too many requests", translation: "Muitas tentativas. Aguarde alguns minutos." },
];

// ============================================================================
// RATE LIMITING ERRORS
// ============================================================================

/**
 * Traduz mensagens de rate limiting para português amigável
 * 
 * @param retryAfter - ISO date string de quando pode tentar novamente
 * @returns Mensagem amigável em português
 */
export function translateRateLimitError(retryAfter?: string): string {
  if (!retryAfter) {
    return "Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.";
  }

  try {
    const date = new Date(retryAfter);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffMinutes = Math.ceil(diffMs / 60000);

    if (diffMinutes <= 0) {
      return "Muitas tentativas. Tente novamente agora.";
    }

    if (diffMinutes === 1) {
      return "Muitas tentativas. Aguarde 1 minuto antes de tentar novamente.";
    }

    if (diffMinutes < 60) {
      return `Muitas tentativas. Aguarde ${diffMinutes} minutos antes de tentar novamente.`;
    }

    const hours = Math.ceil(diffMinutes / 60);
    if (hours === 1) {
      return "Muitas tentativas. Aguarde 1 hora antes de tentar novamente.";
    }

    return `Muitas tentativas. Aguarde ${hours} horas antes de tentar novamente.`;
  } catch {
    return "Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.";
  }
}

// ============================================================================
// BLOCKLIST ERRORS
// ============================================================================

/**
 * Traduz mensagens de blocklist para português amigável
 * 
 * @param expiresAt - ISO date string de quando o bloqueio expira
 * @param reason - Razão do bloqueio (opcional)
 * @returns Mensagem amigável em português
 */
export function translateBlocklistError(expiresAt?: string | null, reason?: string | null): string {
  if (!expiresAt) {
    return "Seu acesso foi bloqueado por segurança. Entre em contato com o suporte.";
  }

  try {
    const date = new Date(expiresAt);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffMinutes = Math.ceil(diffMs / 60000);

    if (diffMinutes <= 0) {
      return "Acesso temporariamente bloqueado. Tente novamente agora.";
    }

    if (diffMinutes === 1) {
      return "Seu acesso foi temporariamente bloqueado por segurança. Aguarde 1 minuto.";
    }

    if (diffMinutes < 60) {
      return `Seu acesso foi temporariamente bloqueado por segurança. Aguarde ${diffMinutes} minutos.`;
    }

    const hours = Math.ceil(diffMinutes / 60);
    if (hours === 1) {
      return "Seu acesso foi temporariamente bloqueado por segurança. Aguarde 1 hora.";
    }

    return `Seu acesso foi temporariamente bloqueado por segurança. Aguarde ${hours} horas.`;
  } catch {
    return "Seu acesso foi temporariamente bloqueado por segurança. Tente novamente mais tarde.";
  }
}

// ============================================================================
// MAIN TRANSLATOR
// ============================================================================

/**
 * Traduz mensagens de erro do Supabase Auth para português amigável
 * 
 * @param message - Mensagem original do Supabase Auth
 * @returns Mensagem traduzida em português
 */
export function translateSupabaseAuthError(message?: string | null): string {
  if (!message) {
    return "Erro ao processar sua solicitação. Tente novamente.";
  }

  // 1. Buscar tradução exata
  const exactMatch = SUPABASE_AUTH_ERRORS[message];
  if (exactMatch) {
    return exactMatch;
  }

  // 2. Buscar por substring (case-insensitive)
  const lowerMessage = message.toLowerCase();
  for (const { pattern, translation } of SUPABASE_AUTH_PATTERNS) {
    if (lowerMessage.includes(pattern.toLowerCase())) {
      return translation;
    }
  }

  // 3. Verificar se já está em português (não traduzir)
  const portugueseIndicators = ["é ", "ão", "ção", "senha", "email", "usuário", "erro"];
  const hasPortuguese = portugueseIndicators.some(indicator => 
    lowerMessage.includes(indicator)
  );
  
  if (hasPortuguese) {
    return message; // Já está em português, retornar como está
  }

  // 4. Fallback genérico
  return "Erro ao processar sua solicitação. Tente novamente.";
}

/**
 * Traduz erro 404 de "não encontrado" para mensagem amigável
 * 
 * @param resourceType - Tipo de recurso (email, usuário, etc)
 * @returns Mensagem amigável
 */
export function translateNotFoundError(resourceType: string = "recurso"): string {
  const translations: Record<string, string> = {
    email: "E-mail não encontrado. Verifique se digitou corretamente ou crie uma nova conta.",
    user: "Usuário não encontrado. Verifique se digitou corretamente.",
    usuario: "Usuário não encontrado. Verifique se digitou corretamente.",
    producer: "Produtor não encontrado. Verifique se digitou corretamente.",
    produtor: "Produtor não encontrado. Verifique se digitou corretamente.",
    buyer: "Comprador não encontrado. Verifique se digitou corretamente.",
    comprador: "Comprador não encontrado. Verifique se digitou corretamente.",
    product: "Produto não encontrado.",
    produto: "Produto não encontrado.",
    checkout: "Checkout não encontrado.",
    order: "Pedido não encontrado.",
    pedido: "Pedido não encontrado.",
  };

  return translations[resourceType.toLowerCase()] || `${resourceType} não encontrado.`;
}
