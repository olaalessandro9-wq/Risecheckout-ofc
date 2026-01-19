import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { createLogger } from "@/lib/logger";

const log = createLogger("Utils");

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}


/**
 * Função auxiliar para parsear JSON com segurança, evitando erros fatais de tela preta.
 * Usa generics para inferência de tipo.
 * 
 * @param jsonString - String JSON ou objeto já parseado
 * @param defaultValue - Valor padrão a retornar em caso de erro
 * @returns Objeto parseado ou valor padrão
 */
export function parseJsonSafely<T>(jsonString: unknown, defaultValue: T): T {
  if (typeof jsonString === 'object' && jsonString !== null) {
    // Se já for um objeto (Supabase retornou JSONB parseado automaticamente)
    return jsonString as T;
  }
  
  if (typeof jsonString === 'string') {
    try {
      // Tenta parsear a string JSON
      const parsed = JSON.parse(jsonString);
      // Se for um array ou objeto válido, retorna
      if (typeof parsed === 'object' && parsed !== null) {
        return parsed as T;
      }
    } catch (e) {
      // Se o parse falhar, loga o erro e retorna o valor padrão
      log.error("Erro ao parsear JSON:", e, "String:", jsonString);
      return defaultValue;
    }
  }
  
  // Retorna o valor padrão para qualquer outro caso (null, undefined, string vazia, etc.)
  return defaultValue;
}
