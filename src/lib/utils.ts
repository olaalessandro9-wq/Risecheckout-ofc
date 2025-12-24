import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}


// Função auxiliar para parsear JSON com segurança, evitando erros fatais de tela preta.
export function parseJsonSafely(jsonString: any, defaultValue: any): any {
  if (typeof jsonString === 'object' && jsonString !== null) {
    // Se já for um objeto (Supabase retornou JSONB parseado automaticamente)
    return jsonString;
  }
  
  if (typeof jsonString === 'string') {
    try {
      // Tenta parsear a string JSON
      const parsed = JSON.parse(jsonString);
      // Se for um array ou objeto válido, retorna
      if (typeof parsed === 'object' && parsed !== null) {
        return parsed;
      }
    } catch (e) {
      // Se o parse falhar, loga o erro e retorna o valor padrão
      console.error("Erro ao parsear JSON:", e, "String:", jsonString);
      return defaultValue;
    }
  }
  
  // Retorna o valor padrão para qualquer outro caso (null, undefined, string vazia, etc.)
  return defaultValue;
}
